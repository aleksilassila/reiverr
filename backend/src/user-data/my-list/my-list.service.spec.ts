import { RequestContext } from '@mikro-orm/core';
import { MikroORM } from '@mikro-orm/sqlite';
import { MediaType } from '../../common/common.dto.js';
import {
  MovieMetadata,
  SeriesMetadata,
} from '../../metadata/metadata.entity.js';
import { MetadataService } from '../../metadata/metadata.service.js';
import { TmdbMovieFull, TmdbSeriesFull } from '../../metadata/tmdb/tmdb.dto.js';
import mikroOrmConfig from '../../mikro-orm.config.js';
import { User } from '../../users/user.entity.js';
import { PlayState } from '../play-state/play-state.entity.js';
import { RequestsService } from '../../requests/requests.service.js';
import { PlayStatesService } from '../play-state/play-states.service.js';
import { MyListStatusFilter } from './my-list.dto.js';
import { MyListItem } from './my-list-item.entity.js';
import { MyListService } from './my-list.service.js';

// Movies and series have separate id ranges on TMDB that overlap
const TMDB_ID = '1';

const MOVIE = {
  id: 1,
  title: 'Movie',
  release_date: '2020-01-01',
} as TmdbMovieFull;

const SERIES = {
  id: 1,
  name: 'Series',
  first_air_date: '2020-01-01',
  last_air_date: '2020-01-08',
  last_episode_to_air: { season_number: 1, episode_number: 2 },
  seasons: [],
} as TmdbSeriesFull;

describe('MyListService', () => {
  let orm: MikroORM;
  let library: MyListService;
  let playStates: PlayStatesService;
  let userId: string;

  // Every call gets its own entity manager, as every HTTP request does
  const request = <T>(run: () => Promise<T>) =>
    RequestContext.create(orm.em, run);

  const getMyList = (status?: MyListStatusFilter) =>
    request(() =>
      library.getMyList({
        userId,
        pagination: { page: 1, itemsPerPage: 10 },
        status,
      }),
    );

  beforeEach(async () => {
    orm = await MikroORM.init({ ...mikroOrmConfig, dbName: ':memory:' });
    await orm.migrator.up();

    const user = new User();
    user.name = 'user';
    user.password = '';
    await orm.em.fork().insert(user);
    userId = user.id;

    await orm.em.fork().insert(MovieMetadata.from(MOVIE));
    await orm.em.fork().insert(SeriesMetadata.from(SERIES));

    const myListItems = orm.em.getRepository(MyListItem);
    const playStateRows = orm.em.getRepository(PlayState);

    playStates = new PlayStatesService(
      orm.em.getRepository(PlayState),
      orm.em,
      { applyRules: async () => {} } as unknown as RequestsService,
    );
    library = new MyListService(
      myListItems,
      playStateRows,
      orm.em,
      new MetadataService(
        orm.em.getRepository(MovieMetadata),
        orm.em.getRepository(SeriesMetadata),
        orm.em,
        undefined,
      ),
    );

    for (const mediaType of [MediaType.Series, MediaType.Movie]) {
      await request(() =>
        library.findOrCreateByTmdbId(userId, TMDB_ID, mediaType),
      );
    }
  });

  afterEach(() => orm.close());

  it('keeps a movie and a series with the same TMDB id apart', async () => {
    const find = (mediaType: MediaType) =>
      request(() => library.findByTmdbId(userId, TMDB_ID, mediaType));

    expect((await find(MediaType.Movie)).mediaType).toBe(MediaType.Movie);
    expect((await find(MediaType.Series)).mediaType).toBe(MediaType.Series);

    await request(() =>
      library.deleteByTmdbId(userId, TMDB_ID, MediaType.Movie),
    );

    expect(await find(MediaType.Movie)).toBeNull();
    expect(await find(MediaType.Series)).not.toBeNull();
  });

  it('lists each title with its own metadata and play states', async () => {
    await request(() =>
      playStates.updateOrCreateEpisodePlayState(userId, TMDB_ID, 1, 1, {
        watched: true,
      }),
    );
    await request(() =>
      playStates.updateOrCreateMoviePlayState(userId, TMDB_ID, {
        progress: 0.5,
      }),
    );

    const list = await getMyList();
    const movie = list.items.find((i) => i.mediaType === MediaType.Movie);
    const series = list.items.find((i) => i.mediaType === MediaType.Series);

    expect(list.total).toBe(2);
    expect(movie.tmdbItem.title).toBe('Movie');
    expect(series.tmdbItem.name).toBe('Series');
    expect(movie.playStates).toMatchObject([{ mediaType: 'movie' }]);
    expect(series.playStates).toMatchObject([
      { mediaType: 'episode', season: 1, episode: 1 },
    ]);
  });

  it('does not count a watched episode as a watched movie', async () => {
    await request(() =>
      playStates.updateOrCreateEpisodePlayState(userId, TMDB_ID, 1, 1, {
        watched: true,
      }),
    );

    expect((await getMyList(MyListStatusFilter.Watched)).items).toEqual([]);

    await request(() =>
      playStates.updateOrCreateEpisodePlayState(userId, TMDB_ID, 1, 2, {
        watched: true,
      }),
    );

    const watched = await getMyList(MyListStatusFilter.Watched);
    expect(watched.items.map((i) => i.mediaType)).toEqual([MediaType.Series]);
  });
});
