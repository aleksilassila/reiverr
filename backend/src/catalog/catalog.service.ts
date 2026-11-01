import { EntityManager, sql } from '@mikro-orm/sqlite';
import { Injectable } from '@nestjs/common';
import {
  initialOf,
  Letter,
  MediaType,
  MediaTypeFull,
  OrderDirection,
  PaginatedResponseDto,
  PaginationDto,
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
import { titleTypeOf } from '../requests/requests.utils.js';
import { PlayStatesService } from '../user-data/play-states.service.js';
import { TitleState } from '../user-data/title-state.entity.js';
import {
  CatalogDownloadDto,
  CatalogTitleDto,
  DownloadsOrder,
  DownloadsStatus,
  MyListAvailability,
  MyListOrder,
  MyListStatus,
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

// The sort keys read from the metadata, which the my list joins as mm and sm
const NAME = sql`coalesce(sm.name, mm.name)`;
const FIRST_RELEASE_DATE = sql`coalesce(mm.release_date, sm.first_release_date)`;
const LAST_RELEASE_DATE = sql`coalesce(mm.release_date, sm.last_release_date)`;
// The initial of the name, in upper case; empty without a cached name
const INITIAL = sql`upper(substr(coalesce(sm.name, mm.name, ''), 1, 1))`;

type Title = { mediaType: MediaType; tmdbId: string };

/**
 * The lists the pages show a user: the titles of the user's list, each with
 * what the library and the user's requests have of it, and the torrents
 * that are downloading
 */
@Injectable()
export class CatalogService {
  constructor(
    private readonly em: EntityManager,
    private readonly metadataService: MetadataService,
    private readonly playStatesService: PlayStatesService,
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
