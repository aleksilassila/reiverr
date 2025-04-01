import { Inject, Injectable } from '@nestjs/common';
import {
  MediaType,
  PaginatedResponseDto,
  PaginationDto,
} from 'src/common/common.dto';
import { MetadataService } from 'src/metadata/metadata.service';
import { MediaSourcesService } from 'src/users/media-sources/media-sources.service';
import { Brackets, Repository } from 'typeorm';
import { PlayState } from '../play-state/play-state.entity';
import { USER_PLAY_STATE_REPOSITORY } from '../play-state/play-state.providers';
import {
  CatalogueTypeFilter,
  LibraryItemDto,
  MyListOrder,
  MyListStatusFilter,
  MyListTypeFilter,
  OrderDirection,
} from './library.dto';
import { LibraryItem } from './library.entity';
import { USER_LIBRARY_REPOSITORY } from './library.providers';

@Injectable()
export class LibraryService {
  constructor(
    @Inject(USER_LIBRARY_REPOSITORY)
    private readonly libraryRepository: Repository<LibraryItem>,
    @Inject(USER_PLAY_STATE_REPOSITORY)
    private readonly playStateRepository: Repository<PlayState>,
    private readonly metadataService: MetadataService,
    private readonly mediaSourceService: MediaSourcesService,
  ) {
    // Make sure library items are cached
    this.libraryRepository.find().then((r) =>
      r.forEach((i) => {
        if (i.mediaType === 'movie') {
          this.metadataService.getMovieByTmdbId(i.tmdbId);
        } else if (i.mediaType === 'series') {
          this.metadataService.getSeriesByTmdbId(i.tmdbId);
        }
      }),
    );
  }

  /** TODO: decouple librayItem and movie/seriesItem */
  async getMyList(options: {
    userId: string;
    pagination: PaginationDto;
    type?: MyListTypeFilter;
    status?: MyListStatusFilter;
    order?: MyListOrder;
    direction?: OrderDirection;
  }): Promise<PaginatedResponseDto<LibraryItemDto>> {
    const {
      userId,
      pagination,
      type,
      status,
      order,
      direction = OrderDirection.Desc,
    } = options;

    const mediaType = type
      ? type === MyListTypeFilter.Movies
        ? MediaType.Movie
        : MediaType.Series
      : undefined;

    let builder = this.libraryRepository
      .createQueryBuilder('libraryItem')
      .leftJoinAndSelect('libraryItem.playStates', 'playStates')
      .leftJoinAndSelect('libraryItem.movieMetadata', 'movieMetadata')
      .leftJoinAndSelect('libraryItem.seriesMetadata', 'seriesMetadata')
      .addSelect('libraryItem.createdAt', 'createdAt')
      .addSelect(['libraryItem.createdAt', 'libraryItem.updatedAt'])
      .where('libraryItem.userId = :userId', { userId });

    if (mediaType) {
      builder = builder.andWhere('libraryItem.mediaType = :mediaType', {
        mediaType,
      });
    }

    const watched = new Brackets((qb) =>
      qb
        .where(
          "(libraryItem.mediaType = 'movie' AND playStates.watched = true)",
        )
        .orWhere(
          new Brackets((qb) =>
            qb
              .where("libraryItem.mediaType = 'series'")
              .andWhere(
                'playStates.watched = true AND playStates.season = seriesMetadata.lastSeasonNumber AND playStates.episode = seriesMetadata.lastEpisodeNumber',
              ),
          ),
        ),
    );
    const upcoming = new Brackets((qb) =>
      qb
        .where(watched)
        .andWhere(
          new Brackets((qb) =>
            qb
              .where('seriesMetadata.nextReleaseDate > date("now")')
              .orWhere('movieMetadata.releaseDate > date("now")'),
          ),
        ),
    );
    const watchedAndNotUpcoming = new Brackets((qb) =>
      qb
        .where(watched)
        .andWhere(
          new Brackets((qb) =>
            qb
              .where('seriesMetadata.nextReleaseDate < date("now")')
              .orWhere('movieMetadata.releaseDate < date("now")')
              .orWhere(
                '(seriesMetadata.nextReleaseDate IS NULL AND movieMetadata.releaseDate IS NULL)',
              ),
          ),
        ),
    );
    if (status === MyListStatusFilter.Upcoming) {
      builder = builder.andWhere(upcoming);
    } else if (status === MyListStatusFilter.Watched) {
      builder = builder.andWhere(watchedAndNotUpcoming);
    } else if (
      status === MyListStatusFilter.Unwatched ||
      status === MyListStatusFilter.ContinueWatching
    ) {
      builder = builder.andWhere(
        new Brackets((qb) =>
          qb
            .where(
              "(libraryItem.mediaType = 'movie' AND playStates.watched = false)",
            )
            .orWhere(
              "(libraryItem.mediaType = 'movie' AND playStates.watched IS NULL)",
            )
            .orWhere(
              new Brackets((qb) =>
                qb
                  .where("libraryItem.mediaType = 'series'")
                  .andWhere(
                    'playStates.watched = false AND playStates.season = seriesMetadata.lastSeasonNumber AND playStates.episode = seriesMetadata.lastEpisodeNumber',
                  ),
              ),
            )
            .orWhere(
              new Brackets((qb) =>
                qb.where("libraryItem.mediaType = 'series'").andWhere(
                  `NOT EXISTS (
                    select 1 from play_state playStates
                    LEFT JOIN movie_metadata movieMetadata on playStates.tmdbId = movieMetadata.tmdbId
                    LEFT JOIN series_metadata seriesMetadata on playStates.tmdbId = seriesMetadata.tmdbId
                    where playStates.tmdbId = libraryItem.tmdbId AND playStates.userId = libraryItem.userId
                    AND seriesMetadata.lastEpisodeNumber = playStates.episode AND seriesMetadata.lastSeasonNumber = playStates.season
                  )`,
                ),
              ),
            ),
        ),
      );

      if (status === MyListStatusFilter.ContinueWatching) {
        builder = builder.andWhere(
          "libraryItem.lastPlayedAt IS NOT NULL AND libraryItem.lastPlayedAt > date('now', '-1 month')",
        );
      }
    }

    const DIRECTION = direction === OrderDirection.Asc ? 'ASC' : 'DESC';
    if (order === MyListOrder.Name) {
      builder.addOrderBy('seriesMetadata.name', DIRECTION);
      builder.addOrderBy('movieMetadata.name', DIRECTION);
    } else if (order === MyListOrder.DateAdded) {
      builder.addOrderBy('libraryItem.createdAt', DIRECTION);
    } else if (order === MyListOrder.FirstReleaseDate) {
      builder.addOrderBy('movieMetadata.releaseDate', DIRECTION);
      builder.addOrderBy('seriesMetadata.firstReleaseDate', DIRECTION);
    } else if (order === MyListOrder.LastReleaseDate) {
      builder.addOrderBy('movieMetadata.releaseDate', DIRECTION);
      builder.addOrderBy('seriesMetadata.lastReleaseDate', DIRECTION);
    } else if (order === MyListOrder.LastPlayed) {
      builder.addOrderBy('libraryItem.lastPlayedAt', DIRECTION);
    }

    const [items, total] = await builder
      .take(pagination.itemsPerPage)
      .skip(pagination.itemsPerPage * (pagination.page - 1))
      .getManyAndCount();

    // console.log(builder.getQuery());

    return {
      items: await Promise.all(
        items.map((item) => this.getLibraryItemDto(item)),
      ),
      total,
      itemsPerPage: pagination.itemsPerPage,
      page: pagination.page,
    };
  }

  async getCatalogueItems(options: {
    sourceId: string;
    userId: string;
    token: string;
    pagination: PaginationDto;
    type?: CatalogueTypeFilter;
    order?: string;
    direction?: string;
  }): Promise<PaginatedResponseDto<LibraryItemDto> | undefined> {
    const {
      sourceId,
      userId,
      token,
      pagination,
      type = CatalogueTypeFilter.All,
      order,
      direction,
    } = options;

    const connection = await this.mediaSourceService.getConnection({
      sourceId,
      token,
      userId,
    });

    if (!connection) {
      console.error(
        `No connection found for sourceId: ${sourceId}. Please check your media source configuration.`,
      );
      throw new Error('No connection found');
    }

    const combined = connection.provider.getCatalogue;
    const movies = connection.provider.getMovieCatalogue;
    const series = connection.provider.getSeriesCatalogue;
    const missing = connection.provider.getMissingInCatalogue;
    if (type === CatalogueTypeFilter.All && combined) {
      const response = await combined({
        pagination,
        order,
        direction,
      });

      return {
        ...response,
        items: await Promise.all(
          response.items.map(async (item) => this.getLibraryItemDto(item)),
        ),
      };
    } else if (type === CatalogueTypeFilter.Movies && movies) {
      const response = await movies({
        pagination,
        order,
        direction,
      });

      return {
        ...response,
        items: await Promise.all(
          response.items.map(async (item) => this.getLibraryItemDto(item)),
        ),
      };
    } else if (type === CatalogueTypeFilter.Series && series) {
      const response = await series({
        pagination,
        order,
        direction,
      });

      return {
        ...response,
        items: await Promise.all(
          response.items.map(async (item) => this.getLibraryItemDto(item)),
        ),
      };
    } else if (type === CatalogueTypeFilter.Missing && missing) {
      const tmdbIdToMyListItem: Record<string, LibraryItemDto> = {};
      const myListItems = await this.getMyList({
        pagination: {
          itemsPerPage: 500,
          page: 1,
        },
        userId: connection.mediaSource.userId,
        type: MyListTypeFilter.All,
        status: MyListStatusFilter.All,
        order: MyListOrder.DateAdded,
      }).then((res) => res.items);

      myListItems.forEach((i) => {
        tmdbIdToMyListItem[i.tmdbId] = i;
      });

      const response = await missing({
        pagination,
        myListItems: tmdbIdToMyListItem,
        order,
        direction,
      });

      return response;
    }

    throw new Error(
      `No catalogue provider found for type: ${type}. Please check your media source configuration.`,
    );
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

      const lastPlayedAt = await this.playStateRepository
        .find({
          where: {
            userId,
            tmdbId,
          },
        })
        .then((states) =>
          states.map((s) => new Date(s.lastPlayedAt).getTime() || 0),
        )
        .then((dates) => Math.max(...dates));

      if (lastPlayedAt) {
        libraryItem.lastPlayedAt = new Date(lastPlayedAt);
      }

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
      lastPlayState: playStates ? playStates[playStates.length - 1] : undefined,
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
