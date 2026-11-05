import { EntityManager } from '@mikro-orm/sqlite';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import {
  EpisodeRefDto,
  MediaType,
  Pair,
  pairKey,
  uniquePairs,
} from '../common/common.dto.js';
import { EventsService } from '../events/events.service.js';
import { JobsService } from '../jobs/jobs.service.js';
import { MetadataService } from '../metadata/metadata.service.js';
import { hasEpisode } from '../metadata/metadata.utils.js';
import { PlayState } from '../user-data/play-state.entity.js';
import { RequestSource } from './request-source.entity.js';
import { RequestRule } from './request-rule.entity.js';
import { MediaRequest } from './request.entity.js';
import {
  MediaRequestDto,
  MovieRequestsDto,
  RequestRuleDto,
  RequestSourceDto,
  SeriesRequestsDto,
} from './requests.dto.js';
import {
  isAhead,
  pairOf,
  ResolvedSource,
  resolvedOf,
  sourceOf,
  writeSource,
} from './requests.utils.js';

/** A request and where its user wants its file from, when they picked one */
export type RequestWithSource = MediaRequest & { source?: ResolvedSource };

/** A file of an episode or a movie in the library that an admin requests for a user */
export interface FileToRequest {
  id: string;
  mediaType: MediaType;
  tmdbId: string;
  season: number;
  episode: number;
  lastEpisode: number;
}

/** An episode or a movie to request, with the file it is to have */
type FileRequest = EpisodeRefDto & { file: FileToRequest };

/** The rule of a user for a title, with nothing set when there is no row */
type RuleRow = RequestRuleDto & Pair;

const READ = { disableIdentityMap: true };
const HOUR = 60 * 60 * 1000;

const byEpisode = (
  a: { season: number; episode: number },
  b: { season: number; episode: number },
) => a.season - b.season || a.episode - b.episode;

/** A source as the clients get it: the release as it was picked, or the id of the file */
const toRequestSourceDto = (source: RequestSource): RequestSourceDto => {
  const resolved = resolvedOf(source);
  if (!resolved) return {};
  if (resolved.kind === 'file') return { mediaFileId: resolved.mediaFileId };

  const { infoHash, title, indexer, size } = resolved.release;

  return { release: { infoHash, title, indexer, size } };
};

/**
 * What users want on disk, and the gates a request passes before the
 * library acts on it: a source picked by the user and the download-ahead
 * window of the user's rule. Every change of a
 * request, or of what its source is, has the library look at the request
 * again, through the job `library.reconcileBinding`, and tells the clients
 * of the user that their requests of the title changed.
 */
@Injectable()
export class RequestsService {
  constructor(
    private readonly em: EntityManager,
    private readonly metadataService: MetadataService,
    private readonly jobs: JobsService,
    private readonly events: EventsService,
  ) {}

  /**
   * Brings the requests of a user for a title in line with what they go by,
   * their play states, rule and sources, after a change of any of them, in
   * the caller's transaction. A rule looks at all the requests of its user
   * for the title, so the pair goes whole. A request row is a wish for its
   * file, so this can only let a request through to the library, or delete
   * it; the requests that become needed or are deleted are looked at by the
   * library.
   *
   * Every writer of the requests, the rule, the sources or the play
   * states of the pair calls this, so this is where the clients of
   * the user are told that their requests of the title changed, whether
   * or not the rule changed anything.
   */
  async reconcileRequests(em: EntityManager, pair: Pair): Promise<void> {
    const { userId, mediaType, tmdbId } = pair;
    this.events.emit({ type: 'requests', userId, data: { mediaType, tmdbId } });

    const requests = await this.findRequestsWithSources(em, pair);
    if (!requests.length) return;
    const ofTitle = { userId, mediaType, tmdbId };
    const rule = await em.findOne(RequestRule, ofTitle, READ);
    const playStates = await em.find(PlayState, ofTitle, READ);

    const now = new Date();
    const orderedRequests = requests.filter((r) => r.approved);
    const watchedStates = playStates.filter((p) => p.watched).sort(byEpisode);
    const lastWatched = watchedStates.at(-1);
    const upcoming = orderedRequests.filter(
      (r) => !lastWatched || byEpisode(r, lastWatched) > 0,
    );

    // Autodelete requests of watched episodes
    const deleted = new Set<string>();
    if (rule && (rule.keepWatched !== null || rule.keepWatchedHours !== null)) {
      const watched = orderedRequests.flatMap((request) => {
        const state = watchedStates.find(
          (p) => p.season === request.season && p.episode === request.episode,
        );
        // Marked watched before the time was stored: watched long ago
        return state
          ? [{ id: request.id, at: state.watchedAt?.getTime() ?? 0 }]
          : [];
      });
      watched.forEach(({ id, at }, index) => {
        // keepWatched: the last watched ones, while there is more to watch
        const isAmongLast =
          rule.keepWatched !== null &&
          upcoming.length > 0 &&
          index >= watched.length - rule.keepWatched;
        // keepWatchedHours: the ones watched within the limit
        const isRecent =
          rule.keepWatchedHours !== null &&
          now.getTime() - at < rule.keepWatchedHours * HOUR;
        if (!isAmongLast && !isRecent) deleted.add(id);
      });
    }

    // Download ahead: of the requests after the last watched episode, only the
    // next keepNext are needed, and a needed request stays so. An episode in
    // progress is not watched, so its request is one of the next ones. The
    // requests up to the last watched episode, skipped or watched, are needed.
    // Without a rule, or without keepNext, every approved request is.
    //
    // A request only becomes needed with a source, what its user selected
    // for the episode: without one it has not passed the gate, and a rule set
    // later applies to it. It takes its place in the window all the same, so
    // that nothing downloads past it.
    const pastWindow = upcoming.slice(rule?.keepNext ?? upcoming.length);
    const needed = orderedRequests
      .filter(
        (r) =>
          !r.neededSince &&
          !deleted.has(r.id) &&
          !pastWindow.includes(r) &&
          r.source,
      )
      .map((r) => r.id);

    if (deleted.size) {
      await em.nativeDelete(MediaRequest, { id: { $in: [...deleted] } });
    }
    if (needed.length) {
      await em.nativeUpdate(
        MediaRequest,
        { id: { $in: needed } },
        { neededSince: now },
      );
    }
    await this.reconcileBindingsLater(em, [...needed, ...deleted]);
  }

  /**
   * An hours limit expires with time, and whatever a writer missed is right
   * by the morning: before the cleanup hour. Every pair is its own
   * transaction, as it is for the writers; the run is one unit of work,
   * whose events go out when it is done.
   */
  reconcileAllRequests(): Promise<void> {
    return this.events.run(async () => {
      const rows: {
        user_id: string;
        media_type: MediaType;
        tmdb_id: string;
      }[] = await this.em
        .fork()
        .execute('select distinct user_id, media_type, tmdb_id from request');

      for (const row of rows) {
        await this.em.fork().transactional((tx) =>
          this.reconcileRequests(tx, {
            userId: row.user_id,
            mediaType: row.media_type,
            tmdbId: row.tmdb_id,
          }),
        );
      }
    });
  }

  /** Tells the library that requests changed, in the caller's transaction */
  async reconcileBindingsLater(
    em: EntityManager,
    ids: string[],
  ): Promise<void> {
    for (const requestId of new Set(ids)) {
      await this.jobs.enqueue(em, 'library.reconcileBinding', { requestId });
    }
  }

  /** A request with the source its user selected for it, for the library */
  async readRequestWithSource(
    em: EntityManager,
    id: string,
  ): Promise<RequestWithSource | undefined> {
    const request = await em.findOne(MediaRequest, { id }, READ);
    if (!request) return undefined;

    const sources = await em.find(
      RequestSource,
      {
        ...pairOf(request),
        season: request.season,
        episode: { $in: [request.episode, 0] },
      },
      { ...READ, populate: ['torrentFile'] },
    );

    return {
      ...request,
      source: sourceOf(sources, request.season, request.episode),
    };
  }

  /**
   * The requests of a user for a title with their sources, in season and
   * episode order, without the .torrent files: for reconciling them and for
   * what the library says of them. The fulfilment reads the one it acts on
   * with readRequestWithSource.
   */
  async findRequestsWithSources(
    em: EntityManager,
    { userId, mediaType, tmdbId }: Pair,
  ): Promise<RequestWithSource[]> {
    const requests = await em.find(
      MediaRequest,
      { userId, mediaType, tmdbId },
      { ...READ, orderBy: { season: 'asc', episode: 'asc' } },
    );
    const sources = await this.findSources(em, { userId, mediaType, tmdbId });

    return requests.map((request) => ({
      ...request,
      source: sourceOf(sources, request.season, request.episode),
    }));
  }

  /**
   * Every request, or those of a user, with the fields that say whether it
   * is needed, in user, title and episode order: for the library
   */
  findRequests(
    em: EntityManager,
    filter: { userId?: string } = {},
  ): Promise<Pick<MediaRequest, 'id' | 'approved' | 'neededSince'>[]> {
    return em.find(
      MediaRequest,
      filter.userId ? { userId: filter.userId } : {},
      {
        ...READ,
        fields: ['id', 'approved', 'neededSince'],
        orderBy: {
          userId: 'asc',
          mediaType: 'asc',
          tmdbId: 'asc',
          season: 'asc',
          episode: 'asc',
        },
      },
    );
  }

  /** The request of a user for a movie with the rule and the source it is fulfilled by: the document of the movie page */
  async describeMovieRequests(
    userId: string,
    tmdbId: string,
  ): Promise<MovieRequestsDto> {
    const pair = { userId, mediaType: MediaType.Movie, tmdbId };
    const {
      requests: [request],
      sources: [source],
    } = await this.readRequestDtos(pair);
    const rule = await this.findRule(pair);

    return {
      request,
      rule: { keepWatchedHours: rule?.keepWatchedHours ?? null },
      source: source && toRequestSourceDto(source),
    };
  }

  /** The requests of a user for a series with the rule and the sources they are fulfilled by: the document of the series page */
  async describeSeriesRequests(
    userId: string,
    tmdbId: string,
  ): Promise<SeriesRequestsDto> {
    const pair = { userId, mediaType: MediaType.Series, tmdbId };
    const { requests, sources } = await this.readRequestDtos(pair);
    const rule = await this.findRule(pair);

    return {
      requests,
      rule: {
        keepNext: rule?.keepNext ?? null,
        keepWatched: rule?.keepWatched ?? null,
        keepWatchedHours: rule?.keepWatchedHours ?? null,
      },
      sources: sources.map((source) => ({
        season: source.season,
        episode: source.episode,
        ...toRequestSourceDto(source),
      })),
    };
  }

  async createMovieRequest(
    userId: string,
    tmdbId: string,
  ): Promise<MediaRequestDto> {
    await this.assertMovieExists(tmdbId);
    const pair = { userId, mediaType: MediaType.Movie, tmdbId };

    await this.em.transactional(async (tx) => {
      await this.insertRequests(tx, [{ ...pair, season: 0, episode: 0 }]);
      await this.reconcileRequests(tx, pair);
    });

    const {
      requests: [request],
    } = await this.readRequestDtos(pair);

    return request;
  }

  deleteMovieRequest(userId: string, tmdbId: string): Promise<number> {
    return this.em.transactional((tx) =>
      this.deleteWhere(tx, { userId, tmdbId, mediaType: MediaType.Movie }),
    );
  }

  async setEpisodeRequests(options: {
    userId: string;
    tmdbId: string;
    episodes: EpisodeRefDto[];
    requested: boolean;
  }): Promise<MediaRequestDto[]> {
    const { userId, tmdbId, episodes, requested } = options;
    const pair = { userId, mediaType: MediaType.Series, tmdbId };

    const series = await this.assertSeriesExists(tmdbId);

    const unknown = episodes.find(
      (e) => !hasEpisode(series.tmdbSeries, e.season, e.episode),
    );
    if (unknown) {
      throw new BadRequestException(
        `Season ${unknown.season} episode ${unknown.episode} does not exist`,
      );
    }

    if (episodes.length) {
      await this.em.transactional(async (tx) => {
        if (requested) {
          await this.insertRequests(
            tx,
            episodes.map(({ season, episode }) => ({
              ...pair,
              season,
              episode,
            })),
          );
          await this.reconcileRequests(tx, pair);
        } else {
          await this.deleteWhere(tx, {
            ...pair,
            $or: episodes.map(({ season, episode }) => ({ season, episode })),
          });
        }
      });
    }

    const { requests } = await this.readRequestDtos(pair);

    return requests;
  }

  /** Sets the limits of the rule of a user for a title */
  async setRule(pair: Pair, limits: RequestRuleDto): Promise<RequestRuleDto> {
    if (pair.mediaType === MediaType.Movie) {
      await this.assertMovieExists(pair.tmdbId);
    } else {
      await this.assertSeriesExists(pair.tmdbId);
    }

    const { keepNext, keepWatched, keepWatchedHours } = limits;
    await this.em.transactional(async (tx) => {
      await this.writeRule(tx, {
        ...pair,
        keepNext,
        keepWatched,
        keepWatchedHours,
      });
      await this.reconcileRequests(tx, pair);
    });

    return { keepNext, keepWatched, keepWatchedHours };
  }

  /**
   * Requests the episodes and the movies of files in the library for a user
   * and makes the files what the requests have, which is how an admin keeps
   * files. The requests are needed: the files are there, nothing downloads.
   * Of several files of an episode or a movie, the first gets the request.
   * Files of episodes the series does not have, and of movies that are not
   * known, are skipped.
   */
  async requestFiles(
    userId: string,
    files: FileToRequest[],
  ): Promise<{ requests: number; skipped: number }> {
    const result = { requests: 0, skipped: 0 };
    const byTitle = new Map<string, FileToRequest[]>();
    for (const file of files) {
      const key = pairKey({ userId, ...file });
      byTitle.set(key, [...(byTitle.get(key) ?? []), file]);
    }

    for (const titleFiles of byTitle.values()) {
      const { mediaType, tmdbId } = titleFiles[0];
      const { fileRequests, skipped } = await this.getFileRequests(titleFiles);
      result.skipped += skipped;
      if (!fileRequests.length) continue;

      result.requests += await this.em.transactional((tx) =>
        this.writeFileRequests(tx, { userId, mediaType, tmdbId }, fileRequests),
      );
    }

    return result;
  }

  /** Deletes requests by id in the caller's transaction, as deleteWhere does */
  deleteRequests(em: EntityManager, ids: string[]): Promise<number> {
    return this.deleteWhere(em, { id: { $in: ids } });
  }

  /** For a user that is deleted, before the rows go: the library lets go of what their requests had */
  async userDeleting(em: EntityManager, userId: string): Promise<void> {
    const requests = await this.findRequests(em, { userId });
    await this.reconcileBindingsLater(
      em,
      requests.map((request) => request.id),
    );
  }

  private async assertMovieExists(tmdbId: string): Promise<void> {
    const movie = await this.metadataService.getMovieByTmdbId(tmdbId);
    if (!movie) throw new NotFoundException('Movie not found');
  }

  private async assertSeriesExists(tmdbId: string) {
    const series = await this.metadataService.getSeriesByTmdbId(tmdbId);
    if (!series) throw new NotFoundException('Series not found');

    return series;
  }

  /** What the files of a title are to request, each with the first file of it, and how many of them the title does not have */
  private async getFileRequests(
    files: FileToRequest[],
  ): Promise<{ fileRequests: FileRequest[]; skipped: number }> {
    const { mediaType, tmdbId } = files[0];
    if (mediaType === MediaType.Movie) {
      const movie = await this.metadataService.getMovieByTmdbId(tmdbId);

      return movie
        ? {
            fileRequests: [{ season: 0, episode: 0, file: files[0] }],
            skipped: 0,
          }
        : { fileRequests: [], skipped: 1 };
    }

    const series = await this.metadataService.getSeriesByTmdbId(tmdbId);
    const fileRequests = new Map<string, FileRequest>();
    let skipped = 0;
    for (const file of files) {
      for (let episode = file.episode; episode <= file.lastEpisode; episode++) {
        const key = `${file.season}/${episode}`;
        if (fileRequests.has(key)) continue;
        if (!series || !hasEpisode(series.tmdbSeries, file.season, episode)) {
          skipped++;
          continue;
        }
        fileRequests.set(key, { season: file.season, episode, file });
      }
    }

    return { fileRequests: [...fileRequests.values()], skipped };
  }

  /** Requests the episodes or the movie and makes the files what they have; how many requests that is */
  private async writeFileRequests(
    tx: EntityManager,
    pair: Pair,
    fileRequests: FileRequest[],
  ): Promise<number> {
    const now = new Date();
    await this.insertRequests(
      tx,
      fileRequests.map(({ season, episode }) => ({
        ...pair,
        season,
        episode,
        neededSince: now,
      })),
    );
    const where = {
      ...pair,
      $or: fileRequests.map(({ season, episode }) => ({ season, episode })),
    };
    // The ones that were requested before are let through as well
    await tx.nativeUpdate(
      MediaRequest,
      {
        ...where,
        $and: [{ $or: [{ approved: false }, { neededSince: null }] }],
      },
      { approved: true, neededSince: now, updatedAt: now },
    );
    const requests = await tx.find(MediaRequest, where, {
      ...READ,
      fields: ['id'],
    });

    for (const { season, episode, file } of fileRequests) {
      await writeSource(tx, {
        ...pair,
        season,
        episode,
        kind: 'file',
        mediaFileId: file.id,
      });
    }

    await this.reconcileRequests(tx, pair);
    await this.reconcileBindingsLater(
      tx,
      requests.map((request) => request.id),
    );

    return requests.length;
  }

  /** Inserts requests that do not exist yet, approved; one made at the same time wins */
  private insertRequests(
    tx: EntityManager,
    requests: Pick<
      MediaRequest,
      'userId' | 'tmdbId' | 'mediaType' | 'season' | 'episode'
    >[] &
      Partial<Pick<MediaRequest, 'neededSince'>>[],
  ) {
    const now = new Date();

    return tx
      .createQueryBuilder(MediaRequest)
      .insert(
        requests.map((request) => ({
          id: randomUUID(),
          ...request,
          approved: true,
          createdAt: now,
          updatedAt: now,
        })),
      )
      .onConflict(['userId', 'mediaType', 'tmdbId', 'season', 'episode'])
      .ignore()
      .execute();
  }

  /**
   * Deletes the requests that match, has the library let go of what they
   * had, and reconciles the rest of their pairs
   */
  private async deleteWhere(
    tx: EntityManager,
    where: Record<string, unknown>,
  ): Promise<number> {
    const requests = await tx.find(MediaRequest, where, {
      ...READ,
      fields: ['id', 'userId', 'mediaType', 'tmdbId'],
    });
    if (!requests.length) return 0;

    const ids = requests.map((request) => request.id);
    await tx.nativeDelete(MediaRequest, { id: { $in: ids } });
    await this.reconcileBindingsLater(tx, ids);
    for (const pair of uniquePairs(requests.map(pairOf))) {
      await this.reconcileRequests(tx, pair);
    }

    return ids.length;
  }

  /** A rule row exists while it has a limit */
  private async writeRule(tx: EntityManager, rule: RuleRow): Promise<void> {
    const { userId, mediaType, tmdbId } = rule;
    const { keepNext, keepWatched, keepWatchedHours } = rule;
    const isEmpty =
      keepNext === null && keepWatched === null && keepWatchedHours === null;
    if (isEmpty) {
      await tx.nativeDelete(RequestRule, { userId, mediaType, tmdbId });
      return;
    }

    await tx
      .createQueryBuilder(RequestRule)
      .insert({
        id: randomUUID(),
        userId,
        mediaType,
        tmdbId,
        keepNext,
        keepWatched,
        keepWatchedHours,
      })
      .onConflict(['userId', 'mediaType', 'tmdbId'])
      .merge(['keepNext', 'keepWatched', 'keepWatchedHours'])
      .execute();
  }

  private findRule({ userId, mediaType, tmdbId }: Pair) {
    return this.em.findOne(RequestRule, { userId, mediaType, tmdbId }, READ);
  }

  /** The sources of a user for a title, in season and episode order, without the .torrent files */
  private findSources(
    em: EntityManager,
    { userId, mediaType, tmdbId }: Pair,
  ): Promise<RequestSource[]> {
    return em.find(
      RequestSource,
      { userId, mediaType, tmdbId },
      { ...READ, orderBy: { season: 'asc', episode: 'asc' } },
    );
  }

  /** The requests of a title as the clients get them, in episode order, with the sources they go by */
  private async readRequestDtos(
    pair: Pair,
  ): Promise<{ requests: MediaRequestDto[]; sources: RequestSource[] }> {
    const { userId, mediaType, tmdbId } = pair;
    const requests = await this.em.find(
      MediaRequest,
      { userId, mediaType, tmdbId },
      { ...READ, orderBy: { season: 'asc', episode: 'asc' } },
    );
    const sources = await this.findSources(this.em, pair);

    return {
      requests: requests.map((request) => ({
        ...request,
        ahead: isAhead(request, sources),
      })),
      sources,
    };
  }
}
