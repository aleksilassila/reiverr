import { EntityManager, sql } from '@mikro-orm/sqlite';
import { Injectable } from '@nestjs/common';
import {
  Letter,
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
import { PlayStatesService } from '../user-data/play-states.service.js';
import { TitleState } from '../user-data/title-state.entity.js';
import {
  CatalogTitleDto,
  LibraryOrder,
  LibraryStatus,
  MyListAvailability,
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
// The initial of the name, in upper case; empty without a cached name
const INITIAL = sql`upper(substr(coalesce(sm.name, mm.name, ''), 1, 1))`;

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
      letter?: Letter;
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
      if (options.letter) builder.andWhere(letterFilter(options.letter));

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
      availability?: MyListAvailability;
      letter?: Letter;
      order: MyListOrder;
      direction?: OrderDirection;
      pagination: PaginationDto;
    },
  ): Promise<PaginatedResponseDto<CatalogTitleDto>> {
    const em = this.em.fork();
    const { page, itemsPerPage } = options.pagination;
    const status = myListStatusFilter(options.status);
    const availability = myListAvailabilityFilter(options.availability);

    // The rows (ts) are the user's; the filters read the stamped next episode
    const titles = () => {
      const builder = em
        .createQueryBuilder(TitleState, 'ts')
        .leftJoin(sql.ref('movie_metadata'), 'mm', {
          'mm.tmdb_id': sql.ref('ts.tmdb_id'),
          'ts.media_type': MediaType.Movie,
        })
        .leftJoin(sql.ref('series_metadata'), 'sm', {
          'sm.tmdb_id': sql.ref('ts.tmdb_id'),
          'ts.media_type': MediaType.Series,
        })
        .where({ userId, addedToMyListAt: { $ne: null } });
      if (options.mediaType) {
        builder.andWhere({ mediaType: options.mediaType });
      }
      if (status) builder.andWhere(status);
      if (availability) builder.andWhere(availability);
      if (options.letter) builder.andWhere(letterFilter(options.letter));

      return builder;
    };

    const { total } = await titles()
      .select(sql`count(*) as total`)
      .execute<{ total: number }>('get');

    const direction = options.direction ?? MY_LIST_NATURAL[options.order];
    const sortKey = {
      [MyListOrder.DateAdded]: sql`ts.added_to_my_list_at`,
      [MyListOrder.Name]: NAME,
      [MyListOrder.FirstReleaseDate]: FIRST_RELEASE_DATE,
      [MyListOrder.LastReleaseDate]: LAST_RELEASE_DATE,
      [MyListOrder.LastPlayed]: sql`ts.last_played_at`,
    }[options.order];
    const rows = await titles()
      .select(['ts.mediaType', 'ts.tmdbId'])
      .orderBy({ [sortKey]: direction, [sql`ts.id`]: 'asc' })
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
    const next = await this.findNext(em, userId, titles);
    const files = await this.findFiles(em, titles);
    const { cleanup } = await this.libraryService.getSettings();
    const nextCleanup = getNextCleanup(new Date(), cleanup);

    const items: CatalogTitleDto[] = [];
    for (const title of titles) {
      const key = titleKey(title);
      const lastPlayState = lastPlayed.get(key);
      const nextEpisode = next.get(key);
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
        ...(nextEpisode && {
          nextEpisode: {
            season: nextEpisode.season,
            episode: nextEpisode.episode,
            ...(nextEpisode.airDate && {
              airDate: nextEpisode.airDate.toISOString(),
            }),
            onDisk: titleFiles.some(
              (file) =>
                file.season === nextEpisode.season &&
                file.episode <= nextEpisode.episode &&
                nextEpisode.episode <= file.lastEpisode,
            ),
          },
        }),
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

  /** The next episode the user's rows have stamped for the series, by key */
  private async findNext(
    em: EntityManager,
    userId: string,
    titles: Title[],
  ): Promise<Map<string, NextEpisodeRow>> {
    const series = titles.filter(
      (title) => title.mediaType === MediaType.Series,
    );
    if (!series.length) return new Map();

    const rows = await em.find(
      TitleState,
      {
        userId,
        mediaType: MediaType.Series,
        tmdbId: { $in: series.map((title) => title.tmdbId) },
        nextSeason: { $ne: null },
      },
      {
        ...READ,
        fields: ['tmdbId', 'nextSeason', 'nextEpisode', 'nextAirDate'],
      },
    );

    return new Map(
      rows.map((row) => [
        titleKey({ mediaType: MediaType.Series, tmdbId: row.tmdbId }),
        {
          season: row.nextSeason as number,
          episode: row.nextEpisode as number,
          airDate: row.nextAirDate ?? null,
        },
      ]),
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

type NextEpisodeRow = { season: number; episode: number; airDate: Date | null };

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

/** The titles whose name (from mm, sm) starts with the letter; '#' is those that start with none */
function letterFilter(letter: Letter) {
  return letter === '#'
    ? sql`${INITIAL} not between 'A' and 'Z'`
    : sql`${INITIAL} = ${letter}`;
}

// The stamped air date is a day at UTC midnight, so an episode airing today has aired
const unwatched = (now: number) => sql`ts.next_air_date <= ${now}`;
// Nothing stamped, or the next episode not aired yet
const nothingToWatch = (now: number) =>
  sql`(ts.next_air_date is null or ts.next_air_date > ${now})`;

/** The rows (ts) whose stamped next episode gives them the status */
function myListStatusFilter(status?: MyListStatus) {
  const now = Date.now();

  if (status === MyListStatus.Unwatched) {
    return unwatched(now);
  } else if (status === MyListStatus.Watched) {
    return nothingToWatch(now);
  } else if (status === MyListStatus.ContinueWatching) {
    const monthAgo = new Date();
    monthAgo.setUTCMonth(monthAgo.getUTCMonth() - 1);

    return sql`(${unwatched(now)}
      and ts.last_played_at >= ${monthAgo.setUTCHours(0, 0, 0, 0)})`;
  }

  return undefined;
}

/**
 * The rows (ts) that have a file of what the user would watch next, or not:
 * of the next episode while an aired one is left (a movie is at season 0,
 * episode 0, as its file), else of anything of the title
 */
function myListAvailabilityFilter(availability?: MyListAvailability) {
  const now = Date.now();
  const available = sql`exists (
    select 1 from media_file mf
    where mf.media_type = ts.media_type and mf.tmdb_id = ts.tmdb_id
      and (${nothingToWatch(now)}
        or (mf.season = ts.next_season
          and ts.next_episode between mf.episode and mf.last_episode))
  )`;

  if (availability === MyListAvailability.Available) {
    return available;
  } else if (availability === MyListAvailability.Unavailable) {
    return sql`not ${available}`;
  }

  return undefined;
}
