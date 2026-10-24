import { EntityManager, sql } from '@mikro-orm/sqlite';
import { Injectable } from '@nestjs/common';
import {
  MediaType,
  MediaTypeFull,
  OrderDirection,
  PaginatedResponseDto,
  PaginationDto,
} from '../common/common.dto.js';
import { getNextCleanup } from '../library/cleanup.utils.js';
import { LibraryService } from '../library/library.service.js';
import { MediaFile } from '../library/media-file.entity.js';
import { RequestBinding } from '../library/request-binding.entity.js';
import { MetadataService } from '../metadata/metadata.service.js';
import { MediaRequest } from '../requests/request.entity.js';
import { titleTypeOf } from '../requests/requests.utils.js';
import { MyListItem } from '../user-data/my-list/my-list-item.entity.js';
import { PlayStatesService } from '../user-data/play-state/play-states.service.js';
import {
  CatalogTitleDto,
  LibraryOrder,
  LibraryStatus,
  MyListOrder,
  MyListStatus,
} from './catalog.dto.js';

const READ = { disableIdentityMap: true };

/** The direction each order reads in when none is asked for */
const LIBRARY_NATURAL: Record<LibraryOrder, OrderDirection> = {
  [LibraryOrder.DateAdded]: OrderDirection.Desc,
  [LibraryOrder.Name]: OrderDirection.Asc,
  [LibraryOrder.FirstReleaseDate]: OrderDirection.Desc,
  [LibraryOrder.LastReleaseDate]: OrderDirection.Desc,
};
const MY_LIST_NATURAL: Record<MyListOrder, OrderDirection> = {
  [MyListOrder.DateAdded]: OrderDirection.Desc,
  [MyListOrder.Name]: OrderDirection.Asc,
  [MyListOrder.FirstReleaseDate]: OrderDirection.Desc,
  [MyListOrder.LastReleaseDate]: OrderDirection.Desc,
  [MyListOrder.LastPlayed]: OrderDirection.Desc,
};

// The sort keys read from the metadata, which both catalogues join as mm and sm
const NAME = sql`coalesce(sm.name, mm.name)`;
const FIRST_RELEASE_DATE = sql`coalesce(mm.release_date, sm.first_release_date)`;
const LAST_RELEASE_DATE = sql`coalesce(mm.release_date, sm.last_release_date)`;

type Title = { mediaType: MediaType; tmdbId: string };

/**
 * The catalogues of titles the pages list for a user: the titles that have
 * files in the library, and the titles of the user's list, each with what
 * the library and the user's requests have of it
 */
@Injectable()
export class CatalogService {
  constructor(
    private readonly em: EntityManager,
    private readonly metadataService: MetadataService,
    private readonly playStatesService: PlayStatesService,
    private readonly libraryService: LibraryService,
  ) {}

  /** The titles that have files in the library */
  async findLibraryTitles(
    userId: string,
    options: {
      mediaType?: MediaType;
      status?: LibraryStatus;
      order: LibraryOrder;
      direction?: OrderDirection;
      pagination: PaginationDto;
    },
  ): Promise<PaginatedResponseDto<CatalogTitleDto>> {
    const em = this.em.fork();
    const { page, itemsPerPage } = options.pagination;

    // Whether the user has a request for the title of the file
    const requested = sql`exists (
      select 1 from request r
      where r.user_id = ${userId} and r.tmdb_id = mf.tmdb_id
        and r.media_type = case mf.media_type when 'movie' then 'movie' else 'episode' end
    )`;
    const titles = () => {
      const builder = em
        .createQueryBuilder(MediaFile, 'mf')
        .leftJoin(sql.ref('movie_metadata'), 'mm', {
          'mm.tmdb_id': sql.ref('mf.tmdb_id'),
          'mf.media_type': MediaType.Movie,
        })
        .leftJoin(sql.ref('series_metadata'), 'sm', {
          'sm.tmdb_id': sql.ref('mf.tmdb_id'),
          'mf.media_type': MediaType.Series,
        });
      if (options.mediaType) {
        builder.andWhere({ mediaType: options.mediaType });
      }
      if (options.status === LibraryStatus.Requested) {
        builder.andWhere(requested);
      } else if (options.status === LibraryStatus.Unrequested) {
        builder.andWhere(sql`not ${requested}`);
      }

      return builder;
    };

    const { total } = await titles()
      .select(sql`count(distinct mf.media_type || ':' || mf.tmdb_id) as total`)
      .execute<{ total: number }>('get');

    const direction = options.direction ?? LIBRARY_NATURAL[options.order];
    const sortKey = {
      [LibraryOrder.DateAdded]: sql`max(mf.created_at)`,
      [LibraryOrder.Name]: NAME,
      [LibraryOrder.FirstReleaseDate]: FIRST_RELEASE_DATE,
      [LibraryOrder.LastReleaseDate]: LAST_RELEASE_DATE,
    }[options.order];
    const rows = await titles()
      .select(['mf.mediaType', 'mf.tmdbId'])
      .groupBy(['mf.mediaType', 'mf.tmdbId'])
      .orderBy({ [sortKey]: direction, [sql`mf.tmdb_id`]: 'asc' })
      .limit(itemsPerPage)
      .offset(itemsPerPage * (page - 1))
      .execute<Title[]>();

    return {
      items: await this.describeTitles(em, userId, rows),
      total,
      page,
      itemsPerPage,
    };
  }

  /** The titles of the user's list */
  async findMyList(
    userId: string,
    options: {
      mediaType?: MediaType;
      status?: MyListStatus;
      order: MyListOrder;
      direction?: OrderDirection;
      pagination: PaginationDto;
    },
  ): Promise<PaginatedResponseDto<CatalogTitleDto>> {
    const em = this.em.fork();
    const { page, itemsPerPage } = options.pagination;
    const status = myListStatusFilter(options.status);

    // Each item is joined with its play states (ps), which the status filter reads
    const titles = () => {
      const builder = em
        .createQueryBuilder(MyListItem, 'li')
        .leftJoin(sql.ref('play_state'), 'ps', {
          'ps.tmdb_id': sql.ref('li.tmdb_id'),
          'ps.user_id': sql.ref('li.user_id'),
          'ps.media_type': sql`case li.media_type when 'movie' then 'movie' else 'episode' end`,
        })
        .leftJoin(sql.ref('movie_metadata'), 'mm', {
          'mm.tmdb_id': sql.ref('li.tmdb_id'),
          'li.media_type': MediaType.Movie,
        })
        .leftJoin(sql.ref('series_metadata'), 'sm', {
          'sm.tmdb_id': sql.ref('li.tmdb_id'),
          'li.media_type': MediaType.Series,
        })
        .where({ userId });
      if (options.mediaType) {
        builder.andWhere({ mediaType: options.mediaType });
      }
      if (status) builder.andWhere(status);

      return builder;
    };

    const { total } = await titles()
      .select(sql`count(distinct li.id) as total`)
      .execute<{ total: number }>('get');

    const direction = options.direction ?? MY_LIST_NATURAL[options.order];
    const sortKey = {
      [MyListOrder.DateAdded]: sql`li.created_at`,
      [MyListOrder.Name]: NAME,
      [MyListOrder.FirstReleaseDate]: FIRST_RELEASE_DATE,
      [MyListOrder.LastReleaseDate]: LAST_RELEASE_DATE,
      [MyListOrder.LastPlayed]: sql`li.last_played_at`,
    }[options.order];
    const rows = await titles()
      .select(['li.mediaType', 'li.tmdbId'])
      .groupBy('li.id')
      .orderBy({ [sortKey]: direction, [sql`li.id`]: 'asc' })
      .limit(itemsPerPage)
      .offset(itemsPerPage * (page - 1))
      .execute<Title[]>();

    return {
      items: await this.describeTitles(em, userId, rows),
      total,
      page,
      itemsPerPage,
    };
  }

  /** The titles as the pages show them, in the order given */
  private async describeTitles(
    em: EntityManager,
    userId: string,
    titles: Title[],
  ): Promise<CatalogTitleDto[]> {
    const requested = await this.findRequested(em, userId, titles);
    const lastPlayed = await this.playStatesService.findLastPlayed(
      userId,
      titles,
    );
    const files = await this.findFiles(em, titles);
    const { cleanup } = await this.libraryService.getSettings();
    const nextCleanup = getNextCleanup(new Date(), cleanup);

    const items: CatalogTitleDto[] = [];
    for (const title of titles) {
      const key = titleKey(title);
      const lastPlayState = lastPlayed.get(key);
      const titleFiles = files.get(key) ?? [];
      const cleanedUp =
        !!nextCleanup &&
        titleFiles.length > 0 &&
        titleFiles.every((file) => file.managed && !file.held);
      items.push({
        mediaType: title.mediaType,
        tmdbId: title.tmdbId,
        tmdbItem: await this.metadataService.getTmdbItem(
          title.tmdbId,
          title.mediaType,
        ),
        requested: requested.has(key),
        available:
          title.mediaType === MediaType.Movie
            ? Math.min(titleFiles.length, 1)
            : countEpisodes(titleFiles),
        ...(cleanedUp && { cleanupAt: nextCleanup.toISOString() }),
        ...(lastPlayState && { lastPlayState }),
      });
    }

    return items;
  }

  /** The keys of the titles the user has a request for */
  private async findRequested(
    em: EntityManager,
    userId: string,
    titles: Title[],
  ): Promise<Set<string>> {
    if (!titles.length) return new Set();

    const requests = await em
      .createQueryBuilder(MediaRequest, 'r')
      .select(['r.mediaType', 'r.tmdbId'], true)
      .where({ userId, tmdbId: { $in: titles.map((title) => title.tmdbId) } })
      .execute<{ mediaType: MediaTypeFull; tmdbId: string }[]>();

    return new Set(
      requests.map((request) =>
        titleKey({
          mediaType: titleTypeOf(request.mediaType),
          tmdbId: request.tmdbId,
        }),
      ),
    );
  }

  /** The files of the titles, by key, with whether a request of anyone holds them */
  private async findFiles(
    em: EntityManager,
    titles: Title[],
  ): Promise<Map<string, TitleFile[]>> {
    if (!titles.length) return new Map();

    const files = await em.find(
      MediaFile,
      { $or: titles.map(({ mediaType, tmdbId }) => ({ mediaType, tmdbId })) },
      {
        ...READ,
        fields: [
          'id',
          'mediaType',
          'tmdbId',
          'season',
          'episode',
          'lastEpisode',
          'managed',
        ],
      },
    );
    const held = new Set(
      (
        await em.find(
          RequestBinding,
          { mediaFileId: { $in: files.map((file) => file.id) } },
          { ...READ, fields: ['mediaFileId'] },
        )
      ).map((binding) => binding.mediaFileId),
    );

    const byTitle = new Map<string, TitleFile[]>();
    for (const file of files) {
      const key = titleKey(file);
      byTitle.set(key, [
        ...(byTitle.get(key) ?? []),
        { ...file, held: held.has(file.id) },
      ]);
    }

    return byTitle;
  }
}

const titleKey = ({ mediaType, tmdbId }: Title) => `${mediaType}:${tmdbId}`;

type TitleFile = Pick<
  MediaFile,
  'id' | 'season' | 'episode' | 'lastEpisode' | 'managed'
> & { held: boolean };

/** The episodes the files cover, each once; a file may hold several */
function countEpisodes(files: TitleFile[]): number {
  const episodes = new Set<string>();
  for (const file of files) {
    for (let episode = file.episode; episode <= file.lastEpisode; episode++) {
      episodes.add(`${file.season}:${episode}`);
    }
  }

  return episodes.size;
}

/** The items (li) whose play states (ps) and metadata (mm, sm) give them the status */
function myListStatusFilter(status?: MyListStatus) {
  // Release dates are compared by UTC day, a release today counts as upcoming
  const today = new Date().setUTCHours(0, 0, 0, 0);

  const watched = sql`(
    (li.media_type = 'movie' and ps.watched = true)
    or (li.media_type = 'series' and ps.watched = true
      and ps.season = sm.last_season_number and ps.episode = sm.last_episode_number)
  )`;

  if (status === MyListStatus.Upcoming) {
    return sql`(${watched}
      and (sm.next_release_date >= ${today} or mm.release_date >= ${today}))`;
  } else if (status === MyListStatus.Watched) {
    return sql`(${watched} and (
      sm.next_release_date < ${today} or mm.release_date < ${today}
      or (sm.next_release_date is null and mm.release_date is null)
    ))`;
  } else if (
    status === MyListStatus.Unwatched ||
    status === MyListStatus.ContinueWatching
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

    if (status === MyListStatus.ContinueWatching) {
      const monthAgo = new Date();
      monthAgo.setUTCMonth(monthAgo.getUTCMonth() - 1);

      return sql`(${unwatched} and li.last_played_at is not null
        and li.last_played_at >= ${monthAgo.setUTCHours(0, 0, 0, 0)})`;
    }

    return unwatched;
  }

  return undefined;
}
