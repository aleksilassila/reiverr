import { MikroORM } from '@mikro-orm/core';
import { MIKRO_ORM_MODULE_OPTIONS } from '@mikro-orm/nestjs';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import {
  existsSync,
  mkdirSync,
  readdirSync,
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
import { SeriesDownloadsDto } from '../src/downloads/downloads.dto.js';
import { DownloadsService } from '../src/downloads/downloads.service.js';
import {
  TorrentHandle,
  TORRENT_ENGINE,
  TorrentEngine,
  TorrentFile,
} from '../src/downloads/torrent-engine.js';
import { Torrent } from '../src/downloads/torrent.entity.js';
import { ReleaseDto } from '../src/indexers/indexers.dto.js';
import { MediaFile } from '../src/local-media/media-file.entity.js';
import { SeriesMetadata } from '../src/metadata/metadata.entity.js';
import mikroOrmConfig from '../src/mikro-orm.config.js';
import { LogEntry, LogType } from '../src/server-log/log-entry.entity.js';
import { MediaRequest } from '../src/requests/request.entity.js';
import { RequestRuleDto } from '../src/requests/requests.dto.js';
import { RequestsService } from '../src/requests/requests.service.js';
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
const MAGNET_FILES: Record<string, { path: string; length: number }[]> = {
  [PACK]: [
    { path: 'Test.Show.S01/Test.Show.S01E01.1080p.mkv', length: 100 },
    { path: 'Test.Show.S01/Test.Show.S01E02.1080p.mkv', length: 100 },
    { path: 'Test.Show.S01/Test.Show.S01E03.1080p.mkv', length: 100 },
    { path: 'Test.Show.S01/Sample/Test.Show.S01E01.sample.mkv', length: 10 },
    { path: 'Test.Show.S01/info.nfo', length: 1 },
  ],
  [REDIRECT]: [{ path: 'Other.Show.S09E09.mkv', length: 50 }],
};

class FakeTorrent implements TorrentHandle {
  readonly infoHash: string;
  readonly files: TorrentFile[];
  readonly ready: Promise<TorrentFile[]>;
  wanted: number[] = [];
  destroyed = false;
  stats = {
    peers: 3,
    downloadSpeed: 0,
    uploadSpeed: 0,
    downloaded: 0,
    uploaded: 0,
  };
  private listeners: ((index: number) => void)[] = [];

  constructor(
    source: string | Buffer,
    readonly directory: string,
  ) {
    const parsed = parseTorrent(source);

    this.infoHash = parsed.infoHash;
    this.files = (parsed.files ?? MAGNET_FILES[parsed.infoHash]).map(
      (file: { path: string; length: number }, index: number) => ({
        index,
        name: path.basename(file.path),
        path: file.path,
        length: file.length,
      }),
    );
    this.ready = Promise.resolve(this.files);
  }

  setWantedFiles(indexes: number[]) {
    this.wanted = indexes;
  }

  getFileProgress(index: number) {
    return this.isFileComplete(index) ? 1 : 0.5;
  }

  // Like a real client, data from an earlier run counts
  isFileComplete(index: number) {
    return existsSync(this.getFilePath(index));
  }

  onFileComplete(listener: (index: number) => void) {
    this.listeners.push(listener);
  }

  getFilePath(index: number) {
    return path.join(this.directory, this.files[index].path);
  }

  hasData() {
    return this.files.some((file) => this.isFileComplete(file.index));
  }

  getStats() {
    return this.stats;
  }

  async destroy() {
    this.destroyed = true;
  }

  download(index: number) {
    const filePath = this.getFilePath(index);
    mkdirSync(path.dirname(filePath), { recursive: true });
    writeFileSync(filePath, `video ${index}`);
    this.stats.downloaded += this.files[index].length;
    this.listeners.forEach((listener) => listener(index));
  }
}

class FakeEngine implements TorrentEngine {
  torrents: FakeTorrent[] = [];

  add(source: string | Buffer, directory: string) {
    const torrent = new FakeTorrent(source, directory);
    this.torrents.push(torrent);
    return torrent;
  }

  running(hash: string) {
    const running = this.torrents.filter(
      (t) => t.infoHash === hash && !t.destroyed,
    );
    expect(running.length).toBeLessThanOrEqual(1);

    return running[0];
  }
}

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

  const signIn = (name: string): Promise<TestUser> =>
    request(app.getHttpServer())
      .post('/auth')
      .send({ name, password: 'password' })
      .expect(200)
      .then((res) => ({ id: res.body.user.id, token: res.body.accessToken }));

  const getDownloads = (user = admin): Promise<SeriesDownloadsDto> =>
    api('get', `/v2/downloads/series/${TMDB_ID}`, user)
      .expect(200)
      .then((res) => res.body);

  const search = (query: string): Promise<ReleaseDto[]> =>
    api('get', `/v2/indexers/search/series/${TMDB_ID}?${query}`)
      .expect(200)
      .then((res) => res.body);

  const setRequested = (
    episodes: number[],
    requested: boolean,
    { season = 1, user = admin } = {},
  ) =>
    api('put', `/v2/users/${user.id}/requests/series/tmdb/${TMDB_ID}`, user)
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

    return api(
      'put',
      `/v2/downloads/series/${TMDB_ID}/${target}/selection`,
      user,
    )
      .send({ releaseId: releases.find((r) => r.title === title).id })
      .expect(status);
  }

  const statuses = (downloads: SeriesDownloadsDto) =>
    downloads.episodes.map((e) => [e.season, e.episode, e.status ?? null]);

  const torrentHashes = async () =>
    (await app.get(MikroORM).em.fork().find(Torrent, {}))
      .map((torrent) => torrent.infoHash)
      .sort();

  /**
   * What the requests of a user refer to: the info hash of their torrent and
   * of the torrent that their file came from
   */
  async function references(user = admin) {
    const em = app.get(MikroORM).em.fork();
    const requests = await em.find(
      MediaRequest,
      { userId: user.id },
      { orderBy: { season: 'asc', episode: 'asc' } },
    );
    const torrents = await em.find(Torrent, {});
    const files = await em.find(MediaFile, {});

    // A reference to a row that is gone would show as undefined
    return requests.map((request) => [
      request.season,
      request.episode,
      request.torrentId &&
        torrents.find((t) => t.id === request.torrentId)?.infoHash,
      request.mediaFileId &&
        files.find((f) => f.id === request.mediaFileId)?.infoHash,
    ]);
  }

  // Reconciliations run in the background
  const settle = () => new Promise((resolve) => setTimeout(resolve, 100));

  /** Holds the next reconciliation back, in the middle of its run */
  function holdReconciliation() {
    const requests = app.get(RequestsService);
    const find = requests.findEpisodeRequests.bind(requests);
    let start: () => void;
    let release: () => void;
    const started = new Promise<void>((resolve) => (start = resolve));
    const released = new Promise<void>((resolve) => (release = resolve));

    const reads = vi
      .spyOn(requests, 'findEpisodeRequests')
      .mockImplementationOnce(async () => {
        start();
        await released;

        return find();
      });

    return { reads, started, release };
  }

  const libraryFiles = () =>
    existsSync(dirs.library)
      ? (readdirSync(dirs.library, { recursive: true }) as string[])
          .filter((file) => file.endsWith('.mkv'))
          .sort()
      : [];

  const episodeFile = (episode: number, hash: string) =>
    `Test Show (2020) [tmdbid-100]/Season 01/Test Show - S01E0${episode} - ${version(hash)}.mkv`;

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

    const orm = app.get(MikroORM);
    await orm.em.fork().insert(
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

    await api('put', '/v2/local-media/settings')
      .send({ movieFolders: [], seriesFolders: [dirs.library] })
      .expect(200);
  });

  afterAll(async () => {
    await app.close();
    indexer.server.close();
    rmSync(dirs.root, { recursive: true, force: true });
  });

  it('rejects an indexer that does not answer with capabilities', async () => {
    const res = await api('put', '/v2/indexers')
      .send({ indexers: [{ name: 'Fake', url: indexer.url, apiKey: 'wrong' }] })
      .expect(400);

    expect(res.body.message).toBe('Fake: Invalid API Key');
  });

  it('saves a working indexer', async () => {
    const res = await api('put', '/v2/indexers')
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

    const downloads = await getDownloads();
    expect(downloads.selections).toMatchObject([
      {
        season: 1,
        episode: 0,
        torrent: {
          title: 'Test.Show.S01.1080p.WEB-GRP',
          infoHash: PACK,
          status: 'stopped',
        },
      },
    ]);
    expect(downloads.episodes).toEqual([]);
    expect(downloads.onServer).toEqual([PACK]);
  });

  it('does not download a requested episode without a torrent', async () => {
    await setRequested([1], true, { season: 2 });
    await settle();

    expect(engine.torrents).toEqual([]);
    expect((await getDownloads()).episodes).toEqual([
      {
        season: 2,
        episode: 1,
        requested: true,
        onDisk: false,
        status: 'no-selection',
      },
    ]);

    await setRequested([1], false, { season: 2 });
  });

  it('downloads only the requested episodes of a season pack', async () => {
    await setRequested([1, 2], true);
    // The files of a magnet link are known once the torrent runs
    await settle();

    expect(engine.running(PACK).wanted).toEqual([0, 1]);

    const downloads = await getDownloads();
    expect(downloads.episodes).toMatchObject([
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
    // The requests are bound to the torrent and have no file yet
    expect(await references()).toEqual([
      [1, 1, PACK, null],
      [1, 2, PACK, null],
    ]);
    expect(downloads.selections[0].torrent).toMatchObject({
      status: 'downloading',
      peers: 3,
    });
  });

  it('binds a request that has no file yet to the torrent that is selected for its episode', async () => {
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

  it('imports finished episodes as versions with hard links and stops finished torrents', async () => {
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
      await app
        .get(MikroORM)
        .em.fork()
        .find(LogEntry, { type: LogType.DownloadDeleted }),
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

    const downloads = await getDownloads();
    expect(downloads.episodes).toMatchObject([
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
    // The requests refer to the files that fulfil them
    expect(await references()).toEqual([
      [1, 1, PACK, PACK],
      [1, 2, EPISODE, EPISODE],
    ]);
    expect(downloads.selections.map((s) => s.torrent)).toMatchObject([
      { infoHash: PACK, status: 'stopped', downloadedBytes: 0 },
      { infoHash: EPISODE, status: 'stopped', downloadedBytes: 0 },
    ]);

    const files = await api('get', `/v2/local-media/series/${TMDB_ID}`).expect(
      200,
    );
    expect(files.body.map((file) => [file.season, file.episodes])).toEqual([
      [1, [1]],
      [1, [2]],
    ]);
    const stream = await api(
      'get',
      `/v2/local-media/files/${files.body[0].id}/stream`,
    ).expect(200);
    expect(stream.body.toString()).toBe('video 0');

    const indexed = await app
      .get(MikroORM)
      .em.fork()
      .find(MediaFile, {}, { orderBy: { episode: 'asc' } });
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
    expect(statuses(await getDownloads())).toEqual([
      [1, 1, 'available'],
      [1, 2, 'downloading'],
    ]);
    // The request let go of the file it had
    expect(await references()).toEqual([
      [1, 1, PACK, PACK],
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
    expect(statuses(await getDownloads())).toEqual([
      [1, 1, 'available'],
      [1, 2, 'available'],
    ]);
    expect(await references()).toEqual([
      [1, 1, PACK, PACK],
      [1, 2, REDIRECT, REDIRECT],
    ]);

    // Nothing refers to the first torrent any more. Its file stays until a
    // cleanup and still tells search results that this release is on the server.
    expect(await torrentHashes()).toEqual([PACK, REDIRECT].sort());
    expect((await getDownloads()).onServer.sort()).toEqual(
      [PACK, REDIRECT, EPISODE].sort(),
    );
  });

  it('keeps the files of a season when another torrent is selected for the season', async () => {
    const selectForSeason = (releaseId: string) =>
      api('put', `/v2/downloads/series/${TMDB_ID}/seasons/1/selection`)
        .send({ releaseId })
        .expect(200);
    const releases = await search('season=1&episode=2');

    await selectForSeason(
      releases.find((r) => r.title === 'Test.Show.S01E02.1080p.WEB-GRP').id,
    );
    await settle();

    expect(engine.running(EPISODE)).toBeUndefined();
    expect(await references()).toEqual([
      [1, 1, PACK, PACK],
      [1, 2, REDIRECT, REDIRECT],
    ]);

    // The request shows the torrent it has its file from, not the selected one
    const downloads = await getDownloads();
    expect(statuses(downloads)).toEqual([
      [1, 1, 'available'],
      [1, 2, 'available'],
    ]);
    expect(downloads.selections[0].torrent.infoHash).toBe(EPISODE);
    expect(downloads.episodes[0].torrent.infoHash).toBe(PACK);

    // The request keeps the torrent of its file known
    expect(await torrentHashes()).toEqual([PACK, EPISODE, REDIRECT].sort());

    await select('Test.Show.S01.1080p.WEB-GRP');
    await settle();
    expect(await torrentHashes()).toEqual([PACK, REDIRECT].sort());
  });

  it('fails a selection whose download link does not lead to a torrent', async () => {
    const res = await select('Test.Show.S01E03.1080p.WEB-GRP', {
      episode: 3,
      status: 502,
    });

    expect(res.body.message).toContain(
      'Could not get the torrent of "Test.Show.S01E03.1080p.WEB-GRP"',
    );
    expect((await getDownloads()).selections).toHaveLength(2);
  });

  it('stops downloading an episode that is no longer requested', async () => {
    await setRequested([3], true);
    await settle();
    expect(engine.running(PACK).wanted).toEqual([2]);

    await setRequested([3], false);
    await settle();
    expect(engine.running(PACK)).toBeUndefined();
  });

  it('gives every user their own selections and shares a torrent between them', async () => {
    await select('Test.Show.S01.1080p.WEB-GRP', { user: viewer });
    await setRequested([3], true, { user: viewer });
    await settle();

    // Requests of other users than admins wait for approval
    expect(engine.running(PACK)).toBeUndefined();
    expect(statuses(await getDownloads(viewer))).toEqual([
      [1, 1, null],
      [1, 2, null],
      [1, 3, 'waiting-for-approval'],
    ]);

    const pending = await api('get', '/v2/requests?approved=false').expect(200);
    await api('put', `/v2/requests/${pending.body.items[0].id}`)
      .send({ approved: true })
      .expect(200);
    await settle();

    // Both users selected the same release, which is one torrent
    expect(engine.running(PACK).wanted).toEqual([2]);
    expect(await torrentHashes()).toEqual([PACK, REDIRECT].sort());

    const downloads = await getDownloads(viewer);
    expect(downloads.selections).toMatchObject([
      { season: 1, episode: 0, torrent: { infoHash: PACK } },
    ]);
    expect(downloads.episodes).toMatchObject([
      { episode: 1, requested: false, onDisk: true },
      { episode: 2, requested: false, onDisk: true },
      { episode: 3, requested: true, onDisk: false, status: 'downloading' },
    ]);
    // The request of the viewer is not the admin's
    expect(statuses(await getDownloads())).toEqual([
      [1, 1, 'available'],
      [1, 2, 'available'],
    ]);

    // Without the viewer's selection the request, which has no file yet, is
    // bound to nothing. The admin's selection keeps the torrent known
    await api(
      'delete',
      `/v2/downloads/series/${TMDB_ID}/seasons/1/selection`,
      viewer,
    ).expect(200);
    await settle();

    expect(engine.running(PACK)).toBeUndefined();
    expect(statuses(await getDownloads(viewer))).toEqual([
      [1, 1, null],
      [1, 2, null],
      [1, 3, 'no-selection'],
    ]);
    expect(await torrentHashes()).toEqual([PACK, REDIRECT].sort());
  });

  it('seeds until the ratio is reached, also after a restart', async () => {
    await api('put', '/v2/downloads/settings')
      .send({ seedRatio: 2, cleanup: 'daily' })
      .expect(200);
    await select('Test.Show.S01.1080p.WEB-GRP', { user: viewer });
    await settle();

    let pack = engine.running(PACK);
    pack.download(2);
    pack.stats.uploaded = 50;
    await settle();

    expect(libraryFiles()).toContain(episodeFile(3, PACK));
    expect(pack.destroyed).toBe(false);
    expect(pack.wanted).toEqual([]);
    expect((await getDownloads(viewer)).selections[0].torrent).toMatchObject({
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
    expect((await getDownloads(viewer)).selections[0].torrent).toMatchObject({
      status: 'seeding',
      downloadedBytes: 100,
      uploadedBytes: 50,
    });

    pack.stats.uploaded = 150;
    await app.get(DownloadsService).reconcile();

    expect(pack.destroyed).toBe(true);
    expect(existsSync(pack.directory)).toBe(false);
    expect((await getDownloads(viewer)).selections[0].torrent).toMatchObject({
      status: 'stopped',
      downloadedBytes: 0,
      uploadedBytes: 0,
    });

    await api('put', '/v2/downloads/settings')
      .send({ seedRatio: 0, cleanup: 'daily' })
      .expect(200);
  });

  it('downloads a version again when its file is gone from the library', async () => {
    rmSync(path.join(dirs.library, episodeFile(3, PACK)));

    expect(await references(viewer)).toEqual([[1, 3, PACK, PACK]]);

    // Looking the series up notices the missing file. The request no longer
    // refers to it, and downloads it again from its torrent
    await getDownloads(viewer);
    await settle();

    expect(await references(viewer)).toEqual([[1, 3, PACK, null]]);
    expect(engine.running(PACK).wanted).toEqual([2]);
    expect(statuses(await getDownloads(viewer))).toEqual([
      [1, 1, null],
      [1, 2, null],
      [1, 3, 'downloading'],
    ]);
    await setRequested([3], false, { user: viewer });
    await settle();
    expect(engine.running(PACK)).toBeUndefined();
  });

  it('forgets a torrent that nobody selects and no request refers to', async () => {
    for (const user of [admin, viewer]) {
      await api(
        'delete',
        `/v2/downloads/series/${TMDB_ID}/seasons/1/selection`,
        user,
      ).expect(200);
    }
    await settle();

    // The admin's request for episode 1 has its file from the torrent
    expect(await torrentHashes()).toEqual([PACK, REDIRECT].sort());
    expect(statuses(await getDownloads())).toEqual([
      [1, 1, 'available'],
      [1, 2, 'available'],
    ]);

    await setRequested([1], false);
    await setRequested([1], true);
    await settle();

    expect(await torrentHashes()).toEqual([REDIRECT]);
    // Requested again, the episode has nothing to download from, although the
    // file of the forgotten torrent is still on disk
    const downloads = await getDownloads();
    expect(statuses(downloads)).toEqual([
      [1, 1, 'no-selection'],
      [1, 2, 'available'],
    ]);
    expect(downloads.episodes[0].onDisk).toBe(true);
    expect(await references()).toEqual([
      [1, 1, null, null],
      [1, 2, REDIRECT, REDIRECT],
    ]);
  });

  it('answers a request before the torrents are brought in line', async () => {
    await app.get(DownloadsService).reconcile();
    const held = holdReconciliation();

    await setRequested([1], true, { season: 2 });
    await held.started;
    expect(statuses(await getDownloads())).toContainEqual([
      2,
      1,
      'no-selection',
    ]);

    held.release();
    held.reads.mockRestore();
    await setRequested([1], false, { season: 2 });
    await settle();
  });

  it('covers the changes that arrive during a reconciliation with one more', async () => {
    const downloads = app.get(DownloadsService);
    await downloads.reconcile();
    const held = holdReconciliation();

    const running = downloads.reconcile();
    await held.started;
    const waiting = [1, 2, 3].map(() => downloads.reconcile());
    held.release();
    await Promise.all([running, ...waiting]);

    expect(held.reads).toHaveBeenCalledTimes(2);
    held.reads.mockRestore();
  });

  it('downloads only the requests that the rule of the user keeps active', async () => {
    const rulePath = `/v2/users/${admin.id}/requests/series/tmdb/${TMDB_ID}/rule`;
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
        `/users/${admin.id}/play-state/series/tmdb/${TMDB_ID}/season/${season}/episode/${episode}`,
      )
        .send(playState)
        .expect(200);
    const season2 = async () =>
      (await getDownloads()).episodes
        .filter((e) => e.season === 2)
        .map((e) => e.status);

    await setRule({ keepNext: 1 });
    expect((await api('get', rulePath).expect(200)).body).toEqual({
      keepNext: 1,
      keepWatched: null,
      keepWatchedHours: null,
    });

    // The next request is counted from the last watched episode on, over
    // the seasons
    await setRequested([1, 2, 3], true, { season: 2 });
    expect(await season2()).toEqual(Array(3).fill('inactive-ahead'));

    await setPlayState(1, 3, { watched: true });
    expect(await season2()).toEqual([
      'no-selection',
      'inactive-ahead',
      'inactive-ahead',
    ]);

    // An episode in progress is not watched yet
    await setPlayState(2, 1, { progress: 0.3 });
    expect(await season2()).toEqual([
      'no-selection',
      'inactive-ahead',
      'inactive-ahead',
    ]);

    await setPlayState(2, 1, { watched: true });
    await setPlayState(2, 2, { watched: true });
    // The second episode is the last watched one, but has no file to keep
    await setRule({ keepNext: 1, keepWatched: 1 });
    expect(await season2()).toEqual([
      'inactive-watched',
      'inactive-watched',
      'no-selection',
    ]);

    // The torrent has a file for the first episode only
    const releases = await search('season=2');
    await api('put', `/v2/downloads/series/${TMDB_ID}/seasons/2/selection`)
      .send({
        releaseId: releases.find((r) => r.title.includes('S02')).id,
      })
      .expect(200);
    await settle();
    expect(engine.running(SEASON_2)).toBeUndefined();

    await setPlayState(2, 1, { watched: false });
    await settle();
    expect(engine.running(SEASON_2).wanted).toEqual([0]);
    expect(await season2()).toEqual([
      'downloading',
      'inactive-watched',
      'no-file-in-torrent',
    ]);

    // A watched request that the rule keeps holds on to its file
    engine.running(SEASON_2).download(0);
    await settle();
    await setPlayState(2, 1, { watched: true });
    await setRule({ keepNext: 1, keepWatched: 2 });
    expect(await season2()).toEqual([
      'available',
      'inactive-watched',
      'no-file-in-torrent',
    ]);

    // The last watched ones are not kept once nothing is left to watch
    await setPlayState(2, 3, { watched: true });
    expect(await season2()).toEqual(Array(3).fill('inactive-watched'));

    await setRule({});
    expect((await api('get', rulePath).expect(200)).body).toEqual({
      keepNext: null,
      keepWatched: null,
      keepWatchedHours: null,
    });
    await setRequested([1, 2, 3], false, { season: 2 });
    await api(
      'delete',
      `/v2/downloads/series/${TMDB_ID}/seasons/2/selection`,
    ).expect(200);
    await settle();
    expect(engine.running(SEASON_2)).toBeUndefined();
  });

  it('accepts a rule only from its user and with positive limits', async () => {
    const rulePath = `/v2/users/${admin.id}/requests/series/tmdb/${TMDB_ID}/rule`;
    const rule = { keepNext: 1, keepWatched: null, keepWatchedHours: null };

    await api('put', rulePath, viewer).send(rule).expect(401);
    await api('put', rulePath)
      .send({ ...rule, keepNext: 0 })
      .expect(400);
    await api('put', rulePath).send({ keepNext: 1 }).expect(400);
  });

  it('deletes the imported files that no request holds at a cleanup', async () => {
    const setCleanup = (cleanup: string, status = 200) =>
      api('put', '/v2/downloads/settings')
        .send({ seedRatio: 0, cleanup })
        .expect(status);
    const cleanedUp = async (user = admin) =>
      (await getDownloads(user)).episodes.map((e) => [
        e.season,
        e.episode,
        !!e.cleanupAt,
      ]);
    const downloads = app.get(DownloadsService);

    // The admin's request for episode 2 holds the version that the admin
    // selected. Nothing holds the other version and the other episodes
    const held = episodeFile(2, REDIRECT);
    expect(libraryFiles()).toEqual([
      episodeFile(1, PACK),
      held,
      episodeFile(2, EPISODE),
      `Test Show (2020) [tmdbid-100]/Season 02/Test Show - S02E01 - ${version(SEASON_2)}.mkv`,
    ]);

    await setCleanup('hourly', 400);
    await setCleanup('off');
    expect(await cleanedUp()).toEqual([
      [1, 1, false],
      [1, 2, false],
      [2, 1, false],
    ]);
    await downloads.onCleanupHour();
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
    await downloads.onCleanupHour();

    expect(libraryFiles()).toEqual([held]);
    expect(
      readdirSync(path.join(dirs.library, 'Test Show (2020) [tmdbid-100]')),
    ).toEqual(['Season 01']);
    expect(statuses(await getDownloads())).toEqual([
      [1, 1, 'no-selection'],
      [1, 2, 'available'],
    ]);
    expect(
      await app.get(MikroORM).em.fork().count(MediaFile, { managed: true }),
    ).toBe(1);

    // Every deletion is in the log, with the file it was
    const deleted = await app
      .get(MikroORM)
      .em.fork()
      .find(LogEntry, { type: LogType.FileDeleted });
    expect(deleted.map((entry) => entry.data.path).sort()).toEqual(
      [
        episodeFile(1, PACK),
        episodeFile(2, EPISODE),
        `Test Show (2020) [tmdbid-100]/Season 02/Test Show - S02E01 - ${version(SEASON_2)}.mkv`,
      ].map((file) => path.join(dirs.library, file)),
    );
    expect(deleted[0].message).toBe(
      `Deleted "${deleted[0].data.path}": no request holds it`,
    );
  });

  it('rejects requests for episodes that do not exist', async () => {
    await api('put', `/v2/users/${admin.id}/requests/series/tmdb/${TMDB_ID}`)
      .send({ episodes: [{ season: 1, episode: 9 }], requested: true })
      .expect(400);
  });

  it('keeps the download settings for admins', async () => {
    await api('put', '/v2/downloads/settings', viewer)
      .send({ seedRatio: 5 })
      .expect(403);
  });
});
