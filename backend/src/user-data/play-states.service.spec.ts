import { RequestContext } from '@mikro-orm/core';
import { MikroORM } from '@mikro-orm/sqlite';
import { MediaType } from '../common/common.dto.js';
import mikroOrmConfig from '../mikro-orm.config.js';
import { MovieMetadata, SeriesMetadata } from '../metadata/metadata.entity.js';
import { MetadataService } from '../metadata/metadata.service.js';
import { TmdbSeriesFull } from '../metadata/tmdb/tmdb.dto.js';
import { User } from '../users/user.entity.js';
import { TitleState } from './title-state.entity.js';
import { TitleStateService } from './title-state.service.js';
import { PlayState } from './play-state.entity.js';
import { RequestsService } from '../requests/requests.service.js';
import { PlayStatesService } from './play-states.service.js';

// Movies and series have separate id ranges on TMDB that overlap
const TMDB_ID = '1';

describe('PlayStatesService', () => {
  let orm: MikroORM;
  let playStates: PlayStatesService;
  const requests = { applyRule: vi.fn(async () => {}) };
  let userId: string;

  // Every call gets its own entity manager, as every HTTP request does
  const request = <T>(run: () => Promise<T>) =>
    RequestContext.create(orm.em, run);

  beforeEach(async () => {
    orm = await MikroORM.init({ ...mikroOrmConfig, dbName: ':memory:' });
    await orm.migrator.up();

    const user = new User();
    user.name = 'user';
    user.passwordHash = '';
    await orm.em.fork().insert(user);
    userId = user.id;

    requests.applyRule.mockClear();
    playStates = new PlayStatesService(
      orm.em.getRepository(PlayState),
      orm.em,
      requests as unknown as RequestsService,
      new TitleStateService(
        orm.em.getRepository(TitleState),
        orm.em,
        new MetadataService(
          orm.em.getRepository(MovieMetadata),
          orm.em.getRepository(SeriesMetadata),
          orm.em,
          undefined,
        ),
      ),
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
      { mediaType: 'series', season: 1, episode: 1, watched: true },
    ]);
    expect(
      await request(() =>
        playStates.findEpisodePlayState(userId, TMDB_ID, 1, 1),
      ),
    ).toMatchObject({ mediaType: 'series', progress: 0, watched: true });
  });

  it('marks only the state of the played title as played, creating it', async () => {
    const series = new TitleState();
    series.userId = userId;
    series.tmdbId = TMDB_ID;
    series.mediaType = MediaType.Series;
    await orm.em.fork().insert(series);

    await request(() =>
      playStates.updateOrCreateMoviePlayState(userId, TMDB_ID, {
        progress: 0.5,
      }),
    );

    const states = await orm.em.fork().find(TitleState, { userId });
    const played = states
      .filter((state) => state.lastPlayedAt)
      .map((state) => state.mediaType);
    expect(played).toEqual([MediaType.Movie]);
    expect(states).toHaveLength(2);
  });

  it('stamps what the user would watch next of the series when an episode becomes watched', async () => {
    await orm.em.fork().insert(
      SeriesMetadata.from({
        id: 1,
        seasons: [
          {
            season_number: 1,
            episodes: [
              { episode_number: 1, air_date: '2020-01-01' },
              { episode_number: 2, air_date: '2020-01-08' },
            ],
          },
        ],
      } as TmdbSeriesFull),
    );
    const state = () =>
      orm.em
        .fork()
        .findOneOrFail(TitleState, { userId, mediaType: MediaType.Series });

    await request(() =>
      playStates.updateOrCreateEpisodePlayState(userId, TMDB_ID, 1, 1, {
        progress: 0.5,
      }),
    );
    expect((await state()).nextSeason).toBeNull();

    await request(() =>
      playStates.updateOrCreateEpisodePlayState(userId, TMDB_ID, 1, 1, {
        watched: true,
      }),
    );
    expect(await state()).toMatchObject({ nextSeason: 1, nextEpisode: 2 });

    await request(() =>
      playStates.deleteEpisodePlayState(userId, TMDB_ID, 1, 1),
    );
    expect(await state()).toMatchObject({ nextSeason: 1, nextEpisode: 1 });
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

  it('has the rule applied to the requests of the series when something becomes watched or unwatched, not on progress', async () => {
    const changes = requests.applyRule;
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
    expect(changes).toHaveBeenCalledWith(expect.anything(), {
      userId,
      mediaType: MediaType.Series,
      tmdbId: TMDB_ID,
    });

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
