import { CreateRequestContext } from '@mikro-orm/decorators/legacy';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityManager, EntityRepository, sql } from '@mikro-orm/sqlite';
import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import {
  MediaType,
  MediaTypeFull,
  PaginatedResponseDto,
  PaginationDto,
} from '../../common/common.dto.js';
import { MetadataService } from '../../metadata/metadata.service.js';
import { PlayState } from '../play-state/play-state.entity.js';
import {
  LibraryItemDto,
  MyListOrder,
  MyListStatusFilter,
  MyListTypeFilter,
  OrderDirection,
} from './library.dto.js';
import { LibraryItem } from './library.entity.js';

@Injectable()
export class LibraryService implements OnApplicationBootstrap {
  private readonly logger = new Logger(LibraryService.name);

  constructor(
    @InjectRepository(LibraryItem)
    private readonly libraryRepository: EntityRepository<LibraryItem>,
    @InjectRepository(PlayState)
    private readonly playStateRepository: EntityRepository<PlayState>,
    private readonly em: EntityManager,
    private readonly metadataService: MetadataService,
  ) {}

  @CreateRequestContext()
  async onApplicationBootstrap() {
    // Make sure library items are cached
    const items = await this.libraryRepository.findAll();

    items.forEach((i) => {
      const metadata =
        i.mediaType === 'movie'
          ? this.metadataService.getMovieByTmdbId(i.tmdbId)
          : this.metadataService.getSeriesByTmdbId(i.tmdbId);

      metadata.catch((e) =>
        this.logger.warn(
          `Failed to cache ${i.mediaType} ${i.tmdbId}: ${e.message}`,
        ),
      );
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
        'ps.media_type': sql`case li.media_type when 'movie' then 'movie' else 'episode' end`,
      })
      .leftJoin('li.movieMetadata', 'mm', {
        [sql`li.media_type = 'movie'`]: [],
      })
      .leftJoin('li.seriesMetadata', 'sm', {
        [sql`li.media_type = 'series'`]: [],
      })
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
        'li.media_type': sql`case ps.media_type when 'movie' then 'movie' else 'series' end`,
      })
      .leftJoin(sql.ref('movie_metadata'), 'mm', {
        'mm.tmdb_id': sql.ref('li.tmdb_id'),
        'li.media_type': MediaType.Movie,
      })
      .leftJoin(sql.ref('series_metadata'), 'sm', {
        'sm.tmdb_id': sql.ref('li.tmdb_id'),
        'li.media_type': MediaType.Series,
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
              (playState) =>
                playState.tmdbId === item.tmdbId &&
                playStateMediaType(item.mediaType) === playState.mediaType,
            ),
          }),
        ),
      ),
      total,
      itemsPerPage: pagination.itemsPerPage,
      page: pagination.page,
    };
  }

  async findByTmdbId(
    userId: string,
    tmdbId: string,
    mediaType: MediaType,
  ): Promise<LibraryItem | null> {
    return this.libraryRepository.findOne({ userId, tmdbId, mediaType });
  }

  async findOrCreateByTmdbId(
    userId: string,
    tmdbId: string,
    mediaType: MediaType,
  ): Promise<LibraryItem> {
    let libraryItem = await this.findByTmdbId(userId, tmdbId, mediaType);

    if (!libraryItem) {
      libraryItem = new LibraryItem();
      libraryItem.userId = userId;
      libraryItem.tmdbId = tmdbId;
      libraryItem.mediaType = mediaType;

      const lastPlayedAt = await this.playStateRepository
        .find({ userId, tmdbId, mediaType: playStateMediaType(mediaType) })
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

  async deleteByTmdbId(userId: string, tmdbId: string, mediaType: MediaType) {
    return await this.libraryRepository.nativeDelete({
      userId,
      tmdbId,
      mediaType,
    });
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

// The play states of a series are those of its episodes
function playStateMediaType(mediaType: MediaType): MediaTypeFull {
  return mediaType === MediaType.Movie
    ? MediaTypeFull.Movie
    : MediaTypeFull.Episode;
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
          and last_episode.media_type = 'episode'
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
