import { RequestContext } from '@mikro-orm/core';
import { MikroORM } from '@mikro-orm/sqlite';
import { MediaType, MediaTypeFull } from '../common/common.dto.js';
import { Torrent } from '../downloads/torrent.entity.js';
import { IndexersService, Release } from '../indexers/indexers.service.js';
import { Job, JobStatus } from '../jobs/job.entity.js';
import { JobsService } from '../jobs/jobs.service.js';
import { MediaFile } from '../local-media/media-file.entity.js';
import { MetadataService } from '../metadata/metadata.service.js';
import mikroOrmConfig from '../mikro-orm.config.js';
import { PlayState } from '../user-data/play-state/play-state.entity.js';
import { User } from '../users/user.entity.js';
import { RequestRule } from './request-rule.entity.js';
import { MediaRequest } from './request.entity.js';
import { RequestsService, SelectionTarget } from './requests.service.js';

const SERIES = '100';
const PACK = '1'.repeat(40);
const EPISODE = '2'.repeat(40);

describe('RequestsService', () => {
  let orm: MikroORM;
  let requests: RequestsService;
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

  const addTorrent = async (id: string, infoHash: string) => {
    await orm.em.fork().insert(Torrent, {
      ...new Torrent(),
      id,
      infoHash,
      title: id,
      indexer: 'test',
      size: 1,
    });
  };

  const requestEpisodes = (episodes: number[], approved = true) =>
    request(() =>
      requests.setEpisodeRequests({
        userId,
        tmdbId: SERIES,
        episodes: episodes.map((episode) => ({ season: 1, episode })),
        requested: true,
        approved,
      }),
    );

  const setRule = (limits: Partial<RequestRule>) =>
    request(() =>
      requests.setSeriesRule(userId, SERIES, {
        keepNext: null,
        keepWatched: null,
        keepWatchedHours: null,
        ...limits,
      }),
    );

  /** Marks an episode watched or unwatched, as the play states service does */
  const watch = async (episode: number, watched = true) => {
    const em = orm.em.fork();
    const where = {
      userId,
      mediaType: MediaTypeFull.Episode,
      tmdbId: SERIES,
      season: 1,
      episode,
    };
    const watchedAt = watched ? new Date() : null;
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
      requests.evaluate(tx, [
        { userId, mediaType: MediaType.Series, tmdbId: SERIES },
      ]),
    );
  };

  const target = (episode: number): SelectionTarget => ({
    userId,
    tmdbId: SERIES,
    season: 1,
    episode,
  });
  const select = (episode: number, releaseId: string) =>
    request(() => requests.selectTorrent(target(episode), releaseId));
  const clear = (episode: number) =>
    request(() => requests.clearTorrent(target(episode)));

  /** Binds requests the way the reconciliation of the title does */
  const bind = (episodes: number[], torrentId: string) =>
    orm.em
      .fork()
      .nativeUpdate(
        MediaRequest,
        { episode: { $in: episodes } },
        { torrentId },
      );

  const attach = async (episode: number, infoHash: string) => {
    const em = orm.em.fork();
    const file = new MediaFile();
    file.path = `/tv/${episode}-${infoHash}.mkv`;
    file.mediaType = MediaType.Series;
    file.tmdbId = SERIES;
    file.season = 1;
    file.episode = episode;
    file.lastEpisode = episode;
    file.size = 1;
    file.modifiedAt = new Date();
    file.infoHash = infoHash;
    file.managed = true;
    await em.insert(MediaFile, { ...file });
    await em.nativeUpdate(MediaRequest, { episode }, { mediaFileId: file.id });

    return file.id;
  };

  /** Where each episode request stands, with its torrent and file */
  const references = async () =>
    (
      await orm.em
        .fork()
        .find(
          MediaRequest,
          { mediaType: MediaTypeFull.Episode },
          { orderBy: { episode: 'asc' } },
        )
    ).map((r) => [
      r.episode,
      !r.approved
        ? 'waiting'
        : !r.activatedAt
          ? 'ahead'
          : r.watchedAt
            ? 'watched'
            : 'active',
      r.torrentId ?? null,
      r.mediaFileId ? 'file' : null,
    ]);

  const rule = () =>
    orm.em.fork().findOne(RequestRule, { userId, tmdbId: SERIES });

  const queuedTitles = () =>
    orm.em.fork().count(Job, {
      type: 'title.reconcile',
      status: JobStatus.Queued,
    });

  beforeEach(async () => {
    orm = await MikroORM.init({ ...mikroOrmConfig, dbName: ':memory:' });
    await orm.migrator.up();

    const user = new User();
    user.name = 'user';
    user.password = '';
    await orm.em.fork().insert(user);
    userId = user.id;

    const metadata = {
      getSeriesByTmdbId: async () => ({
        tmdbSeries: {
          seasons: [
            {
              season_number: 1,
              episodes: [1, 2, 3].map((episode_number) => ({ episode_number })),
            },
          ],
        },
      }),
      getMovieByTmdbId: async () => ({ tmdbMovie: {} }),
    };
    indexers.resolveTorrent.mockClear();
    requests = new RequestsService(
      orm.em.getRepository(MediaRequest),
      orm.em.getRepository(RequestRule),
      orm.em,
      metadata as unknown as MetadataService,
      indexers as unknown as IndexersService,
      new JobsService(orm.em),
    );
  });

  afterEach(() => orm.close());

  it('activates new requests and has the series reconciled', async () => {
    await requestEpisodes([1, 2]);
    await requestEpisodes([3], false);

    expect(await references()).toEqual([
      [1, 'active', null, null],
      [2, 'active', null, null],
      [3, 'waiting', null, null],
    ]);
    expect(await queuedTitles()).toBe(1);
  });

  it('applies the rule of the user when a request is made and when an episode is watched', async () => {
    await setRule({ keepNext: 1 });
    await requestEpisodes([1, 2, 3]);

    expect(await references()).toEqual([
      [1, 'active', null, null],
      [2, 'ahead', null, null],
      [3, 'ahead', null, null],
    ]);

    await watch(1);
    expect(await references()).toEqual([
      [1, 'watched', null, null],
      [2, 'active', null, null],
      [3, 'ahead', null, null],
    ]);

    // Marking the episode unwatched takes nothing back
    await watch(1, false);
    expect(await references()).toEqual([
      [1, 'active', null, null],
      [2, 'active', null, null],
      [3, 'ahead', null, null],
    ]);
  });

  it('deletes the requests of watched episodes that no keep setting retains', async () => {
    await requestEpisodes([1, 2, 3]);
    await setRule({ keepWatched: 1 });
    await addTorrent('pack', PACK);
    await bind([1, 2, 3], 'pack');
    await attach(1, PACK);

    await watch(1);
    await watch(2);
    expect(await references()).toEqual([
      [2, 'watched', 'pack', null],
      [3, 'active', 'pack', null],
    ]);

    // Nothing is kept once nothing is left to watch
    await watch(3);
    expect(await references()).toEqual([]);
    expect(await queuedTitles()).toBe(1);
  });

  it('keeps the release a user picks on the rule, resolved, and binds nothing itself', async () => {
    await requestEpisodes([1]);
    await select(0, 'pack');

    expect(indexers.resolveTorrent).toHaveBeenCalledTimes(1);
    expect(await rule()).toMatchObject({
      keepNext: null,
      seasonTorrents: [
        {
          season: 1,
          release: { releaseId: 'pack', title: 'pack', infoHash: PACK },
        },
      ],
      episodeTorrents: null,
    });
    expect(await references()).toEqual([[1, 'active', null, null]]);
    expect(await orm.em.fork().count(Torrent)).toBe(0);
    expect(await queuedTitles()).toBe(1);
  });

  it('refuses a release that is not in the search cache any more', async () => {
    await expect(select(0, 'gone')).rejects.toThrow('Release not found');
  });

  it('rebinds the requests of a season that have no file', async () => {
    await setRule({ keepNext: 2 });
    await requestEpisodes([1, 2, 3]);
    await addTorrent('pack', PACK);
    await bind([1, 2], 'pack');
    await attach(1, PACK);

    await select(0, 'episode');

    // The first keeps its file, the third was never bound
    expect(await references()).toEqual([
      [1, 'active', 'pack', 'file'],
      [2, 'active', null, null],
      [3, 'ahead', null, null],
    ]);
  });

  it('replaces even a held file for an episode', async () => {
    await requestEpisodes([1, 2]);
    await addTorrent('pack', PACK);
    await bind([1, 2], 'pack');
    await attach(1, PACK);
    await attach(2, PACK);

    await select(2, 'episode');

    expect(await references()).toEqual([
      [1, 'active', 'pack', 'file'],
      [2, 'active', null, null],
    ]);
    expect(await rule()).toMatchObject({
      episodeTorrents: [{ season: 1, episode: 2 }],
    });
  });

  it('leaves the requests of the picked torrent alone and forgets its failure', async () => {
    await requestEpisodes([1, 2]);
    await addTorrent('pack', PACK);
    await bind([1, 2], 'pack');
    await orm.em
      .fork()
      .nativeUpdate(
        Torrent,
        { id: 'pack' },
        { error: 'no peers', attempts: 3, retryAt: new Date() },
      );
    await orm.em
      .fork()
      .nativeUpdate(
        MediaRequest,
        { episode: 1 },
        { error: 'Import failed', attempts: 1, retryAt: new Date() },
      );

    await select(0, 'pack');

    expect(await references()).toEqual([
      [1, 'active', 'pack', null],
      [2, 'active', 'pack', null],
    ]);
    expect(await orm.em.fork().findOne(Torrent, { id: 'pack' })).toMatchObject({
      error: null,
      attempts: 0,
      retryAt: null,
    });
    expect(
      await orm.em.fork().findOne(MediaRequest, { episode: 1 }),
    ).toMatchObject({ error: null, attempts: 0, retryAt: null });
  });

  it('leaves an episode with a torrent of its own out of a season change', async () => {
    await requestEpisodes([1, 2]);
    await addTorrent('episode', EPISODE);
    await select(2, 'episode');
    await bind([2], 'episode');

    await select(0, 'pack');

    expect(await references()).toEqual([
      [1, 'active', null, null],
      [2, 'active', 'episode', null],
    ]);
  });

  it('falls back to the season torrent when the torrent of an episode is cleared', async () => {
    await requestEpisodes([1, 2]);
    await addTorrent('episode', EPISODE);
    await select(0, 'pack');
    await select(2, 'episode');
    await bind([2], 'episode');

    expect(await clear(2)).toBe(true);
    expect(await clear(2)).toBe(false);
    expect(await references()).toEqual([
      [1, 'active', null, null],
      [2, 'active', null, null],
    ]);
    expect(await rule()).toMatchObject({
      seasonTorrents: [{ season: 1 }],
      episodeTorrents: null,
    });

    // A rule without a limit or a torrent is no rule
    expect(await clear(0)).toBe(true);
    expect(await rule()).toBeNull();
  });

  it('deletes the requests of files and evaluates the rest of their pairs', async () => {
    await setRule({ keepNext: 1 });
    await requestEpisodes([1, 2, 3]);
    await addTorrent('pack', PACK);
    await bind([1], 'pack');
    const fileId = await attach(1, PACK);

    const deleted = await orm.em
      .fork()
      .transactional((tx) =>
        requests.deleteRequests(tx, { mediaFileIds: [fileId] }),
      );

    expect(deleted).toBe(1);
    expect(await references()).toEqual([
      [2, 'active', null, null],
      [3, 'ahead', null, null],
    ]);
  });
});

describe('Migration20261010200450', () => {
  it('moves the selections into the rules and stamps the requests', async () => {
    const orm = await MikroORM.init({ ...mikroOrmConfig, dbName: ':memory:' });
    try {
      await orm.migrator.up({ to: 'Migration20261009203715' });
      const em = orm.em.fork();
      // The rows are written as the schema of the step before has them
      await em.execute(
        `insert into user (id, name, password, is_admin, onboarding_done, settings, profile_picture)
         values ('user', 'user', '', 0, 0, '{}', null)`,
      );
      for (const id of ['pack', 'episode']) {
        await em.execute(
          `insert into torrent (id, info_hash, title, indexer, size, magnet_url, downloaded_bytes, uploaded_bytes, created_at)
           values (?, ?, ?, 'test', 1, ?, 0, 0, 0)`,
          [id, id.padEnd(40, '0'), id, id === 'pack' ? 'magnet:?pack' : null],
        );
      }
      const selection = (
        tmdbId: string,
        season: number,
        episode: number,
        torrentId: string,
      ) =>
        em.execute(
          `insert into torrent_selection (id, user_id, media_type, tmdb_id, season, episode, torrent_id, release_id, created_at)
           values (?, 'user', 'series', ?, ?, ?, ?, 'r', 0)`,
          [
            `${tmdbId}/${season}/${episode}`,
            tmdbId,
            season,
            episode,
            torrentId,
          ],
        );
      await selection('100', 1, 0, 'pack');
      await selection('100', 1, 2, 'episode');
      await selection('200', 2, 0, 'pack');
      await em.execute(
        `insert into request_rule (id, user_id, tmdb_id, keep_next, keep_watched, keep_watched_hours)
         values ('rule', 'user', '100', 2, null, null)`,
      );
      const insert = (episode: number, approved: number) =>
        em.execute(
          `insert into request (id, user_id, tmdb_id, media_type, season, episode, approved, torrent_id, created_at, updated_at)
           values (?, 'user', '100', 'episode', 1, ?, ?, 'pack', 0, 0)`,
          [`1/${episode}`, episode, approved],
        );
      await insert(1, 1);
      await insert(2, 0);
      await em.execute(
        `insert into play_state (id, user_id, media_type, tmdb_id, season, episode, progress, watched, watched_at, last_played_at)
         values ('played', 'user', 'episode', '100', 1, 1, 1, 1, 5000, 5000)`,
      );
      await em.execute(
        `insert into jobs (id, type, payload, status, run_at, attempts, created_at)
         values ('job', 'torrent.import', '{}', 'queued', 0, 0, 0)`,
      );

      await orm.migrator.up();

      const rules = await orm.em
        .fork()
        .find(RequestRule, {}, { orderBy: { tmdbId: 'asc' } });
      expect(rules).toMatchObject([
        {
          tmdbId: '100',
          mediaType: 'series',
          keepNext: 2,
          seasonTorrents: [
            {
              season: 1,
              release: {
                releaseId: 'r',
                title: 'pack',
                infoHash: 'pack'.padEnd(40, '0'),
                magnetUrl: 'magnet:?pack',
              },
            },
          ],
          episodeTorrents: [
            {
              season: 1,
              episode: 2,
              release: { title: 'episode', magnetUrl: null },
            },
          ],
        },
        {
          tmdbId: '200',
          keepNext: null,
          seasonTorrents: [{ season: 2, release: { title: 'pack' } }],
          episodeTorrents: null,
        },
      ]);
      const requests = await orm.em
        .fork()
        .find(MediaRequest, {}, { orderBy: { episode: 'asc' } });
      // A request that downloads is through the gate; the others go through
      // the rules when the server starts
      expect(
        requests.map((r) => [
          r.episode,
          !!r.activatedAt,
          r.watchedAt?.getTime() ?? null,
          r.torrentId,
        ]),
      ).toEqual([
        [1, true, 5000, 'pack'],
        [2, false, null, 'pack'],
      ]);
      expect(await orm.em.fork().count(Job)).toBe(0);
    } finally {
      await orm.close();
    }
  });
});
