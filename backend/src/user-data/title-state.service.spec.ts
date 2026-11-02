import { RequestContext } from '@mikro-orm/core';
import { MikroORM } from '@mikro-orm/sqlite';
import { MediaType } from '../common/common.dto.js';
import { MovieMetadata, SeriesMetadata } from '../metadata/metadata.entity.js';
import { MetadataService } from '../metadata/metadata.service.js';
import { TmdbMovieFull, TmdbSeriesFull } from '../metadata/tmdb/tmdb.dto.js';
import mikroOrmConfig from '../mikro-orm.config.js';
import { User } from '../users/user.entity.js';
import { PlayState } from './play-state.entity.js';
import { TitleState } from './title-state.entity.js';
import { TitleStateService } from './title-state.service.js';

// Movies and series have separate id ranges on TMDB that overlap
const TMDB_ID = '1';
const SERIES = {
  id: 1,
  name: 'Series',
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
const MOVIE = {
  id: 1,
  title: 'Movie',
  release_date: '2020-06-01',
} as TmdbMovieFull;

describe('TitleStateService', () => {
  let orm: MikroORM;
  let titleStates: TitleStateService;
  let userId: string;

  // Every call gets its own entity manager, as every HTTP request does
  const request = <T>(run: () => Promise<T>) =>
    RequestContext.create(orm.em, run);
  const insert = <T extends object>(entity: T) =>
    orm.em
      .fork()
      .insert(entity)
      .then(() => entity);
  const watched = (season: number, episode: number) => {
    const state = new PlayState();
    state.userId = userId;
    state.tmdbId = TMDB_ID;
    state.mediaType = MediaType.Series;
    state.season = season;
    state.episode = episode;
    state.watched = true;
    return insert(state);
  };
  const list = (mediaType: MediaType) =>
    request(() => titleStates.addToMyList(userId, TMDB_ID, mediaType));
  const state = (mediaType: MediaType) =>
    orm.em
      .fork()
      .findOneOrFail(TitleState, { userId, tmdbId: TMDB_ID, mediaType });

  beforeEach(async () => {
    orm = await MikroORM.init({ ...mikroOrmConfig, dbName: ':memory:' });
    await orm.migrator.up();

    const user = new User();
    user.name = 'user';
    user.passwordHash = '';
    userId = (await insert(user)).id;
    await insert(SeriesMetadata.from(SERIES));
    await insert(MovieMetadata.from(MOVIE));

    titleStates = new TitleStateService(
      orm.em.getRepository(TitleState),
      orm.em,
      new MetadataService(
        orm.em.getRepository(MovieMetadata),
        orm.em.getRepository(SeriesMetadata),
        orm.em,
        undefined,
      ),
    );
  });

  afterEach(() => orm.close());

  it('keeps a movie and a series with the same TMDB id apart, and keeps the row of a title taken off the list', async () => {
    await list(MediaType.Series);
    await list(MediaType.Movie);
    expect((await state(MediaType.Movie)).addedToMyListAt).toBeTruthy();

    expect(
      await request(() =>
        titleStates.removeFromMyList(userId, TMDB_ID, MediaType.Movie),
      ),
    ).toBe(true);

    expect((await state(MediaType.Movie)).addedToMyListAt).toBeNull();
    expect((await state(MediaType.Series)).addedToMyListAt).toBeTruthy();
    expect(
      await request(() =>
        titleStates.removeFromMyList(userId, TMDB_ID, MediaType.Movie),
      ),
    ).toBe(false);
  });

  it('stamps what the user would watch next when the title is listed', async () => {
    await watched(1, 1);
    await list(MediaType.Series);
    await list(MediaType.Movie);

    expect(await state(MediaType.Series)).toMatchObject({
      nextSeason: 1,
      nextEpisode: 2,
      nextAirDate: new Date('2020-01-08'),
    });
    expect(await state(MediaType.Movie)).toMatchObject({
      nextSeason: 0,
      nextEpisode: 0,
      nextAirDate: new Date('2020-06-01'),
    });
  });

  it('stamps every row again from the documents', async () => {
    await watched(1, 1);
    await watched(1, 2);
    await list(MediaType.Series);
    expect((await state(MediaType.Series)).nextSeason).toBeNull();

    // A third episode came out
    await orm.em.fork().nativeUpdate(
      SeriesMetadata,
      { tmdbId: TMDB_ID },
      {
        tmdbSeries: {
          ...SERIES,
          seasons: [
            {
              season_number: 1,
              episodes: [
                ...(SERIES.seasons?.[0].episodes ?? []),
                { episode_number: 3, air_date: '2020-01-15' },
              ],
            },
          ],
        } as TmdbSeriesFull,
      },
    );
    await titleStates.stampAll();

    expect(await state(MediaType.Series)).toMatchObject({
      nextSeason: 1,
      nextEpisode: 3,
      nextAirDate: new Date('2020-01-15'),
    });
  });
});
