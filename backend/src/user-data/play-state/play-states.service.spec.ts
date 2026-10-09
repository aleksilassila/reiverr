import { RequestContext } from '@mikro-orm/core';
import { MikroORM } from '@mikro-orm/sqlite';
import { MediaType } from '../../common/common.dto.js';
import mikroOrmConfig from '../../mikro-orm.config.js';
import { User } from '../../users/user.entity.js';
import { LibraryItem } from '../library/library.entity.js';
import { PlayState } from './play-state.entity.js';
import { RequestsService } from '../../requests/requests.service.js';
import { PlayStatesService } from './play-states.service.js';

// Movies and series have separate id ranges on TMDB that overlap
const TMDB_ID = '1';

describe('PlayStatesService', () => {
  let orm: MikroORM;
  let playStates: PlayStatesService;
  const requests = { enqueueTorrentsOfPairs: vi.fn(async () => {}) };
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

    requests.enqueueTorrentsOfPairs.mockClear();
    playStates = new PlayStatesService(
      orm.em.getRepository(PlayState),
      orm.em,
      requests as unknown as RequestsService,
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

  it('remembers when an episode became watched', async () => {
    const update = (playState: { watched?: boolean; progress?: number }) =>
      request(() =>
        playStates.updateOrCreateEpisodePlayState(
          userId,
          TMDB_ID,
          1,
          1,
          playState,
        ),
      );

    expect((await update({ progress: 0.5 })).watchedAt).toBeNull();

    const { watchedAt } = await update({ progress: 0.95, watched: true });
    expect(watchedAt).toBeInstanceOf(Date);
    // Playing on does not make it watched again
    expect((await update({ progress: 0.97, watched: true })).watchedAt).toEqual(
      watchedAt,
    );

    expect(await update({ watched: false })).toMatchObject({
      watched: false,
      watchedAt: null,
    });
  });

  it('creates a play state once when the first reports arrive together', async () => {
    const report = (progress: number) =>
      request(() =>
        playStates.updateOrCreateEpisodePlayState(userId, TMDB_ID, 1, 1, {
          progress,
        }),
      );

    await Promise.all([report(0.1), report(0.2)]);

    expect(await orm.em.fork().count(PlayState)).toBe(1);
  });

  it('updates the play states of a series, an episode named twice included', async () => {
    const states = await request(() =>
      playStates.updateOrCreateSeriesPlayStates(userId, TMDB_ID, [
        { season: 1, episode: 1, watched: true },
        { season: 1, episode: 2, progress: 0.5 },
        { season: 1, episode: 1, progress: 0.9 },
      ]),
    );

    expect(states.map((s) => [s.episode, s.watched, s.progress])).toEqual([
      [1, true, 0.9],
      [2, false, 0.5],
      [1, true, 0.9],
    ]);
    const stored = await orm.em
      .fork()
      .find(PlayState, {}, { orderBy: { episode: 'asc' } });
    expect(stored.map((s) => [s.episode, s.watched, s.progress])).toEqual([
      [1, true, 0.9],
      [2, false, 0.5],
    ]);
  });

  it('has the torrents of the series reconciled when something becomes watched or unwatched, not on progress', async () => {
    const changes = requests.enqueueTorrentsOfPairs;
    const update = (playState: { watched?: boolean; progress?: number }) =>
      request(() =>
        playStates.updateOrCreateEpisodePlayState(
          userId,
          TMDB_ID,
          1,
          1,
          playState,
        ),
      );

    await update({ progress: 0.1 });
    await update({ progress: 0.5 });
    expect(changes).not.toHaveBeenCalled();

    await update({ progress: 0.95, watched: true });
    await update({ progress: 0.97, watched: true });
    expect(changes).toHaveBeenCalledTimes(1);
    expect(changes).toHaveBeenCalledWith(expect.anything(), [
      { userId, tmdbId: TMDB_ID },
    ]);

    await request(() =>
      playStates.updateOrCreateSeriesPlayStates(userId, TMDB_ID, [
        { season: 1, episode: 1, watched: true },
        { season: 1, episode: 2, watched: true },
      ]),
    );
    expect(changes).toHaveBeenCalledTimes(2);

    await request(() =>
      playStates.updateOrCreateSeriesPlayStates(userId, TMDB_ID, [
        { season: 1, episode: 1, watched: true },
        { season: 1, episode: 2, watched: true },
      ]),
    );
    expect(changes).toHaveBeenCalledTimes(2);

    await update({ watched: false });
    expect(changes).toHaveBeenCalledTimes(3);
  });
});
