import { Inject, Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { LibraryItem } from './library.entity';
import { MediaType, PaginationParamsDto } from 'src/common/common.dto';
import { LibraryItemDto } from './library.dto';
import { MetadataService } from 'src/metadata/metadata.service';
import { USER_LIBRARY_REPOSITORY } from './library.providers';

@Injectable()
export class LibraryService {
  constructor(
    @Inject(USER_LIBRARY_REPOSITORY)
    private readonly libraryRepository: Repository<LibraryItem>,
    private readonly metadataService: MetadataService,
  ) {}

  async getLibraryItemsWithMetadata(
    userId: string,
    pagination: PaginationParamsDto,
  ): Promise<LibraryItemDto[]> {
    const items = await this.getLibraryItems(userId, pagination);

    return Promise.all(
      items.map(async (item) => {
        return {
          ...item,
          movieMetadata:
            item.mediaType === MediaType.Movie
              ? await this.metadataService.getMovieByTmdbId(item.tmdbId)
              : undefined,
          seriesMetadata:
            item.mediaType === MediaType.Series
              ? await this.metadataService.getSeriesByTmdbId(item.tmdbId)
              : undefined,
        };
      }),
    );
  }

  private async getLibraryItems(
    userId: string,
    pagination: PaginationParamsDto,
  ): Promise<LibraryItem[]> {
    return this.libraryRepository.find({
      where: { userId },
      relations: {
        playStates: true,
      },
      take: pagination.itemsPerPage,
      skip: pagination.itemsPerPage * (pagination.page - 1),
    });
  }

  async findByTmdbId(
    userId: string,
    tmdbId: string,
  ): Promise<LibraryItem | null> {
    return this.libraryRepository.findOne({ where: { userId, tmdbId } });
  }

  async findOrCreateByTmdbId(
    userId: string,
    tmdbId: string,
    mediaType: MediaType,
  ): Promise<LibraryItem> {
    let libraryItem = await this.findByTmdbId(userId, tmdbId);

    if (!libraryItem) {
      libraryItem = this.libraryRepository.create({
        userId,
        tmdbId,
        mediaType,
      });
      await this.libraryRepository.save(libraryItem);
    }

    return libraryItem;
  }

  async deleteByTmdbId(userId: string, tmdbId: string) {
    return await this.libraryRepository.delete({ userId, tmdbId });
  }
}
