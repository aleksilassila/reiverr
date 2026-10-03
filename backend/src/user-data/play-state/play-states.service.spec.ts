import { RequestContext } from '@mikro-orm/core';
import { MikroORM } from '@mikro-orm/sqlite';
import { MediaType } from '../../common/common.dto.js';
import mikroOrmConfig from '../../mikro-orm.config.js';
import { User } from '../../users/user.entity.js';
import { LibraryItem } from '../library/library.entity.js';
import { PlayState } from './play-state.entity.js';
import { PlayStatesService } from './play-states.service.js';

// Movies and series have separate id ranges on TMDB that overlap
const TMDB_ID = '1';

describe('PlayStatesService', () => {
  let orm: MikroORM;
  let playStates: PlayStatesService;
  let userId: string;

  // Every call gets its own entity manager, as every HTTP request does
  const request = <T>(run: () => Promise<T>) =>
    RequestContext.create(orm.em, run);

  beforeEach(async () => {
    orm = await MikroORM.init({ ...mikroOrmConfig, dbName: ':memory:' });
    await orm.migrator.up();

    const user = new User();
    user.name = 'user';
    user.password = '';
    await orm.em.fork().insert(user);
    userId = user.id;

    playStates = new PlayStatesService(
      orm.em.getRepository(PlayState),
      orm.em.getRepository(LibraryItem),
      orm.em,
    );
  });

  afterEach(() => orm.close());

  it('keeps the play states of a movie and a series with the same TMDB id apart', async () => {
    await request(() =>
      playStates.updateOrCreateEpisodePlayState(userId, TMDB_ID, 1, 1, {
        watched: true,
      }),
    );
    expect(
      await request(() => playStates.findMoviePlayState(userId, TMDB_ID)),
    ).toBeNull();

    await request(() =>
      playStates.updateOrCreateMoviePlayState(userId, TMDB_ID, {
        progress: 0.5,
      }),
    );

    expect(
      await request(() => playStates.findMoviePlayState(userId, TMDB_ID)),
    ).toMatchObject({ mediaType: 'movie', progress: 0.5, watched: false });
    expect(
      await request(() => playStates.findSeriesPlayStates(userId, TMDB_ID)),
    ).toMatchObject([
      { mediaType: 'episode', season: 1, episode: 1, watched: true },
    ]);
    expect(
      await request(() =>
        playStates.findEpisodePlayState(userId, TMDB_ID, 1, 1),
      ),
    ).toMatchObject({ mediaType: 'episode', progress: 0, watched: true });
  });

  it('marks only the library item of the played title as played', async () => {
    for (const mediaType of [MediaType.Movie, MediaType.Series]) {
      const item = new LibraryItem();
      item.userId = userId;
      item.tmdbId = TMDB_ID;
      item.mediaType = mediaType;
      await orm.em.fork().insert(item);
    }

    await request(() =>
      playStates.updateOrCreateMoviePlayState(userId, TMDB_ID, {
        progress: 0.5,
      }),
    );

    const items = await orm.em.fork().find(LibraryItem, { userId });
    const played = items
      .filter((item) => item.lastPlayedAt)
      .map((item) => item.mediaType);
    expect(played).toEqual([MediaType.Movie]);
  });
});
