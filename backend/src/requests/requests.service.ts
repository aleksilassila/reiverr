import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityManager, EntityRepository } from '@mikro-orm/sqlite';
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
import { evaluateRules, fullTypeOf, titleTypeOf } from './request-rules.js';
import { RequestRule } from './request-rule.entity.js';
import { MediaRequest } from './request.entity.js';
import {
  AdminMediaRequestDto,
  RequestRuleDto,
  UpdateMediaRequestDto,
} from './requests.dto.js';
import {
  EpisodeTorrent,
  ReleaseSnapshot,
  SeasonTorrent,
} from './torrent-preference.js';

/** A user and a title, whose requests a rule looks at together */
export interface Pair {
  userId: string;
  mediaType: MediaType;
  tmdbId: string;
}

/** A season (episode 0) or an episode of a series, for a user */
export interface SelectionTarget {
  userId: string;
  tmdbId: string;
  season: number;
  episode: number;
}

/** The rule of a user for a series, with nothing set when there is no row */
interface RuleRow extends RequestRuleDto {
  userId: string;
  tmdbId: string;
  seasonTorrents: SeasonTorrent[];
  episodeTorrents: EpisodeTorrent[];
}

const READ = { disableIdentityMap: true };

const uniquePairs = (pairs: Pair[]): Pair[] => [
  ...new Map(
    pairs.map(({ userId, mediaType, tmdbId }) => [
      `${userId}/${mediaType}/${tmdbId}`,
      { userId, mediaType, tmdbId },
    ]),
  ).values(),
];

const pairOf = (
  request: Pick<MediaRequest, 'userId' | 'mediaType' | 'tmdbId'>,
): Pair => ({
  userId: request.userId,
  mediaType: titleTypeOf(request.mediaType),
  tmdbId: request.tmdbId,
});

@Injectable()
export class RequestsService implements OnApplicationBootstrap {
  constructor(
    @InjectRepository(MediaRequest)
    private readonly requestRepository: EntityRepository<MediaRequest>,
    @InjectRepository(RequestRule)
    private readonly ruleRepository: EntityRepository<RequestRule>,
    private readonly em: EntityManager,
    private readonly metadataService: MetadataService,
    private readonly indexersService: IndexersService,
    private readonly jobs: JobsService,
  ) {}

  /** The rules can be behind after a restart or a migration */
  onApplicationBootstrap(): Promise<void> {
    return this.applyRulesToAll();
  }

  /**
   * Applies the rules to the requests of (user, title) pairs after a change
   * of what they go by, and has the titles reconciled. Runs in the caller's
   * transaction. A rule looks at all the requests of its user for the title,
   * so the rules are applied to a pair whole.
   */
  async applyRules(em: EntityManager, pairs: Pair[]): Promise<void> {
    const unique = uniquePairs(pairs);
    if (!unique.length) return;

    const ofPairs = unique.map(({ userId, mediaType, tmdbId }) => ({
      userId,
      tmdbId,
      mediaType: fullTypeOf(mediaType),
    }));
    const requests = await em.find(
      MediaRequest,
      { $or: ofPairs },
      {
        ...READ,
        fields: [
          'id',
          'userId',
          'mediaType',
          'tmdbId',
          'season',
          'episode',
          'approved',
          'activatedAt',
          'watchedAt',
        ],
      },
    );
    const rules = await em.find(RequestRule, { $or: unique }, READ);
    const playStates = requests.length
      ? await em.find(PlayState, { $or: ofPairs }, READ)
      : [];

    const now = new Date();
    const outcome = evaluateRules({
      requests,
      rules,
      playStates,
      now: now.getTime(),
    });
    const stamps = new Map<number | null, string[]>();
    for (const [id, watchedAt] of outcome.watched) {
      const key = watchedAt?.getTime() ?? null;
      stamps.set(key, [...(stamps.get(key) ?? []), id]);
    }
    for (const [time, ids] of stamps) {
      await em.nativeUpdate(
        MediaRequest,
        { id: { $in: ids } },
        { watchedAt: time === null ? null : new Date(time) },
      );
    }
    if (outcome.deleted.length) {
      await em.nativeDelete(MediaRequest, { id: { $in: outcome.deleted } });
    }
    if (outcome.activated.length) {
      await em.nativeUpdate(
        MediaRequest,
        { id: { $in: outcome.activated } },
        { activatedAt: now },
      );
    }

    const titles = new Map(
      unique
        .filter((pair) => pair.mediaType === MediaType.Series)
        .map(({ mediaType, tmdbId }) => [tmdbId, { mediaType, tmdbId }]),
    );
    for (const title of titles.values()) {
      await this.jobs.enqueue(em, 'downloads.reconcileTitle', title);
    }
  }

  /**
   * An hours limit expires with time, and whatever a writer missed is right
   * by the morning: before the cleanup hour
   */
  @Cron('50 3 * * *')
  async applyRulesToAll(): Promise<void> {
    await this.em.fork().transactional(async (tx) => {
      const rows: {
        user_id: string;
        media_type: MediaTypeFull;
        tmdb_id: string;
      }[] = await tx.execute(
        'select distinct user_id, media_type, tmdb_id from request',
      );
      await this.applyRules(
        tx,
        rows.map((row) => ({
          userId: row.user_id,
          mediaType: titleTypeOf(row.media_type),
          tmdbId: row.tmdb_id,
        })),
      );
    });
  }

  async findByUser(
    userId: string,
    pagination: PaginationDto,
  ): Promise<PaginatedResponseDto<MediaRequest>> {
    const [items, total] = await this.requestRepository.findAndCount(
      { userId },
      {
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

  async findMovieRequest(
    userId: string,
    tmdbId: string,
  ): Promise<MediaRequest | undefined> {
    return this.requestRepository.findOne({
      userId,
      tmdbId,
      mediaType: MediaTypeFull.Movie,
    });
  }

  async createMovieRequest(
    userId: string,
    tmdbId: string,
    approved: boolean,
  ): Promise<MediaRequest> {
    const movie = await this.metadataService.getMovieByTmdbId(tmdbId);
    if (!movie) throw new NotFoundException('Movie not found');

    const now = new Date();
    await this.em.transactional(async (tx) => {
      await tx
        .createQueryBuilder(MediaRequest)
        .insert({
          id: randomUUID(),
          userId,
          tmdbId,
          mediaType: MediaTypeFull.Movie,
          season: 0,
          episode: 0,
          approved,
          createdAt: now,
          updatedAt: now,
        })
        // A movie is requested once, two requests at the same time included
        .onConflict(['userId', 'mediaType', 'tmdbId', 'season', 'episode'])
        .ignore()
        .execute('run');
      await this.applyRules(tx, [
        { userId, mediaType: MediaType.Movie, tmdbId },
      ]);
    });

    return this.findMovieRequest(userId, tmdbId);
  }

  async deleteMovieRequest(userId: string, tmdbId: string): Promise<number> {
    return this.requestRepository.nativeDelete({
      userId,
      tmdbId,
      mediaType: MediaTypeFull.Movie,
    });
  }

  async findSeriesRequests(
    userId: string,
    tmdbId: string,
  ): Promise<MediaRequest[]> {
    return this.requestRepository.find(
      { userId, tmdbId, mediaType: MediaTypeFull.Episode },
      { orderBy: { season: 'asc', episode: 'asc' } },
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

    const now = new Date();
    if (episodes.length) {
      await this.em.transactional(async (tx) => {
        if (requested) {
          await tx
            .createQueryBuilder(MediaRequest)
            .insert(
              episodes.map(({ season, episode }) => ({
                id: randomUUID(),
                userId,
                tmdbId,
                mediaType: MediaTypeFull.Episode,
                season,
                episode,
                approved,
                createdAt: now,
                updatedAt: now,
              })),
            )
            .onConflict(['userId', 'mediaType', 'tmdbId', 'season', 'episode'])
            .ignore()
            .execute();
        } else {
          await tx.nativeDelete(MediaRequest, {
            userId,
            tmdbId,
            mediaType: MediaTypeFull.Episode,
            $or: episodes.map(({ season, episode }) => ({ season, episode })),
          });
        }
        await this.applyRules(tx, [
          { userId, mediaType: MediaType.Series, tmdbId },
        ]);
      });
    }

    return this.findSeriesRequests(userId, tmdbId);
  }

  async findSeriesRule(
    userId: string,
    tmdbId: string,
  ): Promise<RequestRule | undefined> {
    return this.ruleRepository.findOne(
      { userId, mediaType: MediaType.Series, tmdbId },
      READ,
    );
  }

  /** Sets the limits of the rule of a user for a series. The torrents it prefers stay. */
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
      await this.applyRules(tx, [
        { userId, mediaType: MediaType.Series, tmdbId },
      ]);
    });

    return { keepNext, keepWatched, keepWatchedHours };
  }

  /**
   * Makes a release the torrent that the requests of a user for an episode,
   * or with episode 0 for a season, download from. The release is resolved
   * now, so that a link that leads nowhere fails here and not when a request
   * needs it, and is kept so that it can be resolved again long after the
   * search result has expired.
   */
  async selectTorrent(
    target: SelectionTarget,
    releaseId: string,
  ): Promise<void> {
    const { userId, tmdbId, season, episode } = target;
    const series = await this.metadataService.getSeriesByTmdbId(tmdbId);
    if (!series) throw new NotFoundException('Series not found');

    const exists =
      episode === 0
        ? hasSeason(series.tmdbSeries, season)
        : hasEpisode(series.tmdbSeries, season, episode);
    if (!exists) throw new NotFoundException('Season or episode not found');

    const release = this.indexersService.getRelease(releaseId);
    if (!release) {
      throw new NotFoundException('Release not found, search again');
    }
    const source = await this.indexersService.resolveTorrent(release);
    const snapshot: ReleaseSnapshot = {
      releaseId: release.id,
      indexer: release.indexer,
      title: release.title,
      size: release.size,
      infoHash: source.infoHash,
      magnetUrl: release.magnetUrl ?? source.magnetUrl,
      downloadUrl: release.downloadUrl,
    };

    await this.em.transactional(async (tx) => {
      const rule = await this.readRule(tx, userId, tmdbId);
      const seasonTorrents = rule.seasonTorrents.filter(
        (t) => episode !== 0 || t.season !== season,
      );
      const episodeTorrents = rule.episodeTorrents.filter(
        (t) => t.season !== season || t.episode !== episode,
      );
      if (episode === 0) seasonTorrents.push({ season, release: snapshot });
      else episodeTorrents.push({ season, episode, release: snapshot });

      await this.writeRule(tx, { ...rule, seasonTorrents, episodeTorrents });
      await this.rebind(tx, target, {
        episodeTorrents,
        replaceHeld: episode !== 0,
        infoHash: source.infoHash,
      });
      await this.jobs.enqueue(tx, 'downloads.reconcileTitle', {
        mediaType: MediaType.Series,
        tmdbId,
      });
    });
  }

  /**
   * Forgets the torrent a user prefers for an episode or a season. The
   * requests it was for that have no file are bound again: an episode falls
   * back to its season's torrent.
   */
  async clearTorrent(target: SelectionTarget): Promise<boolean> {
    const { userId, tmdbId, season, episode } = target;

    return this.em.transactional(async (tx) => {
      const rule = await this.readRule(tx, userId, tmdbId);
      const seasonTorrents = rule.seasonTorrents.filter(
        (t) => episode !== 0 || t.season !== season,
      );
      const episodeTorrents = rule.episodeTorrents.filter(
        (t) => t.season !== season || t.episode !== episode,
      );
      const had =
        seasonTorrents.length < rule.seasonTorrents.length ||
        episodeTorrents.length < rule.episodeTorrents.length;
      if (!had) return false;

      await this.writeRule(tx, { ...rule, seasonTorrents, episodeTorrents });
      await this.rebind(tx, target, { episodeTorrents, replaceHeld: false });
      await this.jobs.enqueue(tx, 'downloads.reconcileTitle', {
        mediaType: MediaType.Series,
        tmdbId,
      });

      return true;
    });
  }

  /** The requests that refer to the files, for whoever deletes the files */
  findReferringRequests(
    mediaFileIds: string[],
  ): Promise<Pick<MediaRequest, 'id' | 'mediaFileId'>[]> {
    if (!mediaFileIds.length) return Promise.resolve([]);

    return this.em.find(
      MediaRequest,
      { mediaFileId: { $in: mediaFileIds } },
      { ...READ, fields: ['id', 'mediaFileId'] },
    );
  }

  /**
   * Deletes requests by id or by the file they refer to, in the caller's
   * transaction, and applies the rules to the rest of their pairs
   */
  async deleteRequests(
    em: EntityManager,
    where: { ids?: string[]; mediaFileIds?: string[] },
  ): Promise<number> {
    const conditions = [];
    if (where.ids?.length) conditions.push({ id: { $in: where.ids } });
    if (where.mediaFileIds?.length) {
      conditions.push({ mediaFileId: { $in: where.mediaFileIds } });
    }
    if (!conditions.length) return 0;

    const requests = await em.find(MediaRequest, { $or: conditions }, READ);
    if (!requests.length) return 0;

    await em.nativeDelete(MediaRequest, {
      id: { $in: requests.map((request) => request.id) },
    });
    await this.applyRules(em, requests.map(pairOf));

    return requests.length;
  }

  /**
   * For a user that is deleted, before the rows go: the torrents that only
   * their requests refer to are to stop
   */
  async userDeleting(em: EntityManager, userId: string): Promise<void> {
    const requests = await em.find(
      MediaRequest,
      { userId, mediaType: MediaTypeFull.Episode },
      { ...READ, fields: ['tmdbId'] },
    );
    for (const tmdbId of new Set(requests.map((request) => request.tmdbId))) {
      await this.jobs.enqueue(em, 'downloads.reconcileTitle', {
        mediaType: MediaType.Series,
        tmdbId,
      });
    }
  }

  async findAll(
    pagination: PaginationDto,
    approved?: boolean,
  ): Promise<PaginatedResponseDto<AdminMediaRequestDto>> {
    const [items, total] = await this.requestRepository.findAndCount(
      approved === undefined ? {} : { approved },
      {
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
    const request = await this.requestRepository.findOne({ id });

    return request
      ? this.withRequesters([request]).then((requests) => requests[0])
      : undefined;
  }

  async update(
    id: string,
    update: UpdateMediaRequestDto,
  ): Promise<AdminMediaRequestDto> {
    await this.em.transactional(async (tx) => {
      const request = await tx.findOne(MediaRequest, { id }, READ);
      if (!request) throw new NotFoundException('Request not found');

      await tx.nativeUpdate(
        MediaRequest,
        { id },
        { approved: update.approved, updatedAt: new Date() },
      );
      await this.applyRules(tx, [pairOf(request)]);
    });

    return this.findById(id);
  }

  async deleteById(id: string): Promise<number> {
    return this.em.transactional((tx) =>
      this.deleteRequests(tx, { ids: [id] }),
    );
  }

  /** How many requests a file fulfils, for every file that fulfils one */
  async countByMediaFile(): Promise<Map<string, number>> {
    const requests = await this.requestRepository.find(
      { mediaFileId: { $ne: null } },
      { fields: ['mediaFileId'], disableIdentityMap: true },
    );

    const counts = new Map<string, number>();
    for (const { mediaFileId } of requests) {
      counts.set(mediaFileId, (counts.get(mediaFileId) ?? 0) + 1);
    }

    return counts;
  }

  /**
   * Makes the requests of the user in the scope of a preference forget their
   * torrent, so that the reconciliation of the title binds them to the
   * torrent preferred now: the ones that have no file, or every one when
   * the preference is for the episode itself. Requests that download
   * from the preferred torrent already stay as they are. Picking a torrent
   * again is how a user retries it, so its failure is forgotten.
   */
  private async rebind(
    tx: EntityManager,
    target: SelectionTarget,
    options: {
      episodeTorrents: EpisodeTorrent[];
      replaceHeld: boolean;
      infoHash?: string;
    },
  ): Promise<void> {
    const { userId, tmdbId, season, episode } = target;
    const scope = [
      'user_id = ?',
      'tmdb_id = ?',
      `media_type = '${MediaTypeFull.Episode}'`,
      'season = ?',
    ];
    const params: unknown[] = [userId, tmdbId, season];
    if (episode !== 0) {
      scope.push('episode = ?');
      params.push(episode);
    } else {
      // An episode with a torrent of its own is not the season's business
      const own = options.episodeTorrents
        .filter((t) => t.season === season)
        .map((t) => t.episode);
      if (own.length) {
        scope.push(`episode not in (${own.map(() => '?').join(', ')})`);
        params.push(...own);
      }
    }

    await tx.execute(
      `update request set error = null, attempts = 0, retry_at = null
       where ${scope.join(' and ')}`,
      params,
      'run',
    );

    const conditions = [...scope];
    const unbindParams = [...params];
    if (!options.replaceHeld) {
      conditions.push('media_file_id is null');
    }
    if (options.infoHash) {
      conditions.push(
        'not exists (select 1 from torrent t where t.id = request.torrent_id and t.info_hash = ?)',
      );
      unbindParams.push(options.infoHash);
    }
    await tx.execute(
      `update request set torrent_id = null, media_file_id = null
       where ${conditions.join(' and ')}`,
      unbindParams,
      'run',
    );

    if (options.infoHash) {
      await tx.execute(
        'update torrent set error = null, attempts = 0, retry_at = null where info_hash = ?',
        [options.infoHash],
        'run',
      );
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
      episodeTorrents: rule?.episodeTorrents ?? [],
    };
  }

  /** A rule row exists while it has a limit or a preferred torrent */
  private async writeRule(tx: EntityManager, rule: RuleRow): Promise<void> {
    const { userId, tmdbId, keepNext, keepWatched, keepWatchedHours } = rule;
    const isEmpty =
      keepNext === null &&
      keepWatched === null &&
      keepWatchedHours === null &&
      !rule.seasonTorrents.length &&
      !rule.episodeTorrents.length;
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
        episodeTorrents: rule.episodeTorrents.length
          ? rule.episodeTorrents
          : null,
      })
      .onConflict(['userId', 'mediaType', 'tmdbId'])
      .merge([
        'keepNext',
        'keepWatched',
        'keepWatchedHours',
        'seasonTorrents',
        'episodeTorrents',
      ])
      .execute();
  }

  private async withRequesters(
    requests: MediaRequest[],
  ): Promise<AdminMediaRequestDto[]> {
    const users = await this.em.find(
      User,
      { id: { $in: requests.map((request) => request.userId) } },
      { fields: ['id', 'name'], disableIdentityMap: true },
    );

    return requests.map((request) => {
      const user = users.find((user) => user.id === request.userId);

      return { ...request, user: { id: user.id, name: user.name } };
    });
  }
}
