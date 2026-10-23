import { RequestContext } from '@mikro-orm/core';
import { MikroORM } from '@mikro-orm/sqlite';
import {
  MediaType,
  MediaTypeFull,
  OrderDirection,
} from '../common/common.dto.js';
import { MovieMetadata, SeriesMetadata } from '../metadata/metadata.entity.js';
import { MetadataService } from '../metadata/metadata.service.js';
import { TmdbMovieFull, TmdbSeriesFull } from '../metadata/tmdb/tmdb.dto.js';
import mikroOrmConfig from '../mikro-orm.config.js';
import { MediaRequest } from '../requests/request.entity.js';
import { RequestsService } from '../requests/requests.service.js';
import { PlayState } from '../user-data/play-state/play-state.entity.js';
import { PlayStatesService } from '../user-data/play-state/play-states.service.js';
import { User } from '../users/user.entity.js';
import { CatalogService } from './catalog.service.js';
import { LibraryTitlesOrder, LibraryTitlesStatus } from './library.dto.js';
import { MediaFile } from './media-file.entity.js';

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
  ) => {
    const row = new MediaFile();
    row.path = `/tv/${mediaType}-${tmdbId}-${episode}.mkv`;
    row.mediaType = mediaType;
    row.tmdbId = tmdbId;
    row.season = episode ? 1 : 0;
    row.episode = episode;
    row.size = 1;
    row.modifiedAt = createdAt;
    row.createdAt = createdAt;
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
  const titles = (
    options: {
      mediaType?: MediaType;
      status?: LibraryTitlesStatus;
      order?: LibraryTitlesOrder;
      direction?: OrderDirection;
      page?: number;
      itemsPerPage?: number;
    } = {},
  ) =>
    RequestContext.create(orm.em, () =>
      catalog.findTitles(userId, {
        mediaType: options.mediaType,
        status: options.status,
        order: options.order ?? LibraryTitlesOrder.DateAdded,
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
    user.password = '';
    userId = (await insert(user)).id;
    await insert(SeriesMetadata.from(SERIES));
    await insert(SeriesMetadata.from(ANOTHER_SERIES));
    await insert(MovieMetadata.from(MOVIE));

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
    );

    // The series: two files, requested by the user; the movie and the other series: files, no requests
    await file(MediaType.Series, '1', 1, new Date('2026-01-01T00:00:00Z'));
    await file(MediaType.Series, '1', 2, new Date('2026-01-03T00:00:00Z'));
    await request('1', MediaTypeFull.Episode, 1);
    await file(MediaType.Movie, '1', 0, new Date('2026-01-02T00:00:00Z'));
    await file(MediaType.Series, '2', 1, new Date('2026-01-04T00:00:00Z'));
  });

  afterEach(() => orm.close());

  it('lists each title with files once, newest file first, with whether the user requested it', async () => {
    const { items, total } = await titles();

    expect(total).toBe(3);
    expect(names({ items })).toEqual(['Another', 'Series', 'Movie']);
    expect(items.map((item) => item.requested)).toEqual([false, true, false]);
    expect(items[1]).toMatchObject({
      mediaType: MediaType.Series,
      tmdbId: '1',
    });
  });

  it('separates the titles the user requested from the rest', async () => {
    expect(
      names(await titles({ status: LibraryTitlesStatus.Requested })),
    ).toEqual(['Series']);
    expect(
      names(await titles({ status: LibraryTitlesStatus.Unrequested })),
    ).toEqual(['Another', 'Movie']);
  });

  it('orders by name and by release, in either direction, and filters by type', async () => {
    expect(names(await titles({ order: LibraryTitlesOrder.Name }))).toEqual([
      'Another',
      'Movie',
      'Series',
    ]);
    expect(
      names(
        await titles({
          order: LibraryTitlesOrder.Name,
          direction: OrderDirection.Desc,
        }),
      ),
    ).toEqual(['Series', 'Movie', 'Another']);
    expect(
      names(await titles({ order: LibraryTitlesOrder.FirstReleaseDate })),
    ).toEqual(['Another', 'Movie', 'Series']);
    expect(names(await titles({ mediaType: MediaType.Movie }))).toEqual([
      'Movie',
    ]);
  });

  it('pages, and gives each title the play state played last', async () => {
    await RequestContext.create(orm.em, () =>
      playStates.updateOrCreateMoviePlayState(userId, '1', { progress: 0.5 }),
    );
    await RequestContext.create(orm.em, () =>
      playStates.updateOrCreateEpisodePlayState(userId, '1', 1, 1, {
        progress: 0.2,
      }),
    );

    const page = await titles({ page: 2, itemsPerPage: 2 });
    expect(page).toMatchObject({ total: 3, page: 2, itemsPerPage: 2 });
    expect(names(page)).toEqual(['Movie']);
    expect(page.items[0].lastPlayState).toMatchObject({
      mediaType: MediaTypeFull.Movie,
      progress: 0.5,
    });

    const { items } = await titles();
    expect(items[1].lastPlayState).toMatchObject({
      mediaType: MediaTypeFull.Episode,
      episode: 1,
      progress: 0.2,
    });
    expect(items[0].lastPlayState).toBeUndefined();
  });
});
