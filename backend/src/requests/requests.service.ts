import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityManager, EntityRepository } from '@mikro-orm/sqlite';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import {
  EpisodeRefDto,
  MediaType,
  MediaTypeFull,
  PaginatedResponseDto,
  PaginationDto,
} from '../common/common.dto.js';
import { MetadataService } from '../metadata/metadata.service.js';
import { hasEpisode } from '../metadata/metadata.utils.js';
import { User } from '../users/user.entity.js';
import { RequestRule } from './request-rule.entity.js';
import { MediaRequest } from './request.entity.js';
import {
  AdminMediaRequestDto,
  RequestRuleDto,
  UpdateMediaRequestDto,
} from './requests.dto.js';
import { Torrent } from '../downloads/torrent.entity.js';
import { JobsService } from '../jobs/jobs.service.js';
import { MediaFile } from '../local-media/media-file.entity.js';
import { PlayState } from '../user-data/play-state/play-state.entity.js';
import {
  Activity,
  evaluateActivity,
  fileOf,
  holdsFile,
} from './request-activity.js';
import { TorrentSelection } from './torrent-selection.entity.js';

/** A user and a series, whose requests a rule looks at together */
export interface Pair {
  userId: string;
  tmdbId: string;
}

const uniquePairs = (pairs: Pair[]): Pair[] => [
  ...new Map(
    pairs.map(({ userId, tmdbId }) => [
      `${userId}/${tmdbId}`,
      { userId, tmdbId },
    ]),
  ).values(),
];

/** A selection: of an episode, or with episode 0 of a season */
export interface SelectionTarget {
  userId: string;
  tmdbId: string;
  season: number;
  episode: number;
}

const scopeOf = ({ userId, tmdbId, season, episode }: SelectionTarget) => ({
  userId,
  tmdbId,
  season,
  ...(episode === 0 ? {} : { episode }),
});

/** Every request it sets gets its episode's selection, or else its season's */
const BIND_TO_PREFERENCE = `
  update request set torrent_id = coalesce(
    (
      select s.torrent_id from torrent_selection s
      where s.user_id = request.user_id and s.media_type = '${MediaType.Series}'
      and s.tmdb_id = request.tmdb_id and s.season = request.season
      and s.episode = request.episode
    ),
    (
      select s.torrent_id from torrent_selection s
      where s.user_id = request.user_id and s.media_type = '${MediaType.Series}'
      and s.tmdb_id = request.tmdb_id and s.season = request.season
      and s.episode = 0
    )
  )`;

@Injectable()
export class RequestsService {
  constructor(
    @InjectRepository(MediaRequest)
    private readonly requestRepository: EntityRepository<MediaRequest>,
    @InjectRepository(RequestRule)
    private readonly ruleRepository: EntityRepository<RequestRule>,
    private readonly em: EntityManager,
    private readonly metadataService: MetadataService,
    private readonly jobs: JobsService,
  ) {}

  async findByUser(
    userId: string,
    pagination: PaginationDto,
  ): Promise<PaginatedResponseDto<MediaRequest>> {
    const [items, total] = await this.requestRepository.findAndCount(
      { userId },
      {
        populate: ['movieMetadata'],
        orderBy: { createdAt: 'desc' },
        offset: (pagination.page - 1) * pagination.itemsPerPage,
        limit: pagination.itemsPerPage,
      },
    );

    return {
      items: items.map(withOwnMetadata),
      total,
      page: pagination.page,
      itemsPerPage: pagination.itemsPerPage,
    };
  }

  async findMovieRequest(
    userId: string,
    tmdbId: string,
  ): Promise<MediaRequest | undefined> {
    return this.requestRepository.findOne(
      { userId, tmdbId, mediaType: MediaTypeFull.Movie },
      { populate: ['movieMetadata'] },
    );
  }

  async createMovieRequest(
    userId: string,
    tmdbId: string,
    approved: boolean,
  ): Promise<MediaRequest> {
    const movie = await this.metadataService.getMovieByTmdbId(tmdbId);
    if (!movie) throw new NotFoundException('Movie not found');

    const now = new Date();
    await this.em
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

    return this.findMovieRequest(userId, tmdbId);
  }

  async deleteMovieRequest(userId: string, tmdbId: string): Promise<number> {
    const deleted = await this.requestRepository.nativeDelete({
      userId,
      tmdbId,
      mediaType: MediaTypeFull.Movie,
    });

    return deleted;
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
      await this.em.transactional((tx) =>
        this.enqueuePairs(tx, [{ userId, tmdbId }], async () => {
          if (!requested) {
            await tx.nativeDelete(MediaRequest, {
              userId,
              tmdbId,
              mediaType: MediaTypeFull.Episode,
              $or: episodes.map(({ season, episode }) => ({ season, episode })),
            });
            return;
          }

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
          await this.bind(tx, { userId, tmdbId });
        }),
      );
    }

    return this.findSeriesRequests(userId, tmdbId);
  }

  /**
   * Makes the requests of a user for an episode, or with episode 0 for a
   * season, forget their torrent, so that they are bound to the one the user
   * prefers now. A request that has its file keeps both, unless it is to let
   * go of the file as well.
   */
  private async unbind(
    em: EntityManager,
    target: SelectionTarget,
    options: { withFile: boolean },
  ): Promise<void> {
    await em.nativeUpdate(
      MediaRequest,
      {
        userId: target.userId,
        tmdbId: target.tmdbId,
        mediaType: MediaTypeFull.Episode,
        season: target.season,
        ...(target.episode === 0 ? {} : { episode: target.episode }),
        ...(options.withFile ? {} : { mediaFileId: null }),
      },
      { torrentId: null, mediaFileId: null },
    );
  }

  /**
   * Binds the episode requests of a user for a series, or for a season or an
   * episode of it, that refer to no torrent to the torrent the user prefers:
   * the selection for the episode, or else for the season. Whether a request
   * is approved or active plays no part.
   */
  async bind(
    em: EntityManager,
    scope: {
      userId: string;
      tmdbId: string;
      season?: number;
      episode?: number;
    },
  ): Promise<void> {
    const conditions = [
      `media_type = '${MediaTypeFull.Episode}'`,
      'torrent_id is null',
      'user_id = ?',
      'tmdb_id = ?',
    ];
    const params: unknown[] = [scope.userId, scope.tmdbId];
    if (scope.season !== undefined) {
      conditions.push('season = ?');
      params.push(scope.season);
    }
    if (scope.episode !== undefined) {
      conditions.push('episode = ?');
      params.push(scope.episode);
    }

    await em.execute(
      `${BIND_TO_PREFERENCE} where ${conditions.join(' and ')}`,
      params,
      'run',
    );
  }

  /**
   * Makes a torrent the one that the requests of a user for an episode, or
   * with episode 0 for the rest of a season, are bound to. For an episode this
   * replaces what its request has: it lets go of its file. For a season the
   * requests that have no file are bound again and the ones that have their
   * file keep it. Runs in the caller's transaction.
   */
  async select(
    em: EntityManager,
    target: SelectionTarget,
    selected: { torrentId: string; releaseId: string },
  ): Promise<void> {
    await this.enqueuePairs(em, [target], async () => {
      await this.attachHeld(em, target);
      await em
        .createQueryBuilder(TorrentSelection)
        .insert({
          id: randomUUID(),
          ...target,
          mediaType: MediaType.Series,
          ...selected,
          createdAt: new Date(),
        })
        .onConflict(['userId', 'mediaType', 'tmdbId', 'season', 'episode'])
        .merge(['torrentId', 'releaseId'])
        .execute();
      await this.unbind(em, target, { withFile: target.episode !== 0 });
      await this.bind(em, scopeOf(target));
    });
  }

  /**
   * Removes a selection. The requests it was for that have no file are bound
   * to what the user prefers now: an episode falls back to its season's
   * selection. Runs in the caller's transaction.
   */
  async deselect(em: EntityManager, target: SelectionTarget): Promise<boolean> {
    return this.enqueuePairs(em, [target], async () => {
      await this.attachHeld(em, target);
      const deleted = await em.nativeDelete(TorrentSelection, {
        ...target,
        mediaType: MediaType.Series,
      });
      await this.unbind(em, target, { withFile: false });
      await this.bind(em, scopeOf(target));

      return deleted > 0;
    });
  }

  /**
   * Stores the file of every request in the scope of a selection that holds
   * one it does not refer to yet, so that the unbind that follows leaves the
   * request its file, as it does for a request that refers to it
   */
  private async attachHeld(em: EntityManager, target: SelectionTarget) {
    const { requests, activity } = await this.readActivity(em, [target]);
    const inScope = requests.filter(
      (request) =>
        request.season === target.season &&
        (target.episode === 0 || request.episode === target.episode) &&
        request.torrentId &&
        !request.mediaFileId &&
        holdsFile(activity.get(request.id)),
    );
    if (!inScope.length) return;

    const torrents = await em.find(
      Torrent,
      { id: { $in: inScope.map((request) => request.torrentId) } },
      { fields: ['id', 'infoHash'], disableIdentityMap: true },
    );
    const files = await em.find(
      MediaFile,
      { mediaType: MediaType.Series, tmdbId: target.tmdbId },
      { disableIdentityMap: true },
    );
    await this.attach(
      em,
      inScope.flatMap((request) => {
        const infoHash = torrents.find(
          (t) => t.id === request.torrentId,
        )?.infoHash;
        const file = fileOf(request, activity.get(request.id), infoHash, files);

        return file
          ? [
              {
                requestId: request.id,
                torrentId: request.torrentId,
                mediaFileId: file.id,
              },
            ]
          : [];
      }),
    );
  }

  /**
   * Stores the file of requests that have none, while the file is there and
   * the request is still bound to the torrent the file came from
   */
  async attach(
    em: EntityManager,
    files: { requestId: string; torrentId: string; mediaFileId: string }[],
  ): Promise<void> {
    for (const { requestId, torrentId, mediaFileId } of files) {
      await em.execute(
        `update request set media_file_id = ?
         where id = ? and torrent_id = ? and media_file_id is null
         and exists (select 1 from media_file where id = ?)`,
        [mediaFileId, requestId, torrentId, mediaFileId],
        'run',
      );
    }
  }

  /**
   * The episode requests of (user, series) pairs with their activity. A rule
   * looks at all of a user's requests for a series, so a read covers whole
   * pairs.
   */
  async readActivity(
    em: EntityManager,
    pairs: Pair[],
  ): Promise<{ requests: MediaRequest[]; activity: Map<string, Activity> }> {
    const where = {
      $or: uniquePairs(pairs).map(({ userId, tmdbId }) => ({ userId, tmdbId })),
    };
    if (!where.$or.length) return { requests: [], activity: new Map() };

    const requests = await em.find(
      MediaRequest,
      { ...where, mediaType: MediaTypeFull.Episode },
      { disableIdentityMap: true },
    );
    const rules = await em.find(RequestRule, where, {
      disableIdentityMap: true,
    });
    const playStates = rules.length
      ? await em.find(
          PlayState,
          {
            $or: rules.map(({ userId, tmdbId }) => ({ userId, tmdbId })),
            mediaType: MediaTypeFull.Episode,
          },
          { disableIdentityMap: true },
        )
      : [];

    return {
      requests,
      activity: evaluateActivity({
        requests,
        rules,
        playStates,
        now: Date.now(),
      }),
    };
  }

  /**
   * Runs a write that changes what the requests of (user, series) pairs want
   * or hold, and enqueues the torrents that the requests and selections of
   * the pairs refer to before and after it, in the caller's transaction. The
   * activity of a request depends on every request of its pair, so the whole
   * pair counts.
   */
  async enqueuePairs<T>(
    em: EntityManager,
    pairs: Pair[],
    write: () => Promise<T>,
  ): Promise<T> {
    const before = await this.torrentsOfPairs(em, pairs);
    const result = await write();
    const after = await this.torrentsOfPairs(em, pairs);
    await this.enqueueTorrents(em, [...before, ...after]);

    return result;
  }

  /** For a change of what the requests of the pairs want, such as a play state */
  async enqueueTorrentsOfPairs(em: EntityManager, pairs: Pair[]) {
    await this.enqueueTorrents(em, await this.torrentsOfPairs(em, pairs));
  }

  /** For a user that is deleted, before its rows go */
  async enqueueTorrentsOfUser(em: EntityManager, userId: string) {
    const rows: { torrent_id: string }[] = await em.execute(
      `select torrent_id from request where user_id = ? and torrent_id is not null
       union select torrent_id from torrent_selection where user_id = ?`,
      [userId, userId],
    );
    await this.enqueueTorrents(
      em,
      rows.map((row) => row.torrent_id),
    );
  }

  /** For files that are forgotten, before their rows go */
  async enqueueTorrentsOfFiles(em: EntityManager, mediaFileIds: string[]) {
    if (!mediaFileIds.length) return;

    const requests = await em.find(
      MediaRequest,
      { mediaFileId: { $in: mediaFileIds }, torrentId: { $ne: null } },
      { fields: ['torrentId'], disableIdentityMap: true },
    );
    await this.enqueueTorrents(
      em,
      requests.map((request) => request.torrentId),
    );
  }

  private async enqueueTorrents(em: EntityManager, torrentIds: string[]) {
    for (const torrentId of new Set(torrentIds)) {
      await this.jobs.enqueue(em, 'torrent.reconcile', { torrentId });
    }
  }

  private async torrentsOfPairs(
    em: EntityManager,
    pairs: Pair[],
  ): Promise<string[]> {
    const unique = uniquePairs(pairs);
    if (!unique.length) return [];

    const condition = unique
      .map(() => '(user_id = ? and tmdb_id = ?)')
      .join(' or ');
    const params = unique.flatMap(({ userId, tmdbId }) => [userId, tmdbId]);
    const rows: { torrent_id: string }[] = await em.execute(
      `select torrent_id from request
       where media_type = '${MediaTypeFull.Episode}' and torrent_id is not null and (${condition})
       union
       select torrent_id from torrent_selection
       where media_type = '${MediaType.Series}' and (${condition})`,
      [...params, ...params],
    );

    return rows.map((row) => row.torrent_id);
  }

  async findSeriesRule(
    userId: string,
    tmdbId: string,
  ): Promise<RequestRule | undefined> {
    return this.ruleRepository.findOne(
      { userId, tmdbId },
      { disableIdentityMap: true },
    );
  }

  /** A rule without limits is no rule */
  async setSeriesRule(
    userId: string,
    tmdbId: string,
    rule: RequestRuleDto,
  ): Promise<RequestRuleDto> {
    const series = await this.metadataService.getSeriesByTmdbId(tmdbId);
    if (!series) throw new NotFoundException('Series not found');

    const { keepNext, keepWatched, keepWatchedHours } = rule;
    await this.em.transactional((tx) =>
      this.enqueuePairs(tx, [{ userId, tmdbId }], async () => {
        if (
          keepNext === null &&
          keepWatched === null &&
          keepWatchedHours === null
        ) {
          await tx.nativeDelete(RequestRule, { userId, tmdbId });
          return;
        }

        await tx
          .createQueryBuilder(RequestRule)
          .insert({
            id: randomUUID(),
            userId,
            tmdbId,
            keepNext,
            keepWatched,
            keepWatchedHours,
          })
          .onConflict(['userId', 'tmdbId'])
          .merge(['keepNext', 'keepWatched', 'keepWatchedHours'])
          .execute();
      }),
    );

    return { keepNext, keepWatched, keepWatchedHours };
  }

  async findAll(
    pagination: PaginationDto,
    approved?: boolean,
  ): Promise<PaginatedResponseDto<AdminMediaRequestDto>> {
    const [items, total] = await this.requestRepository.findAndCount(
      approved === undefined ? {} : { approved },
      {
        populate: ['movieMetadata'],
        orderBy: { createdAt: 'desc' },
        offset: (pagination.page - 1) * pagination.itemsPerPage,
        limit: pagination.itemsPerPage,
      },
    );

    return {
      items: await this.withRequesters(items.map(withOwnMetadata)),
      total,
      page: pagination.page,
      itemsPerPage: pagination.itemsPerPage,
    };
  }

  async findById(id: string): Promise<AdminMediaRequestDto | undefined> {
    const request = await this.requestRepository.findOne(
      { id },
      { populate: ['movieMetadata'] },
    );

    return request
      ? this.withRequesters([withOwnMetadata(request)]).then(
          (requests) => requests[0],
        )
      : undefined;
  }

  async update(
    id: string,
    update: UpdateMediaRequestDto,
  ): Promise<AdminMediaRequestDto> {
    await this.em.transactional(async (tx) => {
      const request = await tx.findOne(
        MediaRequest,
        { id },
        { disableIdentityMap: true },
      );
      if (!request) throw new NotFoundException('Request not found');

      await this.enqueuePairs(tx, [request], () =>
        tx.nativeUpdate(
          MediaRequest,
          { id },
          { approved: update.approved, updatedAt: new Date() },
        ),
      );
    });

    return this.findById(id);
  }

  async deleteById(id: string): Promise<number> {
    return this.em.transactional(async (tx) => {
      const request = await tx.findOne(
        MediaRequest,
        { id },
        { disableIdentityMap: true },
      );
      if (!request) return 0;

      return this.enqueuePairs(tx, [request], () =>
        tx.nativeDelete(MediaRequest, { id }),
      );
    });
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

// The metadata relation joins on the TMDB id alone, and movies and series
// share ids, so an episode request can pick up an unrelated movie
function withOwnMetadata(request: MediaRequest): MediaRequest {
  if (request.mediaType !== MediaTypeFull.Movie) {
    request.movieMetadata = undefined;
  }

  return request;
}
