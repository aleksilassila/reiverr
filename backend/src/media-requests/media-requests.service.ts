import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityManager, EntityRepository } from '@mikro-orm/sqlite';
import { Injectable, NotFoundException } from '@nestjs/common';
import {
  MediaTypeFull,
  PaginatedResponseDto,
  PaginationDto,
} from '../common/common.dto.js';
import { MetadataService } from '../metadata/metadata.service.js';
import { User } from '../users/user.entity.js';
import { MediaRequest } from './media-request.entity.js';
import {
  AdminMediaRequestDto,
  UpdateMediaRequestDto,
} from './media-requests.dto.js';

@Injectable()
export class MediaRequestsService {
  constructor(
    @InjectRepository(MediaRequest)
    private readonly requestRepository: EntityRepository<MediaRequest>,
    private readonly em: EntityManager,
    private readonly metadataService: MetadataService,
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
    return this.requestRepository.findOne(
      { userId, tmdbId, season: 0, episode: 0 },
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

    return this.findMovieRequest(userId, tmdbId);
  }

  async deleteMovieRequest(userId: string, tmdbId: string): Promise<number> {
    return this.requestRepository.nativeDelete({
      userId,
      tmdbId,
      season: 0,
      episode: 0,
    });
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
      items: await this.withRequesters(items),
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
      ? this.withRequesters([request]).then((requests) => requests[0])
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

    return this.findById(id);
  }

  async deleteById(id: string): Promise<number> {
    return this.requestRepository.nativeDelete({ id });
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
