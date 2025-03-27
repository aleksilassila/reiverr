import { Inject, Injectable } from '@nestjs/common';
import {
  MediaType,
  PaginatedResponseDto,
  PaginationParamsDto,
} from 'src/common/common.dto';
import { MetadataService } from 'src/metadata/metadata.service';
import { Repository } from 'typeorm';
import { LibraryItemDto } from './library.dto';
import { LibraryItem } from './library.entity';
import { USER_LIBRARY_REPOSITORY } from './library.providers';

export enum SortByDirection {
  Asc = 'asc',
  Desc = 'desc',
}

export enum LibrarySortBy {
  DateAdded = 'dateAdded',
  Name = 'name',
  FirstReleaseDate = 'firstReleaseDate',
  LastReleaseDate = 'lastReleaseDate',
}

export enum MyListFilter {
  Movie = 'movie',
  Series = 'series',
}

export enum CatalogueFilter {
  All = 'all',
  Movies = 'movies',
  Series = 'series',
  Unavailable = 'unavailable',
}

@Injectable()
export class LibraryService {
  constructor(
    @Inject(USER_LIBRARY_REPOSITORY)
    private readonly libraryRepository: Repository<LibraryItem>,
    private readonly metadataService: MetadataService,
  ) {}

  async getMyListDtos(
    ...args: Parameters<LibraryService['getMyList']>
  ): Promise<PaginatedResponseDto<LibraryItemDto>> {
    const paginatedItems = await this.getMyList(...args);

    const items = await Promise.all(
      paginatedItems.items.map(async (item) => {
        const seriesMetadata =
          item.mediaType === MediaType.Series
            ? await this.metadataService.getSeriesByTmdbId(item.tmdbId)
            : undefined;
        const movieMetadata =
          item.mediaType === MediaType.Movie
            ? await this.metadataService.getMovieByTmdbId(item.tmdbId)
            : undefined;

        return LibraryItemDto.create({
          libraryItem: item,
          seriesMetadata,
          movieMetadata,
        });
      }),
    );

    return { ...paginatedItems, items };
  }

  /** TODO: decouple librayItem and movie/seriesItem */
  private async getMyList(options: {
    userId: string;
    pagination: PaginationParamsDto;
    filter?: MyListFilter;
    sortBy?: LibrarySortBy;
    direction?: SortByDirection;
  }): Promise<PaginatedResponseDto<LibraryItem>> {
    const {
      userId,
      pagination,
      filter,
      sortBy,
      direction = SortByDirection.Desc,
    } = options;

    const directon = direction === SortByDirection.Asc ? 'ASC' : 'DESC';

    const order = {
      [LibrarySortBy.DateAdded]: { createdAt: directon } as const,
      [LibrarySortBy.Name]: {
        seriesMetadata: {
          name: directon,
        },
        movieMetadata: {
          name: directon,
        },
      } as const,
      [LibrarySortBy.FirstReleaseDate]: {
        movieMetadata: {
          releaseDate: directon,
        },
        seriesMetadata: {
          firstReleaseDate: directon,
        },
      } as const,
      [LibrarySortBy.LastReleaseDate]: {
        movieMetadata: {
          releaseDate: directon,
        },
        seriesMetadata: {
          lastReleaseDate: directon,
        },
      } as const,
    }[sortBy];

    const mediaType = filter
      ? filter === MyListFilter.Movie
        ? MediaType.Movie
        : MediaType.Series
      : undefined;

    const [items, total] = await this.libraryRepository.findAndCount({
      relations: {
        playStates: true,
        seriesMetadata: true,
        movieMetadata: true,
      },
      select: {
        seriesMetadata: {
          firstReleaseDate: true,
          lastReleaseDate: true,
          name: true,
        },
        movieMetadata: {
          releaseDate: true,
          name: true,
        },
      },

      where: {
        userId,
        ...(mediaType ? { mediaType } : {}),
      },
      order,
      take: pagination.itemsPerPage,
      skip: pagination.itemsPerPage * (pagination.page - 1),
    });

    return {
      items,
      total,
      itemsPerPage: pagination.itemsPerPage,
      page: pagination.page,
    };
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
