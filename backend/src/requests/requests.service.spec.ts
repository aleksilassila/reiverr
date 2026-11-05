import { RequestContext } from '@mikro-orm/core';
import { MikroORM } from '@mikro-orm/sqlite';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { MediaType } from '../common/common.dto.js';
import { IndexersService, Release } from '../indexers/indexers.service.js';
import { Job, JobStatus } from '../jobs/job.entity.js';
import { EventsService } from '../events/events.service.js';
import { JobsService } from '../jobs/jobs.service.js';
import { MetadataService } from '../metadata/metadata.service.js';
import mikroOrmConfig from '../mikro-orm.config.js';
import { PlayState } from '../user-data/play-state.entity.js';
import { User } from '../users/user.entity.js';
import { RequestSource } from './request-source.entity.js';
import { RequestRule } from './request-rule.entity.js';
import { MediaRequest } from './request.entity.js';
import {
  RequestSourcesService,
  SelectionTarget,
} from './request-sources.service.js';
import { RequestsService } from './requests.service.js';

const SERIES = '100';
const MOVIE = '200';
const PACK = '1'.repeat(40);
const EPISODE = '2'.repeat(40);
const HOUR = 60 * 60 * 1000;

describe('RequestsService', () => {
  let orm: MikroORM;
  let requests: RequestsService;
  let requestSources: RequestSourcesService;
  let events: EventsService;
  let userId: string;

  const request = <T>(run: () => Promise<T>) =>
    RequestContext.create(orm.em, run);

  const release = (id: string, infoHash: string): Release => ({
    id,
    guid: id,
    indexer: 'test',
    title: id,
    size: 1,
    seeders: 1,
    peers: 1,
    infoHash,
    magnetUrl: `magnet:?xt=urn:btih:${infoHash}`,
    seasons: [1],
    episodes: [],
  });
  const releases = new Map([
    ['pack', release('pack', PACK)],
    ['episode', release('episode', EPISODE)],
  ]);
  const indexers = {
    getRelease: (id: string) => releases.get(id),
    resolveTorrent: vi.fn(async (release: Release) => ({
      infoHash: release.infoHash,
      magnetUrl: release.magnetUrl,
    })),
  };

  const requestEpisodes = (episodes: number[]) =>
    request(() =>
      requests.setEpisodeRequests({
        userId,
        tmdbId: SERIES,
        episodes: episodes.map((episode) => ({ season: 1, episode })),
        requested: true,
      }),
    );

  /** A request that is not approved, which nothing creates any more but the gates still go by */
  const insertUnapproved = (episode: number) => {
    const row = new MediaRequest();
    row.userId = userId;
    row.tmdbId = SERIES;
    row.mediaType = MediaType.Series;
    row.season = 1;
    row.episode = episode;

    return orm.em.fork().insert(row);
  };

  const unrequestEpisodes = (episodes: number[]) =>
    request(() =>
      requests.setEpisodeRequests({
        userId,
        tmdbId: SERIES,
        episodes: episodes.map((episode) => ({ season: 1, episode })),
        requested: false,
      }),
    );

  const setRule = (limits: Partial<RequestRule>) =>
    request(() =>
      requests.setRule(
        { userId, mediaType: MediaType.Series, tmdbId: SERIES },
        {
          keepNext: null,
          keepWatched: null,
          keepWatchedHours: null,
          ...limits,
        },
      ),
    );

  /** Writes the play state of an episode, as the play states service does, and reconciles the requests */
  const setPlayState = async (
    episode: number,
    watched: boolean,
    watchedAt: Date | null,
  ) => {
    const em = orm.em.fork();
    const where = {
      userId,
      mediaType: MediaType.Series,
      tmdbId: SERIES,
      season: 1,
      episode,
    };
    const playState = await em.findOne(PlayState, where);
    if (playState) {
      await em.nativeUpdate(PlayState, where, { watched, watchedAt });
    } else {
      await em.insert(PlayState, {
        ...new PlayState(),
        ...where,
        watched,
        watchedAt,
      });
    }
    await em.transactional((tx) =>
      requests.reconcileRequests(tx, {
        userId,
        mediaType: MediaType.Series,
        tmdbId: SERIES,
      }),
    );
  };

  /** Marks an episode watched at a time; without one, as an episode marked watched before the time was stored */
  const watch = (episode: number, at: Date | null = new Date()) =>
    setPlayState(episode, true, at);
  /** Unwatched, or in progress: a play state that is not watched */
  const unwatch = (episode: number) => setPlayState(episode, false, null);
  const hoursAgo = (hours: number) => new Date(Date.now() - hours * HOUR);

  const target = (episode: number): SelectionTarget => ({
    userId,
    mediaType: MediaType.Series,
    tmdbId: SERIES,
    season: 1,
    episode,
  });
  const movieTarget = (): SelectionTarget => ({
    userId,
    mediaType: MediaType.Movie,
    tmdbId: MOVIE,
    season: 0,
    episode: 0,
  });
  const select = (episode: number, releaseId: string) =>
    request(() => requestSources.selectRelease(target(episode), releaseId));
  const clear = (episode: number) =>
    request(() => requestSources.clearSelection(target(episode)));

  const rows = () =>
    orm.em
      .fork()
      .find(
        MediaRequest,
        { mediaType: MediaType.Series },
        { orderBy: { episode: 'asc' } },
      );

  /** The gate each episode request has passed */
  const gates = async () =>
    (await rows()).map((r) => [
      r.episode,
      !r.approved ? 'waiting' : !r.neededSince ? 'ahead' : 'needed',
    ]);

  const sourceOf = async (episode: number) => {
    const row = (await rows()).find((r) => r.episode === episode);
    const { source } = await request(() =>
      requests.readRequestWithSource(orm.em, row.id),
    );

    return source;
  };

  const rule = () =>
    orm.em.fork().findOne(RequestRule, { userId, tmdbId: SERIES });

  const sources = () =>
    orm.em
      .fork()
      .find(
        RequestSource,
        { userId, tmdbId: SERIES },
        { orderBy: { season: 'asc', episode: 'asc' } },
      );

  /** The episodes of the requests the library is to look at, and the ids of requests that are gone */
  const reconciled = async () => {
    const jobs = await orm.em.fork().find(Job, {
      type: 'library.reconcileBinding',
      status: JobStatus.Queued,
    });
    const requests = await rows();

    return jobs
      .map(
        (job) =>
          requests.find((r) => r.id === job.payload.requestId)?.episode ??
          `gone:${job.payload.requestId}`,
      )
      .sort();
  };
  const forgetJobs = () => orm.em.fork().nativeDelete(Job, {});

  beforeEach(async () => {
    orm = await MikroORM.init({ ...mikroOrmConfig, dbName: ':memory:' });
    await orm.migrator.up();

    const user = new User();
    user.name = 'user';
    user.passwordHash = '';
    await orm.em.fork().insert(user);
    userId = user.id;

    const metadata = {
      getSeriesByTmdbId: async () => ({
        tmdbSeries: {
          seasons: [
            {
              season_number: 1,
              episodes: [1, 2, 3, 4].map((episode_number) => ({
                episode_number,
              })),
            },
          ],
        },
      }),
      getMovieByTmdbId: async () => ({ tmdbMovie: {} }),
    };
    indexers.resolveTorrent.mockClear();
    events = new EventsService();
    requests = new RequestsService(
      orm.em,
      metadata as unknown as MetadataService,
      new JobsService(orm.em, events),
      events,
    );
    requestSources = new RequestSourcesService(
      orm.em,
      metadata as unknown as MetadataService,
      indexers as unknown as IndexersService,
      requests,
    );
  });

  afterEach(() => orm.close());

  it('says which requests the download-ahead window holds back, once they have a source', async () => {
    const ahead = async () => {
      const document = await request(() =>
        requests.describeSeriesRequests(userId, SERIES),
      );

      return document.requests.map((r) => [r.episode, r.ahead]);
    };

    await requestEpisodes([1, 2, 3]);
    await setRule({ keepNext: 1 });
    expect(await ahead()).toEqual([
      [1, false],
      [2, false],
      [3, false],
    ]);

    await select(0, 'pack');
    expect(await ahead()).toEqual([
      [1, false],
      [2, true],
      [3, true],
    ]);

    // The routes that return requests say the same
    const returned = await requestEpisodes([]);
    expect(returned.map((r) => [r.episode, r.ahead])).toEqual(await ahead());
  });

  it('tells the clients of the user about a change of a title, with or without requests of it', async () => {
    const emit = vi.spyOn(events, 'emit');
    const told = {
      type: 'requests',
      userId,
      data: { mediaType: MediaType.Series, tmdbId: SERIES },
    };

    await select(0, 'pack');
    expect(emit).toHaveBeenCalledWith(told);

    emit.mockClear();
    await setRule({ keepNext: 1 });
    expect(emit).toHaveBeenCalledWith(told);

    emit.mockClear();
    await requestEpisodes([1]);
    expect(emit).toHaveBeenCalledWith(told);

    // The last request of the title goes
    emit.mockClear();
    await unrequestEpisodes([1]);
    expect(emit).toHaveBeenCalledWith(told);

    emit.mockClear();
    await request(() =>
      requestSources.clearSelection({
        userId,
        mediaType: MediaType.Series,
        tmdbId: SERIES,
        season: 1,
        episode: 0,
      }),
    );
    expect(emit).toHaveBeenCalledWith(told);
  });

  it('lets new requests through once they have a source, and has the library look at them', async () => {
    await requestEpisodes([1, 2]);
    expect(await gates()).toEqual([
      [1, 'ahead'],
      [2, 'ahead'],
    ]);
    expect(await reconciled()).toEqual([]);

    await select(0, 'pack');
    expect(await gates()).toEqual([
      [1, 'needed'],
      [2, 'needed'],
    ]);
    expect(await reconciled()).toEqual([1, 2]);

    // A request made with a source is let through at once
    await forgetJobs();
    await requestEpisodes([3]);
    expect(await gates()).toContainEqual([3, 'needed']);
    expect(await reconciled()).toEqual([3]);
  });

  it('keeps the release a user picks as the source of the season, resolved', async () => {
    await requestEpisodes([1, 2]);
    await select(0, 'pack');
    expect(indexers.resolveTorrent).toHaveBeenCalledTimes(1);

    const pack = {
      infoHash: PACK,
      title: 'pack',
      indexer: 'test',
      size: 1,
      magnetUrl: `magnet:?xt=urn:btih:${PACK}`,
    };
    expect(await sources()).toMatchObject([
      { season: 1, episode: 0, kind: 'torrent', ...pack },
    ]);
    // A selection makes no rule row
    expect(await rule()).toBeNull();
    expect(await sourceOf(1)).toEqual({
      kind: 'torrent',
      release: pack,
      forEpisode: false,
    });

    // An episode's own torrent wins over the season's, as its only video
    await forgetJobs();
    await select(2, 'episode');
    expect(await sources()).toMatchObject([
      { season: 1, episode: 0, infoHash: PACK },
      { season: 1, episode: 2, kind: 'torrent', infoHash: EPISODE },
    ]);
    expect(await sourceOf(2)).toMatchObject({
      kind: 'torrent',
      release: { infoHash: EPISODE },
      forEpisode: true,
    });
    expect(await sourceOf(1)).toMatchObject({ release: { infoHash: PACK } });
    // Only the requests in scope are looked at
    expect(await reconciled()).toEqual([2]);

    // Clearing the episode's torrent falls back to the season's
    await forgetJobs();
    expect(await clear(2)).toBe(true);
    expect(await sourceOf(2)).toMatchObject({ release: { infoHash: PACK } });
    expect(await reconciled()).toEqual([2]);
    expect(await clear(2)).toBe(false);
    expect(await clear(0)).toBe(true);
    expect(await sourceOf(2)).toBeUndefined();
    expect(await sources()).toEqual([]);

    // A pick replaces the one before it
    await select(0, 'pack');
    await select(0, 'episode');
    expect(await sources()).toMatchObject([
      { season: 1, episode: 0, infoHash: EPISODE },
    ]);
  });

  it('refuses a release that is not in the search cache any more, and an episode the series does not have', async () => {
    await expect(select(0, 'expired')).rejects.toThrow(NotFoundException);
    await expect(select(9, 'pack')).rejects.toThrow(NotFoundException);
    await expect(requestEpisodes([9])).rejects.toThrow(BadRequestException);
  });

  it('applies the rule of the user: the next requests are let through, the watched ones it does not keep are deleted', async () => {
    await requestEpisodes([1, 2, 3]);
    await select(0, 'pack');
    await setRule({ keepNext: 1 });
    expect(await gates()).toEqual([
      [1, 'needed'],
      [2, 'needed'],
      [3, 'needed'],
    ]);

    // The rule set after the requests holds nothing back that passed already
    await unrequestEpisodes([2, 3]);
    await requestEpisodes([2, 3]);
    expect(await gates()).toEqual([
      [1, 'needed'],
      [2, 'ahead'],
      [3, 'ahead'],
    ]);

    await forgetJobs();
    await watch(1);
    expect(await gates()).toEqual([
      [1, 'needed'],
      [2, 'needed'],
      [3, 'ahead'],
    ]);
    expect(await reconciled()).toEqual([2]);

    // Unwatching takes nothing back
    await unwatch(1);
    expect(await gates()).toEqual([
      [1, 'needed'],
      [2, 'needed'],
      [3, 'ahead'],
    ]);

    // A watched request the keep setting does not retain is deleted, and
    // the library lets go of what it had
    await setRule({ keepNext: 1, keepWatched: 1 });
    await watch(1);
    await forgetJobs();
    await watch(2);
    expect(await gates()).toEqual([
      [2, 'needed'],
      [3, 'needed'],
    ]);
    expect(await reconciled()).toEqual([3, expect.stringMatching(/^gone:/)]);
  });

  it('lets through the next requests after the last watched episode, and leaves the rest for later', async () => {
    await setRule({ keepNext: 1 });
    await select(0, 'pack');
    await requestEpisodes([1, 2, 3]);
    expect(await gates()).toEqual([
      [1, 'needed'],
      [2, 'ahead'],
      [3, 'ahead'],
    ]);

    // An episode in progress is not watched yet: its request is the next one
    await unwatch(1);
    expect(await gates()).toEqual([
      [1, 'needed'],
      [2, 'ahead'],
      [3, 'ahead'],
    ]);

    // A skipped episode stays wanted
    await watch(2);
    expect(await gates()).toEqual([
      [1, 'needed'],
      [2, 'needed'],
      [3, 'needed'],
    ]);
  });

  it('counts the approved requests only', async () => {
    await setRule({ keepNext: 1 });
    await select(0, 'pack');
    await insertUnapproved(1);
    await requestEpisodes([2]);

    // A request that waits for approval takes no place in the window
    expect(await gates()).toEqual([
      [1, 'waiting'],
      [2, 'needed'],
    ]);
  });

  it('lets a request through only with a source, which takes its place in the window all the same', async () => {
    await setRule({ keepNext: 2 });
    await requestEpisodes([1, 2, 3]);
    await select(2, 'episode');
    await select(3, 'episode');
    expect(await gates()).toEqual([
      [1, 'ahead'],
      [2, 'needed'],
      [3, 'ahead'],
    ]);

    // The season's torrent gives the first its source; the third stays
    // past the window
    await select(0, 'pack');
    expect(await gates()).toEqual([
      [1, 'needed'],
      [2, 'needed'],
      [3, 'ahead'],
    ]);
  });

  it('deletes the watched requests that are not among the last ones', async () => {
    await setRule({ keepWatched: 1 });
    await select(0, 'pack');
    await requestEpisodes([1, 2, 3, 4]);

    await watch(1);
    await watch(2);
    await watch(3);
    expect(await gates()).toEqual([
      [3, 'needed'],
      [4, 'needed'],
    ]);

    // Nothing is kept once nothing is left to watch
    await watch(4);
    expect(await gates()).toEqual([]);
  });

  it('keeps the last watched requests only while there is more to watch after them', async () => {
    await setRule({ keepWatched: 1 });
    await select(0, 'pack');
    await requestEpisodes([1, 2, 3, 4]);

    // A skipped episode is not something left to watch
    await watch(2);
    await watch(3);
    await watch(4);
    expect(await gates()).toEqual([[1, 'needed']]);
  });

  it('deletes the watched requests that were not watched lately', async () => {
    await setRule({ keepWatchedHours: 24 });
    await select(0, 'pack');
    await requestEpisodes([1, 2, 3, 4]);

    await watch(1, hoursAgo(30));
    await watch(3, hoursAgo(20));
    expect(await gates()).toEqual([
      [2, 'needed'],
      [3, 'needed'],
      [4, 'needed'],
    ]);

    // The limit expires with time
    await setRule({ keepWatchedHours: 20 });
    expect(await gates()).toEqual([
      [2, 'needed'],
      [4, 'needed'],
    ]);

    // An episode watched before the time was stored was watched long ago
    await watch(2, null);
    expect(await gates()).toEqual([[4, 'needed']]);
  });

  it('deletes with both limits only what neither of them keeps', async () => {
    await setRule({ keepWatched: 1, keepWatchedHours: 24 });
    await select(0, 'pack');
    await requestEpisodes([1, 2, 3, 4]);

    await watch(1, hoursAgo(30));
    await watch(2, hoursAgo(20));
    await watch(3, hoursAgo(25));
    expect(await gates()).toEqual([
      [2, 'needed'],
      [3, 'needed'],
      [4, 'needed'],
    ]);

    // The time limit goes on keeping what was watched lately after the end
    await watch(4);
    expect(await gates()).toEqual([
      [2, 'needed'],
      [4, 'needed'],
    ]);
  });

  it('deletes nothing without a keep setting', async () => {
    await setRule({ keepNext: 1 });
    await select(0, 'pack');
    await requestEpisodes([1, 2]);

    await watch(1, hoursAgo(100));
    await watch(2, hoursAgo(100));
    expect(await gates()).toEqual([
      [1, 'needed'],
      [2, 'needed'],
    ]);
  });

  it('makes a file the source of an episode', async () => {
    await requestEpisodes([2]);
    await request(() => requestSources.selectFile(target(2), 'file-1'));

    expect(await sources()).toMatchObject([
      { season: 1, episode: 2, kind: 'file', mediaFileId: 'file-1' },
    ]);
    expect(await sourceOf(2)).toEqual({ kind: 'file', mediaFileId: 'file-1' });
    expect(await gates()).toEqual([[2, 'needed']]);
    expect(await reconciled()).toEqual([2]);
  });

  it('requests the episodes of files for a user, needed and pointed at the files', async () => {
    await insertUnapproved(2);
    const file = (id: string, mediaType: MediaType, episode = 1) => ({
      id,
      mediaType,
      tmdbId: SERIES,
      season: 1,
      episode,
      lastEpisode: episode,
    });

    expect(
      await request(() =>
        requests.requestFiles(userId, [
          { ...file('f1', MediaType.Series, 2), lastEpisode: 3 },
          file('f2', MediaType.Series, 3),
          { ...file('f3', MediaType.Movie), tmdbId: MOVIE, season: 0 },
          { ...file('f5', MediaType.Movie), tmdbId: MOVIE, season: 0 },
          file('f4', MediaType.Series, 9),
        ]),
      ),
    ).toEqual({ requests: 3, skipped: 1 });

    // The request that waited for approval is let through too
    expect(await gates()).toEqual([
      [2, 'needed'],
      [3, 'needed'],
    ]);
    // The first file of an episode gets it
    expect(await sourceOf(2)).toEqual({ kind: 'file', mediaFileId: 'f1' });
    expect(await sourceOf(3)).toEqual({ kind: 'file', mediaFileId: 'f1' });
    // The movie likewise, with its first file
    const { request: movie } = await request(() =>
      requests.describeMovieRequests(userId, MOVIE),
    );
    expect(movie).toMatchObject({ approved: true });
    expect(movie.neededSince).toBeTruthy();
    expect(
      (await request(() => requests.readRequestWithSource(orm.em, movie.id)))
        .source,
    ).toEqual({ kind: 'file', mediaFileId: 'f3' });
    expect(await reconciled()).toEqual([2, 3, `gone:${movie.id}`]);
  });

  it('deletes requests and has the library let go of what they had', async () => {
    await requestEpisodes([1, 2]);
    await select(0, 'pack');
    await forgetJobs();
    const [first] = await rows();

    expect(
      await orm.em
        .fork()
        .transactional((tx) => requests.deleteRequests(tx, [first.id])),
    ).toBe(1);
    expect(await gates()).toEqual([[2, 'needed']]);
    expect(await reconciled()).toEqual([`gone:${first.id}`]);

    await forgetJobs();
    await unrequestEpisodes([2]);
    expect(await rows()).toEqual([]);
    expect(await reconciled()).toHaveLength(1);
  });

  it('tells the library about the requests of a user that is deleted', async () => {
    await requestEpisodes([1, 2]);
    await forgetJobs();

    await orm.em
      .fork()
      .transactional((tx) => requests.userDeleting(tx, userId));

    expect(await reconciled()).toEqual([1, 2]);
  });

  it('requests a movie, which is needed once it has a source, and keeps it as long as its rule says', async () => {
    const readMovie = async () => {
      const { request: row } = await request(() =>
        requests.describeMovieRequests(userId, MOVIE),
      );
      return (
        row && request(() => requests.readRequestWithSource(orm.em, row.id))
      );
    };
    const movieRule = () =>
      orm.em.fork().findOne(RequestRule, {
        userId,
        mediaType: MediaType.Movie,
        tmdbId: MOVIE,
      });

    const created = await request(() =>
      requests.createMovieRequest(userId, MOVIE),
    );
    expect(created).toMatchObject({
      mediaType: MediaType.Movie,
      season: 0,
      episode: 0,
      approved: true,
    });
    expect(created.neededSince).toBeFalsy();
    expect((await readMovie()).source).toBeUndefined();
    expect(await reconciled()).toEqual([]);

    // A torrent picked for the movie is wanted for the movie itself
    await request(() => requestSources.selectRelease(movieTarget(), 'episode'));
    expect((await readMovie()).neededSince).toBeTruthy();
    expect((await readMovie()).source).toMatchObject({
      kind: 'torrent',
      release: { infoHash: EPISODE },
      forEpisode: true,
    });
    expect(
      await orm.em.fork().find(RequestSource, { mediaType: MediaType.Movie }),
    ).toMatchObject([
      { season: 0, episode: 0, kind: 'torrent', infoHash: EPISODE },
    ]);
    expect(await movieRule()).toBeNull();
    expect(await reconciled()).toEqual([`gone:${created.id}`]);

    // A file instead, then nothing: the request stays needed without a source
    await request(() => requestSources.selectFile(movieTarget(), 'f1'));
    expect((await readMovie()).source).toEqual({
      kind: 'file',
      mediaFileId: 'f1',
    });
    expect(
      await request(() => requestSources.clearSelection(movieTarget())),
    ).toBe(true);
    expect((await readMovie()).source).toBeUndefined();
    expect((await readMovie()).neededSince).toBeTruthy();
    expect(await movieRule()).toBeNull();

    // The rule of a movie keeps a watched one for a time
    await request(() =>
      requests.setRule(
        { userId, mediaType: MediaType.Movie, tmdbId: MOVIE },
        { keepNext: null, keepWatched: null, keepWatchedHours: 12 },
      ),
    );
    expect(await movieRule()).toMatchObject({ keepWatchedHours: 12 });
    const watch = async (watchedAt: Date) => {
      const em = orm.em.fork();
      await em.insert(PlayState, {
        ...new PlayState(),
        userId,
        mediaType: MediaType.Movie,
        tmdbId: MOVIE,
        season: 0,
        episode: 0,
        watched: true,
        watchedAt,
      });
      await em.transactional((tx) =>
        requests.reconcileRequests(tx, {
          userId,
          mediaType: MediaType.Movie,
          tmdbId: MOVIE,
        }),
      );
    };
    const recently = hoursAgo(6);
    await watch(recently);
    expect(await readMovie()).toBeDefined();

    await orm.em.fork().nativeDelete(PlayState, {});
    await watch(hoursAgo(24));
    expect(await readMovie()).toBeUndefined();

    // Deleting a request
    await orm.em.fork().nativeDelete(PlayState, {});
    await request(() => requests.createMovieRequest(userId, MOVIE));
    expect(
      await request(() => requests.deleteMovieRequest(userId, MOVIE)),
    ).toBe(1);
    expect(await readMovie()).toBeUndefined();
  });
});
