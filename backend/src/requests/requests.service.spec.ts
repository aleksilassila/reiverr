import { RequestContext } from '@mikro-orm/core';
import { MikroORM } from '@mikro-orm/sqlite';
import { MediaType, MediaTypeFull } from '../common/common.dto.js';
import { Torrent } from '../downloads/torrent.entity.js';
import { MediaFile } from '../local-media/media-file.entity.js';
import { Job } from '../jobs/job.entity.js';
import { JobsService } from '../jobs/jobs.service.js';
import { MetadataService } from '../metadata/metadata.service.js';
import mikroOrmConfig from '../mikro-orm.config.js';
import { User } from '../users/user.entity.js';
import { RequestRule } from './request-rule.entity.js';
import { MediaRequest } from './request.entity.js';
import { RequestsService, SelectionTarget } from './requests.service.js';

const SERIES = '100';

describe('RequestsService', () => {
  let orm: MikroORM;
  let requests: RequestsService;
  let userId: string;

  const request = <T>(run: () => Promise<T>) =>
    RequestContext.create(orm.em, run);

  const addTorrent = async (id: string) => {
    await orm.em.fork().insert(Torrent, {
      ...new Torrent(),
      id,
      infoHash: id.padEnd(40, '0'),
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

  const target = (episode: number): SelectionTarget => ({
    userId,
    tmdbId: SERIES,
    season: 1,
    episode,
  });
  const select = (episode: number, torrentId: string) =>
    orm.em
      .fork()
      .transactional((tx) =>
        requests.select(tx, target(episode), { torrentId, releaseId: 'r' }),
      );
  const deselect = (episode: number) =>
    orm.em.fork().transactional((tx) => requests.deselect(tx, target(episode)));

  /** The torrent and the file of each episode request */
  const references = async () =>
    (
      await orm.em
        .fork()
        .find(
          MediaRequest,
          { mediaType: MediaTypeFull.Episode },
          { orderBy: { episode: 'asc' } },
        )
    ).map((r) => [r.episode, r.torrentId ?? null, r.mediaFileId ?? null]);

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
    requests = new RequestsService(
      orm.em.getRepository(MediaRequest),
      orm.em.getRepository(RequestRule),
      orm.em,
      metadata as unknown as MetadataService,
      new JobsService(orm.em),
    );

    await addTorrent('pack');
    await addTorrent('episode');
  });

  afterEach(() => orm.close());

  it('binds new requests to the episode selection, or else the season one, approved or not', async () => {
    await select(0, 'pack');
    await select(2, 'episode');

    await requestEpisodes([1, 2]);
    await requestEpisodes([3], false);

    expect(await references()).toEqual([
      [1, 'pack', null],
      [2, 'episode', null],
      [3, 'pack', null],
    ]);
  });

  it('leaves a request unbound while its user prefers no torrent', async () => {
    await requestEpisodes([1]);
    expect(await references()).toEqual([[1, null, null]]);

    await select(0, 'pack');
    expect(await references()).toEqual([[1, 'pack', null]]);
  });

  it('binds the requests without a file again for a season, and keeps the ones with a file', async () => {
    await select(0, 'pack');
    await requestEpisodes([1, 2]);
    const file = await addFile();
    await attach(1, file);

    await select(0, 'episode');

    expect(await references()).toEqual([
      [1, 'pack', file],
      [2, 'episode', null],
    ]);
  });

  it('replaces what an episode has for an episode selection', async () => {
    await select(0, 'pack');
    await requestEpisodes([1, 2]);
    await attach(1, await addFile());

    await select(1, 'episode');

    expect(await references()).toEqual([
      [1, 'episode', null],
      [2, 'pack', null],
    ]);
  });

  it('falls back to the season selection when an episode selection is cleared', async () => {
    await select(0, 'pack');
    await select(2, 'episode');
    await requestEpisodes([2]);

    expect(await deselect(2)).toBe(true);
    expect(await references()).toEqual([[2, 'pack', null]]);

    expect(await deselect(0)).toBe(true);
    expect(await references()).toEqual([[2, null, null]]);
    expect(await deselect(0)).toBe(false);
  });

  it('binds no movie request to a series selection', async () => {
    await select(0, 'pack');
    // A movie request has season 0 and episode 0, like a specials pack
    await orm.em
      .fork()
      .transactional((tx) =>
        requests.select(
          tx,
          { userId, tmdbId: SERIES, season: 0, episode: 0 },
          { torrentId: 'pack', releaseId: 'r' },
        ),
      );

    await request(() => requests.createMovieRequest(userId, SERIES, true));

    const movie = await orm.em
      .fork()
      .findOneOrFail(MediaRequest, { mediaType: MediaTypeFull.Movie });
    expect(movie.torrentId).toBeNull();
  });

  it('has the torrents of the pair reconciled, also one that loses its last selection', async () => {
    const queued = async () =>
      (await orm.em.fork().find(Job, {}, { orderBy: { dedupeKey: 'asc' } }))
        .map((job) => job.dedupeKey)
        .sort();

    await select(0, 'pack');
    expect(await queued()).toEqual(['torrent:pack']);
    await orm.em.fork().nativeDelete(Job, {});

    await requestEpisodes([1]);
    expect(await queued()).toEqual(['torrent:pack']);
    await orm.em.fork().nativeDelete(Job, {});

    await select(0, 'episode');
    expect(await queued()).toEqual(['torrent:episode', 'torrent:pack']);
  });

  it('keeps a file that a request holds but does not refer to yet when the season gets another torrent', async () => {
    await select(0, 'pack');
    await requestEpisodes([1]);
    const file = await addFile('pack'.padEnd(40, '0'));

    await select(0, 'episode');

    expect(await references()).toEqual([[1, 'pack', file]]);
  });

  it('attaches a file only to a request that is still bound to its torrent', async () => {
    await select(0, 'pack');
    await requestEpisodes([1]);
    const file = await addFile('pack'.padEnd(40, '0'));
    const [request] = await orm.em.fork().find(MediaRequest, {});

    // The user selected another torrent while the file was being placed
    await select(1, 'episode');
    await orm.em
      .fork()
      .transactional((tx) =>
        requests.attach(tx, [
          { requestId: request.id, torrentId: 'pack', mediaFileId: file },
        ]),
      );

    expect(await references()).toEqual([[1, 'episode', null]]);
  });

  async function addFile(infoHash?: string): Promise<string> {
    const file = {
      ...new MediaFile(),
      path: '/tv/file.mkv',
      mediaType: MediaType.Series,
      tmdbId: SERIES,
      season: 1,
      episode: 1,
      lastEpisode: 1,
      size: 1,
      modifiedAt: new Date(),
      managed: true,
      infoHash,
    };
    await orm.em.fork().insert(MediaFile, file);

    return file.id;
  }

  async function attach(episode: number, mediaFileId: string) {
    await orm.em
      .fork()
      .nativeUpdate(MediaRequest, { episode }, { mediaFileId });
  }
});

describe('Migration20261009201800', () => {
  it('binds the requests that are not bound yet to their preference', async () => {
    const orm = await MikroORM.init({ ...mikroOrmConfig, dbName: ':memory:' });
    try {
      await orm.migrator.up({ to: 'Migration20261009201230' });
      const em = orm.em.fork();
      // The rows are written as the schema of the step before has them
      const user = { id: 'user' };
      await em.execute(
        `insert into user (id, name, password, is_admin, onboarding_done, settings, profile_picture)
       values ('user', 'user', '', 0, 0, '{}', null)`,
      );
      for (const id of ['pack', 'episode', 'kept']) {
        await em.execute(
          `insert into torrent (id, info_hash, title, indexer, size, downloaded_bytes, uploaded_bytes, created_at)
         values (?, ?, ?, 'test', 1, 0, 0, 0)`,
          [id, id.padEnd(40, '0'), id],
        );
      }
      const selection = (season: number, episode: number, torrentId: string) =>
        em.execute(
          `insert into torrent_selection (id, user_id, media_type, tmdb_id, season, episode, torrent_id, release_id, created_at)
         values (?, ?, 'series', ?, ?, ?, ?, 'r', 0)`,
          [`${season}/${episode}`, user.id, SERIES, season, episode, torrentId],
        );
      await selection(1, 0, 'pack');
      await selection(1, 2, 'episode');
      await selection(0, 0, 'pack');
      const insert = (
        mediaType: MediaTypeFull,
        season: number,
        episode: number,
        torrentId?: string,
      ) =>
        em.execute(
          `insert into request (id, user_id, tmdb_id, media_type, season, episode, approved, torrent_id, created_at, updated_at)
         values (?, ?, ?, ?, ?, ?, 1, ?, 0, 0)`,
          [
            `${mediaType}/${season}/${episode}`,
            user.id,
            SERIES,
            mediaType,
            season,
            episode,
            torrentId ?? null,
          ],
        );
      await insert(MediaTypeFull.Episode, 1, 1);
      await insert(MediaTypeFull.Episode, 1, 2);
      await insert(MediaTypeFull.Episode, 1, 3, 'kept');
      await insert(MediaTypeFull.Episode, 2, 1);
      await insert(MediaTypeFull.Movie, 0, 0);

      await orm.migrator.up();

      const rows = await orm.em
        .fork()
        .find(
          MediaRequest,
          {},
          { orderBy: { mediaType: 'asc', season: 'asc', episode: 'asc' } },
        );
      expect(
        rows.map((r) => [
          r.mediaType,
          r.season,
          r.episode,
          r.torrentId ?? null,
        ]),
      ).toEqual([
        [MediaTypeFull.Episode, 1, 1, 'pack'],
        [MediaTypeFull.Episode, 1, 2, 'episode'],
        [MediaTypeFull.Episode, 1, 3, 'kept'],
        [MediaTypeFull.Episode, 2, 1, null],
        [MediaTypeFull.Movie, 0, 0, null],
      ]);
    } finally {
      await orm.close();
    }
  });
});
