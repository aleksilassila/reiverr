import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  MediaTypeFull,
  PaginatedResponseDto,
  PaginationDto,
} from 'src/common/common.dto';
import { MetadataService } from 'src/metadata/metadata.service';
import { DeleteResult, Repository } from 'typeorm';
import { MediaRequest } from './media-request.entity';
import {
  AdminMediaRequestDto,
  UpdateMediaRequestDto,
} from './media-requests.dto';
import { MEDIA_REQUEST_REPOSITORY } from './media-requests.providers';

@Injectable()
export class MediaRequestsService {
  constructor(
    @Inject(MEDIA_REQUEST_REPOSITORY)
    private readonly requestRepository: Repository<MediaRequest>,
    private readonly metadataService: MetadataService,
  ) {}

  async findByUser(
    userId: string,
    pagination: PaginationDto,
  ): Promise<PaginatedResponseDto<MediaRequest>> {
    const [items, total] = await this.requestRepository.findAndCount({
      where: { userId },
      relations: { movieMetadata: true },
      order: { createdAt: 'DESC' },
      skip: (pagination.page - 1) * pagination.itemsPerPage,
      take: pagination.itemsPerPage,
    });

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
      where: { userId, tmdbId, season: 0, episode: 0 },
      relations: { movieMetadata: true },
    });
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

    const request = await this.requestRepository.save(
      this.requestRepository.create({
        userId,
        tmdbId,
        mediaType: MediaTypeFull.Movie,
        approved,
      }),
    );
    request.movieMetadata = movie;

    return request;
  }

  async deleteMovieRequest(
    userId: string,
    tmdbId: string,
  ): Promise<DeleteResult> {
    return this.requestRepository.delete({
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
    const builder = this.withRequester()
      .orderBy('request.createdAt', 'DESC')
      .skip((pagination.page - 1) * pagination.itemsPerPage)
      .take(pagination.itemsPerPage);

    if (approved !== undefined) {
      builder.where('request.approved = :approved', { approved });
    }

    const [items, total] = await builder.getManyAndCount();

    return {
      items: items.map(toAdminDto),
      total,
      page: pagination.page,
      itemsPerPage: pagination.itemsPerPage,
    };
  }

  async findById(id: string): Promise<AdminMediaRequestDto | undefined> {
    const request = await this.withRequester()
      .where('request.id = :id', { id })
      .getOne();

    return request ? toAdminDto(request) : undefined;
  }

  async update(
    id: string,
    update: UpdateMediaRequestDto,
  ): Promise<AdminMediaRequestDto> {
    const result = await this.requestRepository.update(id, {
      approved: update.approved,
    });
    if (!result.affected) throw new NotFoundException('Request not found');

    return this.findById(id);
  }

  async deleteById(id: string): Promise<DeleteResult> {
    return this.requestRepository.delete({ id });
  }

  private withRequester() {
    return this.requestRepository
      .createQueryBuilder('request')
      .leftJoinAndSelect('request.movieMetadata', 'movieMetadata')
      .leftJoin('request.user', 'user')
      .addSelect(['user.id', 'user.name']);
  }
}

// TypeORM instantiates User for the partial selection and its field
// initializers would otherwise serialize default values for the requester
function toAdminDto(request: MediaRequest): AdminMediaRequestDto {
  return {
    ...request,
    user: { id: request.user.id, name: request.user.name },
  };
}
