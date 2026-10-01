import { CreateRequestContext } from '@mikro-orm/decorators/legacy';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityManager, EntityRepository, sql } from '@mikro-orm/sqlite';
import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import {
  MediaType,
  PaginatedResponseDto,
  PaginationDto,
} from '../../common/common.dto.js';
import { MetadataService } from '../../metadata/metadata.service.js';
import { MediaSourcesService } from '../../users/media-sources/media-sources.service.js';
import { PlayState } from '../play-state/play-state.entity.js';
import {
  CatalogueTypeFilter,
  LibraryItemDto,
  MyListOrder,
  MyListStatusFilter,
  MyListTypeFilter,
  OrderDirection,
} from './library.dto.js';
import { LibraryItem } from './library.entity.js';

@Injectable()
export class LibraryService implements OnApplicationBootstrap {
  constructor(
    @InjectRepository(LibraryItem)
    private readonly libraryRepository: EntityRepository<LibraryItem>,
    @InjectRepository(PlayState)
    private readonly playStateRepository: EntityRepository<PlayState>,
    private readonly em: EntityManager,
    private readonly metadataService: MetadataService,
    private readonly mediaSourceService: MediaSourcesService,
  ) {}

  @CreateRequestContext()
  async onApplicationBootstrap() {
    // Make sure library items are cached
    const items = await this.libraryRepository.findAll();

    items.forEach((i) => {
      if (i.mediaType === 'movie') {
        this.metadataService.getMovieByTmdbId(i.tmdbId);
      } else if (i.mediaType === 'series') {
        this.metadataService.getSeriesByTmdbId(i.tmdbId);
      }
    });
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

    // Each library item is joined with its play states (ps), so the status
    // filter selects both the items and the play states returned with them
    const statusFilter = getStatusFilter(status);

    const builder = this.libraryRepository
      .createQueryBuilder('li')
      .leftJoin(sql.ref('play_state'), 'ps', {
        'ps.tmdb_id': sql.ref('li.tmdb_id'),
        'ps.user_id': sql.ref('li.user_id'),
      })
      .leftJoin('li.movieMetadata', 'mm')
      .leftJoin('li.seriesMetadata', 'sm')
      .where({ userId });

    if (mediaType) builder.andWhere({ mediaType });
    if (statusFilter) builder.andWhere(statusFilter);

    const total = await builder.clone().getCount('li.id', true);

    const DIRECTION = direction === OrderDirection.Asc ? 'asc' : 'desc';
    const orderBy: Record<string, 'asc' | 'desc'> = {};
    if (order === MyListOrder.Name) {
      orderBy['sm.name'] = DIRECTION;
      orderBy['mm.name'] = DIRECTION;
    } else if (order === MyListOrder.DateAdded) {
      orderBy['li.createdAt'] = DIRECTION;
    } else if (order === MyListOrder.FirstReleaseDate) {
      orderBy['mm.releaseDate'] = DIRECTION;
      orderBy['sm.firstReleaseDate'] = DIRECTION;
    } else if (order === MyListOrder.LastReleaseDate) {
      orderBy['mm.releaseDate'] = DIRECTION;
      orderBy['sm.lastReleaseDate'] = DIRECTION;
    } else if (order === MyListOrder.LastPlayed) {
      orderBy['li.lastPlayedAt'] = DIRECTION;
    }
    orderBy['li.id'] = 'asc';

    const items: Pick<LibraryItem, 'tmdbId' | 'mediaType'>[] = await builder
      .select(['li.tmdbId', 'li.mediaType'])
      .groupBy('li.id')
      .orderBy(orderBy)
      .limit(pagination.itemsPerPage)
      .offset(pagination.itemsPerPage * (pagination.page - 1))
      .execute();

    const playStatesBuilder = this.playStateRepository
      .createQueryBuilder('ps')
      .select('*')
      .innerJoin(sql.ref('library_item'), 'li', {
        'li.tmdb_id': sql.ref('ps.tmdb_id'),
        'li.user_id': sql.ref('ps.user_id'),
      })
      .leftJoin(sql.ref('movie_metadata'), 'mm', {
        'mm.tmdb_id': sql.ref('li.tmdb_id'),
      })
      .leftJoin(sql.ref('series_metadata'), 'sm', {
        'sm.tmdb_id': sql.ref('li.tmdb_id'),
      })
      .where({ userId, tmdbId: { $in: items.map((item) => item.tmdbId) } })
      .orderBy({ season: 'asc', episode: 'asc' });

    if (statusFilter) playStatesBuilder.andWhere(statusFilter);

    const playStates = items.length
      ? await playStatesBuilder.getResultList()
      : [];

    return {
      items: await Promise.all(
        items.map((item) =>
          this.getLibraryItemDto({
            tmdbId: item.tmdbId,
            mediaType: item.mediaType,
            playStates: playStates.filter(
              (playState) => playState.tmdbId === item.tmdbId,
            ),
          }),
        ),
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

    const combined = connection.catalogueProvider.getCatalogue;
    const movies = connection.catalogueProvider.getMovieCatalogue;
    const series = connection.catalogueProvider.getSeriesCatalogue;
    const missing = connection.catalogueProvider.getMissingInCatalogue;
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
    return this.libraryRepository.findOne({ userId, tmdbId });
  }

  async findOrCreateByTmdbId(
    userId: string,
    tmdbId: string,
    mediaType: MediaType,
  ): Promise<LibraryItem> {
    let libraryItem = await this.findByTmdbId(userId, tmdbId);

    if (!libraryItem) {
      libraryItem = new LibraryItem();
      libraryItem.userId = userId;
      libraryItem.tmdbId = tmdbId;
      libraryItem.mediaType = mediaType;

      const lastPlayedAt = await this.playStateRepository
        .find({ userId, tmdbId })
        .then((states) =>
          states.map((s) => new Date(s.lastPlayedAt).getTime() || 0),
        )
        .then((dates) => Math.max(0, ...dates));

      if (lastPlayedAt) {
        libraryItem.lastPlayedAt = new Date(lastPlayedAt);
      }

      await this.em.persist(libraryItem).flush();
    }

    return libraryItem;
  }

  async deleteByTmdbId(userId: string, tmdbId: string) {
    return await this.libraryRepository.nativeDelete({ userId, tmdbId });
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

function getStatusFilter(status?: MyListStatusFilter) {
  // Release dates are compared by UTC day, a release today counts as upcoming
  const today = new Date().setUTCHours(0, 0, 0, 0);

  const watched = sql`(
    (li.media_type = 'movie' and ps.watched = true)
    or (li.media_type = 'series' and ps.watched = true
      and ps.season = sm.last_season_number and ps.episode = sm.last_episode_number)
  )`;

  if (status === MyListStatusFilter.Upcoming) {
    return sql`(${watched}
      and (sm.next_release_date >= ${today} or mm.release_date >= ${today}))`;
  } else if (status === MyListStatusFilter.Watched) {
    return sql`(${watched} and (
      sm.next_release_date < ${today} or mm.release_date < ${today}
      or (sm.next_release_date is null and mm.release_date is null)
    ))`;
  } else if (
    status === MyListStatusFilter.Unwatched ||
    status === MyListStatusFilter.ContinueWatching
  ) {
    const unwatched = sql`(
      (li.media_type = 'movie' and ps.watched = false)
      or (li.media_type = 'movie' and ps.watched is null)
      or (li.media_type = 'series' and ps.watched = false
        and ps.season = sm.last_season_number and ps.episode = sm.last_episode_number)
      or (li.media_type = 'series' and not exists (
        select 1 from play_state last_episode
        left join series_metadata series on series.tmdb_id = last_episode.tmdb_id
        where last_episode.tmdb_id = li.tmdb_id and last_episode.user_id = li.user_id
          and series.last_episode_number = last_episode.episode
          and series.last_season_number = last_episode.season
      ))
    )`;

    if (status === MyListStatusFilter.ContinueWatching) {
      const monthAgo = new Date();
      monthAgo.setUTCMonth(monthAgo.getUTCMonth() - 1);

      return sql`(${unwatched} and li.last_played_at is not null
        and li.last_played_at >= ${monthAgo.setUTCHours(0, 0, 0, 0)})`;
    }

    return unwatched;
  }

  return undefined;
}
