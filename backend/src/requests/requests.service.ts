import { EntityManager } from '@mikro-orm/sqlite';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
  OnApplicationBootstrap,
} from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { randomUUID } from 'node:crypto';
import {
  EpisodeRefDto,
  MediaType,
  MediaTypeFull,
  PaginatedResponseDto,
  PaginationDto,
} from '../common/common.dto.js';
import { IndexersService } from '../indexers/indexers.service.js';
import { JobsService } from '../jobs/jobs.service.js';
import { MetadataService } from '../metadata/metadata.service.js';
import { hasEpisode, hasSeason } from '../metadata/metadata.utils.js';
import { PlayState } from '../user-data/play-state/play-state.entity.js';
import { User } from '../users/user.entity.js';
import {
  EpisodeSource,
  RequestSource,
  SeasonTorrent,
  sourceOf,
} from './request-source.js';
import { RequestRule } from './request-rule.entity.js';
import { MediaRequest } from './request.entity.js';
import {
  AdminMediaRequestDto,
  RequestRuleDto,
  UpdateMediaRequestDto,
} from './requests.dto.js';
import {
  fullTypeOf,
  Pair,
  pairOf,
  seriesPair,
  titleTypeOf,
  uniquePairs,
} from './requests.utils.js';
import { SelectedRelease } from './selected-release.entity.js';

/** A season (episode 0) or an episode of a series, for a user */
export interface SelectionTarget {
  userId: string;
  tmdbId: string;
  season: number;
  episode: number;
}

/** A request and where its user wants its file from, when they picked one */
export type RequestWithSource = MediaRequest & { source?: RequestSource };

/** A file of an episode in the library that an admin requests for a user */
export interface FileToRequest {
  id: string;
  mediaType: MediaType;
  tmdbId: string;
  season: number;
  episode: number;
  lastEpisode: number;
}

/** The rule of a user for a series, with nothing set when there is no row */
interface RuleRow extends RequestRuleDto {
  userId: string;
  tmdbId: string;
  seasonTorrents: SeasonTorrent[];
  episodeSources: EpisodeSource[];
}

const READ = { disableIdentityMap: true };
const HOUR = 60 * 60 * 1000;

const byEpisode = (
  a: { season: number; episode: number },
  b: { season: number; episode: number },
) => a.season - b.season || a.episode - b.episode;

/**
 * What users want on disk, and the gates a request passes before the
 * library acts on it: the admin's approval, a source picked by the user,
 * and the download-ahead window of the user's rule. Every change of a
 * request, or of what its source is, has the library look at the request
 * again, through the job `library.reconcileRequest`.
 */
@Injectable()
export class RequestsService implements OnApplicationBootstrap {
  constructor(
    private readonly em: EntityManager,
    private readonly metadataService: MetadataService,
    private readonly indexersService: IndexersService,
    private readonly jobs: JobsService,
  ) {}

  /** The rules can be behind after a restart or a migration */
  onApplicationBootstrap(): Promise<void> {
    return this.applyAllRules();
  }

  /**
   * Applies the rule of a user for a title to their requests for it, after
   * a change of what the rule goes by, in the caller's transaction. A rule
   * looks at all the requests of its user for the title, so it is applied
   * to the pair whole. A request row is a wish for its file, so the rule
   * can only let a request through to the library, or delete it; the
   * requests that become needed or are deleted are looked at by the
   * library.
   *
   * A request's `watchedAt` mirrors the play state of its episode. An
   * episode that was marked watched before the time was stored counts as
   * watched long ago.
   *
   * The rule looks at the approved requests in episode order. With
   * keepWatched or keepWatchedHours, the request for a watched episode is
   * deleted unless it is among the last keepWatched watched requests while
   * there is more to watch (a request after the last watched episode), or
   * it was watched within keepWatchedHours.
   *
   * Of the requests after the last watched episode, only the next keepNext
   * are needed, and a needed request stays so. An episode in progress is
   * not watched, so its request is one of the next ones. The requests for
   * the episodes up to the last watched one, skipped or watched, are
   * needed. Without a rule, or without keepNext, every approved request is.
   * A request only becomes needed with a source, the preference of its user
   * for the episode: without one it has not passed the gate, and a rule set
   * later applies to it. It takes its place in the window all the same, so
   * that nothing downloads past it.
   */
  async applyRule(em: EntityManager, pair: Pair): Promise<void> {
    const { userId, tmdbId } = pair;
    const ofTitle = { userId, tmdbId, mediaType: fullTypeOf(pair.mediaType) };
    const requests = await em.find(MediaRequest, ofTitle, READ);
    if (!requests.length) return;
    const rule = await em.findOne(RequestRule, pair, READ);
    const playStates = await em.find(PlayState, ofTitle, READ);

    const now = new Date();
    const stamps = new Map<string, Date | null>();
    const watchedAt = new Map<string, Date | null>();
    for (const request of requests) {
      const playState = playStates.find(
        (p) => p.season === request.season && p.episode === request.episode,
      );
      const at = playState?.watched
        ? (playState.watchedAt ?? new Date(0))
        : null;
      watchedAt.set(request.id, at);
      if (at?.getTime() !== request.watchedAt?.getTime()) {
        stamps.set(request.id, at);
      }
    }

    const ordered = requests
      .filter((request) => request.approved)
      .sort(byEpisode);
    const lastWatched = playStates
      .filter((p) => p.watched)
      .sort(byEpisode)
      .pop();
    const ahead = ordered.filter(
      (request) => !lastWatched || byEpisode(request, lastWatched) > 0,
    );

    const deleted = new Set<string>();
    if (rule && (rule.keepWatched !== null || rule.keepWatchedHours !== null)) {
      const watched = ordered.filter((request) => watchedAt.get(request.id));
      watched.forEach((request, index) => {
        const at = (watchedAt.get(request.id) as Date).getTime();
        const isAmongLast =
          rule.keepWatched !== null &&
          ahead.length > 0 &&
          index >= watched.length - rule.keepWatched;
        const isRecent =
          rule.keepWatchedHours !== null &&
          now.getTime() - at < rule.keepWatchedHours * HOUR;
        if (!isAmongLast && !isRecent) deleted.add(request.id);
      });
    }

    const next =
      rule && rule.keepNext !== null ? ahead.slice(0, rule.keepNext) : ahead;
    const needed: string[] = [];
    for (const request of ordered) {
      if (request.neededSince || deleted.has(request.id)) continue;

      const isInWindow = !ahead.includes(request) || next.includes(request);
      const hasSource = !!sourceOf(rule, request.season, request.episode);
      if (isInWindow && hasSource) needed.push(request.id);
    }

    for (const [id, at] of stamps) {
      await em.nativeUpdate(MediaRequest, { id }, { watchedAt: at });
    }
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
    await this.reconcileLater(em, [...needed, ...deleted]);
  }

  /**
   * An hours limit expires with time, and whatever a writer missed is right
   * by the morning: before the cleanup hour. Every pair is its own
   * transaction, as it is for the writers.
   */
  @Cron('50 3 * * *')
  async applyAllRules(): Promise<void> {
    const rows: {
      user_id: string;
      media_type: MediaTypeFull;
      tmdb_id: string;
    }[] = await this.em
      .fork()
      .execute('select distinct user_id, media_type, tmdb_id from request');

    for (const row of rows) {
      await this.em.fork().transactional((tx) =>
        this.applyRule(tx, {
          userId: row.user_id,
          mediaType: titleTypeOf(row.media_type),
          tmdbId: row.tmdb_id,
        }),
      );
    }
  }

  /** A request with the source its user prefers for it, for the library */
  async readRequest(
    em: EntityManager,
    id: string,
  ): Promise<RequestWithSource | undefined> {
    const request = await em.findOne(MediaRequest, { id }, READ);
    if (!request) return undefined;
    if (request.mediaType !== MediaTypeFull.Episode) return request;

    const rule = await em.findOne(
      RequestRule,
      {
        userId: request.userId,
        mediaType: MediaType.Series,
        tmdbId: request.tmdbId,
      },
      READ,
    );

    return {
      ...request,
      source: sourceOf(rule, request.season, request.episode),
    };
  }

  /**
   * Every request, or those of a user, with its title and the fields that
   * say whether it is needed, in user, title and episode order: for the
   * library
   */
  findRequests(
    em: EntityManager,
    filter: { userId?: string } = {},
  ): Promise<
    Pick<
      MediaRequest,
      'id' | 'userId' | 'mediaType' | 'tmdbId' | 'approved' | 'neededSince'
    >[]
  > {
    return em.find(
      MediaRequest,
      filter.userId ? { userId: filter.userId } : {},
      {
        ...READ,
        fields: [
          'id',
          'userId',
          'mediaType',
          'tmdbId',
          'approved',
          'neededSince',
        ],
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

  /** The limits of the rules of a user, by title: for the library's view of the user's titles */
  findRules(
    em: EntityManager,
    filter: { userId: string },
  ): Promise<
    Pick<
      RequestRule,
      'mediaType' | 'tmdbId' | 'keepNext' | 'keepWatched' | 'keepWatchedHours'
    >[]
  > {
    return em.find(RequestRule, filter, {
      ...READ,
      fields: [
        'mediaType',
        'tmdbId',
        'keepNext',
        'keepWatched',
        'keepWatchedHours',
      ],
    });
  }

  /** The releases users picked, with their .torrent files, for the library to hand to downloads */
  findSelectedReleases(
    em: EntityManager,
    infoHashes: string[],
  ): Promise<SelectedRelease[]> {
    if (!infoHashes.length) return Promise.resolve([]);

    return em.find(
      SelectedRelease,
      { infoHash: { $in: infoHashes } },
      { ...READ, populate: ['torrentFile'] },
    );
  }

  async findByUser(
    userId: string,
    pagination: PaginationDto,
  ): Promise<PaginatedResponseDto<MediaRequest>> {
    const [items, total] = await this.em.findAndCount(
      MediaRequest,
      { userId },
      {
        ...READ,
        orderBy: { createdAt: 'desc' },
        offset: (pagination.page - 1) * pagination.itemsPerPage,
        limit: pagination.itemsPerPage,
      },
    );

    return {
      items,
      total,
      page: pagination.page,
      itemsPerPage: pagination.itemsPerPage,
    };
  }

  findMovieRequest(
    userId: string,
    tmdbId: string,
  ): Promise<MediaRequest | undefined> {
    return this.em
      .findOne(
        MediaRequest,
        { userId, tmdbId, mediaType: MediaTypeFull.Movie },
        READ,
      )
      .then((request) => request ?? undefined);
  }

  async createMovieRequest(
    userId: string,
    tmdbId: string,
    approved: boolean,
  ): Promise<MediaRequest> {
    const movie = await this.metadataService.getMovieByTmdbId(tmdbId);
    if (!movie) throw new NotFoundException('Movie not found');

    await this.em.transactional(async (tx) => {
      await this.insertRequests(tx, [
        {
          userId,
          tmdbId,
          mediaType: MediaTypeFull.Movie,
          season: 0,
          episode: 0,
          approved,
        },
      ]);
      await this.applyRule(tx, { userId, mediaType: MediaType.Movie, tmdbId });
    });

    return this.findMovieRequest(userId, tmdbId);
  }

  deleteMovieRequest(userId: string, tmdbId: string): Promise<number> {
    return this.em.transactional((tx) =>
      this.deleteWhere(tx, { userId, tmdbId, mediaType: MediaTypeFull.Movie }),
    );
  }

  findSeriesRequests(userId: string, tmdbId: string): Promise<MediaRequest[]> {
    return this.em.find(
      MediaRequest,
      { userId, tmdbId, mediaType: MediaTypeFull.Episode },
      { ...READ, orderBy: { season: 'asc', episode: 'asc' } },
    );
  }

  async setEpisodeRequests(options: {
    userId: string;
    tmdbId: string;
    episodes: EpisodeRefDto[];
    requested: boolean;
    approved: boolean;
  }): Promise<MediaRequest[]> {
    const { userId, tmdbId, episodes, requested, approved } = options;

    const series = await this.metadataService.getSeriesByTmdbId(tmdbId);
    if (!series) throw new NotFoundException('Series not found');

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
              userId,
              tmdbId,
              mediaType: MediaTypeFull.Episode,
              season,
              episode,
              approved,
            })),
          );
        } else {
          await this.deleteWhere(tx, {
            userId,
            tmdbId,
            mediaType: MediaTypeFull.Episode,
            $or: episodes.map(({ season, episode }) => ({ season, episode })),
          });
        }
        await this.applyRule(tx, seriesPair(userId, tmdbId));
      });
    }

    return this.findSeriesRequests(userId, tmdbId);
  }

  findSeriesRule(
    userId: string,
    tmdbId: string,
  ): Promise<RequestRule | undefined> {
    return this.em
      .findOne(
        RequestRule,
        { userId, mediaType: MediaType.Series, tmdbId },
        READ,
      )
      .then((rule) => rule ?? undefined);
  }

  /** Sets the limits of the rule of a user for a series. The sources it prefers stay. */
  async setSeriesRule(
    userId: string,
    tmdbId: string,
    limits: RequestRuleDto,
  ): Promise<RequestRuleDto> {
    const series = await this.metadataService.getSeriesByTmdbId(tmdbId);
    if (!series) throw new NotFoundException('Series not found');

    const { keepNext, keepWatched, keepWatchedHours } = limits;
    await this.em.transactional(async (tx) => {
      const rule = await this.readRule(tx, userId, tmdbId);
      await this.writeRule(tx, {
        ...rule,
        keepNext,
        keepWatched,
        keepWatchedHours,
      });
      await this.applyRule(tx, seriesPair(userId, tmdbId));
    });

    return { keepNext, keepWatched, keepWatchedHours };
  }

  /**
   * Makes a release the torrent that the requests of a user for an episode,
   * or with episode 0 for a season, get their files from. The release is
   * resolved now, so that a link that leads nowhere fails here, and kept
   * with its magnet link or .torrent file so that it can be downloaded long
   * after the search result has expired. A source is what lets a request
   * through the download-ahead gate, so the rules are applied, and the
   * library looks at the requests in scope.
   */
  async preferRelease(
    target: SelectionTarget,
    releaseId: string,
  ): Promise<void> {
    const { userId, tmdbId, season, episode } = target;
    await this.assertSeasonOrEpisode(target);

    const release = this.indexersService.getRelease(releaseId);
    if (!release) {
      throw new NotFoundException('Release not found, search again');
    }
    // Fetches the .torrent file, outside any transaction
    const source = await this.indexersService.resolveTorrent(release);
    const { infoHash } = source;

    await this.em.transactional(async (tx) => {
      const magnetUrl = release.magnetUrl ?? source.magnetUrl;
      await tx
        .createQueryBuilder(SelectedRelease)
        .insert({
          infoHash,
          title: release.title,
          indexer: release.indexer,
          size: release.size,
          magnetUrl,
          torrentFile: source.torrentFile,
          createdAt: new Date(),
        })
        .onConflict('infoHash')
        .merge([
          'title',
          'indexer',
          'size',
          ...(magnetUrl ? (['magnetUrl'] as const) : []),
          ...(source.torrentFile ? (['torrentFile'] as const) : []),
        ])
        .execute();

      const rule = await this.readRule(tx, userId, tmdbId);
      const seasonTorrents = rule.seasonTorrents.filter(
        (t) => episode !== 0 || t.season !== season,
      );
      const episodeSources = rule.episodeSources.filter(
        (s) => s.season !== season || s.episode !== episode,
      );
      if (episode === 0) seasonTorrents.push({ season, infoHash });
      else episodeSources.push({ season, episode, kind: 'torrent', infoHash });
      await this.writeRule(tx, { ...rule, seasonTorrents, episodeSources });

      await this.applyRule(tx, seriesPair(userId, tmdbId));
      await this.reconcileSelectionScope(tx, target);
    });
  }

  /**
   * Makes a file in the library what the requests of a user for an episode
   * have. Whether the file is of the episode and in the library is the
   * library's to tell, when it looks at the request.
   */
  async preferFile(
    target: SelectionTarget,
    mediaFileId: string,
  ): Promise<void> {
    const { userId, tmdbId, season, episode } = target;
    await this.assertSeasonOrEpisode(target);

    await this.em.transactional(async (tx) => {
      const rule = await this.readRule(tx, userId, tmdbId);
      const episodeSources = rule.episodeSources.filter(
        (s) => s.season !== season || s.episode !== episode,
      );
      episodeSources.push({ season, episode, kind: 'file', mediaFileId });
      await this.writeRule(tx, { ...rule, episodeSources });

      await this.applyRule(tx, seriesPair(userId, tmdbId));
      await this.reconcileSelectionScope(tx, target);
    });
  }

  /**
   * Forgets the torrent a user prefers for a season, or the torrent or the
   * file for an episode. An episode falls back to its season's torrent.
   */
  async clearPreference(target: SelectionTarget): Promise<boolean> {
    const { userId, tmdbId, season, episode } = target;

    return this.em.transactional(async (tx) => {
      const rule = await this.readRule(tx, userId, tmdbId);
      const seasonTorrents = rule.seasonTorrents.filter(
        (t) => episode !== 0 || t.season !== season,
      );
      const episodeSources = rule.episodeSources.filter(
        (s) => s.season !== season || s.episode !== episode,
      );
      const had =
        seasonTorrents.length < rule.seasonTorrents.length ||
        episodeSources.length < rule.episodeSources.length;
      if (!had) return false;

      await this.writeRule(tx, { ...rule, seasonTorrents, episodeSources });
      await this.applyRule(tx, seriesPair(userId, tmdbId));
      await this.reconcileSelectionScope(tx, target);

      return true;
    });
  }

  /**
   * Requests the episodes of files in the library for a user and makes the
   * files what the requests have, which is how an admin keeps files. The
   * requests are approved and needed: the files are there, nothing
   * downloads. Of several files of an episode, the first gets the request.
   * Files of movies and of episodes the series does not have are skipped.
   */
  async requestFiles(
    userId: string,
    files: FileToRequest[],
  ): Promise<{ requests: number; skipped: number }> {
    const result = { requests: 0, skipped: 0 };
    const byTitle = new Map<string, FileToRequest[]>();
    for (const file of files) {
      if (file.mediaType !== MediaType.Series) {
        result.skipped++;
        continue;
      }
      byTitle.set(file.tmdbId, [...(byTitle.get(file.tmdbId) ?? []), file]);
    }

    for (const [tmdbId, titleFiles] of byTitle) {
      const series = await this.metadataService.getSeriesByTmdbId(tmdbId);
      const episodes = new Map<
        string,
        EpisodeRefDto & { file: FileToRequest }
      >();
      for (const file of titleFiles) {
        for (
          let episode = file.episode;
          episode <= file.lastEpisode;
          episode++
        ) {
          const key = `${file.season}/${episode}`;
          if (episodes.has(key)) continue;
          if (!series || !hasEpisode(series.tmdbSeries, file.season, episode)) {
            result.skipped++;
            continue;
          }
          episodes.set(key, { season: file.season, episode, file });
        }
      }
      if (!episodes.size) continue;

      await this.em.transactional(async (tx) => {
        const now = new Date();
        await this.insertRequests(
          tx,
          [...episodes.values()].map(({ season, episode }) => ({
            userId,
            tmdbId,
            mediaType: MediaTypeFull.Episode,
            season,
            episode,
            approved: true,
            neededSince: now,
          })),
        );
        const where = {
          userId,
          tmdbId,
          mediaType: MediaTypeFull.Episode,
          $or: [...episodes.values()].map(({ season, episode }) => ({
            season,
            episode,
          })),
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

        const rule = await this.readRule(tx, userId, tmdbId);
        const episodeSources = rule.episodeSources.filter(
          (s) => !episodes.has(`${s.season}/${s.episode}`),
        );
        for (const { season, episode, file } of episodes.values()) {
          episodeSources.push({
            season,
            episode,
            kind: 'file',
            mediaFileId: file.id,
          });
        }
        await this.writeRule(tx, { ...rule, episodeSources });

        await this.applyRule(tx, seriesPair(userId, tmdbId));
        await this.reconcileLater(
          tx,
          requests.map((request) => request.id),
        );
        result.requests += requests.length;
      });
    }

    return result;
  }

  /**
   * Deletes requests by id in the caller's transaction, applies the rules
   * to the rest of their pairs, and has the library let go of what the
   * requests had
   */
  async deleteRequests(em: EntityManager, ids: string[]): Promise<number> {
    if (!ids.length) return 0;

    const requests = await em.find(MediaRequest, { id: { $in: ids } }, READ);
    if (!requests.length) return 0;

    await em.nativeDelete(MediaRequest, {
      id: { $in: requests.map((r) => r.id) },
    });
    await this.reconcileLater(
      em,
      requests.map((request) => request.id),
    );
    for (const pair of uniquePairs(requests.map(pairOf))) {
      await this.applyRule(em, pair);
    }

    return requests.length;
  }

  /** For a user that is deleted, before the rows go: the library lets go of what their requests had */
  async userDeleting(em: EntityManager, userId: string): Promise<void> {
    const requests = await em.find(
      MediaRequest,
      { userId },
      { ...READ, fields: ['id'] },
    );
    await this.reconcileLater(
      em,
      requests.map((request) => request.id),
    );
  }

  async findAll(
    pagination: PaginationDto,
    approved?: boolean,
  ): Promise<PaginatedResponseDto<AdminMediaRequestDto>> {
    const [items, total] = await this.em.findAndCount(
      MediaRequest,
      approved === undefined ? {} : { approved },
      {
        ...READ,
        orderBy: { createdAt: 'desc' },
        offset: (pagination.page - 1) * pagination.itemsPerPage,
        limit: pagination.itemsPerPage,
      },
    );

    return {
      items: await this.withRequesters(items),
      total,
      page: pagination.page,
      itemsPerPage: pagination.itemsPerPage,
    };
  }

  async findById(id: string): Promise<AdminMediaRequestDto | undefined> {
    const request = await this.em.findOne(MediaRequest, { id }, READ);

    return request ? (await this.withRequesters([request]))[0] : undefined;
  }

  /** Approves a request. Approval is not taken back. */
  async update(
    id: string,
    update: UpdateMediaRequestDto,
  ): Promise<AdminMediaRequestDto> {
    if (update?.approved !== true) {
      throw new BadRequestException('A request can only be approved');
    }

    await this.em.transactional(async (tx) => {
      const request = await tx.findOne(MediaRequest, { id }, READ);
      if (!request) throw new NotFoundException('Request not found');

      await tx.nativeUpdate(
        MediaRequest,
        { id },
        { approved: true, updatedAt: new Date() },
      );
      await this.applyRule(tx, pairOf(request));
    });

    return this.findById(id);
  }

  deleteById(id: string): Promise<number> {
    return this.em.transactional((tx) => this.deleteRequests(tx, [id]));
  }

  private async assertSeasonOrEpisode(target: SelectionTarget): Promise<void> {
    const { tmdbId, season, episode } = target;
    const series = await this.metadataService.getSeriesByTmdbId(tmdbId);
    if (!series) throw new NotFoundException('Series not found');

    const exists =
      episode === 0
        ? hasSeason(series.tmdbSeries, season)
        : hasEpisode(series.tmdbSeries, season, episode);
    if (!exists) throw new NotFoundException('Season or episode not found');
  }

  /** Inserts requests that do not exist yet; one made at the same time wins */
  private insertRequests(
    tx: EntityManager,
    requests: Pick<
      MediaRequest,
      'userId' | 'tmdbId' | 'mediaType' | 'season' | 'episode' | 'approved'
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
          createdAt: now,
          updatedAt: now,
        })),
      )
      .onConflict(['userId', 'mediaType', 'tmdbId', 'season', 'episode'])
      .ignore()
      .execute();
  }

  /** Deletes the requests that match and has the library let go of what they had */
  private async deleteWhere(
    tx: EntityManager,
    where: Record<string, unknown>,
  ): Promise<number> {
    const requests = await tx.find(MediaRequest, where, {
      ...READ,
      fields: ['id'],
    });
    if (!requests.length) return 0;

    const ids = requests.map((request) => request.id);
    await tx.nativeDelete(MediaRequest, { id: { $in: ids } });
    await this.reconcileLater(tx, ids);

    return ids.length;
  }

  /** Has the library look at the requests of the user in the scope of a preference */
  private async reconcileSelectionScope(
    tx: EntityManager,
    target: SelectionTarget,
  ) {
    const { userId, tmdbId, season, episode } = target;
    const requests = await tx.find(
      MediaRequest,
      {
        userId,
        tmdbId,
        mediaType: MediaTypeFull.Episode,
        season,
        ...(episode !== 0 && { episode }),
      },
      { ...READ, fields: ['id'] },
    );
    await this.reconcileLater(
      tx,
      requests.map((request) => request.id),
    );
  }

  /** Tells the library that requests changed, in the caller's transaction */
  private async reconcileLater(
    em: EntityManager,
    ids: string[],
  ): Promise<void> {
    for (const requestId of new Set(ids)) {
      await this.jobs.enqueue(em, 'library.reconcileRequest', { requestId });
    }
  }

  private async readRule(
    tx: EntityManager,
    userId: string,
    tmdbId: string,
  ): Promise<RuleRow> {
    const rule = await tx.findOne(
      RequestRule,
      { userId, mediaType: MediaType.Series, tmdbId },
      READ,
    );

    return {
      userId,
      tmdbId,
      keepNext: rule?.keepNext ?? null,
      keepWatched: rule?.keepWatched ?? null,
      keepWatchedHours: rule?.keepWatchedHours ?? null,
      seasonTorrents: rule?.seasonTorrents ?? [],
      episodeSources: rule?.episodeSources ?? [],
    };
  }

  /** A rule row exists while it has a limit or a preference */
  private async writeRule(tx: EntityManager, rule: RuleRow): Promise<void> {
    const { userId, tmdbId, keepNext, keepWatched, keepWatchedHours } = rule;
    const isEmpty =
      keepNext === null &&
      keepWatched === null &&
      keepWatchedHours === null &&
      !rule.seasonTorrents.length &&
      !rule.episodeSources.length;
    if (isEmpty) {
      await tx.nativeDelete(RequestRule, {
        userId,
        mediaType: MediaType.Series,
        tmdbId,
      });
      return;
    }

    await tx
      .createQueryBuilder(RequestRule)
      .insert({
        id: randomUUID(),
        userId,
        mediaType: MediaType.Series,
        tmdbId,
        keepNext,
        keepWatched,
        keepWatchedHours,
        seasonTorrents: rule.seasonTorrents.length ? rule.seasonTorrents : null,
        episodeSources: rule.episodeSources.length ? rule.episodeSources : null,
      })
      .onConflict(['userId', 'mediaType', 'tmdbId'])
      .merge([
        'keepNext',
        'keepWatched',
        'keepWatchedHours',
        'seasonTorrents',
        'episodeSources',
      ])
      .execute();
  }

  private async withRequesters(
    requests: MediaRequest[],
  ): Promise<AdminMediaRequestDto[]> {
    const users = await this.em.find(
      User,
      { id: { $in: requests.map((request) => request.userId) } },
      { ...READ, fields: ['id', 'name'] },
    );

    return requests.map((request) => {
      const user = users.find((user) => user.id === request.userId);

      return { ...request, user: { id: user.id, name: user.name } };
    });
  }
}
