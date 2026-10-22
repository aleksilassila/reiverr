import { MikroORM } from '@mikro-orm/core';
import { MIKRO_ORM_MODULE_OPTIONS } from '@mikro-orm/nestjs';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import {
  existsSync,
  mkdirSync,
  readdirSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { createServer, Server } from 'node:http';
import { AddressInfo } from 'node:net';
import * as path from 'node:path';
import parseTorrent from 'parse-torrent';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module.js';
import { TORRENT_ENGINE } from '../src/downloads/torrent-engine.js';
import { TorrentItem } from '../src/downloads/torrent-item.entity.js';
import { TorrentRuntime } from '../src/downloads/torrent-runtime.js';
import { Torrent } from '../src/downloads/torrent.entity.js';
import { ReleaseDto } from '../src/indexers/indexers.dto.js';
import { JobsService } from '../src/jobs/jobs.service.js';
import { DeletionService } from '../src/library/deletion.service.js';
import { SeriesStatusDto } from '../src/library/library.dto.js';
import { MediaFile } from '../src/library/media-file.entity.js';
import { RequestBinding } from '../src/library/request-binding.entity.js';
import { ScanService } from '../src/library/scan.service.js';
import { SeriesMetadata } from '../src/metadata/metadata.entity.js';
import mikroOrmConfig from '../src/mikro-orm.config.js';
import { MediaRequest } from '../src/requests/request.entity.js';
import { RequestRuleDto } from '../src/requests/requests.dto.js';
import { LogEntry, LogType } from '../src/server-log/log-entry.entity.js';
import { FakeEngine, magnetFiles } from './fake-engine.js';
import { createTorrent } from './torrent-fixture.js';

// The downloads directory is read from the environment when the app is imported
const dirs = await vi.hoisted(async () => {
  const { mkdtempSync } = await import('node:fs');
  const { tmpdir } = await import('node:os');
  const { join } = await import('node:path');

  const root = mkdtempSync(join(tmpdir(), 'reiverr-downloads-'));
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
const REDIRECT_MAGNET =
  'magnet:?xt=urn:btih:3333333333333333333333333333333333333333';
const EPISODE_TORRENT = createTorrent('Test.Show.S01E02.1080p.WEB-GRP', [
  { name: 'release-group-1080p.mkv', data: Buffer.alloc(50, 'a') },
  { name: 'readme.txt', data: Buffer.alloc(1, 'b') },
]);
const SEASON_2_TORRENT = createTorrent('Test.Show.S02', [
  { name: 'Test Show 2x01.mkv', data: Buffer.alloc(50, 'c') },
]);

const infoHash = (source: string | Buffer): string =>
  parseTorrent(source).infoHash;

const PACK = infoHash(PACK_MAGNET);
const REDIRECT = infoHash(REDIRECT_MAGNET);
const EPISODE = infoHash(EPISODE_TORRENT);
const SEASON_2 = infoHash(SEASON_2_TORRENT);

// Imported files carry the start of the info hash as their version label
const version = (hash: string) => hash.slice(0, 8);

// A magnet link does not say which files the torrent has, its peers do
magnetFiles[PACK] = [
  { path: 'Test.Show.S01/Test.Show.S01E01.1080p.mkv', length: 100 },
  { path: 'Test.Show.S01/Test.Show.S01E02.1080p.mkv', length: 100 },
  { path: 'Test.Show.S01/Test.Show.S01E03.1080p.mkv', length: 100 },
  { path: 'Test.Show.S01/Sample/Test.Show.S01E01.sample.mkv', length: 10 },
  { path: 'Test.Show.S01/info.nfo', length: 1 },
];
magnetFiles[REDIRECT] = [{ path: 'Other.Show.S09E09.mkv', length: 50 }];

const item = (title: string, link: string, seeders: number) => `<item>
  <title>${title}</title>
  <guid>${title}</guid>
  <size>1000</size>
  <link>${link}</link>
  <torznab:attr name="seeders" value="${seeders}" />
  <torznab:attr name="peers" value="${seeders + 5}" />
</item>`;

function startIndexer(): Promise<{
  server: Server;
  url: string;
  requests: URL[];
}> {
  const requests: URL[] = [];

  const server = createServer((req, res) => {
    const url = new URL(req.url, 'http://localhost');
    const origin = `http://localhost:${(server.address() as AddressInfo).port}`;
    requests.push(url);

    if (url.pathname === '/dl/episode') return res.end(EPISODE_TORRENT);
    if (url.pathname === '/dl/other') return res.end(SEASON_2_TORRENT);
    if (url.pathname === '/dl/broken') return res.end('<html>Sign in</html>');
    if (url.pathname === '/dl/redirect') {
      return res.writeHead(302, { Location: REDIRECT_MAGNET }).end();
    }
    if (url.searchParams.get('apikey') !== 'secret') {
      return res.end('<error code="100" description="Invalid API Key" />');
    }
    if (url.searchParams.get('t') === 'caps') {
      return res.end(`<caps><searching>
        <search available="yes" supportedParams="q" />
        <tv-search available="yes" supportedParams="q,season,ep,tmdbid" />
      </searching></caps>`);
    }

    res.end(`<rss xmlns:torznab="http://torznab.com/schemas/2015/feed"><channel>
      ${item('Test.Show.S01.1080p.WEB-GRP', PACK_MAGNET.replace(/&/g, '&amp;'), 50)}
      ${item('Test.Show.S02.1080p.WEB-GRP', `${origin}/dl/other`, 40)}
      ${item('Test.Show.S01E02.1080p.WEB-GRP', `${origin}/dl/episode`, 9)}
      ${item('Test.Show.S01E02.720p.WEB-GRP', `${origin}/dl/redirect`, 30)}
      ${item('Test.Show.S01E03.1080p.WEB-GRP', `${origin}/dl/broken`, 20)}
    </channel></rss>`);
  });

  return new Promise((resolve) =>
    server.listen(0, () =>
      resolve({
        server,
        url: `http://localhost:${(server.address() as AddressInfo).port}/torznab/`,
        requests,
      }),
    ),
  );
}

interface TestUser {
  id: string;
  token: string;
}

describe('Series downloads (e2e)', () => {
  let app: INestApplication<App>;
  let engine: FakeEngine;
  let indexer: Awaited<ReturnType<typeof startIndexer>>;
  let admin: TestUser;
  let viewer: TestUser;

  const api = (
    method: 'get' | 'put' | 'post' | 'delete',
    url: string,
    user = admin,
  ) =>
    request(app.getHttpServer())
      [method](url)
      .set('Authorization', `Bearer ${user.token}`);

  const preferencesUrl = (user = admin) =>
    `/users/${user.id}/requests/series/${TMDB_ID}/preferences`;

  const signIn = (name: string): Promise<TestUser> =>
    request(app.getHttpServer())
      .post('/auth')
      .send({ name, password: 'password' })
      .expect(200)
      .then((res) => ({ id: res.body.user.id, token: res.body.accessToken }));

  const getStatus = (user = admin): Promise<SeriesStatusDto> =>
    api('get', `/library/series/${TMDB_ID}/status`, user)
      .expect(200)
      .then((res) => res.body);

  const search = (query: string): Promise<ReleaseDto[]> =>
    api('get', `/indexers/search/series/${TMDB_ID}?${query}`)
      .expect(200)
      .then((res) => res.body);

  const setRequested = (
    episodes: number[],
    requested: boolean,
    { season = 1, user = admin } = {},
  ) =>
    api('put', `/users/${user.id}/requests/series/${TMDB_ID}`, user)
      .send({
        episodes: episodes.map((episode) => ({ season, episode })),
        requested,
      })
      .expect(200);

  /** Selects the release with the given title for season 1, or for an episode of it */
  async function select(
    title: string,
    { episode = 0, user = admin, status = 200 } = {},
  ) {
    const releases = await search(
      episode ? `season=1&episode=${episode}` : 'season=1',
    );
    const target = episode ? `seasons/1/episodes/${episode}` : 'seasons/1';

    return api('put', `${preferencesUrl(user)}/${target}`, user)
      .send({ releaseId: releases.find((r) => r.title === title).id })
      .expect(status);
  }

  /** Forgets the release a user picked for a season, or for an episode of it */
  const clearSelection = (season: number, episode = 0, user = admin) =>
    api(
      'delete',
      `${preferencesUrl(user)}/seasons/${season}${episode ? `/episodes/${episode}` : ''}`,
      user,
    );

  const statuses = (status: SeriesStatusDto) =>
    status.episodes.map((e) => [e.season, e.episode, e.status ?? null]);

  const em = () => app.get(MikroORM).em.fork();

  /**
   * What the requests of a user wait for or have: the info hash of the
   * torrent of their item and of the torrent that their file came from
   */
  async function references(user = admin) {
    const requests = await em().find(
      MediaRequest,
      { userId: user.id },
      { orderBy: { season: 'asc', episode: 'asc' } },
    );
    const bindings = await em().find(RequestBinding, {});
    const items = await em().find(TorrentItem, {});
    const files = await em().find(MediaFile, {});

    // A reference to a row that is gone would show as undefined
    return requests.map((request) => {
      const binding = bindings.find((b) => b.requestId === request.id);

      return [
        request.season,
        request.episode,
        binding?.torrentItemId
          ? items.find((i) => i.id === binding.torrentItemId)?.torrentHash
          : null,
        binding?.mediaFileId
          ? files.find((f) => f.id === binding.mediaFileId)?.infoHash
          : null,
      ];
    });
  }

  // The jobs run where the loop would run them
  const settle = () => app.get(JobsService).drain();

  /** The 04:00 crons, with the scans and the cleanup jobs they queue */
  async function cleanUp() {
    await app.get(ScanService).scanNightly();
    await app.get(DeletionService).onCleanupHour();
    await app.get(JobsService).drain();
  }

  const libraryFiles = () =>
    existsSync(dirs.library)
      ? (readdirSync(dirs.library, { recursive: true }) as string[])
          .filter((file) => file.endsWith('.mkv'))
          .sort()
      : [];

  const episodeFile = (episode: number, hash: string) =>
    `Test Show (2020) [tmdbid-100]/Season 1/Test Show - S01E0${episode} - ${version(hash)}.mkv`;

  async function startApp() {
    engine = new FakeEngine();

    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(MIKRO_ORM_MODULE_OPTIONS)
      .useValue({
        ...mikroOrmConfig,
        dbName: path.join(dirs.root, 'db.sqlite'),
      })
      .overrideProvider(TORRENT_ENGINE)
      .useValue(engine)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.get(MikroORM).migrator.up();
    await app.init();
  }

  beforeAll(async () => {
    indexer = await startIndexer();
    mkdirSync(dirs.library);
    await startApp();

    await em().insert(
      SeriesMetadata,
      SeriesMetadata.from({
        id: Number(TMDB_ID),
        name: 'Test Show',
        first_air_date: '2020-01-01',
        seasons: [1, 2].map((season_number) => ({
          season_number,
          episodes: [1, 2, 3].map((episode_number) => ({ episode_number })),
        })),
      } as any),
    );

    admin = await signIn('admin');
    await api('post', '/users')
      .send({ name: 'viewer', password: 'password', isAdmin: false })
      .expect(201);
    viewer = await signIn('viewer');

    await api('put', '/library/settings')
      .send({
        movieFolders: [],
        seriesFolders: [dirs.library],
        cleanup: 'daily',
      })
      .expect(200);
  });

  afterAll(async () => {
    await app.close();
    indexer.server.close();
    rmSync(dirs.root, { recursive: true, force: true });
  });

  it('rejects an indexer that does not answer with capabilities', async () => {
    const res = await api('put', '/indexers')
      .send({ indexers: [{ name: 'Fake', url: indexer.url, apiKey: 'wrong' }] })
      .expect(400);

    expect(res.body.message).toBe('Fake: Invalid API Key');
  });

  it('saves a working indexer', async () => {
    const res = await api('put', '/indexers')
      .send({
        indexers: [{ name: 'Fake', url: indexer.url, apiKey: 'secret' }],
      })
      .expect(200);

    expect(res.body.indexers).toMatchObject([
      { name: 'Fake', url: indexer.url },
    ]);
    expect(res.body.indexers[0].id).toBeTruthy();
  });

  it('lists only season packs for a season', async () => {
    const releases = await search('season=1');

    expect(releases.map((r) => r.title)).toEqual([
      'Test.Show.S01.1080p.WEB-GRP',
    ]);
    expect(releases[0]).toMatchObject({
      seeders: 50,
      peers: 55,
      size: 1000,
      indexer: 'Fake',
      infoHash: PACK,
      seasons: [1],
      episodes: [],
    });
    // Download links carry the API key of the indexer
    expect(JSON.stringify(releases)).not.toContain('magnet:');
  });

  it('lists the releases of an episode, most seeded first', async () => {
    const releases = await search('season=1&episode=2');

    expect(releases.map((r) => r.title)).toEqual([
      'Test.Show.S01E02.720p.WEB-GRP',
      'Test.Show.S01E02.1080p.WEB-GRP',
    ]);
  });

  it('does not download when a torrent is selected but nothing is requested', async () => {
    await select('Test.Show.S01.1080p.WEB-GRP');
    await settle();

    expect(engine.torrents).toEqual([]);
    // The release is kept, nothing knows the torrent yet
    expect(await em().count(Torrent, {})).toBe(0);

    const status = await getStatus();
    expect(status.preferences).toMatchObject([
      {
        season: 1,
        episode: 0,
        torrent: {
          title: 'Test.Show.S01.1080p.WEB-GRP',
          infoHash: PACK,
          status: 'idle',
        },
      },
    ]);
    expect(status.episodes).toEqual([]);
    // A torrent that nothing downloads from is not on the server
    expect(status.onServer).toEqual([]);
  });

  it('does not download a requested episode without a torrent', async () => {
    await setRequested([1], true, { season: 2 });
    await settle();

    expect(engine.torrents).toEqual([]);
    expect((await getStatus()).episodes).toEqual([
      {
        season: 2,
        episode: 1,
        requested: true,
        onDisk: false,
        status: 'no-preference',
      },
    ]);

    await setRequested([1], false, { season: 2 });
  });

  it('downloads only the requested episodes of a season pack', async () => {
    await setRequested([1, 2], true);
    // The files of a magnet link are known once the torrent runs
    await settle();

    expect(engine.running(PACK).wanted).toEqual([0, 1]);

    const status = await getStatus();
    expect(status.episodes).toMatchObject([
      {
        season: 1,
        episode: 1,
        requested: true,
        onDisk: false,
        status: 'downloading',
        progress: 0.5,
        torrent: { infoHash: PACK, status: 'downloading' },
      },
      {
        season: 1,
        episode: 2,
        requested: true,
        onDisk: false,
        status: 'downloading',
        progress: 0.5,
        torrent: { infoHash: PACK },
      },
    ]);
    // The requests wait for items of the torrent and have no file yet
    expect(await references()).toEqual([
      [1, 1, PACK, null],
      [1, 2, PACK, null],
    ]);
    expect(status.preferences[0].torrent).toMatchObject({
      status: 'downloading',
      peers: 3,
    });
    expect(status.onServer).toEqual([PACK]);
  });

  it('moves a request that has no file yet to the torrent that is selected for its episode', async () => {
    await select('Test.Show.S01E02.1080p.WEB-GRP', { episode: 2 });
    await settle();

    expect(engine.running(PACK).wanted).toEqual([0]);
    // The only video of an episode torrent is used, whatever it is called
    expect(engine.running(EPISODE).wanted).toEqual([0]);
    expect(await references()).toEqual([
      [1, 1, PACK, null],
      [1, 2, EPISODE, null],
    ]);
  });

  it('imports finished episodes as versions with hard links and releases finished torrents', async () => {
    const pack = engine.running(PACK);
    const episode = engine.running(EPISODE);

    episode.download(0);
    await settle();

    expect(libraryFiles()).toEqual([episodeFile(2, EPISODE)]);
    expect(episode.destroyed).toBe(true);
    expect(existsSync(episode.directory)).toBe(false);
    expect(pack.destroyed).toBe(false);

    const source = pack.getFilePath(0);
    pack.download(0);
    const inode = statSync(source).ino;
    await settle();

    expect(libraryFiles()).toEqual([
      episodeFile(1, PACK),
      episodeFile(2, EPISODE),
    ]);
    expect(statSync(path.join(dirs.library, libraryFiles()[0])).ino).toBe(
      inode,
    );
    expect(pack.destroyed).toBe(true);
    expect(existsSync(pack.directory)).toBe(false);
    expect(
      await em().find(LogEntry, { type: LogType.DownloadDeleted }),
    ).toMatchObject([
      {
        message:
          'Deleted the downloaded data of "Test.Show.S01E02.1080p.WEB-GRP"',
        data: { infoHash: EPISODE },
      },
      {
        message: 'Deleted the downloaded data of "Test.Show.S01.1080p.WEB-GRP"',
        data: { directory: pack.directory, infoHash: PACK },
      },
    ]);

    const status = await getStatus();
    expect(status.episodes).toMatchObject([
      {
        season: 1,
        episode: 1,
        requested: true,
        onDisk: true,
        status: 'available',
        torrent: { infoHash: PACK },
      },
      {
        season: 1,
        episode: 2,
        requested: true,
        onDisk: true,
        status: 'available',
        torrent: { infoHash: EPISODE },
      },
    ]);
    // The requests have the files, and wait for no item any more
    expect(await references()).toEqual([
      [1, 1, null, PACK],
      [1, 2, null, EPISODE],
    ]);
    expect(status.preferences.map((s) => s.torrent)).toMatchObject([
      { infoHash: PACK, status: 'idle', downloadedBytes: 0 },
      { infoHash: EPISODE, status: 'idle', downloadedBytes: 0 },
    ]);
    // The torrents the files came from are on the server
    expect(status.onServer.sort()).toEqual([PACK, EPISODE].sort());

    const files = await api('get', `/library/series/${TMDB_ID}`).expect(200);
    expect(files.body.map((file) => [file.season, file.episodes])).toEqual([
      [1, [1]],
      [1, [2]],
    ]);
    const stream = await api(
      'get',
      `/library/files/${files.body[0].id}/stream`,
    ).expect(200);
    expect(stream.body.toString()).toBe('video 0');

    const indexed = await em().find(
      MediaFile,
      {},
      { orderBy: { episode: 'asc' } },
    );
    expect(indexed.map((file) => [file.managed, file.infoHash])).toEqual([
      [true, PACK],
      [true, EPISODE],
    ]);
  });

  it('replaces the version of an episode when another torrent is selected for it', async () => {
    // The download link of this release redirects to a magnet link
    await select('Test.Show.S01E02.720p.WEB-GRP', { episode: 2 });
    await settle();

    const other = engine.running(REDIRECT);
    expect(other.wanted).toEqual([0]);
    expect(statuses(await getStatus())).toEqual([
      [1, 1, 'available'],
      [1, 2, 'downloading'],
    ]);
    // The request let go of the file it had
    expect(await references()).toEqual([
      [1, 1, null, PACK],
      [1, 2, REDIRECT, null],
    ]);

    other.download(0);
    await settle();

    expect(libraryFiles()).toEqual(
      [
        episodeFile(1, PACK),
        episodeFile(2, EPISODE),
        episodeFile(2, REDIRECT),
      ].sort(),
    );
    expect(statuses(await getStatus())).toEqual([
      [1, 1, 'available'],
      [1, 2, 'available'],
    ]);
    expect(await references()).toEqual([
      [1, 1, null, PACK],
      [1, 2, null, REDIRECT],
    ]);

    // Nothing holds the first version any more. Its file stays until a
    // cleanup and still tells search results that this release is on the server.
    expect((await getStatus()).onServer.sort()).toEqual(
      [PACK, REDIRECT, EPISODE].sort(),
    );
  });

  it('keeps the files of a season when another torrent is selected for the season', async () => {
    const selectForSeason = (releaseId: string) =>
      api('put', `${preferencesUrl()}/seasons/1`)
        .send({ releaseId })
        .expect(200);
    const releases = await search('season=1&episode=2');

    await selectForSeason(
      releases.find((r) => r.title === 'Test.Show.S01E02.1080p.WEB-GRP').id,
    );
    await settle();

    expect(engine.running(EPISODE)).toBeUndefined();
    expect(await references()).toEqual([
      [1, 1, null, PACK],
      [1, 2, null, REDIRECT],
    ]);

    // The request shows the torrent it has its file from, not the selected one
    const status = await getStatus();
    expect(statuses(status)).toEqual([
      [1, 1, 'available'],
      [1, 2, 'available'],
    ]);
    expect(status.preferences[0].torrent.infoHash).toBe(EPISODE);
    expect(status.episodes[0].torrent.infoHash).toBe(PACK);

    await select('Test.Show.S01.1080p.WEB-GRP');
    await settle();
    expect(engine.running(PACK)).toBeUndefined();
  });

  it('fails a selection whose download link does not lead to a torrent', async () => {
    const res = await select('Test.Show.S01E03.1080p.WEB-GRP', {
      episode: 3,
      status: 502,
    });

    expect(res.body.message).toContain(
      'Could not get the torrent of "Test.Show.S01E03.1080p.WEB-GRP"',
    );
    expect((await getStatus()).preferences).toHaveLength(2);
  });

  it('stops downloading an episode that is no longer requested', async () => {
    await setRequested([3], true);
    await settle();
    expect(engine.running(PACK).wanted).toEqual([2]);

    await setRequested([3], false);
    await settle();
    expect(engine.running(PACK)).toBeUndefined();
    expect(existsSync(path.join(dirs.downloads, PACK))).toBe(false);
  });

  it('gives every user their own preferences and shares a torrent between them', async () => {
    await select('Test.Show.S01.1080p.WEB-GRP', { user: viewer });
    await setRequested([3], true, { user: viewer });
    await settle();

    // Requests of other users than admins wait for approval
    expect(engine.running(PACK)).toBeUndefined();
    expect(statuses(await getStatus(viewer))).toEqual([
      [1, 1, null],
      [1, 2, null],
      [1, 3, 'waiting-for-approval'],
    ]);

    const pending = await api('get', '/requests?approved=false').expect(200);
    await api('put', `/requests/${pending.body.items[0].id}`)
      .send({ approved: true })
      .expect(200);
    await settle();

    // Both users selected the same release, which is one torrent
    expect(engine.running(PACK).wanted).toEqual([2]);
    expect(await em().count(Torrent, { infoHash: PACK })).toBe(1);

    const status = await getStatus(viewer);
    expect(status.preferences).toMatchObject([
      { season: 1, episode: 0, torrent: { infoHash: PACK } },
    ]);
    expect(status.episodes).toMatchObject([
      { episode: 1, requested: false, onDisk: true },
      { episode: 2, requested: false, onDisk: true },
      { episode: 3, requested: true, onDisk: false, status: 'downloading' },
    ]);
    // The request of the viewer is not the admin's
    expect(statuses(await getStatus())).toEqual([
      [1, 1, 'available'],
      [1, 2, 'available'],
    ]);

    // Without the viewer's selection the request, which has no file yet,
    // waits for nothing, and the torrent stops
    await clearSelection(1, 0, viewer).expect(200);
    await settle();

    expect(engine.running(PACK)).toBeUndefined();
    expect(statuses(await getStatus(viewer))).toEqual([
      [1, 1, null],
      [1, 2, null],
      [1, 3, 'no-preference'],
    ]);
    expect(await references(viewer)).toEqual([[1, 3, null, null]]);
  });

  it('seeds until the ratio is reached, also after a restart', async () => {
    await api('put', '/downloads/settings').send({ seedRatio: 2 }).expect(200);
    await select('Test.Show.S01.1080p.WEB-GRP', { user: viewer });
    await settle();

    let pack = engine.running(PACK);
    pack.download(2);
    pack.stats.uploaded = 50;
    await settle();

    expect(libraryFiles()).toContain(episodeFile(3, PACK));
    expect(pack.destroyed).toBe(false);
    expect(pack.wanted).toEqual([]);
    expect((await getStatus(viewer)).preferences[0].torrent).toMatchObject({
      status: 'seeding',
      downloadedBytes: 100,
      uploadedBytes: 50,
    });

    await app.close();
    expect(pack.destroyed).toBe(true);
    await startApp();
    await settle();

    pack = engine.running(PACK);
    expect(pack).toBeDefined();
    expect((await getStatus(viewer)).preferences[0].torrent).toMatchObject({
      status: 'seeding',
      downloadedBytes: 100,
      uploadedBytes: 50,
    });

    pack.stats.uploaded = 150;
    // The counters are stored every 30 seconds
    await app.get(TorrentRuntime).flush();
    await settle();

    expect(pack.destroyed).toBe(true);
    expect(existsSync(pack.directory)).toBe(false);
    expect((await getStatus(viewer)).preferences[0].torrent).toMatchObject({
      status: 'idle',
      downloadedBytes: 0,
      uploadedBytes: 0,
    });

    await api('put', '/downloads/settings').send({ seedRatio: 0 }).expect(200);
  });

  it('keeps what it knows while the library folder is not mounted', async () => {
    const disk = path.join(dirs.root, 'disk');
    const countFiles = () => em().count(MediaFile);
    const before = statuses(await getStatus(viewer));
    const files = await countFiles();

    // The folder is there with nothing in it
    renameSync(dirs.library, disk);
    mkdirSync(dirs.library);

    // The status is as of the last scan, playing fails
    expect(statuses(await getStatus(viewer))).toEqual(before);
    const { body } = await api(
      'get',
      `/library/series/${TMDB_ID}`,
      viewer,
    ).expect(503);
    expect(body.message).toBe(
      `Library folder "${dirs.library}" is not available: it is empty, but files are indexed in it`,
    );
    await cleanUp();
    await settle();

    expect(await references(viewer)).toEqual([[1, 3, null, PACK]]);
    expect(await countFiles()).toBe(files);
    expect(engine.running(PACK)).toBeUndefined();
    expect(readdirSync(dirs.library)).toEqual([]);

    rmSync(dirs.library, { recursive: true });
    renameSync(disk, dirs.library);

    expect(statuses(await getStatus(viewer))).toEqual(before);
    expect(await references(viewer)).toEqual([[1, 3, null, PACK]]);
  });

  it('downloads a version again when its file is gone from the library', async () => {
    rmSync(path.join(dirs.library, episodeFile(3, PACK)));

    expect(await references(viewer)).toEqual([[1, 3, null, PACK]]);

    // Playing the series notices the missing file. The request no longer
    // has it, and downloads it again from its torrent
    await api('get', `/library/series/${TMDB_ID}`, viewer).expect(200);
    await settle();

    expect(await references(viewer)).toEqual([[1, 3, PACK, null]]);
    expect(engine.running(PACK).wanted).toEqual([2]);
    expect(statuses(await getStatus(viewer))).toEqual([
      [1, 1, null],
      [1, 2, null],
      [1, 3, 'downloading'],
    ]);
    await setRequested([3], false, { user: viewer });
    await settle();
    expect(engine.running(PACK)).toBeUndefined();
  });

  it('shows a torrent that nobody selects as off the server', async () => {
    for (const user of [admin, viewer]) {
      await clearSelection(1, 0, user).expect(200);
    }
    await settle();

    // The admin's request for episode 1 has its file from the torrent
    expect(statuses(await getStatus())).toEqual([
      [1, 1, 'available'],
      [1, 2, 'available'],
    ]);

    await setRequested([1], false);
    await setRequested([1], true);
    await settle();

    // Requested again, the episode has nothing to download from, although
    // the file of the torrent is still on disk
    const status = await getStatus();
    expect(statuses(status)).toEqual([
      [1, 1, 'no-preference'],
      [1, 2, 'available'],
    ]);
    expect(status.episodes[0].onDisk).toBe(true);
    expect(await references()).toEqual([
      [1, 1, null, null],
      [1, 2, null, REDIRECT],
    ]);
    expect(status.onServer.sort()).toEqual([PACK, REDIRECT, EPISODE].sort());
  });

  it('answers a request before the library has looked at it', async () => {
    const resume = app.get(JobsService).pause('library.reconcileRequest');

    await setRequested([1], true, { season: 2 });
    expect(statuses(await getStatus())).toContainEqual([2, 1, 'no-preference']);

    resume();
    await setRequested([1], false, { season: 2 });
    await settle();
  });

  it('lets through what the rule of the user allows, and deletes the watched requests it does not keep', async () => {
    const rulePath = `/users/${admin.id}/requests/series/${TMDB_ID}/rule`;
    const setRule = (rule: Partial<RequestRuleDto>) =>
      api('put', rulePath)
        .send({
          keepNext: null,
          keepWatched: null,
          keepWatchedHours: null,
          ...rule,
        })
        .expect(200);
    const setPlayState = (season: number, episode: number, playState: object) =>
      api(
        'put',
        `/users/${admin.id}/play-states/series/${TMDB_ID}/seasons/${season}/episodes/${episode}`,
      )
        .send(playState)
        .expect(200);
    const season2 = async () =>
      (await getStatus()).episodes
        .filter((e) => e.season === 2)
        .map((e) => [e.episode, e.requested, e.status ?? null]);

    // A rule set after the requests applies to them: without a source none
    // of them has passed the gate
    await setRequested([1, 2, 3], true, { season: 2 });
    await setRule({ keepNext: 1 });
    expect((await api('get', rulePath).expect(200)).body).toEqual({
      keepNext: 1,
      keepWatched: null,
      keepWatchedHours: null,
    });
    expect(await season2()).toEqual([
      [1, true, 'no-preference'],
      [2, true, 'no-preference'],
      [3, true, 'no-preference'],
    ]);

    // Picking a source lets the next request through, counted from the last
    // watched episode on, over the seasons; an episode in progress is not
    // watched yet. The torrent has a file for the first episode only
    await setPlayState(1, 3, { watched: true });
    await setPlayState(2, 1, { progress: 0.3 });
    const releases = await search('season=2');
    await api('put', `${preferencesUrl()}/seasons/2`)
      .send({
        releaseId: releases.find((r) => r.title.includes('S02')).id,
      })
      .expect(200);
    await settle();
    expect(engine.running(SEASON_2).wanted).toEqual([0]);
    engine.running(SEASON_2).download(0);
    await settle();
    expect(await season2()).toEqual([
      [1, true, 'available'],
      [2, true, 'inactive-ahead'],
      [3, true, 'inactive-ahead'],
    ]);

    // Watching an episode lets the next one through. Without a keep setting
    // the request of the watched episode stays as it is
    await setPlayState(2, 1, { watched: true });
    await settle();
    expect(await season2()).toEqual([
      [1, true, 'available'],
      [2, true, 'no-file-in-torrent'],
      [3, true, 'inactive-ahead'],
    ]);

    // Marking it unwatched holds nothing back again
    await setPlayState(2, 1, { watched: false });
    await settle();
    expect(await season2()).toEqual([
      [1, true, 'available'],
      [2, true, 'no-file-in-torrent'],
      [3, true, 'inactive-ahead'],
    ]);

    // A watched request that the rule keeps holds on to its file
    await setPlayState(2, 1, { watched: true });
    await setRule({ keepNext: 1, keepWatched: 1 });
    expect(await season2()).toEqual([
      [1, true, 'available'],
      [2, true, 'no-file-in-torrent'],
      [3, true, 'inactive-ahead'],
    ]);

    // The one watched before the last is deleted, and nothing holds its
    // file any more
    await setPlayState(2, 2, { watched: true });
    await settle();
    expect(await season2()).toEqual([
      [1, false, null],
      [2, true, 'no-file-in-torrent'],
      [3, true, 'no-file-in-torrent'],
    ]);

    // The last watched ones are not kept once nothing is left to watch
    await setPlayState(2, 3, { watched: true });
    await settle();
    expect(await season2()).toEqual([[1, false, null]]);
    expect(engine.running(SEASON_2)).toBeUndefined();

    await setRule({});
    expect((await api('get', rulePath).expect(200)).body).toEqual({
      keepNext: null,
      keepWatched: null,
      keepWatchedHours: null,
    });
    await clearSelection(2).expect(200);
    await settle();
  });

  it('accepts a rule only from its user and with positive limits', async () => {
    const rulePath = `/users/${admin.id}/requests/series/${TMDB_ID}/rule`;
    const rule = { keepNext: 1, keepWatched: null, keepWatchedHours: null };

    await api('put', rulePath, viewer).send(rule).expect(401);
    await api('put', rulePath)
      .send({ ...rule, keepNext: 0 })
      .expect(400);
    await api('put', rulePath).send({ keepNext: 1 }).expect(400);
  });

  it('deletes the imported files that no request holds at a cleanup', async () => {
    const setCleanup = (cleanup: string, status = 200) =>
      api('put', '/library/settings')
        .send({ movieFolders: [], seriesFolders: [dirs.library], cleanup })
        .expect(status);
    const cleanedUp = async (user = admin) =>
      (await getStatus(user)).episodes.map((e) => [
        e.season,
        e.episode,
        !!e.cleanupAt,
      ]);
    // The admin's request for episode 2 holds the version that the admin
    // selected. Nothing holds the other version and the other episodes
    const held = episodeFile(2, REDIRECT);
    expect(libraryFiles()).toEqual([
      episodeFile(1, PACK),
      held,
      episodeFile(2, EPISODE),
      `Test Show (2020) [tmdbid-100]/Season 2/Test Show - S02E01 - ${version(SEASON_2)}.mkv`,
    ]);

    await setCleanup('hourly', 400);
    await setCleanup('off');
    expect(await cleanedUp()).toEqual([
      [1, 1, false],
      [1, 2, false],
      [2, 1, false],
    ]);
    await cleanUp();
    expect(libraryFiles()).toHaveLength(4);

    // An episode is cleaned up when none of its files is held, by anyone
    await setCleanup('daily');
    for (const user of [admin, viewer]) {
      expect(await cleanedUp(user)).toEqual([
        [1, 1, true],
        [1, 2, false],
        [2, 1, true],
      ]);
    }
    await cleanUp();

    expect(libraryFiles()).toEqual([held]);
    expect(
      readdirSync(path.join(dirs.library, 'Test Show (2020) [tmdbid-100]')),
    ).toEqual(['Season 1']);
    expect(statuses(await getStatus())).toEqual([
      [1, 1, 'no-preference'],
      [1, 2, 'available'],
    ]);
    expect(await em().count(MediaFile, { managed: true })).toBe(1);

    // Every deletion is in the log, with the file it was
    const deleted = await em().find(LogEntry, { type: LogType.FileDeleted });
    expect(deleted.map((entry) => entry.data.path).sort()).toEqual(
      [
        episodeFile(1, PACK),
        episodeFile(2, EPISODE),
        `Test Show (2020) [tmdbid-100]/Season 2/Test Show - S02E01 - ${version(SEASON_2)}.mkv`,
      ].map((file) => path.join(dirs.library, file)),
    );
    expect(deleted[0].message).toBe(
      `Deleted "${deleted[0].data.path}": no request holds it`,
    );
  });

  it('lets an admin delete from a library folder, with the requests that have the files', async () => {
    const SHOW = 'Test Show (2020) [tmdbid-100]';
    const held = episodeFile(2, REDIRECT);
    const getLibrary = (folder: string, user = admin) =>
      api('get', `/server/library?folder=${encodeURIComponent(folder)}`, user);
    const deleteFromLibrary = (paths: string[], user = admin) =>
      api('post', '/server/library/delete', user).send({
        folder: dirs.library,
        paths,
      });

    // The viewer gets the file that the admin has
    await select('Test.Show.S01E02.720p.WEB-GRP', { episode: 2, user: viewer });
    await setRequested([2], true, { user: viewer });
    const pending = await api('get', '/requests?approved=false').expect(200);
    await api('put', `/requests/${pending.body.items[0].id}`)
      .send({ approved: true })
      .expect(200);
    await settle();
    expect(await references(viewer)).toEqual([[1, 2, null, REDIRECT]]);

    await getLibrary(dirs.library, viewer).expect(403);
    await deleteFromLibrary([held], viewer).expect(403);
    await getLibrary(dirs.root).expect(400);
    await deleteFromLibrary(['../downloads']).expect(400);

    expect((await getLibrary(dirs.library).expect(200)).body).toEqual([
      { path: SHOW, isDirectory: true, size: 0 },
      { path: `${SHOW}/Season 1`, isDirectory: true, size: 0 },
      {
        path: held,
        isDirectory: false,
        size: 7,
        mediaFileId: expect.any(String),
        managed: true,
        requests: 2,
      },
    ]);

    expect((await deleteFromLibrary([held]).expect(200)).body).toEqual({
      deleted: 1,
      failed: [],
    });
    await settle();

    // Nothing downloads the file again: the requests for it are gone, the
    // preferences are not
    expect(libraryFiles()).toEqual([]);
    expect(await references()).toEqual([[1, 1, null, null]]);
    expect(await references(viewer)).toEqual([]);
    expect(engine.running(REDIRECT)).toBeUndefined();
    expect((await getStatus(viewer)).preferences).toHaveLength(1);
    expect(
      await em().count(LogEntry, {
        message: `Deleted "${path.join(dirs.library, held)}": deleted by admin`,
      }),
    ).toBe(1);

    await deleteFromLibrary([SHOW]).expect(200);
    expect(readdirSync(dirs.library)).toEqual([]);
  });

  it('scans a library folder by hand and every night, unless it is not mounted', async () => {
    const external = path.join(
      dirs.library,
      'Test Show (2020) [tmdbid-100]/Season 1/Test Show - S01E01.mkv',
    );
    const disk = path.join(dirs.root, 'disk');
    const previewScan = (folder = dirs.library, user = admin) =>
      api(
        'get',
        `/server/library/scan?folder=${encodeURIComponent(folder)}`,
        user,
      );
    const scan = (body: object, user = admin) =>
      api('post', '/server/library/scan', user).send(body);
    const countFiles = () => em().count(MediaFile);
    const failedScans = () =>
      em().count(LogEntry, { type: LogType.ScanFailed });

    const failedBefore = await failedScans();

    mkdirSync(path.dirname(external), { recursive: true });
    writeFileSync(external, 'external');

    await previewScan(dirs.library, viewer).expect(403);
    await scan({ folder: dirs.library }, viewer).expect(403);
    await previewScan(dirs.root).expect(400);

    expect((await previewScan().expect(200)).body).toEqual({
      available: true,
      missing: 0,
      requests: 0,
    });
    expect((await scan({ folder: dirs.library }).expect(200)).body).toEqual({
      added: 1,
      updated: 0,
      forgotten: 0,
      unresolved: [],
      failed: [],
    });
    // The file is external: it plays, but fulfils no request
    expect(
      (await getStatus()).episodes.map((e) => [e.episode, e.onDisk, e.status]),
    ).toEqual([[1, true, 'no-preference']]);

    // Not mounted: the nightly scan leaves the index alone and logs it, the
    // admin is warned and can force it
    renameSync(dirs.library, disk);
    mkdirSync(dirs.library);
    await cleanUp();
    expect(await failedScans()).toBe(failedBefore + 1);
    expect(await countFiles()).toBe(1);
    expect((await previewScan().expect(200)).body).toEqual({
      available: false,
      reason: `Library folder "${dirs.library}" is not available: it is empty, but files are indexed in it`,
      missing: 1,
      requests: 0,
    });
    await scan({ folder: dirs.library }).expect(503);
    expect(
      (await scan({ folder: dirs.library, force: true }).expect(200)).body,
    ).toMatchObject({ forgotten: 1 });
    expect(await countFiles()).toBe(0);

    // Mounted again, the nightly scan finds the file
    rmSync(dirs.library, { recursive: true });
    renameSync(disk, dirs.library);
    await cleanUp();
    expect(await failedScans()).toBe(failedBefore + 1);
    expect(await countFiles()).toBe(1);
  });

  it('lets an admin request the files on disk, which the requests then keep', async () => {
    const SHOW = 'Test Show (2020) [tmdbid-100]';
    const requestFromLibrary = (paths: string[]) =>
      api('post', '/server/library/request').send({
        folder: dirs.library,
        paths,
      });

    expect(
      (await requestFromLibrary([`${SHOW}/Season 1`]).expect(200)).body,
    ).toEqual({
      requests: 1,
      skipped: 0,
    });
    await settle();

    const status = await getStatus();
    expect(statuses(status)).toEqual([[1, 1, 'available']]);
    expect(status.preferences).toContainEqual(
      expect.objectContaining({
        season: 1,
        episode: 1,
        file: expect.objectContaining({ inLibrary: true, managed: false }),
      }),
    );
    expect(await references()).toEqual([[1, 1, null, null]]);
    expect(
      await em().count(RequestBinding, { mediaFileId: { $ne: null } }),
    ).toBe(1);

    // Requested anew, the episode has nothing: the file is external
    await clearSelection(1, 1).expect(200);
    await setRequested([1], false);
    await setRequested([1], true);
    await settle();
    expect(await em().count(RequestBinding, {})).toBe(0);
  });

  it('downloads a file again when a scan forgets it', async () => {
    const scan = (body: object) =>
      api('post', '/server/library/scan').send(body);
    const previewScan = () =>
      api(
        'get',
        `/server/library/scan?folder=${encodeURIComponent(dirs.library)}`,
      );

    await select('Test.Show.S01.1080p.WEB-GRP');
    await settle();
    engine.running(PACK).download(0);
    await settle();
    expect(await references()).toEqual([[1, 1, null, PACK]]);
    const imported = path.join(dirs.library, episodeFile(1, PACK));
    expect(existsSync(imported)).toBe(true);

    rmSync(imported);
    expect((await previewScan().expect(200)).body).toEqual({
      available: true,
      missing: 1,
      requests: 1,
    });
    expect((await scan({ folder: dirs.library }).expect(200)).body).toEqual({
      added: 0,
      updated: 0,
      forgotten: 1,
      unresolved: [],
      failed: [],
    });
    expect(await em().count(MediaFile, { path: imported })).toBe(0);

    // The request was looked at again with the forget, and downloads the
    // file again from its torrent
    await settle();
    expect(await references()).toEqual([[1, 1, PACK, null]]);
    expect(engine.running(PACK).wanted).toEqual([0]);
    engine.running(PACK).download(0);
    await settle();
    expect(await references()).toEqual([[1, 1, null, PACK]]);
    expect(existsSync(imported)).toBe(true);
  });

  it('holds back what does not fit the quota of a user or the disk limit, and lets it through when room is made', async () => {
    await api('post', '/users')
      .send({ name: 'limited', password: 'password', isAdmin: false })
      .expect(201);
    const limited = await signIn('limited');
    const setQuota = (quotaBytes: unknown, user = admin, status = 200) =>
      api('put', `/users/${limited.id}`, user)
        .send({ quotaBytes })
        .expect(status);
    const getUsage = () =>
      api('get', `/library/storage/users/${limited.id}`, limited)
        .expect(200)
        .then((res) => res.body);
    const setLimit = (maxDiskUsagePercent: number | null) =>
      api('put', '/library/settings')
        .send({
          movieFolders: [],
          seriesFolders: [dirs.library],
          cleanup: 'daily',
          maxDiskUsagePercent,
        })
        .expect(200);
    const approveAll = async () => {
      const pending = await api('get', '/requests?approved=false').expect(200);
      for (const request of pending.body.items) {
        await api('put', `/requests/${request.id}`)
          .send({ approved: true })
          .expect(200);
      }
    };

    // Only admins set quotas, in whole bytes
    await setQuota(10, limited);
    await setQuota(-1, admin, 400);
    await setQuota(1.5, admin, 400);
    expect((await getUsage()).quotaBytes).toBeNull();
    await setQuota(100);
    expect(
      (await api('get', `/users/${limited.id}`).expect(200)).body.quotaBytes,
    ).toBe(100);

    // The version of the first episode in the library takes 7 bytes and
    // fits; a download from the season torrent of 1000 bytes is expected
    // to take 334, which does not
    await select('Test.Show.S01.1080p.WEB-GRP', { user: limited });
    await setRequested([1, 2], true, { user: limited });
    await approveAll();
    await settle();
    expect(statuses(await getStatus(limited))).toEqual([
      [1, 1, 'available'],
      [1, 2, 'over-quota'],
    ]);
    expect(await getUsage()).toEqual({
      quotaBytes: 100,
      heldBytes: 7,
      pendingBytes: 0,
    });

    // A quota with room has the request looked at again
    await setQuota(400);
    await settle();
    expect(statuses(await getStatus(limited))).toEqual([
      [1, 1, 'available'],
      [1, 2, 'downloading'],
    ]);
    expect(await getUsage()).toEqual({
      quotaBytes: 400,
      heldBytes: 7,
      pendingBytes: 334,
    });
    engine.running(PACK).download(1);
    await settle();
    expect(await getUsage()).toEqual({
      quotaBytes: 400,
      heldBytes: 14,
      pendingBytes: 0,
    });

    // At the disk limit nothing more is downloaded, for anyone
    await setLimit(0);
    await setRequested([3], true, { user: limited });
    await approveAll();
    await settle();
    expect(statuses(await getStatus(limited))).toEqual([
      [1, 1, 'available'],
      [1, 2, 'available'],
      [1, 3, 'disk-full'],
    ]);
    const storage = await api('get', '/library/storage').expect(200);
    expect(storage.body.maxDiskUsagePercent).toBe(0);
    expect(storage.body.disks).toContainEqual(
      expect.objectContaining({ path: dirs.library }),
    );
    expect(storage.body.users).toContainEqual({
      userId: limited.id,
      name: 'limited',
      quotaBytes: 400,
      heldBytes: 14,
      pendingBytes: 0,
    });
    await api('get', '/library/storage', limited).expect(403);
    await api('get', `/library/storage/users/${limited.id}`, viewer).expect(
      401,
    );

    await setLimit(null);
    await settle();
    expect(statuses(await getStatus(limited))).toEqual([
      [1, 1, 'available'],
      [1, 2, 'available'],
      [1, 3, 'downloading'],
    ]);

    await setRequested([1, 2, 3], false, { user: limited });
    await settle();
  });

  it('lists the torrents for admins', async () => {
    await api('get', '/downloads/torrents', viewer).expect(403);
    const { body } = await api('get', '/downloads/torrents').expect(200);

    expect(body.map((t) => t.infoHash).sort()).toEqual(
      [PACK, EPISODE, REDIRECT, SEASON_2].sort(),
    );
    expect(body.find((t) => t.infoHash === PACK).items).toContainEqual(
      expect.objectContaining({ season: 1, episode: 1, status: 'released' }),
    );
  });

  it('rejects requests for episodes that do not exist', async () => {
    await api('put', `/users/${admin.id}/requests/series/${TMDB_ID}`)
      .send({ episodes: [{ season: 1, episode: 9 }], requested: true })
      .expect(400);
  });

  it('keeps the download settings for admins', async () => {
    await api('put', '/downloads/settings', viewer)
      .send({ seedRatio: 5 })
      .expect(403);
  });
});
