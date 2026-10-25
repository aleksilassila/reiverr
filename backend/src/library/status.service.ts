import { EntityManager } from '@mikro-orm/sqlite';
import { Injectable } from '@nestjs/common';
import { EpisodeRefDto, MediaType } from '../common/common.dto.js';
import {
  TorrentDto,
  TorrentItemDto,
  TorrentItemStatus,
  TorrentStatus,
  TorrentWithItemsDto,
} from '../downloads/downloads.dto.js';
import { DownloadsService } from '../downloads/downloads.service.js';
import { MetadataService } from '../metadata/metadata.service.js';
import {
  EpisodeSource,
  RequestSource,
  sourceOf,
} from '../requests/request-source.js';
import { MediaRequest } from '../requests/request.entity.js';
import { RequestsService } from '../requests/requests.service.js';
import { isNeeded } from '../requests/requests.utils.js';
import { SelectedRelease } from '../requests/selected-release.entity.js';
import { getNextCleanup } from './cleanup.utils.js';
import {
  EpisodePreferenceDto,
  EpisodeStatusDto,
  MovieStatusDto,
  PreferenceDto,
  PreferredFileDto,
  RequestStatus,
  RequestStatusDto,
  SeriesStatusDto,
} from './library.dto.js';
import { LibraryService } from './library.service.js';
import { coversMedia } from './library.utils.js';
import { MediaFile } from './media-file.entity.js';
import { RequestBinding } from './request-binding.entity.js';
import { ScanService } from './scan.service.js';
import {
  Candidate,
  expectedBytes,
  Gate,
  Room,
  roomFor,
  StorageService,
} from './storage.service.js';
import * as path from 'node:path';

const READ = { disableIdentityMap: true };

const episodeKey = (e: EpisodeRefDto) => `${e.season}-${e.episode}`;

/** Where the request of a user stands, as the request page shows it */
type Standing = Pick<RequestStatusDto, 'status' | 'progress' | 'error'>;

/** A torrent as the status describes it: as downloads has it, or as it was picked */
type TorrentOf = (infoHash: string | undefined) => TorrentDto | undefined;

/** The torrents a status refers to */
interface Torrents {
  /** The ones downloads knows */
  known: Map<string, TorrentWithItemsDto>;
  torrentOf: TorrentOf;
}

/** What describes the request of a user for an episode or a movie */
interface RequestContext {
  request: MediaRequest | undefined;
  source: RequestSource | undefined;
  binding: RequestBinding | undefined;
  items: Map<string, TorrentItemDto>;
  /** The files of the title */
  filesById: Map<string, MediaFile>;
  /** The files of the episode or the movie */
  ofMedia: MediaFile[];
  torrentOf: TorrentOf;
  gate: Gate;
  /** For an episode, how many episodes its season has, which a season's torrent is shared by */
  episodesInSeason: number | undefined;
}

/**
 * The status of a title for a user: where their requests and their
 * preferred sources stand, from what the three modules say of them
 */
@Injectable()
export class StatusService {
  constructor(
    private readonly em: EntityManager,
    private readonly requestsService: RequestsService,
    private readonly downloadsService: DownloadsService,
    private readonly metadataService: MetadataService,
    private readonly libraryService: LibraryService,
    private readonly scanService: ScanService,
    private readonly storage: StorageService,
  ) {}

  async getSeriesStatus(
    userId: string,
    tmdbId: string,
  ): Promise<SeriesStatusDto> {
    const em = this.em.fork();
    const requests = await this.requestsService.findSeriesRequests(
      userId,
      tmdbId,
    );
    const rule = await this.requestsService.findSeriesRule(userId, tmdbId);
    const files = await em.find(
      MediaFile,
      { mediaType: MediaType.Series, tmdbId },
      { ...READ, orderBy: { path: 'asc' } },
    );
    const bindings = await em.find(
      RequestBinding,
      { requestId: { $in: requests.map((request) => request.id) } },
      READ,
    );
    const held = await this.heldOf(em, files);
    const items = await this.itemsOf(em, bindings);
    const preferred = [
      ...(rule?.seasonTorrents ?? []).map((t) => t.infoHash),
      ...(rule?.episodeSources ?? []).flatMap((s) =>
        s.kind === 'torrent' ? [s.infoHash] : [],
      ),
    ];
    const { known, torrentOf } = await this.torrentsOf(
      em,
      preferred,
      items,
      files,
    );

    // The index of the series is brought in line with the disk soon
    await this.scanService.requestScan(MediaType.Series, tmdbId);
    const nextCleanup = await this.nextCleanup();
    const gate = await this.gateOf(em, userId);
    const episodeCounts = await this.metadataService.getEpisodeCounts(
      em,
      tmdbId,
    );

    const filesById = new Map(files.map((file) => [file.id, file]));
    const filesOf = ({ season, episode }: EpisodeRefDto) =>
      files.filter((file) =>
        coversMedia(file, {
          mediaType: MediaType.Series,
          tmdbId,
          season,
          episode,
        }),
      );

    const onDisk = new Map<string, EpisodeRefDto>();
    for (const file of files) {
      for (let episode = file.episode; episode <= file.lastEpisode; episode++) {
        const ref = { season: file.season, episode };
        onDisk.set(episodeKey(ref), ref);
      }
    }
    const requested = new Map(
      requests.map((request) => [episodeKey(request), request]),
    );
    const episodes = [
      ...requested.values(),
      ...[...onDisk.values()].filter((e) => !requested.has(episodeKey(e))),
    ];

    const preferences: EpisodePreferenceDto[] = [
      ...(rule?.seasonTorrents ?? []).map((t) => ({
        season: t.season,
        episode: 0,
        torrent: torrentOf(t.infoHash),
      })),
      ...(rule?.episodeSources ?? []).map(({ season, episode, ...source }) => ({
        season,
        episode,
        ...describePreference(source, torrentOf, filesById),
      })),
    ];

    return {
      preferences: preferences.sort(
        (a, b) => a.season - b.season || a.episode - b.episode,
      ),
      episodes: episodes
        .map((episode): EpisodeStatusDto => {
          const request = requested.get(episodeKey(episode));
          const ofMedia = filesOf(episode);

          return {
            season: episode.season,
            episode: episode.episode,
            ...describeRequest({
              request,
              source:
                request && sourceOf(rule, request.season, request.episode),
              binding:
                request && bindings.find((b) => b.requestId === request.id),
              items,
              filesById,
              ofMedia,
              torrentOf,
              gate,
              episodesInSeason: episodeCounts.get(episode.season),
            }),
            onDisk: onDisk.has(episodeKey(episode)),
            cleanupAt: isCleanedUp(ofMedia, held) ? nextCleanup : undefined,
          };
        })
        .sort((a, b) => a.season - b.season || a.episode - b.episode),
      onServer: onServerOf(known, files),
    };
  }

  async getMovieStatus(
    userId: string,
    tmdbId: string,
  ): Promise<MovieStatusDto> {
    const em = this.em.fork();
    const request = await this.requestsService.findMovieRequest(userId, tmdbId);
    const rule = await this.requestsService.findMovieRule(userId, tmdbId);
    const files = await em.find(
      MediaFile,
      { mediaType: MediaType.Movie, tmdbId },
      { ...READ, orderBy: { path: 'asc' } },
    );
    const binding = request
      ? ((await em.findOne(RequestBinding, { requestId: request.id }, READ)) ??
        undefined)
      : undefined;
    const held = await this.heldOf(em, files);
    const items = await this.itemsOf(em, binding ? [binding] : []);
    // The preference of a movie is the entry with season and episode 0
    const preference = rule?.episodeSources?.find(
      (s) => s.season === 0 && s.episode === 0,
    );
    const source = sourceOf(rule, 0, 0);
    const { known, torrentOf } = await this.torrentsOf(
      em,
      source?.kind === 'torrent' ? [source.infoHash] : [],
      items,
      files,
    );

    // The index of the movie is brought in line with the disk soon
    await this.scanService.requestScan(MediaType.Movie, tmdbId);
    const nextCleanup = await this.nextCleanup();
    const gate = await this.gateOf(em, userId);
    const filesById = new Map(files.map((file) => [file.id, file]));

    return {
      ...describeRequest({
        request,
        source,
        binding,
        items,
        filesById,
        ofMedia: files,
        torrentOf,
        gate,
        episodesInSeason: undefined,
      }),
      onDisk: files.length > 0,
      cleanupAt: isCleanedUp(files, held) ? nextCleanup : undefined,
      preference:
        preference && describePreference(preference, torrentOf, filesById),
      onServer: onServerOf(known, files),
    };
  }

  /** The files among the given ones that a request of anyone holds */
  private async heldOf(
    em: EntityManager,
    files: MediaFile[],
  ): Promise<Set<string>> {
    if (!files.length) return new Set();

    const bindings = await em.find(
      RequestBinding,
      { mediaFileId: { $in: files.map((file) => file.id) } },
      { ...READ, fields: ['mediaFileId'] },
    );

    return new Set(bindings.map((binding) => binding.mediaFileId));
  }

  /** The items the bindings wait for, by id */
  private async itemsOf(
    em: EntityManager,
    bindings: RequestBinding[],
  ): Promise<Map<string, TorrentItemDto>> {
    const items = await this.downloadsService.describeItems(
      em,
      bindings.flatMap((binding) => binding.torrentItemId ?? []),
    );

    return new Map(items.map((item) => [item.id, item]));
  }

  /**
   * The torrents the status refers to: the preferred ones, the ones the
   * items are of and the ones the files came from, as downloads has them,
   * or a preferred one as it was picked when downloads knows nothing of it
   */
  private async torrentsOf(
    em: EntityManager,
    preferred: string[],
    items: Map<string, TorrentItemDto>,
    files: MediaFile[],
  ): Promise<Torrents> {
    const hashes = [
      ...new Set([
        ...preferred,
        ...[...items.values()].map((item) => item.infoHash),
        ...files.flatMap((file) => file.infoHash ?? []),
      ]),
    ];
    const known = new Map(
      (await this.downloadsService.describeTorrents(hashes)).map((torrent) => [
        torrent.infoHash,
        torrent,
      ]),
    );
    const releases = new Map(
      (
        await em.find(
          SelectedRelease,
          { infoHash: { $in: preferred.filter((hash) => !known.has(hash)) } },
          READ,
        )
      ).map((release) => [release.infoHash, release]),
    );

    return {
      known,
      torrentOf: (infoHash) => {
        if (!infoHash) return undefined;
        const torrent = known.get(infoHash);
        if (torrent) return toTorrentDto(torrent);
        const release = releases.get(infoHash);

        return release && idleTorrent(release);
      },
    };
  }

  private async nextCleanup(): Promise<Date | undefined> {
    const { cleanup } = await this.libraryService.getSettings();

    return getNextCleanup(new Date(), cleanup);
  }

  /** What holds back a request of the user that is bound to nothing */
  private async gateOf(em: EntityManager, userId: string): Promise<Gate> {
    const diskFull = await this.storage.isDiskFull();

    return this.storage.gateOf(em, userId, { diskFull });
  }
}

/**
 * Where the request of a user for an episode or a movie stands: what it is
 * bound to, whether what it is to get fits when it is bound to nothing,
 * and the torrent it downloads from or has its file from
 */
function describeRequest(
  context: RequestContext,
): Pick<
  RequestStatusDto,
  'requested' | 'status' | 'progress' | 'error' | 'torrent'
> {
  const { request, source, binding, items, filesById, torrentOf, gate } =
    context;
  const item = binding?.torrentItemId
    ? items.get(binding.torrentItemId)
    : undefined;
  const file = binding?.mediaFileId
    ? filesById.get(binding.mediaFileId)
    : undefined;
  const room =
    request && source && isNeeded(request) && !binding
      ? roomFor(gate, candidateOf(source, context))
      : undefined;

  return {
    requested: !!request,
    ...(request && standingOf(request, source, binding, item, file, room)),
    torrent: torrentOf(item?.infoHash ?? file?.infoHash),
  };
}

/** What a request that is bound to nothing is to get, as the fulfilment would find it */
function candidateOf(
  source: RequestSource,
  { filesById, ofMedia, torrentOf, episodesInSeason }: RequestContext,
): Candidate {
  if (source.kind === 'file') {
    return {
      bytes: filesById.get(source.mediaFileId)?.size ?? 0,
      download: false,
    };
  }
  const version = ofMedia.find((file) => file.infoHash === source.infoHash);
  if (version) return { bytes: version.size, download: false };

  return {
    bytes: expectedBytes(
      torrentOf(source.infoHash)?.size ?? 0,
      source.forEpisode,
      episodesInSeason,
    ),
    download: true,
  };
}

/**
 * Where the request of a user stands, from what the modules say of it. The
 * room is what holds back a request that is bound to nothing.
 */
function standingOf(
  request: MediaRequest,
  source: RequestSource | undefined,
  binding: RequestBinding | undefined,
  item: TorrentItemDto | undefined,
  file: MediaFile | undefined,
  room: Room | undefined,
): Standing {
  if (!request.approved) {
    return { status: RequestStatus.WaitingForApproval };
  }
  // A request that has its file has it, whatever its source is now
  if (file) return { status: RequestStatus.Available };
  if (!request.neededSince) {
    return {
      status: source ? RequestStatus.InactiveAhead : RequestStatus.NoPreference,
    };
  }
  if (!source) return { status: RequestStatus.NoPreference };
  if (binding?.error) {
    return { status: RequestStatus.Failed, error: binding.error };
  }
  if (!item) {
    if (room === 'over-quota') return { status: RequestStatus.OverQuota };
    if (room === 'disk-full') return { status: RequestStatus.DiskFull };

    return { status: RequestStatus.Resolving };
  }

  switch (item.status) {
    case TorrentItemStatus.Failed:
      return { status: RequestStatus.Failed, error: item.error };
    case TorrentItemStatus.NoMatch:
      return { status: RequestStatus.NoFileInTorrent, error: item.error };
    case TorrentItemStatus.Downloading:
      return { status: RequestStatus.Downloading, progress: item.progress };
    case TorrentItemStatus.Complete:
      return { status: RequestStatus.Downloading, progress: 1 };
    default:
      return { status: RequestStatus.Resolving };
  }
}

/** No request of anyone keeps a file of the episode or the movie from the next cleanup */
const isCleanedUp = (ofMedia: MediaFile[], held: Set<string>) =>
  ofMedia.length > 0 &&
  ofMedia.every((file) => file.managed && !held.has(file.id));

/** The torrents that have data on the server or that something is wanted of, and the ones files came from */
const onServerOf = (
  known: Map<string, TorrentWithItemsDto>,
  files: MediaFile[],
): string[] => [
  ...new Set([
    ...[...known.values()]
      .filter((torrent) => isOnServer(torrent))
      .map((torrent) => torrent.infoHash),
    ...files.flatMap((file) => file.infoHash ?? []),
  ]),
];

/** A torrent that has data on the server, or that something is wanted of */
const isOnServer = (torrent: TorrentWithItemsDto) =>
  torrent.downloadedBytes > 0 ||
  torrent.items.some((item) => item.status !== TorrentItemStatus.Released);

const toTorrentDto = ({ items, ...torrent }: TorrentWithItemsDto): TorrentDto =>
  torrent;

/** A preferred torrent that downloads knows nothing of yet: the release as it was picked */
const idleTorrent = (release: SelectedRelease): TorrentDto => ({
  infoHash: release.infoHash,
  title: release.title,
  indexer: release.indexer,
  size: release.size,
  downloadedBytes: 0,
  uploadedBytes: 0,
  status: TorrentStatus.Idle,
  peers: 0,
  downloadSpeed: 0,
  uploadSpeed: 0,
});

/** A preference as the status describes it: the torrent, or the file */
const describePreference = (
  source: Pick<EpisodeSource, 'kind'> &
    (
      | { kind: 'torrent'; infoHash: string }
      | { kind: 'file'; mediaFileId: string }
    ),
  torrentOf: TorrentOf,
  filesById: Map<string, MediaFile>,
): PreferenceDto =>
  source.kind === 'torrent'
    ? { torrent: torrentOf(source.infoHash) }
    : {
        file: describeFile(
          source.mediaFileId,
          filesById.get(source.mediaFileId),
        ),
      };

/** A preferred file: as it is in the library, or only its id when it is gone */
const describeFile = (
  mediaFileId: string,
  file: MediaFile | undefined,
): PreferredFileDto => ({
  id: mediaFileId,
  inLibrary: !!file,
  fileName: file && path.basename(file.path),
  size: file?.size,
  managed: file?.managed,
});
