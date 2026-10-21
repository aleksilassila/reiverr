import { RequestContext } from '@mikro-orm/core';
import { MikroORM } from '@mikro-orm/sqlite';
import {
  existsSync,
  mkdirSync,
  readdirSync,
  renameSync,
  rmSync,
} from 'node:fs';
import * as path from 'node:path';
import parseTorrent from 'parse-torrent';
import { FakeEngine, magnetFiles } from '../../test/fake-engine.js';
import { createTorrent } from '../../test/torrent-fixture.js';
import { MediaType } from '../common/common.dto.js';
import { DownloadsService } from '../downloads/downloads.service.js';
import { TorrentItem } from '../downloads/torrent-item.entity.js';
import { TorrentRuntime } from '../downloads/torrent-runtime.js';
import { IndexersService, Release } from '../indexers/indexers.service.js';
import { parseTorrentSource } from '../indexers/torrent-source.utils.js';
import { Job, JobStatus } from '../jobs/job.entity.js';
import { JobsService } from '../jobs/jobs.service.js';
import { MetadataService } from '../metadata/metadata.service.js';
import { TmdbService } from '../metadata/tmdb/tmdb.service.js';
import mikroOrmConfig from '../mikro-orm.config.js';
import { MediaRequest } from '../requests/request.entity.js';
import { RequestsService } from '../requests/requests.service.js';
import { ServerLogService } from '../server-log/server-log.service.js';
import { SettingsService } from '../settings/settings.service.js';
import { User } from '../users/user.entity.js';
import { DeletionService } from './deletion.service.js';
import { FulfilmentService } from './fulfilment.service.js';
import { ImportService } from './import.service.js';
import { CleanupSchedule } from './library.dto.js';
import { LibraryService } from './library.service.js';
import { MediaFile } from './media-file.entity.js';
import { RequestBinding } from './request-binding.entity.js';
import { StatusService } from './status.service.js';

// The downloads directory is read from the environment when the app is imported
const dirs = await vi.hoisted(async () => {
  const { mkdtempSync } = await import('node:fs');
  const { tmpdir } = await import('node:os');
  const { join } = await import('node:path');

  const root = mkdtempSync(join(tmpdir(), 'reiverr-hub-'));
  process.env.DOWNLOADS_DIR = join(root, 'downloads');

  return {
    root,
    downloads: join(root, 'downloads'),
    library: join(root, 'tv'),
  };
});

const TMDB_ID = '100';
const PACK_MAGNET =
  'magnet:?xt=urn:btih:1111111111111111111111111111111111111111';
const OTHER_PACK_MAGNET =
  'magnet:?xt=urn:btih:2222222222222222222222222222222222222222';
const EPISODE_TORRENT = createTorrent('Test.Show.S01E01.1080p.WEB-GRP', [
  { name: 'release-group-1080p.mkv', data: Buffer.alloc(50, 'a') },
  { name: 'readme.txt', data: Buffer.alloc(1, 'b') },
]);
const PACK = parseTorrent(PACK_MAGNET).infoHash;
const OTHER_PACK = parseTorrent(OTHER_PACK_MAGNET).infoHash;
const EPISODE = parseTorrent(EPISODE_TORRENT).infoHash;
const version = (hash: string) => hash.slice(0, 8);

magnetFiles[PACK] = [
  { path: 'Test.Show.S01/Test.Show.S01E01.1080p.mkv', length: 100 },
  { path: 'Test.Show.S01/Test.Show.S01E02.1080p.mkv', length: 100 },
];
magnetFiles[OTHER_PACK] = [
  { path: 'Test.Show.S01.720p/Test.Show.S01E01.720p.mkv', length: 50 },
  { path: 'Test.Show.S01.720p/Test.Show.S01E02.720p.mkv', length: 50 },
];

const releases: Record<string, Release> = {
  pack: {
    id: 'pack',
    guid: 'pack',
    indexer: 'test',
    title: 'Test.Show.S01.1080p.WEB-GRP',
    size: 200,
    seeders: 1,
    peers: 1,
    infoHash: PACK,
    magnetUrl: PACK_MAGNET,
    seasons: [1],
    episodes: [],
  },
  otherPack: {
    id: 'otherPack',
    guid: 'otherPack',
    indexer: 'test',
    title: 'Test.Show.S01.720p.WEB-GRP',
    size: 100,
    seeders: 1,
    peers: 1,
    infoHash: OTHER_PACK,
    magnetUrl: OTHER_PACK_MAGNET,
    seasons: [1],
    episodes: [],
  },
  episode: {
    id: 'episode',
    guid: 'episode',
    indexer: 'test',
    title: 'Test.Show.S01E01.1080p.WEB-GRP',
    size: 50,
    seeders: 1,
    peers: 1,
    downloadUrl: 'http://indexer/dl/episode',
    seasons: [1],
    episodes: [1],
  },
};

/** The three modules on an in-memory database, with the fake engine and a temporary library folder */
async function createHub() {
  const orm = await MikroORM.init({ ...mikroOrmConfig, dbName: ':memory:' });
  await orm.migrator.up();
  rmSync(dirs.root, { recursive: true, force: true });
  mkdirSync(dirs.library, { recursive: true });

  const request = <T>(run: () => Promise<T>) =>
    RequestContext.create(orm.em, run);

  const jobs = new JobsService(orm.em);
  const settings = new SettingsService(orm.em);
  const serverLog = new ServerLogService(orm.em, settings);
  const metadata = {
    getSeriesByTmdbId: async (tmdbId: string) =>
      tmdbId === TMDB_ID
        ? {
            tmdbSeries: {
              name: 'Test Show',
              first_air_date: '2020-01-01',
              seasons: [
                {
                  season_number: 1,
                  episodes: [1, 2, 3].map((episode_number) => ({
                    episode_number,
                  })),
                },
              ],
            },
          }
        : undefined,
    getMovieByTmdbId: async () => undefined,
  };
  const tmdb = {
    searchTitles: async () => [],
    findByExternalId: async () => undefined,
  };
  const indexers = {
    getRelease: (id: string) => releases[id],
    resolveTorrent: async (release: Release) =>
      parseTorrentSource(
        release.magnetUrl ?? (release.id === 'episode' ? EPISODE_TORRENT : ''),
      ),
  };

  const libraryService = new LibraryService(
    orm.em,
    settings,
    metadata as unknown as MetadataService,
    tmdb as unknown as TmdbService,
    jobs,
    serverLog,
  );
  const importService = new ImportService(orm.em, libraryService);
  const requests = new RequestsService(
    orm.em,
    metadata as unknown as MetadataService,
    indexers as unknown as IndexersService,
    jobs,
  );
  const engine = new FakeEngine();
  const runtime = new TorrentRuntime(orm.em, jobs, settings, engine);
  const downloads = new DownloadsService(
    orm.em,
    settings,
    serverLog,
    jobs,
    runtime,
  );
  const deletion = new DeletionService(
    orm.em,
    jobs,
    libraryService,
    requests,
    serverLog,
  );
  const fulfilment = new FulfilmentService(
    orm.em,
    jobs,
    requests,
    downloads,
    importService,
  );
  const status = new StatusService(
    orm.em,
    jobs,
    requests,
    downloads,
    libraryService,
  );
  for (const service of [libraryService, downloads, deletion, fulfilment]) {
    service.onModuleInit();
  }
  await request(() => settings.saveValue('downloads', { seedRatio: 0 }));
  await request(() =>
    libraryService.updateSettings({
      movieFolders: [],
      seriesFolders: [dirs.library],
      cleanup: CleanupSchedule.Daily,
    }),
  );

  const user = new User();
  user.name = 'user';
  user.password = '';
  await orm.em.fork().insert(user);
  const other = new User();
  other.name = 'other';
  other.password = '';
  await orm.em.fork().insert(other);

  return {
    orm,
    request,
    jobs,
    engine,
    runtime,
    libraryService,
    requests,
    downloads,
    deletion,
    fulfilment,
    status,
    userId: user.id,
    otherId: other.id,
  };
}

describe('FulfilmentService', () => {
  let hub: Awaited<ReturnType<typeof createHub>>;
  let orm: MikroORM;
  let userId: string;

  const settle = () => hub.jobs.drain();
  const request = <T>(run: () => Promise<T>) => hub.request(run);

  const setRequested = (
    episodes: number[],
    requested = true,
    { user = userId, approved = true } = {},
  ) =>
    request(() =>
      hub.requests.setEpisodeRequests({
        userId: user,
        tmdbId: TMDB_ID,
        episodes: episodes.map((episode) => ({ season: 1, episode })),
        requested,
        approved,
      }),
    );
  const select = (episode: number, releaseId: string, user = userId) =>
    request(() =>
      hub.requests.preferRelease(
        { userId: user, tmdbId: TMDB_ID, season: 1, episode },
        releaseId,
      ),
    );
  const selectFile = (episode: number, mediaFileId: string, user = userId) =>
    request(() =>
      hub.requests.preferFile(
        { userId: user, tmdbId: TMDB_ID, season: 1, episode },
        mediaFileId,
      ),
    );

  /** The requests of a user, with what their bindings say */
  const bindings = async (user = userId) => {
    const em = orm.em.fork();
    const rows = await em.find(
      MediaRequest,
      { userId: user },
      { orderBy: { episode: 'asc' } },
    );
    const all = await em.find(RequestBinding, {});
    const items = await em.find(TorrentItem, {});
    const files = await em.find(MediaFile, {});

    return rows.map((row) => {
      const binding = all.find((b) => b.requestId === row.id);
      const item = binding?.torrentItemId
        ? items.find((i) => i.id === binding.torrentItemId)
        : undefined;
      const file = binding?.mediaFileId
        ? files.find((f) => f.id === binding.mediaFileId)
        : undefined;

      return [
        row.episode,
        item ? `item:${item.torrentHash.slice(0, 4)}` : null,
        binding?.mediaFileId
          ? file
            ? `file:${file.infoHash?.slice(0, 4) ?? 'external'}`
            : 'file:gone'
          : null,
        binding?.error ?? null,
      ];
    });
  };
  const statuses = async (user = userId) =>
    (
      await request(() => hub.status.getSeriesStatus(user, TMDB_ID))
    ).episodes.map((e) => [e.episode, e.status ?? null, e.onDisk]);
  const libraryFiles = () =>
    existsSync(dirs.library)
      ? (readdirSync(dirs.library, { recursive: true }) as string[])
          .filter((file) => file.endsWith('.mkv'))
          .sort()
      : [];
  const episodeFile = (episode: number, hash: string) =>
    `Test Show (2020) [tmdbid-100]/Season 1/Test Show - S01E0${episode} - ${version(hash)}.mkv`;
  const items = () =>
    orm.em.fork().find(TorrentItem, {}, { orderBy: { episode: 'asc' } });
  const queued = (type: string) =>
    orm.em.fork().find(Job, { type, status: JobStatus.Queued });

  beforeEach(async () => {
    hub = await createHub();
    ({ orm, userId } = hub);
  });

  afterEach(async () => {
    await orm.close();
    rmSync(dirs.root, { recursive: true, force: true });
  });

  it('has downloads get the files of active requests and imports them as they complete', async () => {
    await setRequested([1, 2]);
    await select(0, 'pack');
    await settle();

    const pack = hub.engine.running(PACK);
    expect(pack.wanted).toEqual([0, 1]);
    expect(await bindings()).toEqual([
      [1, 'item:1111', null, null],
      [2, 'item:1111', null, null],
    ]);
    expect(await statuses()).toEqual([
      [1, 'downloading', false],
      [2, 'downloading', false],
    ]);

    pack.download(0);
    await settle();

    expect(libraryFiles()).toEqual([episodeFile(1, PACK)]);
    expect(await bindings()).toEqual([
      [1, null, 'file:1111', null],
      [2, 'item:1111', null, null],
    ]);
    expect(
      (await items()).map((i) => [i.episode, !!i.completedAt, !!i.releasedAt]),
    ).toEqual([
      [1, true, true],
      [2, false, false],
    ]);
    expect(await statuses()).toEqual([
      [1, 'available', true],
      [2, 'downloading', false],
    ]);
    expect(pack.wanted).toEqual([1]);
    // The file is held
    expect(await hub.fulfilment.countByMediaFile()).toEqual(
      new Map([[(await orm.em.fork().find(MediaFile, {}))[0].id, 1]]),
    );
  });

  it('gives a request the version the library has, and shares an item between users', async () => {
    await setRequested([1, 2]);
    await select(0, 'pack');
    await settle();
    hub.engine.running(PACK).download(0);
    await settle();

    // The other user wants the same episodes from the same torrent
    await select(0, 'pack', hub.otherId);
    await setRequested([1, 2], true, { user: hub.otherId });
    await settle();

    expect(await bindings(hub.otherId)).toEqual([
      [1, null, 'file:1111', null],
      [2, 'item:1111', null, null],
    ]);
    expect(await items()).toHaveLength(2);
    expect(await hub.fulfilment.countByMediaFile()).toEqual(
      new Map([[(await orm.em.fork().find(MediaFile, {}))[0].id, 2]]),
    );

    // The file is imported once and given to both
    hub.engine.running(PACK).download(1);
    await settle();
    expect(libraryFiles()).toEqual([
      episodeFile(1, PACK),
      episodeFile(2, PACK),
    ]);
    expect(await bindings()).toEqual([
      [1, null, 'file:1111', null],
      [2, null, 'file:1111', null],
    ]);
    expect(await bindings(hub.otherId)).toEqual(await bindings());
    expect(hub.engine.running(PACK)).toBeUndefined();
    expect(existsSync(path.join(dirs.downloads, PACK))).toBe(false);

    // One user letting go changes nothing for the other
    await setRequested([1], false);
    await settle();
    expect(await bindings()).toEqual([[2, null, 'file:1111', null]]);
    expect(await bindings(hub.otherId)).toHaveLength(2);
    expect(await orm.em.fork().count(RequestBinding, {})).toBe(3);
  });

  it('replaces the file of an episode when a torrent is picked for the episode, not for the season', async () => {
    await setRequested([1, 2]);
    await select(0, 'pack');
    await settle();
    hub.engine.running(PACK).download(0);
    await settle();
    expect(await bindings()).toEqual([
      [1, null, 'file:1111', null],
      [2, 'item:1111', null, null],
    ]);

    // Another torrent for the season: the file on disk stays, the download changes
    await select(0, 'otherPack');
    await settle();
    expect(await bindings()).toEqual([
      [1, null, 'file:1111', null],
      [2, 'item:2222', null, null],
    ]);
    expect(hub.engine.running(PACK)).toBeUndefined();
    expect(hub.engine.running(OTHER_PACK).wanted).toEqual([1]);
    expect(
      (await items()).map((i) => [
        i.torrentHash.slice(0, 4),
        i.episode,
        !!i.releasedAt,
      ]),
    ).toEqual([
      [PACK.slice(0, 4), 1, true],
      [PACK.slice(0, 4), 2, true],
      [OTHER_PACK.slice(0, 4), 2, false],
    ]);

    // A torrent for the episode itself replaces its file, which stays until a cleanup
    await select(1, 'episode');
    await settle();
    expect(await bindings()).toEqual([
      [1, 'item:' + EPISODE.slice(0, 4), null, null],
      [2, 'item:2222', null, null],
    ]);
    expect(await hub.fulfilment.countByMediaFile()).toEqual(new Map());
    expect(libraryFiles()).toEqual([episodeFile(1, PACK)]);
    hub.engine.running(EPISODE).download(0);
    await settle();
    expect(libraryFiles()).toEqual(
      [episodeFile(1, EPISODE), episodeFile(1, PACK)].sort(),
    );
    expect(await statuses()).toEqual([
      [1, 'available', true],
      [2, 'downloading', false],
    ]);
  });

  it('lets go of what a request waits for when it is not active or gone, and keeps what it has', async () => {
    await setRequested([1, 2]);
    await select(0, 'pack');
    await settle();
    const pack = hub.engine.running(PACK);
    pack.download(0);
    await settle();

    // Unrequested: the item goes, the torrent stops and its data goes
    await setRequested([2], false);
    await settle();
    expect(await bindings()).toEqual([[1, null, 'file:1111', null]]);
    expect(pack.destroyed).toBe(true);
    expect(existsSync(path.join(dirs.downloads, PACK))).toBe(false);
    expect(await orm.em.fork().count(RequestBinding, {})).toBe(1);

    // Without a source the request is not active, but keeps its file
    await request(() =>
      hub.requests.clearPreference({
        userId,
        tmdbId: TMDB_ID,
        season: 1,
        episode: 0,
      }),
    );
    await settle();
    expect(await bindings()).toEqual([[1, null, 'file:1111', null]]);
    expect(await statuses()).toEqual([[1, 'available', true]]);

    // Deleted: the binding goes, and nothing holds the file
    await setRequested([1], false);
    await settle();
    expect(await orm.em.fork().count(RequestBinding, {})).toBe(0);
    expect(await hub.fulfilment.countByMediaFile()).toEqual(new Map());
    expect(libraryFiles()).toEqual([episodeFile(1, PACK)]);
  });

  it('downloads a file again when the library forgets it', async () => {
    await setRequested([1]);
    await select(0, 'pack');
    await settle();
    hub.engine.running(PACK).download(0);
    await settle();
    expect(await bindings()).toEqual([[1, null, 'file:1111', null]]);

    rmSync(path.join(dirs.library, episodeFile(1, PACK)));
    await request(() =>
      hub.libraryService.scanTitle(MediaType.Series, TMDB_ID),
    );
    await settle();

    expect(await bindings()).toEqual([[1, 'item:1111', null, null]]);
    expect(hub.engine.running(PACK).wanted).toEqual([0]);
    hub.engine.running(PACK).download(0);
    await settle();
    expect(await bindings()).toEqual([[1, null, 'file:1111', null]]);
    expect(libraryFiles()).toEqual([episodeFile(1, PACK)]);
  });

  it('gives a request the file its user picked, once it is in the library', async () => {
    await setRequested([3]);
    await selectFile(3, 'not-a-file');
    await settle();

    expect(await bindings()).toEqual([
      [3, null, null, 'The file is not in the library'],
    ]);
    expect(await statuses()).toEqual([[3, 'failed', false]]);

    const external = path.join(
      dirs.library,
      'Test Show (2020) [tmdbid-100]/Season 1/Test Show - S01E03.mkv',
    );
    mkdirSync(path.dirname(external), { recursive: true });
    const { writeFileSync } = await import('node:fs');
    writeFileSync(external, 'external');
    await request(() =>
      hub.libraryService.scanTitle(MediaType.Series, TMDB_ID),
    );
    const file = await orm.em.fork().findOne(MediaFile, { path: external });

    await selectFile(3, file.id);
    await settle();
    expect(await bindings()).toEqual([[3, null, 'file:external', null]]);
    expect(await statuses()).toEqual([[3, 'available', true]]);

    // A file of another episode is refused
    await selectFile(2, file.id);
    await setRequested([2]);
    await settle();
    expect(await bindings()).toContainEqual([
      2,
      null,
      null,
      'The file is not of this episode',
    ]);
  });

  it('keeps an import that failed on the request and retries it with the torrent', async () => {
    await setRequested([1]);
    await select(0, 'pack');
    await settle();
    const pack = hub.engine.running(PACK);

    // The library folder is gone while the file completes
    renameSync(dirs.library, path.join(dirs.root, 'disk'));
    pack.download(0);
    await settle();

    expect(await bindings()).toEqual([
      [1, 'item:1111', null, expect.stringMatching(/^Import failed: /)],
    ]);
    expect(await statuses()).toEqual([[1, 'failed', false]]);
    // The data stays for the import
    expect(existsSync(path.join(dirs.downloads, PACK))).toBe(true);

    renameSync(path.join(dirs.root, 'disk'), dirs.library);
    await orm.em.fork().nativeDelete(Job, {});
    await request(() =>
      orm.em.transactional((tx) =>
        hub.jobs.enqueue(tx, 'downloads.reconcileTorrent', { infoHash: PACK }),
      ),
    );
    await settle();

    expect(await bindings()).toEqual([[1, null, 'file:1111', null]]);
    expect(existsSync(path.join(dirs.downloads, PACK))).toBe(false);
  });

  it('sweeps the active requests that are bound to nothing and the bindings of requests that are gone', async () => {
    await setRequested([1, 2]);
    await select(0, 'pack');
    await orm.em.fork().nativeDelete(Job, {});
    const em = orm.em.fork();
    const [first, second] = await em.find(
      MediaRequest,
      {},
      { orderBy: { episode: 'asc' } },
    );
    await em.insert(RequestBinding, {
      requestId: 'gone',
      torrentItemId: 'item',
      updatedAt: new Date(),
    });
    await em.insert(RequestBinding, {
      requestId: second.id,
      mediaFileId: 'some-file',
      updatedAt: new Date(),
    });

    await hub.fulfilment.sweep();

    expect(
      (await queued('library.reconcileRequest'))
        .map((job) => job.payload.requestId)
        .sort(),
    ).toEqual([first.id, 'gone'].sort());
    await settle();
    expect(
      await orm.em.fork().count(RequestBinding, { requestId: 'gone' }),
    ).toBe(0);
  });
});
