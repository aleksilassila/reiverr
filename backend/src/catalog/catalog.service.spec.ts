import { RequestContext } from '@mikro-orm/core';
import { MikroORM } from '@mikro-orm/sqlite';
import { Letter, MediaType, OrderDirection } from '../common/common.dto.js';
import {
  TorrentItemStatus,
  TorrentStatus,
  TorrentWithItemsDto,
} from '../downloads/downloads.dto.js';
import { DownloadsService } from '../downloads/downloads.service.js';
import { CleanupSchedule } from '../library/library.dto.js';
import { LibraryService } from '../library/library.service.js';
import { MediaFile } from '../library/media-file.entity.js';
import { RequestBinding } from '../library/request-binding.entity.js';
import { MovieMetadata, SeriesMetadata } from '../metadata/metadata.entity.js';
import { MetadataService } from '../metadata/metadata.service.js';
import { TmdbMovieFull, TmdbSeriesFull } from '../metadata/tmdb/tmdb.dto.js';
import mikroOrmConfig from '../mikro-orm.config.js';
import { RequestRule } from '../requests/request-rule.entity.js';
import { MediaRequest } from '../requests/request.entity.js';
import { RequestsService } from '../requests/requests.service.js';
import { PlayState } from '../user-data/play-state.entity.js';
import { PlayStatesService } from '../user-data/play-states.service.js';
import { TitleState } from '../user-data/title-state.entity.js';
import { TitleStateService } from '../user-data/title-state.service.js';
import { User } from '../users/user.entity.js';
import {
  DownloadsOrder,
  DownloadsStatus,
  MyListAvailability,
  MyListOrder,
  MyListStatus,
  OnDiskOrder,
  OnDiskStatus,
} from './catalog.dto.js';
import { CatalogService } from './catalog.service.js';

describe('CatalogService', () => {
  let orm: MikroORM;
  let catalog: CatalogService;
  let playStates: PlayStatesService;
  let titleStates: TitleStateService;
  let userId: string;
  /** What the engine is downloading, as the downloads service describes it */
  let downloads: TorrentWithItemsDto[] = [];

  // Movies and series have separate id ranges on TMDB that overlap
  const SERIES = {
    id: 1,
    name: 'Series',
    first_air_date: '2020-01-01',
    last_air_date: '2020-01-08',
    seasons: [
      {
        season_number: 1,
        episodes: [
          { episode_number: 1, air_date: '2020-01-01' },
          { episode_number: 2, air_date: '2020-01-08' },
        ],
      },
    ],
  } as TmdbSeriesFull;
  // Its second episode has not aired
  const ANOTHER_SERIES = {
    ...SERIES,
    id: 2,
    name: 'Another',
    first_air_date: '2021-01-01',
    last_air_date: '2021-01-01',
    seasons: [
      {
        season_number: 1,
        episodes: [
          { episode_number: 1, air_date: '2021-01-01' },
          { episode_number: 2, air_date: '2999-01-01' },
        ],
      },
    ],
  } as TmdbSeriesFull;
  const MOVIE = {
    id: 1,
    title: 'Movie',
    release_date: '2020-06-01',
  } as TmdbMovieFull;
  const ANOTHER_MOVIE = {
    id: 2,
    title: 'Another Movie',
    release_date: '2021-06-01',
  } as TmdbMovieFull;

  const insert = <T extends object>(entity: T) =>
    orm.em
      .fork()
      .insert(entity)
      .then(() => entity);
  const file = (
    mediaType: MediaType,
    tmdbId: string,
    episode: number,
    createdAt: Date,
    options: { managed?: boolean; lastEpisode?: number; size?: number } = {},
  ) => {
    const row = new MediaFile();
    row.path = `/tv/${mediaType}-${tmdbId}-${episode}-${options.size ?? 1}.mkv`;
    row.mediaType = mediaType;
    row.tmdbId = tmdbId;
    row.season = episode ? 1 : 0;
    row.episode = episode;
    row.lastEpisode = options.lastEpisode ?? episode;
    row.size = options.size ?? 1;
    row.modifiedAt = createdAt;
    row.createdAt = createdAt;
    row.managed = options.managed ?? false;
    return insert(row);
  };
  const request = (tmdbId: string, mediaType: MediaType, episode = 0) => {
    const row = new MediaRequest();
    row.userId = userId;
    row.tmdbId = tmdbId;
    row.mediaType = mediaType;
    row.season = episode ? 1 : 0;
    row.episode = episode;
    return insert(row);
  };
  const bind = (
    requestId: string,
    to: Pick<RequestBinding, 'mediaFileId' | 'torrentItemId' | 'pendingBytes'>,
  ) => {
    const row = new RequestBinding();
    row.requestId = requestId;
    Object.assign(row, to);
    return insert(row);
  };
  const listed = (mediaType: MediaType, tmdbId: string) =>
    RequestContext.create(orm.em, () =>
      titleStates.addToMyList(userId, tmdbId, mediaType),
    );
  const myList = (
    options: {
      mediaType?: MediaType;
      status?: MyListStatus;
      availability?: MyListAvailability;
      letter?: Letter;
      order?: MyListOrder;
      direction?: OrderDirection;
      page?: number;
      itemsPerPage?: number;
    } = {},
  ) =>
    RequestContext.create(orm.em, () =>
      catalog.findMyList(userId, {
        mediaType: options.mediaType,
        status: options.status,
        availability: options.availability,
        letter: options.letter,
        order: options.order ?? MyListOrder.Name,
        direction: options.direction,
        pagination: {
          page: options.page ?? 1,
          itemsPerPage: options.itemsPerPage ?? 10,
        },
      }),
    );
  const names = ({
    items,
  }: {
    items: { tmdbItem: { name?: string; title?: string } }[];
  }) => items.map((item) => item.tmdbItem.name ?? item.tmdbItem.title);

  beforeEach(async () => {
    orm = await MikroORM.init({ ...mikroOrmConfig, dbName: ':memory:' });
    await orm.migrator.up();

    const user = new User();
    user.name = 'user';
    user.passwordHash = '';
    userId = (await insert(user)).id;
    await insert(SeriesMetadata.from(SERIES));
    await insert(SeriesMetadata.from(ANOTHER_SERIES));
    await insert(MovieMetadata.from(MOVIE));
    await insert(MovieMetadata.from(ANOTHER_MOVIE));

    const metadata = new MetadataService(
      orm.em.getRepository(MovieMetadata),
      orm.em.getRepository(SeriesMetadata),
      orm.em,
      undefined,
    );
    titleStates = new TitleStateService(
      orm.em.getRepository(TitleState),
      orm.em,
      metadata,
    );
    playStates = new PlayStatesService(
      orm.em.getRepository(PlayState),
      orm.em,
      { applyRule: async () => {} } as unknown as RequestsService,
      titleStates,
    );
    catalog = new CatalogService(
      orm.em,
      metadata,
      playStates,
      {
        getSettings: async () => ({ cleanup: CleanupSchedule.Daily }),
      } as unknown as LibraryService,
      {
        describeDownloads: async () => downloads,
      } as unknown as DownloadsService,
    );

    // The series: a managed file the user's request holds, and a file of two
    // episodes; the movie: an external file; the other series: a managed file
    // nobody holds; the other movie: nothing
    const held = await file(
      MediaType.Series,
      '1',
      1,
      new Date('2026-01-01T00:00:00Z'),
      { managed: true, size: 100 },
    );
    await file(MediaType.Series, '1', 2, new Date('2026-01-02T00:00:00Z'), {
      lastEpisode: 3,
      size: 200,
    });
    const { id } = await request('1', MediaType.Series, 1);
    await bind(id, { mediaFileId: held.id });
    await file(MediaType.Movie, '1', 0, new Date('2026-01-03T00:00:00Z'), {
      size: 400,
    });
    await file(MediaType.Series, '2', 1, new Date('2026-01-04T00:00:00Z'), {
      managed: true,
      size: 50,
    });
  });

  afterEach(() => orm.close());

  describe('the my list', () => {
    beforeEach(async () => {
      await listed(MediaType.Series, '1');
      await listed(MediaType.Movie, '1');
      await listed(MediaType.Movie, '2');
    });

    it('lists the titles of the list with what the library and the requests have of them', async () => {
      const { items, total } = await myList();

      expect(total).toBe(3);
      expect(names({ items })).toEqual(['Another Movie', 'Movie', 'Series']);
      const [anotherMovie, movie, series] = items;
      expect(series).toMatchObject({ requested: true, available: 3 });
      expect(movie).toMatchObject({ requested: false, available: 1 });
      // A title without files has nothing to clean up
      expect(anotherMovie).toMatchObject({ requested: false, available: 0 });
      expect(anotherMovie.cleanupAt).toBeUndefined();
    });

    it('dates the cleanup of a title whose files nobody holds', async () => {
      await listed(MediaType.Series, '2');
      const { items } = await myList({ mediaType: MediaType.Series });
      const [another, series] = items;

      // Managed and held, and external, stay; managed and unheld goes at 4 in the morning
      expect(series.cleanupAt).toBeUndefined();
      expect(new Date(another.cleanupAt).getHours()).toBe(4);
      expect(Date.parse(another.cleanupAt)).toBeGreaterThan(Date.now());
    });

    it('pages, and gives each title the play state played last', async () => {
      await RequestContext.create(orm.em, () =>
        playStates.updateOrCreateMoviePlayState(userId, '1', {
          progress: 0.5,
        }),
      );
      await RequestContext.create(orm.em, () =>
        playStates.updateOrCreateEpisodePlayState(userId, '1', 1, 1, {
          progress: 0.2,
        }),
      );

      const page = await myList({ page: 2, itemsPerPage: 2 });
      expect(page).toMatchObject({ total: 3, page: 2, itemsPerPage: 2 });
      expect(names(page)).toEqual(['Series']);
      expect(page.items[0].lastPlayState).toMatchObject({
        mediaType: MediaType.Series,
        episode: 1,
        progress: 0.2,
      });

      const { items } = await myList();
      expect(items[1].lastPlayState).toMatchObject({
        mediaType: MediaType.Movie,
        progress: 0.5,
      });
      expect(items[0].lastPlayState).toBeUndefined();
    });

    it('does not count a watched episode as a watched movie', async () => {
      await RequestContext.create(orm.em, () =>
        playStates.updateOrCreateEpisodePlayState(userId, '1', 1, 1, {
          watched: true,
        }),
      );

      expect((await myList({ status: MyListStatus.Watched })).items).toEqual(
        [],
      );

      await RequestContext.create(orm.em, () =>
        playStates.updateOrCreateEpisodePlayState(userId, '1', 1, 2, {
          watched: true,
        }),
      );

      expect(names(await myList({ status: MyListStatus.Watched }))).toEqual([
        'Series',
      ]);
      expect(names(await myList({ status: MyListStatus.Unwatched }))).toEqual([
        'Another Movie',
        'Movie',
      ]);
    });

    it('tells the next episode of a series and whether it is on disk', async () => {
      const next = async () =>
        (await myList({ mediaType: MediaType.Series })).items[0].nextEpisode;

      expect(await next()).toEqual({
        season: 1,
        episode: 1,
        airDate: '2020-01-01T00:00:00.000Z',
        onDisk: true,
      });

      await RequestContext.create(orm.em, () =>
        playStates.updateOrCreateEpisodePlayState(userId, '1', 1, 1, {
          watched: true,
        }),
      );

      expect(await next()).toMatchObject({
        season: 1,
        episode: 2,
        onDisk: true,
      });
      // A movie has none
      expect(
        (await myList({ mediaType: MediaType.Movie })).items[0].nextEpisode,
      ).toBeUndefined();
    });

    it('keeps a series whose next episode has not aired among the watched', async () => {
      await listed(MediaType.Series, '2');
      await RequestContext.create(orm.em, () =>
        playStates.updateOrCreateEpisodePlayState(userId, '2', 1, 1, {
          watched: true,
        }),
      );

      expect(names(await myList({ status: MyListStatus.Unwatched }))).toEqual([
        'Another Movie',
        'Movie',
        'Series',
      ]);
      const { items } = await myList({ status: MyListStatus.Watched });
      expect(names({ items })).toEqual(['Another']);
      expect(items[0].nextEpisode).toEqual({
        season: 1,
        episode: 2,
        airDate: '2999-01-01T00:00:00.000Z',
        onDisk: false,
      });
    });

    it('filters by whether what the user would watch next is on disk', async () => {
      // The next episode of the series and the movie have files; the other movie has none
      expect(
        names(await myList({ availability: MyListAvailability.Available })),
      ).toEqual(['Movie', 'Series']);
      expect(
        names(await myList({ availability: MyListAvailability.Unavailable })),
      ).toEqual(['Another Movie']);

      // With everything watched, anything of the title on disk counts
      await RequestContext.create(orm.em, () =>
        playStates.updateOrCreateSeriesPlayStates(userId, '1', [
          { season: 1, episode: 1, watched: true },
          { season: 1, episode: 2, watched: true },
        ]),
      );
      expect(
        names(
          await myList({
            status: MyListStatus.Watched,
            availability: MyListAvailability.Available,
          }),
        ),
      ).toEqual(['Series']);
    });

    it('orders by when the user last played, and continues what was played lately', async () => {
      await RequestContext.create(orm.em, () =>
        playStates.updateOrCreateMoviePlayState(userId, '1', {
          progress: 0.5,
        }),
      );

      const { items } = await myList({ order: MyListOrder.LastPlayed });
      expect(names({ items })[0]).toBe('Movie');
      expect(items[0].lastPlayState).toMatchObject({ progress: 0.5 });

      expect(
        names(await myList({ status: MyListStatus.ContinueWatching })),
      ).toEqual(['Movie']);
    });

    it('filters by the first letter of the name', async () => {
      await insert(
        MovieMetadata.from({
          ...MOVIE,
          id: 3,
          title: '12 Angry Men',
        } as TmdbMovieFull),
      );
      await listed(MediaType.Movie, '3');

      expect(names(await myList({ letter: 'M' }))).toEqual(['Movie']);
      expect(names(await myList({ letter: '#' }))).toEqual(['12 Angry Men']);
      expect(names(await myList({ letter: 'A' }))).toEqual(['Another Movie']);
    });
  });

  describe('the downloads', () => {
    const torrent = (
      infoHash: string,
      name: string,
      addedAt: string,
      items: {
        id: string;
        mediaType: MediaType;
        tmdbId: string;
        season: number;
        episode: number;
        released?: boolean;
      }[],
      live: Partial<
        Pick<
          TorrentWithItemsDto,
          'status' | 'wantedBytes' | 'progress' | 'peers' | 'downloadSpeed'
        >
      > = {},
    ): TorrentWithItemsDto => ({
      infoHash,
      title: name,
      indexer: 'Fake',
      size: 0,
      downloadedBytes: 0,
      uploadedBytes: 0,
      wantedBytes: 0,
      progress: 0,
      addedAt,
      status: TorrentStatus.Downloading,
      peers: 0,
      downloadSpeed: 0,
      uploadSpeed: 0,
      ...live,
      items: items.map((item) => ({
        id: item.id,
        infoHash,
        mediaType: item.mediaType,
        tmdbId: item.tmdbId,
        season: item.season,
        episode: item.episode,
        status: item.released
          ? TorrentItemStatus.Released
          : TorrentItemStatus.Downloading,
      })),
    });
    const list = (
      options: {
        mediaType?: MediaType;
        status?: DownloadsStatus;
        letter?: Letter;
        order?: DownloadsOrder;
        direction?: OrderDirection;
      } = {},
    ) =>
      RequestContext.create(orm.em, () =>
        catalog.findDownloads(userId, {
          mediaType: options.mediaType,
          status: options.status,
          letter: options.letter,
          order: options.order ?? DownloadsOrder.Size,
          direction: options.direction,
        }),
      );

    beforeEach(async () => {
      // A season pack of the series with a released episode, the movie's torrent not started yet, and one of the other series
      downloads = [
        torrent(
          'pack',
          'Series.S01.1080p',
          '2026-02-01T00:00:00.000Z',
          [
            {
              id: 'item-1',
              mediaType: MediaType.Series,
              tmdbId: '1',
              season: 1,
              episode: 1,
            },
            {
              id: 'item-2',
              mediaType: MediaType.Series,
              tmdbId: '1',
              season: 1,
              episode: 2,
            },
            {
              id: 'item-3',
              mediaType: MediaType.Series,
              tmdbId: '1',
              season: 1,
              episode: 3,
              released: true,
            },
          ],
          { wantedBytes: 1000, progress: 0.5, peers: 3, downloadSpeed: 100 },
        ),
        torrent(
          'movie',
          'Movie.2020.1080p',
          '2026-02-03T00:00:00.000Z',
          [
            {
              id: 'item-m',
              mediaType: MediaType.Movie,
              tmdbId: '1',
              season: 0,
              episode: 0,
            },
          ],
          { status: TorrentStatus.Starting, wantedBytes: 2000 },
        ),
        torrent(
          'another',
          'Another.S01E01',
          '2026-02-02T00:00:00.000Z',
          [
            {
              id: 'item-a',
              mediaType: MediaType.Series,
              tmdbId: '2',
              season: 1,
              episode: 1,
            },
          ],
          { wantedBytes: 500 },
        ),
      ];
      // The user's request for the second episode waits for the pack
      const { id } = await request('1', MediaType.Series, 2);
      const binding = new RequestBinding();
      binding.requestId = id;
      binding.torrentItemId = 'item-2';
      await insert(binding);
    });

    afterEach(() => {
      downloads = [];
    });

    it('lists every download with its title, its episodes and whether the user waits for it, largest first', async () => {
      const items = await list();

      expect(names({ items })).toEqual(['Movie', 'Series', 'Another']);
      expect(items[0]).toMatchObject({
        infoHash: 'movie',
        mediaType: MediaType.Movie,
        tmdbId: '1',
        name: 'Movie.2020.1080p',
        episodes: [{ season: 0, episode: 0 }],
        status: TorrentStatus.Starting,
        size: 2000,
        progress: 0,
        requested: false,
      });
      // The released episode is not downloaded
      expect(items[1]).toMatchObject({
        infoHash: 'pack',
        mediaType: MediaType.Series,
        tmdbId: '1',
        episodes: [
          { season: 1, episode: 1 },
          { season: 1, episode: 2 },
        ],
        status: TorrentStatus.Downloading,
        size: 1000,
        progress: 0.5,
        peers: 3,
        downloadSpeed: 100,
        requested: true,
      });
      expect(items[2].requested).toBe(false);
    });

    it('lists only the downloads the user waits for with the status', async () => {
      expect(
        names({ items: await list({ status: DownloadsStatus.Requested }) }),
      ).toEqual(['Series']);
    });

    it('sorts by name and by when the torrent was added, in either direction, and filters by type and letter', async () => {
      expect(
        names({ items: await list({ order: DownloadsOrder.Name }) }),
      ).toEqual(['Another', 'Movie', 'Series']);
      expect(
        names({ items: await list({ order: DownloadsOrder.Added }) }),
      ).toEqual(['Movie', 'Another', 'Series']);
      expect(
        names({
          items: await list({
            order: DownloadsOrder.Added,
            direction: OrderDirection.Asc,
          }),
        }),
      ).toEqual(['Series', 'Another', 'Movie']);
      expect(
        names({ items: await list({ direction: OrderDirection.Asc }) }),
      ).toEqual(['Another', 'Series', 'Movie']);
      expect(
        names({ items: await list({ mediaType: MediaType.Movie }) }),
      ).toEqual(['Movie']);
      expect(names({ items: await list({ letter: 'A' }) })).toEqual([
        'Another',
      ]);
      expect(await list({ letter: 'B' })).toEqual([]);
    });
  });

  describe('the titles on disk', () => {
    const onDisk = (
      options: {
        mediaType?: MediaType;
        status?: OnDiskStatus;
        letter?: Letter;
        order?: OnDiskOrder;
        direction?: OrderDirection;
        page?: number;
        itemsPerPage?: number;
      } = {},
    ) =>
      RequestContext.create(orm.em, () =>
        catalog.findOnDisk(userId, {
          mediaType: options.mediaType,
          status: options.status,
          letter: options.letter,
          order: options.order ?? OnDiskOrder.Size,
          direction: options.direction,
          pagination: {
            page: options.page ?? 1,
            itemsPerPage: options.itemsPerPage ?? 10,
          },
        }),
      );

    beforeEach(async () => {
      // The series: two more requests hold the file of two episodes, a fourth
      // waits for a download, and a managed second version of the first
      // episode is held by nobody, so the cleanup deletes it; the movie: its
      // file, held by a request
      const shared = await RequestContext.create(orm.em, () =>
        orm.em.findOneOrFail(MediaFile, {
          mediaType: MediaType.Series,
          tmdbId: '1',
          episode: 2,
        }),
      );
      for (const episode of [2, 3]) {
        const { id } = await request('1', MediaType.Series, episode);
        await bind(id, { mediaFileId: shared.id });
      }
      const { id: fourth } = await request('1', MediaType.Series, 4);
      await bind(fourth, { torrentItemId: 'item', pendingBytes: 50 });
      await file(MediaType.Series, '1', 1, new Date('2026-01-05T00:00:00Z'), {
        managed: true,
        size: 200,
      });
      const rule = new RequestRule();
      rule.userId = userId;
      rule.tmdbId = '1';
      rule.keepNext = 2;
      await insert(rule);

      const movieFile = await RequestContext.create(orm.em, () =>
        orm.em.findOneOrFail(MediaFile, {
          mediaType: MediaType.Movie,
          tmdbId: '1',
        }),
      );
      const { id: movie } = await request('1', MediaType.Movie);
      await bind(movie, { mediaFileId: movieFile.id });
    });

    it('lists the titles a request of the user has a file of by what they hold, largest first', async () => {
      const result = await onDisk({ status: OnDiskStatus.Requested });

      expect(result.total).toBe(2);
      expect(names(result)).toEqual(['Movie', 'Series']);
      expect(result.items[0]).toMatchObject({
        mediaType: MediaType.Movie,
        tmdbId: '1',
        files: 1,
        unretained: 0,
        diskBytes: 400,
        requests: 1,
        fulfilled: 1,
        heldBytes: 400,
      });
      expect(result.items[0].rule).toBeUndefined();
      // The file two requests hold counts once, as the usage of the user does; the version nobody holds is on disk only
      expect(result.items[1]).toMatchObject({
        mediaType: MediaType.Series,
        tmdbId: '1',
        files: 3,
        unretained: 1,
        diskBytes: 500,
        requests: 4,
        fulfilled: 3,
        heldBytes: 300,
        rule: { keepNext: 2, keepWatched: null, keepWatchedHours: null },
      });
    });

    it('lists every title with files by what they take on disk without the status', async () => {
      const result = await onDisk();

      expect(result.total).toBe(3);
      expect(names(result)).toEqual(['Series', 'Movie', 'Another']);
      // Managed and held by nobody: what the cleanup deletes
      expect(result.items[2]).toMatchObject({
        tmdbId: '2',
        files: 1,
        unretained: 1,
        diskBytes: 50,
        requests: 0,
        fulfilled: 0,
        heldBytes: 0,
      });
      expect(result.items[2].rule).toBeUndefined();
    });

    it('orders by when the newest file was indexed: of those the user holds with the status, of all without', async () => {
      expect(
        names(
          await onDisk({
            status: OnDiskStatus.Requested,
            order: OnDiskOrder.Added,
          }),
        ),
      ).toEqual(['Movie', 'Series']);
      expect(names(await onDisk({ order: OnDiskOrder.Added }))).toEqual([
        'Series',
        'Another',
        'Movie',
      ]);
    });

    it('orders by name, filters by the type of title, and pages', async () => {
      expect(names(await onDisk({ order: OnDiskOrder.Name }))).toEqual([
        'Another',
        'Movie',
        'Series',
      ]);

      const movies = await onDisk({ mediaType: MediaType.Movie });
      expect(movies.total).toBe(1);
      expect(names(movies)).toEqual(['Movie']);
      expect(movies.items[0]).toMatchObject({ requests: 1, heldBytes: 400 });

      const page = await onDisk({ page: 2, itemsPerPage: 2 });
      expect(page).toMatchObject({ total: 3, page: 2, itemsPerPage: 2 });
      expect(page.items.map((item) => item.tmdbId)).toEqual(['2']);
    });

    it('lists the titles under a letter, # for the names that start with none', async () => {
      await insert(
        SeriesMetadata.from({ ...SERIES, id: 3, name: '24' } as TmdbSeriesFull),
      );
      const { id } = await request('3', MediaType.Series, 1);
      await bind(id, {
        mediaFileId: (
          await file(MediaType.Series, '3', 1, new Date('2026-01-06T00:00:00Z'))
        ).id,
      });

      const under = await onDisk({ letter: 'A' });
      expect(names(under)).toEqual(['Another']);
      expect(under.total).toBe(1);
      expect(
        (await onDisk({ letter: 'A', status: OnDiskStatus.Requested })).total,
      ).toBe(0);
      expect(names(await onDisk({ letter: 'S' }))).toEqual(['Series']);
      expect(names(await onDisk({ letter: '#' }))).toEqual(['24']);
      expect((await onDisk({ letter: 'B' })).total).toBe(0);
    });

    it('reads each order in the other direction when asked', async () => {
      expect(names(await onDisk({ direction: OrderDirection.Asc }))).toEqual([
        'Another',
        'Movie',
        'Series',
      ]);
      expect(names(await onDisk({ direction: OrderDirection.Desc }))).toEqual([
        'Series',
        'Movie',
        'Another',
      ]);
      expect(
        names(
          await onDisk({
            order: OnDiskOrder.Name,
            direction: OrderDirection.Desc,
          }),
        ),
      ).toEqual(['Series', 'Movie', 'Another']);
      expect(
        names(
          await onDisk({
            order: OnDiskOrder.Added,
            direction: OrderDirection.Asc,
          }),
        ),
      ).toEqual(['Movie', 'Another', 'Series']);
    });
  });
});
