import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityManager, EntityRepository } from '@mikro-orm/sqlite';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { randomUUID } from 'node:crypto';
import {
  EpisodeRefDto,
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
import { REQUESTS_CHANGED, RequestsChangedEvent } from './requests.events.js';

@Injectable()
export class RequestsService {
  constructor(
    @InjectRepository(MediaRequest)
    private readonly requestRepository: EntityRepository<MediaRequest>,
    @InjectRepository(RequestRule)
    private readonly ruleRepository: EntityRepository<RequestRule>,
    private readonly em: EntityManager,
    private readonly metadataService: MetadataService,
    private readonly eventEmitter: EventEmitter2,
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

    const existing = await this.findMovieRequest(userId, tmdbId);
    if (existing) return existing;

    const request = new MediaRequest();
    request.userId = userId;
    request.tmdbId = tmdbId;
    request.mediaType = MediaTypeFull.Movie;
    request.approved = approved;
    await this.em.persist(request).flush();
    await this.emitChanged(tmdbId, MediaTypeFull.Movie);

    return this.findMovieRequest(userId, tmdbId);
  }

  async deleteMovieRequest(userId: string, tmdbId: string): Promise<number> {
    const deleted = await this.requestRepository.nativeDelete({
      userId,
      tmdbId,
      mediaType: MediaTypeFull.Movie,
    });
    await this.emitChanged(tmdbId, MediaTypeFull.Movie);

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

  /** The episode requests of every user for a series */
  async findAllSeriesRequests(tmdbId: string): Promise<MediaRequest[]> {
    return this.requestRepository.find(
      { tmdbId, mediaType: MediaTypeFull.Episode },
      { disableIdentityMap: true },
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

    if (episodes.length && requested) {
      const now = new Date();
      await this.em
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
    } else if (episodes.length) {
      await this.requestRepository.nativeDelete({
        userId,
        tmdbId,
        mediaType: MediaTypeFull.Episode,
        $or: episodes.map(({ season, episode }) => ({ season, episode })),
      });
    }
    await this.emitChanged(tmdbId, MediaTypeFull.Episode);

    return this.findSeriesRequests(userId, tmdbId);
  }

  /** The approved episode requests of every user, oldest first */
  async findApprovedEpisodeRequests(): Promise<MediaRequest[]> {
    return this.requestRepository.find(
      { mediaType: MediaTypeFull.Episode, approved: true },
      { orderBy: { createdAt: 'asc' }, disableIdentityMap: true },
    );
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

  /** The rules of every user, for one series or for all of them */
  async findRules(tmdbId?: string): Promise<RequestRule[]> {
    return this.ruleRepository.find(tmdbId === undefined ? {} : { tmdbId }, {
      disableIdentityMap: true,
    });
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
    if (
      keepNext === null &&
      keepWatched === null &&
      keepWatchedHours === null
    ) {
      await this.ruleRepository.nativeDelete({ userId, tmdbId });
    } else {
      await this.em
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
    }
    await this.emitChanged(tmdbId, MediaTypeFull.Episode);

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
    const affected = await this.requestRepository.nativeUpdate(
      { id },
      { approved: update.approved, updatedAt: new Date() },
    );
    if (!affected) throw new NotFoundException('Request not found');

    const request = await this.findById(id);
    await this.emitChanged(request.tmdbId, request.mediaType);

    return request;
  }

  async deleteById(id: string): Promise<number> {
    const request = await this.requestRepository.findOne({ id });
    if (!request) return 0;

    const deleted = await this.requestRepository.nativeDelete({ id });
    await this.emitChanged(request.tmdbId, request.mediaType);

    return deleted;
  }

  private emitChanged(tmdbId: string, mediaType: MediaTypeFull) {
    const event: RequestsChangedEvent = { tmdbId, mediaType };
    return this.eventEmitter.emitAsync(REQUESTS_CHANGED, event);
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
