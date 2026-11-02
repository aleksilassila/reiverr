import { EntityManager, sql } from '@mikro-orm/sqlite';
import { Injectable } from '@nestjs/common';
import {
  initialOf,
  Letter,
  MediaType,
  OrderDirection,
  PaginatedResponseDto,
  PaginationDto,
  Title,
} from '../common/common.dto.js';
import {
  TorrentItemStatus,
  TorrentWithItemsDto,
} from '../downloads/downloads.dto.js';
import { DownloadsService } from '../downloads/downloads.service.js';
import { getNextCleanup } from '../library/cleanup.utils.js';
import { LibraryService } from '../library/library.service.js';
import { countEpisodes } from '../library/library.utils.js';
import { MediaFile } from '../library/media-file.entity.js';
import { RequestBinding } from '../library/request-binding.entity.js';
import { MetadataService } from '../metadata/metadata.service.js';
import { MediaRequest } from '../requests/request.entity.js';
import { TitleState } from '../user-data/title-state.entity.js';
import {
  CatalogDownloadDto,
  CatalogTitleDto,
  CatalogTitleOnDiskDto,
  DownloadsOrder,
  DownloadsStatus,
  MyListAvailability,
  MyListOrder,
  MyListStatus,
  OnDiskOrder,
  OnDiskStatus,
} from './catalog.dto.js';

const READ = { disableIdentityMap: true };

/** The direction each order reads in when none is asked for */
const MY_LIST_NATURAL: Record<MyListOrder, OrderDirection> = {
  [MyListOrder.DateAdded]: OrderDirection.Desc,
  [MyListOrder.Name]: OrderDirection.Asc,
  [MyListOrder.FirstReleaseDate]: OrderDirection.Desc,
  [MyListOrder.LastReleaseDate]: OrderDirection.Desc,
  [MyListOrder.LastPlayed]: OrderDirection.Desc,
};

const ON_DISK_NATURAL: Record<OnDiskOrder, OrderDirection> = {
  [OnDiskOrder.Size]: OrderDirection.Desc,
  [OnDiskOrder.Name]: OrderDirection.Asc,
  [OnDiskOrder.Added]: OrderDirection.Desc,
};

// The sort keys read from the metadata, which the my list and the titles on disk join as mm and sm
const NAME = sql`coalesce(sm.name, mm.name)`;
const FIRST_RELEASE_DATE = sql`coalesce(mm.release_date, sm.first_release_date)`;
const LAST_RELEASE_DATE = sql`coalesce(mm.release_date, sm.last_release_date)`;
// The initial of the name, in upper case; empty without a cached name
const INITIAL = sql`upper(substr(coalesce(sm.name, mm.name, ''), 1, 1))`;

/**
 * The lists the pages show a user: the titles of the user's list, each with
 * what the library and their play states have of it, the torrents that
 * are downloading, and the titles on disk with what the user's requests
 * hold of them
 */
@Injectable()
export class CatalogService {
  constructor(
    private readonly em: EntityManager,
    private readonly metadataService: MetadataService,
    private readonly libraryService: LibraryService,
    private readonly downloadsService: DownloadsService,
  ) {}

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
      .select([
        'ts.mediaType',
        'ts.tmdbId',
        'ts.nextSeason',
        'ts.nextEpisode',
        'ts.nextAirDate',
        // Of what the user played last of the title
        sql`(select ps.progress from play_state ps
          where ps.user_id = ${userId}
            and ps.media_type = ts.media_type and ps.tmdb_id = ts.tmdb_id
          order by ps.last_played_at desc limit 1) as progress`,
        sql`exists (select 1 ${FILES_OF_TITLE} and ${OF_NEXT_EPISODE}) as next_on_disk`,
        // Files, every one managed and held by no request of anyone: what the cleanup deletes
        sql`(exists (select 1 ${FILES_OF_TITLE}) and not exists (select 1 ${FILES_OF_TITLE}
          and (not mf.managed or exists (
            select 1 from request_binding b where b.media_file_id = mf.id
          )))) as unretained`,
      ])
      .orderBy({ [sortKey]: direction, [sql`ts.id`]: 'asc' })
      .limit(itemsPerPage)
      .offset(itemsPerPage * (page - 1))
      .execute<
        (Title & {
          nextSeason: number | null;
          nextEpisode: number | null;
          nextAirDate: Date | null;
          progress: number | null;
          next_on_disk: number;
          unretained: number;
        })[]
      >();

    const files = await this.findFiles(em, rows);
    const { cleanup } = await this.libraryService.getSettings();
    const nextCleanup = getNextCleanup(new Date(), cleanup);

    const items: CatalogTitleDto[] = [];
    for (const row of rows) {
      const titleFiles = files.get(titleKey(row)) ?? [];
      const cleanedUp = !!nextCleanup && !!row.unretained;
      items.push({
        mediaType: row.mediaType,
        tmdbId: row.tmdbId,
        tmdbItem: await this.metadataService.getTmdbItem(
          row.tmdbId,
          row.mediaType,
        ),
        available:
          row.mediaType === MediaType.Movie
            ? Math.min(titleFiles.length, 1)
            : countEpisodes(titleFiles),
        ...(cleanedUp && { cleanupAt: nextCleanup.toISOString() }),
        ...(row.progress != null && { progress: row.progress }),
        ...(row.mediaType === MediaType.Series &&
          row.nextSeason != null &&
          row.nextEpisode != null && {
            nextEpisode: {
              season: row.nextSeason,
              episode: row.nextEpisode,
              ...(row.nextAirDate && {
                airDate: row.nextAirDate.toISOString(),
              }),
              onDisk: !!row.next_on_disk,
            },
          }),
      });
    }

    return { items, total, page, itemsPerPage };
  }

  /**
   * The torrents that are downloading, as the engine has them, each with
   * the title it downloads: every one, or those a request of the user waits
   * for; of one type of title or both, under a letter or all; by what they
   * download, by the name of the title or by when they were added, in the
   * direction asked for or the one natural to the order. Not paged: there
   * are a handful at a time
   */
  async findDownloads(
    userId: string,
    options: {
      mediaType?: MediaType;
      status?: DownloadsStatus;
      letter?: Letter;
      order: DownloadsOrder;
      direction?: OrderDirection;
    },
  ): Promise<CatalogDownloadDto[]> {
    const em = this.em.fork();
    const torrents = await this.downloadsService.describeDownloads();
    const waitedFor = await this.findWaitedItems(em, userId);

    // A torrent downloads the items of it that are not released, all of one title
    type Download = Omit<CatalogDownloadDto, 'tmdbItem'> & { addedAt: number };
    const downloads: Download[] = [];
    for (const torrent of torrents) {
      const items = torrent.items.filter(
        (item) => item.status !== TorrentItemStatus.Released,
      );
      const [first] = items;
      if (!first) continue;
      if (options.mediaType && first.mediaType !== options.mediaType) continue;
      const requested = items.some((item) => waitedFor.has(item.id));
      if (options.status === DownloadsStatus.Requested && !requested) continue;
      downloads.push({
        infoHash: torrent.infoHash,
        mediaType: first.mediaType,
        tmdbId: first.tmdbId,
        name: torrent.title,
        episodes: items.map(({ season, episode }) => ({ season, episode })),
        status: torrent.status,
        size: torrent.wantedBytes,
        progress: torrent.progress,
        peers: torrent.peers,
        downloadSpeed: torrent.downloadSpeed,
        requested,
        addedAt: Date.parse(torrent.addedAt),
      });
    }

    // The cached names, for the letter and the name order; without one a title is '': first by name, under '#'
    const names = new Map<string, string>();
    if (options.letter || options.order === DownloadsOrder.Name) {
      for (const mediaType of [MediaType.Movie, MediaType.Series]) {
        const found = await this.metadataService.findNames(
          em,
          mediaType,
          downloads
            .filter((download) => download.mediaType === mediaType)
            .map((download) => download.tmdbId),
        );
        for (const [tmdbId, name] of found) {
          names.set(titleKey({ mediaType, tmdbId }), name);
        }
      }
    }
    const nameOf = (download: Download) => names.get(titleKey(download)) ?? '';
    const listed = options.letter
      ? downloads.filter(
          (download) => initialOf(nameOf(download)) === options.letter,
        )
      : downloads;
    const natural = {
      [DownloadsOrder.Size]: OrderDirection.Desc,
      [DownloadsOrder.Name]: OrderDirection.Asc,
      [DownloadsOrder.Added]: OrderDirection.Desc,
    }[options.order];
    // The order's own direction, reversed when the other is asked for
    const sign = options.direction && options.direction !== natural ? -1 : 1;
    const byHash = (a: Download, b: Download) =>
      a.infoHash.localeCompare(b.infoHash);
    if (options.order === DownloadsOrder.Name) {
      listed.sort(
        (a, b) =>
          sign *
            (nameOf(a).localeCompare(nameOf(b)) ||
              a.name.localeCompare(b.name)) || byHash(a, b),
      );
    } else if (options.order === DownloadsOrder.Added) {
      listed.sort((a, b) => sign * (b.addedAt - a.addedAt) || byHash(a, b));
    } else {
      listed.sort((a, b) => sign * (b.size - a.size) || byHash(a, b));
    }

    const items: CatalogDownloadDto[] = [];
    for (const download of listed) {
      items.push({
        infoHash: download.infoHash,
        mediaType: download.mediaType,
        tmdbId: download.tmdbId,
        tmdbItem: await this.metadataService.getTmdbItem(
          download.tmdbId,
          download.mediaType,
        ),
        name: download.name,
        episodes: download.episodes,
        status: download.status,
        size: download.size,
        progress: download.progress,
        peers: download.peers,
        downloadSpeed: download.downloadSpeed,
        requested: download.requested,
      });
    }

    return items;
  }

  /** The ids of the items that the requests of the user wait for */
  private async findWaitedItems(
    em: EntityManager,
    userId: string,
  ): Promise<Set<string>> {
    const requests = await em.find(
      MediaRequest,
      { userId },
      { ...READ, fields: ['id'] },
    );
    if (!requests.length) return new Set();

    const bindings = await em.find(
      RequestBinding,
      {
        requestId: { $in: requests.map((request) => request.id) },
        torrentItemId: { $ne: null },
      },
      { ...READ, fields: ['torrentItemId'] },
    );

    return new Set(bindings.flatMap((binding) => binding.torrentItemId ?? []));
  }

  /**
   * The titles that have files in the library, with what the files take
   * and what the requests of the user hold of them: a page, of one type of
   * title or both, every title or those a request of the user has a file
   * of, under a letter or all; by size, by name or by when the newest file
   * was indexed, in the direction asked for or the one natural to the
   * order. With the requested status the size and the date are of the
   * files the user's requests hold, counted as the usage of the user is,
   * so that the titles add up to what it holds; without it, of every file
   * of the title
   */
  async findOnDisk(
    userId: string,
    options: {
      mediaType?: MediaType;
      status?: OnDiskStatus;
      letter?: Letter;
      order: OnDiskOrder;
      direction?: OrderDirection;
      pagination: PaginationDto;
    },
  ): Promise<PaginatedResponseDto<CatalogTitleOnDiskDto>> {
    const em = this.em.fork();
    const { page, itemsPerPage } = options.pagination;
    const requestedOnly = options.status === OnDiskStatus.Requested;

    // The user's requests for the title of the file (mf), those with their file, and the files they hold, each once however many hold it
    const requestsOfTitle = sql`from request r
      where r.user_id = ${userId}
        and r.media_type = mf.media_type and r.tmdb_id = mf.tmdb_id`;
    const fulfilledOfTitle = sql`from request r
      join request_binding b on b.request_id = r.id and b.media_file_id is not null
      where r.user_id = ${userId}
        and r.media_type = mf.media_type and r.tmdb_id = mf.tmdb_id`;
    const heldFilesOfTitle = sql`from media_file f
      where f.id in (select b.media_file_id ${fulfilledOfTitle})`;

    // The rows are the files (mf), grouped by title below; the filters hold for every file of a title
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
      if (requestedOnly) {
        builder.andWhere(sql`exists (select 1 ${fulfilledOfTitle})`);
      }
      if (options.letter) builder.andWhere(letterFilter(options.letter));

      return builder;
    };

    const { total } = await titles()
      .select(sql`count(distinct mf.media_type || ':' || mf.tmdb_id) as total`)
      .execute<{ total: number }>('get');

    const direction = options.direction ?? ON_DISK_NATURAL[options.order];
    const sortKey = {
      [OnDiskOrder.Size]: requestedOnly ? sql`held_bytes` : sql`disk_bytes`,
      [OnDiskOrder.Name]: NAME,
      [OnDiskOrder.Added]: requestedOnly
        ? sql`newest_held_file_at`
        : sql`newest_file_at`,
    }[options.order];
    const rows = await titles()
      .select([
        'mf.mediaType',
        'mf.tmdbId',
        sql`count(*) as file_count`,
        // Managed and held by no request of anyone: what the cleanup deletes
        sql`sum(mf.managed and not exists (
          select 1 from request_binding b where b.media_file_id = mf.id
        )) as unretained_count`,
        sql`sum(mf.size) as disk_bytes`,
        sql`max(mf.created_at) as newest_file_at`,
        sql`(select count(*) ${requestsOfTitle}) as request_count`,
        sql`(select count(*) ${fulfilledOfTitle}) as fulfilled_count`,
        sql`(select coalesce(sum(f.size), 0) ${heldFilesOfTitle}) as held_bytes`,
        sql`(select coalesce(max(f.created_at), 0) ${heldFilesOfTitle}) as newest_held_file_at`,
        sql`rr.id as rule_id`,
        sql`rr.keep_next`,
        sql`rr.keep_watched`,
        sql`rr.keep_watched_hours`,
      ])
      .leftJoin(sql.ref('request_rule'), 'rr', {
        'rr.user_id': userId,
        'rr.media_type': sql.ref('mf.media_type'),
        'rr.tmdb_id': sql.ref('mf.tmdb_id'),
      })
      .groupBy(['mf.mediaType', 'mf.tmdbId'])
      .orderBy({
        [sortKey]: direction,
        [sql`mf.tmdb_id`]: 'asc',
        [sql`mf.media_type`]: 'asc',
      })
      .limit(itemsPerPage)
      .offset(itemsPerPage * (page - 1))
      .execute<
        (Title & {
          file_count: number;
          unretained_count: number;
          disk_bytes: number;
          newest_file_at: number;
          request_count: number;
          fulfilled_count: number;
          held_bytes: number;
          newest_held_file_at: number;
          rule_id: string | null;
          keep_next: number | null;
          keep_watched: number | null;
          keep_watched_hours: number | null;
        })[]
      >();

    const items: CatalogTitleOnDiskDto[] = [];
    for (const row of rows) {
      items.push({
        mediaType: row.mediaType,
        tmdbId: row.tmdbId,
        tmdbItem: await this.metadataService.getTmdbItem(
          row.tmdbId,
          row.mediaType,
        ),
        files: row.file_count,
        unretained: row.unretained_count,
        diskBytes: row.disk_bytes,
        requests: row.request_count,
        fulfilled: row.fulfilled_count,
        heldBytes: row.held_bytes,
        ...(row.rule_id && {
          rule: {
            keepNext: row.keep_next,
            keepWatched: row.keep_watched,
            keepWatchedHours: row.keep_watched_hours,
          },
        }),
      });
    }

    return { items, total, page, itemsPerPage };
  }

  /** The files of the titles in the library, by key, for the count of episodes on disk */
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
        fields: ['mediaType', 'tmdbId', 'season', 'episode', 'lastEpisode'],
      },
    );

    const byTitle = new Map<string, TitleFile[]>();
    for (const file of files) {
      const key = titleKey(file);
      byTitle.set(key, [...(byTitle.get(key) ?? []), file]);
    }

    return byTitle;
  }
}

const titleKey = ({ mediaType, tmdbId }: Title) => `${mediaType}:${tmdbId}`;

type TitleFile = Pick<MediaFile, 'season' | 'episode' | 'lastEpisode'>;

/** The titles whose name (from mm, sm) starts with the letter; '#' is those that start with none */
function letterFilter(letter: Letter) {
  return letter === '#'
    ? sql`${INITIAL} not between 'A' and 'Z'`
    : sql`${INITIAL} = ${letter}`;
}

// The files (mf) of the title of a row (ts), and a file covering the stamped next episode
const FILES_OF_TITLE = sql`from media_file mf
  where mf.media_type = ts.media_type and mf.tmdb_id = ts.tmdb_id`;
const OF_NEXT_EPISODE = sql`(mf.season = ts.next_season
  and ts.next_episode between mf.episode and mf.last_episode)`;

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
    select 1 ${FILES_OF_TITLE}
      and (${nothingToWatch(now)} or ${OF_NEXT_EPISODE})
  )`;

  if (availability === MyListAvailability.Available) {
    return available;
  } else if (availability === MyListAvailability.Unavailable) {
    return sql`not ${available}`;
  }

  return undefined;
}
