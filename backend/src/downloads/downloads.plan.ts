import { MediaType } from '../common/common.dto.js';
import type { MediaFile } from '../local-media/media-file.entity.js';
import type { RequestRule } from '../requests/request-rule.entity.js';
import type { MediaRequest } from '../requests/request.entity.js';
import type { PlayState } from '../user-data/play-state/play-state.entity.js';
import { findEpisodeFile, findOnlyVideoFile } from './downloads.utils.js';
import type { TorrentSelection } from './torrent-selection.entity.js';
import type { Torrent } from './torrent.entity.js';

export interface DownloadsState {
  /** Episode requests */
  requests: Pick<
    MediaRequest,
    'id' | 'userId' | 'tmdbId' | 'season' | 'episode' | 'approved'
  >[];
  selections: Pick<
    TorrentSelection,
    'userId' | 'mediaType' | 'tmdbId' | 'season' | 'episode' | 'torrentId'
  >[];
  torrents: Pick<
    Torrent,
    'id' | 'infoHash' | 'files' | 'downloadedBytes' | 'uploadedBytes'
  >[];
  /** Episode files in the library */
  files: Pick<
    MediaFile,
    'tmdbId' | 'season' | 'episode' | 'lastEpisode' | 'infoHash'
  >[];
  rules: Pick<
    RequestRule,
    'userId' | 'tmdbId' | 'keepNext' | 'keepWatched' | 'keepWatchedHours'
  >[];
  /** Episode play states of the users and series that have a rule */
  playStates: Pick<
    PlayState,
    'userId' | 'tmdbId' | 'season' | 'episode' | 'watched' | 'watchedAt'
  >[];
  /** Milliseconds since the epoch */
  now: number;
  seedRatio: number;
}

type PlanRequest = DownloadsState['requests'][number];

export enum PlannedStatus {
  WaitingForApproval = 'waiting-for-approval',
  /** A rule holds the request back until the user has watched up to it */
  InactiveAhead = 'inactive-ahead',
  /** A rule does not keep the request of the watched episode, or has no file of it to keep */
  InactiveWatched = 'inactive-watched',
  NoSelection = 'no-selection',
  /** The file of the selected torrent is in the library */
  Available = 'available',
  /** The files of the selected torrent are not known yet */
  Resolving = 'resolving',
  NoFileInTorrent = 'no-file-in-torrent',
  Wanted = 'wanted',
}

export interface PlannedRequest {
  request: PlanRequest;
  status: PlannedStatus;
  torrentId?: string;
  fileIndex?: number;
}

export interface WantedFile {
  fileIndex: number;
  tmdbId: string;
  season: number;
  /** The requested episodes that this file is downloaded for */
  episodes: number[];
}

export interface PlannedTorrent {
  torrentId: string;
  wanted: WantedFile[];
  /** A request waits for the file list of the torrent */
  needsFiles: boolean;
  seeds: boolean;
  selected: boolean;
}

export interface DownloadsPlan {
  requests: PlannedRequest[];
  torrents: PlannedTorrent[];
}

const HOUR = 60 * 60 * 1000;

const keyOf = (...parts: (string | number)[]) => parts.join('/');

const byEpisode = (
  a: { season: number; episode: number },
  b: { season: number; episode: number },
) => a.season - b.season || a.episode - b.episode;

function groupBy<T>(items: T[], getKey: (item: T) => string): Map<string, T[]> {
  const groups = new Map<string, T[]>();
  for (const item of items) {
    const group = groups.get(getKey(item));
    if (group) group.push(item);
    else groups.set(getKey(item), [item]);
  }

  return groups;
}

/**
 * What the rules make of the approved requests of their users.
 *
 * A rule looks at the requests of its user for the series in episode order.
 * Of the requests after the last watched episode, only the next keepNext are
 * active, the others are inactive. An episode in progress is not watched, so
 * its request is one of the next ones.
 *
 * With keepWatched or keepWatchedHours, a request for a watched episode
 * downloads nothing. It is kept, which is to hold on to a file that is in the
 * library, while it is among the last keepWatched watched requests or was
 * watched within keepWatchedHours, and is inactive otherwise. The last ones
 * are kept only while there is more to watch: a request after the last
 * watched episode.
 *
 * The requests for unwatched episodes before the last watched one are active.
 */
function evaluateRules(state: DownloadsState): {
  inactive: Map<PlanRequest, PlannedStatus>;
  kept: Set<PlanRequest>;
} {
  const inactive = new Map<PlanRequest, PlannedStatus>();
  const kept = new Set<PlanRequest>();
  const requests = groupBy(
    state.requests.filter((request) => request.approved),
    (request) => keyOf(request.userId, request.tmdbId),
  );
  const playStates = groupBy(state.playStates, (playState) =>
    keyOf(playState.userId, playState.tmdbId),
  );

  for (const rule of state.rules) {
    const key = keyOf(rule.userId, rule.tmdbId);
    const ofSeries = (requests.get(key) ?? []).sort(byEpisode);
    const watchedEpisodes = (playStates.get(key) ?? [])
      .filter((playState) => playState.watched)
      .sort(byEpisode);
    const lastWatched = watchedEpisodes[watchedEpisodes.length - 1];
    const ahead = ofSeries.filter(
      (request) => !lastWatched || byEpisode(request, lastWatched) > 0,
    );

    if (rule.keepNext !== null) {
      for (const request of ahead.slice(rule.keepNext)) {
        inactive.set(request, PlannedStatus.InactiveAhead);
      }
    }

    if (rule.keepWatched === null && rule.keepWatchedHours === null) continue;

    const watchedAt = new Map(
      watchedEpisodes.map((playState) => [
        keyOf(playState.season, playState.episode),
        playState.watchedAt.getTime(),
      ]),
    );
    const watched = ofSeries.filter((request) =>
      watchedAt.has(keyOf(request.season, request.episode)),
    );

    watched.forEach((request, index) => {
      const isAmongLast =
        rule.keepWatched !== null &&
        ahead.length > 0 &&
        index >= watched.length - rule.keepWatched;
      const isRecent =
        rule.keepWatchedHours !== null &&
        state.now - watchedAt.get(keyOf(request.season, request.episode)) <
          rule.keepWatchedHours * HOUR;

      if (isAmongLast || isRecent) kept.add(request);
      else inactive.set(request, PlannedStatus.InactiveWatched);
    });
  }

  return { inactive, kept };
}

/**
 * What every request resolves to and what every torrent has to do for it.
 *
 * An approved request downloads from the torrent its user selected for the
 * episode, or else for the season. It is fulfilled by the file of that torrent
 * and by no other file of the episode. A request that a rule makes inactive
 * downloads nothing, and neither does one that a rule keeps (see evaluateRules).
 */
export function planDownloads(state: DownloadsState): DownloadsPlan {
  const torrents = new Map(state.torrents.map((t) => [t.id, t]));
  const selected = new Set(state.selections.map((s) => s.torrentId));
  const planned = new Map(
    state.torrents.map((torrent): [string, PlannedTorrent] => [
      torrent.id,
      {
        torrentId: torrent.id,
        wanted: [],
        needsFiles: false,
        seeds:
          torrent.downloadedBytes > 0 &&
          torrent.uploadedBytes < state.seedRatio * torrent.downloadedBytes,
        selected: selected.has(torrent.id),
      },
    ]),
  );
  const selections = new Map(
    state.selections
      .filter((s) => s.mediaType === MediaType.Series)
      .map((s) => [keyOf(s.userId, s.tmdbId, s.season, s.episode), s]),
  );

  // The library files of a season by the torrent they were imported from
  const versions = groupBy(
    state.files.filter((file) => file.infoHash),
    (file) => keyOf(file.infoHash, file.tmdbId, file.season),
  );
  const { inactive, kept } = evaluateRules(state);

  const requests = state.requests.map((request): PlannedRequest => {
    if (!request.approved) {
      return { request, status: PlannedStatus.WaitingForApproval };
    }
    if (inactive.has(request)) {
      return { request, status: inactive.get(request) };
    }

    const { userId, tmdbId, season, episode } = request;
    const selection =
      selections.get(keyOf(userId, tmdbId, season, episode)) ??
      selections.get(keyOf(userId, tmdbId, season, 0));
    const torrent = torrents.get(selection?.torrentId);
    const isInLibrary =
      !!torrent &&
      versions
        .get(keyOf(torrent.infoHash, tmdbId, season))
        ?.some(
          (file) => file.episode <= episode && episode <= file.lastEpisode,
        );

    // A kept request holds on to the file it has, it downloads none
    if (kept.has(request) && !isInLibrary) {
      return { request, status: PlannedStatus.InactiveWatched };
    }
    if (!selection) return { request, status: PlannedStatus.NoSelection };

    const torrentId = torrent.id;
    if (isInLibrary) {
      return { request, status: PlannedStatus.Available, torrentId };
    }

    if (!torrent.files) {
      planned.get(torrentId).needsFiles = true;
      return { request, status: PlannedStatus.Resolving, torrentId };
    }

    // The only video of an episode torrent is the episode, whatever it is called
    const file =
      findEpisodeFile(torrent.files, season, episode) ??
      (selection.episode !== 0 ? findOnlyVideoFile(torrent.files) : undefined);
    if (!file) {
      return { request, status: PlannedStatus.NoFileInTorrent, torrentId };
    }

    const { wanted } = planned.get(torrentId);
    const sameFile = wanted.find(
      (w) =>
        w.fileIndex === file.index &&
        w.tmdbId === tmdbId &&
        w.season === season,
    );
    if (!sameFile) {
      wanted.push({
        fileIndex: file.index,
        tmdbId,
        season,
        episodes: [episode],
      });
    } else if (!sameFile.episodes.includes(episode)) {
      sameFile.episodes.push(episode);
    }

    return {
      request,
      status: PlannedStatus.Wanted,
      torrentId,
      fileIndex: file.index,
    };
  });

  return { requests, torrents: [...planned.values()] };
}
