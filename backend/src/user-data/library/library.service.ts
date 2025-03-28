import { Inject, Injectable } from '@nestjs/common';
import {
  MediaType,
  PaginatedResponseDto,
  PaginationParamsDto,
} from 'src/common/common.dto';
import { MetadataService } from 'src/metadata/metadata.service';
import { Repository } from 'typeorm';
import {
  LibraryItemDto,
  MyListSortBy,
  MyListFilter,
  SortByDirection,
} from './library.dto';
import { LibraryItem } from './library.entity';
import { USER_LIBRARY_REPOSITORY } from './library.providers';
import { SourceProvidersService } from 'src/source-providers/source-providers.service';
import { MediaSourcesService } from 'src/users/media-sources/media-sources.service';
import { PlayState } from '../play-state/play-state.entity';

@Injectable()
export class LibraryService {
  constructor(
    @Inject(USER_LIBRARY_REPOSITORY)
    private readonly libraryRepository: Repository<LibraryItem>,
    private readonly metadataService: MetadataService,
    private readonly mediaSourceService: MediaSourcesService,
  ) {}

  /** TODO: decouple librayItem and movie/seriesItem */
  async getMyList(options: {
    userId: string;
    pagination: PaginationParamsDto;
    filter?: MyListFilter;
    sortBy?: MyListSortBy;
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
      [MyListSortBy.DateAdded]: { createdAt: directon } as const,
      [MyListSortBy.Name]: {
        seriesMetadata: {
          name: directon,
        },
        movieMetadata: {
          name: directon,
        },
      } as const,
      [MyListSortBy.FirstReleaseDate]: {
        movieMetadata: {
          releaseDate: directon,
        },
        seriesMetadata: {
          firstReleaseDate: directon,
        },
      } as const,
      [MyListSortBy.LastReleaseDate]: {
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

  async getCatalogueItems<T extends object = object>(options: {
    sourceId: string;
    token: string;
    pagination: PaginationParamsDto;
    filter?: 'all' | 'movies' | 'series' | 'missing';
  }): Promise<PaginatedResponseDto<LibraryItemDto> | undefined> {
    const { sourceId, token, pagination, filter = 'all' } = options;

    const connection = await this.mediaSourceService.getConnection(sourceId);

    if (!connection) return;

    const combined = connection.provider.catalogueProvider.getCatalogue;
    const movies = connection.provider.catalogueProvider.getMovieCatalogue;
    const series = connection.provider.catalogueProvider.getSeriesCatalogue;
    const missing = connection.provider.catalogueProvider.getMissingInCatalogue;
    if (filter === 'all' && combined) {
      const response = await combined(
        {
          userId: connection.mediaSource.userId,
          settings: connection.mediaSource.pluginSettings,
          sourceId: connection.mediaSource.id,
          token,
        },
        pagination,
      );

      return {
        ...response,
        items: await Promise.all(
          response.items.map(async (item) => this.getLibraryItemDto(item)),
        ),
      };
    } else if (filter === 'movies' && movies) {
      const response = await movies(
        {
          userId: connection.mediaSource.userId,
          settings: connection.mediaSource.pluginSettings,
          sourceId: connection.mediaSource.id,
          token,
        },
        pagination,
      );

      return {
        ...response,
        items: await Promise.all(
          response.items.map(async (item) => this.getLibraryItemDto(item)),
        ),
      };
    } else if (filter === 'series' && series) {
      const response = await series(
        {
          userId: connection.mediaSource.userId,
          settings: connection.mediaSource.pluginSettings,
          sourceId: connection.mediaSource.id,
          token,
        },
        pagination,
      );

      return {
        ...response,
        items: await Promise.all(
          response.items.map(async (item) => this.getLibraryItemDto(item)),
        ),
      };
    } else if (filter === 'missing' && missing) {
      const tmdbIdToMyListItem: Record<string, LibraryItem> = {};
      const myListItems = await this.getMyList({
        pagination: {
          itemsPerPage: 500,
          page: 1,
        },
        userId: connection.mediaSource.userId,
        filter: MyListFilter.All,
        sortBy: MyListSortBy.DateAdded,
      }).then((res) => res.items);

      myListItems.forEach((i) => {
        tmdbIdToMyListItem[i.tmdbId] = i;
      });

      const response = await missing(
        {
          userId: connection.mediaSource.userId,
          settings: connection.mediaSource.pluginSettings,
          sourceId: connection.mediaSource.id,
          token,
        },
        pagination,
        tmdbIdToMyListItem,
      );

      return {
        ...response,
        items: await Promise.all(
          response.items.map(async (item) =>
            this.getLibraryItemDto({
              ...item,
              mediaType:
                item.mediaType === MediaType.Movie ? 'movie' : 'series',
            }),
          ),
        ),
      };
    }
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

  async getLibraryItemDto(options: {
    tmdbId: string;
    mediaType: 'series' | 'movie';
    playStates?: PlayState[];
  }): Promise<LibraryItemDto> {
    const { tmdbId, mediaType, playStates } = options;

    const seriesMetadata =
      mediaType === 'series'
        ? await this.metadataService.getSeriesByTmdbId(tmdbId)
        : undefined;
    const movieMetadata =
      mediaType === 'movie'
        ? await this.metadataService.getMovieByTmdbId(tmdbId)
        : undefined;

    if (!movieMetadata && !seriesMetadata) {
      throw new Error(
        'At least one of movieMetadata or seriesMetadata must be provided',
      );
    }

    let watched = false;

    if (mediaType === 'movie') {
      watched = playStates?.some((state) => state.watched) ?? false;
    } else if (
      mediaType === 'series' &&
      seriesMetadata?.tmdbSeries?.last_episode_to_air
    ) {
      const { season_number: season, episode_number: episode } =
        seriesMetadata?.tmdbSeries.last_episode_to_air;
      watched =
        playStates?.some(
          (state) =>
            state.season === season &&
            state.episode === episode &&
            state.watched,
        ) ?? false;
    }

    const libraryItem: LibraryItemDto = {
      tmdbId,
      mediaType: mediaType === 'movie' ? MediaType.Movie : MediaType.Series,
      watched,
      playStates,
      tmdbItem: {
        id: movieMetadata?.tmdbMovie.id ?? seriesMetadata?.tmdbSeries.id,
        poster_path:
          movieMetadata?.tmdbMovie.poster_path ??
          seriesMetadata?.tmdbSeries.poster_path,
        vote_average:
          movieMetadata?.tmdbMovie.vote_average ??
          seriesMetadata?.tmdbSeries.vote_average,
        title: movieMetadata?.tmdbMovie.title,
        release_date: movieMetadata?.tmdbMovie.release_date,
        runtime: movieMetadata?.tmdbMovie.runtime,
        name: seriesMetadata?.tmdbSeries.name,
        first_air_date: seriesMetadata?.tmdbSeries.first_air_date,
        last_air_date: seriesMetadata?.tmdbSeries.last_air_date,
        next_episode_to_air: seriesMetadata?.tmdbSeries.next_episode_to_air,
        seasons: seriesMetadata?.tmdbSeries.seasons,
      },
    };

    return libraryItem;
  }
}
