import { RequestContext } from '@mikro-orm/core';
import { MikroORM } from '@mikro-orm/sqlite';
import {
  Letter,
  MediaType,
  MediaTypeFull,
  OrderDirection,
} from '../common/common.dto.js';
import { CleanupSchedule } from '../library/library.dto.js';
import { LibraryService } from '../library/library.service.js';
import { MediaFile } from '../library/media-file.entity.js';
import { RequestBinding } from '../library/request-binding.entity.js';
import { MovieMetadata, SeriesMetadata } from '../metadata/metadata.entity.js';
import { MetadataService } from '../metadata/metadata.service.js';
import { TmdbMovieFull, TmdbSeriesFull } from '../metadata/tmdb/tmdb.dto.js';
import mikroOrmConfig from '../mikro-orm.config.js';
import { MediaRequest } from '../requests/request.entity.js';
import { RequestsService } from '../requests/requests.service.js';
import { MyListItem } from '../user-data/my-list/my-list-item.entity.js';
import { PlayState } from '../user-data/play-state/play-state.entity.js';
import { PlayStatesService } from '../user-data/play-state/play-states.service.js';
import { User } from '../users/user.entity.js';
import {
  LibraryOrder,
  LibraryStatus,
  MyListOrder,
  MyListStatus,
} from './catalog.dto.js';
import { CatalogService } from './catalog.service.js';

describe('CatalogService', () => {
  let orm: MikroORM;
  let catalog: CatalogService;
  let playStates: PlayStatesService;
  let userId: string;

  // Movies and series have separate id ranges on TMDB that overlap
  const SERIES = {
    id: 1,
    name: 'Series',
    first_air_date: '2020-01-01',
    last_air_date: '2020-01-08',
    last_episode_to_air: { season_number: 1, episode_number: 2 },
    seasons: [],
  } as TmdbSeriesFull;
  const ANOTHER_SERIES = {
    ...SERIES,
    id: 2,
    name: 'Another',
    first_air_date: '2021-01-01',
    last_air_date: '2021-01-08',
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
    options: { managed?: boolean; lastEpisode?: number } = {},
  ) => {
    const row = new MediaFile();
    row.path = `/tv/${mediaType}-${tmdbId}-${episode}.mkv`;
    row.mediaType = mediaType;
    row.tmdbId = tmdbId;
    row.season = episode ? 1 : 0;
    row.episode = episode;
    row.lastEpisode = options.lastEpisode ?? episode;
    row.size = 1;
    row.modifiedAt = createdAt;
    row.createdAt = createdAt;
    row.managed = options.managed ?? false;
    return insert(row);
  };
  const request = (tmdbId: string, mediaType: MediaTypeFull, episode = 0) => {
    const row = new MediaRequest();
    row.userId = userId;
    row.tmdbId = tmdbId;
    row.mediaType = mediaType;
    row.season = episode ? 1 : 0;
    row.episode = episode;
    return insert(row);
  };
  const listed = (mediaType: MediaType, tmdbId: string) => {
    const row = new MyListItem();
    row.userId = userId;
    row.tmdbId = tmdbId;
    row.mediaType = mediaType;
    return insert(row);
  };
  const library = (
    options: {
      mediaType?: MediaType;
      status?: LibraryStatus;
      letter?: Letter;
      order?: LibraryOrder;
      direction?: OrderDirection;
      page?: number;
      itemsPerPage?: number;
    } = {},
  ) =>
    RequestContext.create(orm.em, () =>
      catalog.findLibraryTitles(userId, {
        mediaType: options.mediaType,
        status: options.status,
        letter: options.letter,
        order: options.order ?? LibraryOrder.DateAdded,
        direction: options.direction,
        pagination: {
          page: options.page ?? 1,
          itemsPerPage: options.itemsPerPage ?? 10,
        },
      }),
    );
  const myList = (
    options: {
      mediaType?: MediaType;
      status?: MyListStatus;
      letter?: Letter;
      order?: MyListOrder;
      direction?: OrderDirection;
    } = {},
  ) =>
    RequestContext.create(orm.em, () =>
      catalog.findMyList(userId, {
        mediaType: options.mediaType,
        status: options.status,
        letter: options.letter,
        order: options.order ?? MyListOrder.Name,
        direction: options.direction,
        pagination: { page: 1, itemsPerPage: 10 },
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
    user.password = '';
    userId = (await insert(user)).id;
    await insert(SeriesMetadata.from(SERIES));
    await insert(SeriesMetadata.from(ANOTHER_SERIES));
    await insert(MovieMetadata.from(MOVIE));
    await insert(MovieMetadata.from(ANOTHER_MOVIE));

    playStates = new PlayStatesService(
      orm.em.getRepository(PlayState),
      orm.em,
      { applyRule: async () => {} } as unknown as RequestsService,
    );
    catalog = new CatalogService(
      orm.em,
      new MetadataService(
        orm.em.getRepository(MovieMetadata),
        orm.em.getRepository(SeriesMetadata),
        orm.em,
        undefined,
      ),
      playStates,
      {
        getSettings: async () => ({ cleanup: CleanupSchedule.Daily }),
      } as unknown as LibraryService,
    );

    // The series: a managed file the user's request holds, and a file of two
    // episodes; the movie: an external file; the other series: a managed file
    // nobody holds; the other movie: nothing
    const held = await file(
      MediaType.Series,
      '1',
      1,
      new Date('2026-01-01T00:00:00Z'),
      { managed: true },
    );
    await file(MediaType.Series, '1', 2, new Date('2026-01-03T00:00:00Z'), {
      lastEpisode: 3,
    });
    const { id } = await request('1', MediaTypeFull.Episode, 1);
    const binding = new RequestBinding();
    binding.requestId = id;
    binding.mediaFileId = held.id;
    await insert(binding);
    await file(MediaType.Movie, '1', 0, new Date('2026-01-02T00:00:00Z'));
    await file(MediaType.Series, '2', 1, new Date('2026-01-04T00:00:00Z'), {
      managed: true,
    });
  });

  afterEach(() => orm.close());

  describe('the library', () => {
    it('lists each title with files once, newest file first, with whether the user requested it', async () => {
      const { items, total } = await library();

      expect(total).toBe(3);
      expect(names({ items })).toEqual(['Another', 'Series', 'Movie']);
      expect(items.map((item) => item.requested)).toEqual([false, true, false]);
      expect(items[1]).toMatchObject({
        mediaType: MediaType.Series,
        tmdbId: '1',
      });
    });

    it('counts the episodes on disk, and dates the cleanup of a title nobody holds', async () => {
      const { items } = await library({ order: LibraryOrder.Name });
      const [another, movie, series] = items;

      // A file of two episodes counts both
      expect(series.available).toBe(3);
      expect(movie.available).toBe(1);
      expect(another.available).toBe(1);

      // Managed and held, and external, stay; managed and unheld goes at 4 in the morning
      expect(series.cleanupAt).toBeUndefined();
      expect(movie.cleanupAt).toBeUndefined();
      expect(new Date(another.cleanupAt).getHours()).toBe(4);
      expect(Date.parse(another.cleanupAt)).toBeGreaterThan(Date.now());
    });

    it('separates the titles the user requested from the rest', async () => {
      expect(names(await library({ status: LibraryStatus.Requested }))).toEqual(
        ['Series'],
      );
      expect(
        names(await library({ status: LibraryStatus.Unrequested })),
      ).toEqual(['Another', 'Movie']);
    });

    it('orders by name and by release, in either direction, and filters by type', async () => {
      expect(names(await library({ order: LibraryOrder.Name }))).toEqual([
        'Another',
        'Movie',
        'Series',
      ]);
      expect(
        names(
          await library({
            order: LibraryOrder.Name,
            direction: OrderDirection.Desc,
          }),
        ),
      ).toEqual(['Series', 'Movie', 'Another']);
      expect(
        names(await library({ order: LibraryOrder.FirstReleaseDate })),
      ).toEqual(['Another', 'Movie', 'Series']);
      expect(names(await library({ mediaType: MediaType.Movie }))).toEqual([
        'Movie',
      ]);
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

      const page = await library({ page: 2, itemsPerPage: 2 });
      expect(page).toMatchObject({ total: 3, page: 2, itemsPerPage: 2 });
      expect(names(page)).toEqual(['Movie']);
      expect(page.items[0].lastPlayState).toMatchObject({
        mediaType: MediaTypeFull.Movie,
        progress: 0.5,
      });

      const { items } = await library();
      expect(items[1].lastPlayState).toMatchObject({
        mediaType: MediaTypeFull.Episode,
        episode: 1,
        progress: 0.2,
      });
      expect(items[0].lastPlayState).toBeUndefined();
    });

    it('filters by the first letter of the name, # for the names that start with none', async () => {
      await insert(
        SeriesMetadata.from({ ...SERIES, id: 3, name: '24' } as TmdbSeriesFull),
      );
      await insert(
        MovieMetadata.from({
          ...MOVIE,
          id: 3,
          title: 'zodiac',
        } as TmdbMovieFull),
      );
      await file(MediaType.Series, '3', 1, new Date('2026-01-05T00:00:00Z'));
      await file(MediaType.Movie, '3', 0, new Date('2026-01-06T00:00:00Z'));

      const another = await library({ letter: 'A' });
      expect(names(another)).toEqual(['Another']);
      expect(another.total).toBe(1);
      expect(names(await library({ letter: 'Z' }))).toEqual(['zodiac']);
      expect(names(await library({ letter: '#' }))).toEqual(['24']);
      expect(await library({ letter: 'B' })).toMatchObject({ total: 0 });
    });
  });

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
});
