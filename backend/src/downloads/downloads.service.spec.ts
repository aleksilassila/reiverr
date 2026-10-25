import { RequestContext } from '@mikro-orm/core';
import { MikroORM } from '@mikro-orm/sqlite';
import { existsSync, rmSync } from 'node:fs';
import * as path from 'node:path';
import parseTorrent from 'parse-torrent';
import { FakeEngine, magnetFiles } from '../../test/fake-engine.js';
import { createTorrent } from '../../test/torrent-fixture.js';
import { MediaType } from '../common/common.dto.js';
import { Job, JobStatus } from '../jobs/job.entity.js';
import { JobsService } from '../jobs/jobs.service.js';
import mikroOrmConfig from '../mikro-orm.config.js';
import { LogEntry } from '../server-log/log-entry.entity.js';
import { ServerLogService } from '../server-log/server-log.service.js';
import { SettingsService } from '../settings/settings.service.js';
import { DownloadsService } from './downloads.service.js';
import { TorrentItem } from './torrent-item.entity.js';
import { TorrentRuntime } from './torrent-runtime.js';
import { Torrent } from './torrent.entity.js';

// The downloads directory is read from the environment when the app is imported
const dirs = await vi.hoisted(async () => {
  const { mkdtempSync } = await import('node:fs');
  const { tmpdir } = await import('node:os');
  const { join } = await import('node:path');

  const root = mkdtempSync(join(tmpdir(), 'reiverr-downloads-'));
  process.env.DOWNLOADS_DIR = join(root, 'downloads');

  return { root, downloads: join(root, 'downloads') };
});

const PACK_MAGNET =
  'magnet:?xt=urn:btih:1111111111111111111111111111111111111111';
const PACK = parseTorrent(PACK_MAGNET).infoHash;
const EPISODE_TORRENT = createTorrent('Test.Show.S01E02.1080p.WEB-GRP', [
  { name: 'release-group-1080p.mkv', data: Buffer.alloc(50, 'a') },
  { name: 'readme.txt', data: Buffer.alloc(1, 'b') },
]);
const EPISODE = parseTorrent(EPISODE_TORRENT).infoHash;

magnetFiles[PACK] = [
  { path: 'Test.Show.S01/Test.Show.S01E01.1080p.mkv', length: 100 },
  { path: 'Test.Show.S01/Test.Show.S01E02.1080p.mkv', length: 100 },
  { path: 'Test.Show.S01/info.nfo', length: 1 },
];

const SUBS_MAGNET =
  'magnet:?xt=urn:btih:2222222222222222222222222222222222222222';
const SUBS = parseTorrent(SUBS_MAGNET).infoHash;
magnetFiles[SUBS] = [
  { path: 'Test.Show.S01/Test.Show.S01E01.mkv', length: 100 },
  { path: 'Test.Show.S01/Subs/Test.Show.S01E01/2_English.srt', length: 5 },
  { path: 'Test.Show.S01/Test.Show.S01E02.mkv', length: 100 },
  { path: 'Test.Show.S01/Test.Show.S01E02.en.srt', length: 5 },
];

const packRelease = {
  infoHash: PACK,
  title: 'Test.Show.S01.1080p.WEB-GRP',
  indexer: 'test',
  size: 1000,
  magnetUrl: PACK_MAGNET,
};
const subsRelease = {
  infoHash: SUBS,
  title: 'Test.Show.S01.1080p.WEB-SUBS',
  indexer: 'test',
  size: 1000,
  magnetUrl: SUBS_MAGNET,
};
const episodeRelease = {
  infoHash: EPISODE,
  title: 'Test.Show.S01E02.1080p.WEB-GRP',
  indexer: 'test',
  size: 50,
  torrentFile: EPISODE_TORRENT,
};

const item = (episode: number, onlyVideo = false) => ({
  mediaType: MediaType.Series,
  tmdbId: '100',
  season: 1,
  episode,
  onlyVideo,
});

describe('DownloadsService', () => {
  let orm: MikroORM;
  let engine: FakeEngine;
  let jobs: JobsService;
  let runtime: TorrentRuntime;
  let downloads: DownloadsService;
  let seedRatio = 0;

  const request = <T>(run: () => Promise<T>) =>
    RequestContext.create(orm.em, run);
  const settle = () => jobs.drain();
  const inTx = <T>(run: (tx: MikroORM['em']) => Promise<T>) =>
    request(() => orm.em.transactional(run));

  const wantItem = (infoHash: string, wanted: ReturnType<typeof item>) =>
    inTx((tx) => downloads.requestItem(tx, infoHash, wanted));
  const items = () =>
    orm.em.fork().find(TorrentItem, {}, { orderBy: { episode: 'asc' } });
  const describeItems = async () => {
    const ids = (await items()).map((row) => row.id);
    const described = await request(() => downloads.describeItems(orm.em, ids));

    return described
      .sort((a, b) => a.episode - b.episode)
      .map((dto) => [
        dto.episode,
        dto.status,
        dto.progress ?? null,
        dto.error ?? null,
      ]);
  };
  const imports = async () =>
    (
      await orm.em.fork().find(Job, {
        type: 'library.importItem',
        status: JobStatus.Queued,
      })
    ).map((job) => job.payload.itemId);
  const directory = (infoHash: string) => path.join(dirs.downloads, infoHash);

  beforeEach(async () => {
    orm = await MikroORM.init({ ...mikroOrmConfig, dbName: ':memory:' });
    await orm.migrator.up();
    rmSync(dirs.downloads, { recursive: true, force: true });

    engine = new FakeEngine();
    jobs = new JobsService(orm.em);
    const settings = new SettingsService(orm.em);
    await request(() => settings.saveValue('downloads', { seedRatio }));
    runtime = new TorrentRuntime(orm.em, jobs, settings, engine);
    downloads = new DownloadsService(
      orm.em,
      settings,
      new ServerLogService(orm.em, settings),
      jobs,
      runtime,
    );
    downloads.onModuleInit();
  });

  afterEach(async () => {
    seedRatio = 0;
    await orm.close();
  });

  it('knows a torrent at once and downloads the files of the items wanted of it', async () => {
    await inTx((tx) => downloads.ensureTorrent(tx, packRelease));
    expect(await orm.em.fork().find(Torrent, {})).toMatchObject([
      { infoHash: PACK, title: packRelease.title, files: null },
    ]);
    expect(engine.torrents).toEqual([]);

    // The files of a magnet link are known once the torrent runs
    const first = await wantItem(PACK, item(1));
    expect(first).toMatchObject({ torrentHash: PACK, episode: 1 });
    expect(first.fileIndex).toBeFalsy();
    expect(await describeItems()).toEqual([[1, 'resolving', null, null]]);
    await settle();

    expect(engine.running(PACK).wanted).toEqual([0]);
    expect(await describeItems()).toEqual([[1, 'downloading', 0.5, null]]);
    expect(await downloads.describeTorrents()).toMatchObject([
      {
        infoHash: PACK,
        status: 'downloading',
        peers: 3,
        items: [{ episode: 1 }],
      },
    ]);

    // Another item of the same torrent, and one the torrent has no file for
    await wantItem(PACK, item(2));
    await wantItem(PACK, item(3));
    await settle();
    expect(engine.running(PACK).wanted).toEqual([0, 1]);
    expect(await describeItems()).toEqual([
      [1, 'downloading', 0.5, null],
      [2, 'downloading', 0.5, null],
      [3, 'no-match', null, 'The torrent has no file for this episode'],
    ]);
    // Wanted again, an item is the one there is
    expect((await wantItem(PACK, item(2))).id).toBe((await items())[1].id);
  });

  it('matches the only video of a torrent picked for an episode, from a .torrent file at once', async () => {
    await inTx((tx) => downloads.ensureTorrent(tx, episodeRelease));
    expect(
      (await orm.em.fork().findOne(Torrent, { infoHash: EPISODE })).files,
    ).toHaveLength(2);

    await wantItem(EPISODE, item(3));
    await settle();
    expect(await describeItems()).toEqual([
      [3, 'no-match', null, 'The torrent has no file for this episode'],
    ]);
    expect(engine.running(EPISODE)).toBeUndefined();

    await wantItem(EPISODE, item(3, true));
    await settle();
    expect(await describeItems()).toEqual([[3, 'downloading', 0.5, null]]);
    expect(engine.running(EPISODE).wanted).toEqual([0]);
    expect(
      await downloads.describeItems(orm.em, [(await items())[0].id]),
    ).toMatchObject([{ fileName: 'release-group-1080p.mkv' }]);
  });

  it('tells the library about a complete item and keeps the data until the item is released', async () => {
    await inTx((tx) => downloads.ensureTorrent(tx, packRelease));
    const wanted = await wantItem(PACK, item(1));
    await settle();
    const pack = engine.running(PACK);

    pack.download(0);
    await settle();

    expect(await describeItems()).toEqual([[1, 'complete', null, null]]);
    expect(await imports()).toEqual([wanted.id]);
    expect(
      await request(() => downloads.getItemFile(orm.em, wanted.id)),
    ).toEqual({
      path: path.join(
        directory(PACK),
        'Test.Show.S01/Test.Show.S01E01.1080p.mkv',
      ),
      name: 'Test.Show.S01E01.1080p.mkv',
      subtitles: [],
    });
    // Nothing downloads and nothing seeds: the engine stops, the data stays
    expect(pack.destroyed).toBe(true);
    expect(existsSync(directory(PACK))).toBe(true);
    expect(await downloads.describeTorrents()).toMatchObject([
      { status: 'stopped', downloadedBytes: 100 },
    ]);

    await inTx((tx) => downloads.releaseItem(tx, wanted.id));
    await settle();

    expect(await describeItems()).toEqual([[1, 'released', null, null]]);
    expect(existsSync(directory(PACK))).toBe(false);
    expect(await downloads.describeTorrents()).toMatchObject([
      { status: 'idle', downloadedBytes: 0 },
    ]);
    expect(await orm.em.fork().find(LogEntry, {})).toMatchObject([
      {
        type: 'download.deleted',
        message: `Deleted the downloaded data of "${packRelease.title}"`,
        data: { infoHash: PACK },
      },
    ]);

    // Wanted again, the item starts over
    await orm.em.fork().nativeDelete(Job, {});
    const again = await wantItem(PACK, item(1));
    expect(again).toMatchObject({
      id: wanted.id,
      releasedAt: null,
      completedAt: null,
    });
    await settle();
    expect(engine.running(PACK).wanted).toEqual([0]);
    expect(await describeItems()).toEqual([[1, 'downloading', 0.5, null]]);
  });

  it('downloads the subtitles of an item with its file, while the setting is on', async () => {
    await inTx((tx) => downloads.ensureTorrent(tx, subsRelease));
    const wanted = await wantItem(SUBS, item(1));
    await settle();
    const subs = engine.running(SUBS);
    expect(subs.wanted).toEqual([0, 1]);
    expect((await items())[0].subtitleFileIndexes).toEqual([1]);

    // Complete with its subtitles only
    subs.download(0);
    await settle();
    expect(await describeItems()).toEqual([[1, 'downloading', 1, null]]);
    expect(await imports()).toEqual([]);

    subs.download(1);
    await settle();
    expect(await describeItems()).toEqual([[1, 'complete', null, null]]);
    expect(await imports()).toEqual([wanted.id]);
    expect(
      await request(() => downloads.getItemFile(orm.em, wanted.id)),
    ).toEqual({
      path: path.join(directory(SUBS), 'Test.Show.S01/Test.Show.S01E01.mkv'),
      name: 'Test.Show.S01E01.mkv',
      subtitles: [
        {
          path: path.join(
            directory(SUBS),
            'Test.Show.S01/Subs/Test.Show.S01E01/2_English.srt',
          ),
          name: '2_English.srt',
        },
      ],
    });

    // An item matched while the setting is off downloads its file alone
    await downloads.updateSettings({ seedRatio: 0, downloadSubtitles: false });
    await wantItem(SUBS, item(2));
    await settle();
    const second = (await items())[1];
    expect(engine.running(SUBS).wanted).toEqual([0, 1, 2]);
    expect(second.subtitleFileIndexes).toEqual([]);
    expect(
      await request(() => downloads.getItemFile(orm.em, second.id)),
    ).toMatchObject({ name: 'Test.Show.S01E02.mkv', subtitles: [] });
  });

  it('seeds until the ratio is reached', async () => {
    seedRatio = 2;
    await request(() =>
      new SettingsService(orm.em).saveValue('downloads', { seedRatio }),
    );
    await inTx((tx) => downloads.ensureTorrent(tx, packRelease));
    const wanted = await wantItem(PACK, item(1));
    await settle();
    const pack = engine.running(PACK);
    pack.download(0);
    pack.stats.uploaded = 50;
    await inTx((tx) => downloads.releaseItem(tx, wanted.id));
    await settle();

    expect(pack.destroyed).toBe(false);
    expect(pack.wanted).toEqual([]);
    expect(await downloads.describeTorrents()).toMatchObject([
      { status: 'seeding', downloadedBytes: 100, uploadedBytes: 50 },
    ]);

    pack.stats.uploaded = 200;
    await runtime.flush();
    await settle();

    expect(pack.destroyed).toBe(true);
    expect(existsSync(directory(PACK))).toBe(false);
  });

  it('keeps the error of a torrent that failed until it is picked or needed again', async () => {
    await inTx((tx) => downloads.ensureTorrent(tx, packRelease));
    const wanted = await wantItem(PACK, item(1));
    await settle();
    const pack = engine.running(PACK);

    pack.fail(new Error('no peers'));
    await settle();

    expect(pack.destroyed).toBe(true);
    expect(await describeItems()).toEqual([[1, 'failed', null, 'no peers']]);
    expect(await downloads.describeTorrents()).toMatchObject([
      { status: 'failed', error: 'no peers' },
    ]);
    // Another item changes nothing
    await wantItem(PACK, item(2));
    await settle();
    expect(engine.running(PACK)).toBeUndefined();

    // Picked again, the torrent has another go
    await inTx((tx) => downloads.ensureTorrent(tx, packRelease));
    await settle();
    expect(engine.running(PACK).wanted).toEqual([0, 1]);
    expect(await describeItems()).toEqual([
      [1, 'downloading', 0.5, null],
      [2, 'downloading', 0.5, null],
    ]);

    // So does an item that is wanted again after it was released
    engine.running(PACK).fail(new Error('no peers'));
    await settle();
    await inTx((tx) => downloads.releaseItem(tx, wanted.id));
    await settle();
    expect(engine.running(PACK)).toBeUndefined();
    expect(
      (await orm.em.fork().findOne(Torrent, { infoHash: PACK })).error,
    ).toBe('no peers');
  });

  it('purges the torrents that nothing wants', async () => {
    await inTx((tx) => downloads.ensureTorrent(tx, packRelease));
    await inTx((tx) => downloads.ensureTorrent(tx, episodeRelease));
    await wantItem(EPISODE, item(2, true));

    await downloads.purgeTorrents();

    expect(
      (await orm.em.fork().find(Torrent, {})).map((t) => t.infoHash),
    ).toEqual([EPISODE]);
  });
});
