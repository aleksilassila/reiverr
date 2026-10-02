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
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module.js';
import { SeriesDownloadsDto } from '../src/downloads/downloads.dto.js';
import {
  Torrent,
  TORRENT_ENGINE,
  TorrentEngine,
  TorrentFile,
} from '../src/downloads/torrent-engine.js';
import { ReleaseDto } from '../src/indexers/indexers.dto.js';
import { SeriesMetadata } from '../src/metadata/metadata.entity.js';
import mikroOrmConfig from '../src/mikro-orm.config.js';

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
const EPISODE_TORRENT = 'contents of a .torrent file';
const SEASON_2_TORRENT = 'contents of another .torrent file';

const TORRENT_FILES: Record<string, { path: string; length: number }[]> = {
  [PACK_MAGNET]: [
    { path: 'Test.Show.S01/Test.Show.S01E01.1080p.mkv', length: 100 },
    { path: 'Test.Show.S01/Test.Show.S01E02.1080p.mkv', length: 100 },
    { path: 'Test.Show.S01/Test.Show.S01E03.1080p.mkv', length: 100 },
    { path: 'Test.Show.S01/Sample/Test.Show.S01E01.sample.mkv', length: 10 },
    { path: 'Test.Show.S01/info.nfo', length: 1 },
  ],
  [EPISODE_TORRENT]: [
    { path: 'release-group-1080p.mkv', length: 50 },
    { path: 'readme.txt', length: 1 },
  ],
  [REDIRECT_MAGNET]: [{ path: 'Other.Show.S09E09.mkv', length: 50 }],
  [SEASON_2_TORRENT]: [{ path: 'Test Show 2x01.mkv', length: 50 }],
};

class FakeTorrent implements Torrent {
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
    readonly source: string,
    readonly directory: string,
  ) {
    this.files = TORRENT_FILES[source].map((file, index) => ({
      ...file,
      index,
      name: path.basename(file.path),
    }));
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
    const torrent = new FakeTorrent(source.toString(), directory);
    this.torrents.push(torrent);
    return torrent;
  }

  running(source: string) {
    return this.torrents.find((t) => t.source === source && !t.destroyed);
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
      ${item('Test.Show.S01E03.1080p.WEB-GRP', `${origin}/dl/other`, 20)}
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

describe('Series downloads (e2e)', () => {
  let app: INestApplication<App>;
  let engine: FakeEngine;
  let indexer: Awaited<ReturnType<typeof startIndexer>>;
  let token: string;
  let userId: string;

  const api = (method: 'get' | 'put' | 'delete', url: string) =>
    request(app.getHttpServer())
      [method](url)
      .set('Authorization', `Bearer ${token}`);

  const getDownloads = (): Promise<SeriesDownloadsDto> =>
    api('get', `/v2/downloads/series/${TMDB_ID}`)
      .expect(200)
      .then((res) => res.body);

  const search = (query: string): Promise<ReleaseDto[]> =>
    api('get', `/v2/indexers/search/series/${TMDB_ID}?${query}`)
      .expect(200)
      .then((res) => res.body);

  const setRequested = (episodes: number[], requested: boolean) =>
    api('put', `/v2/users/${userId}/media-requests/series/tmdb/${TMDB_ID}`)
      .send({
        episodes: episodes.map((episode) => ({ season: 1, episode })),
        requested,
      })
      .expect(200);

  // Reconciliations triggered by torrent events run in the background
  const settle = () => new Promise((resolve) => setTimeout(resolve, 100));

  const libraryFiles = () =>
    existsSync(dirs.library)
      ? (readdirSync(dirs.library, { recursive: true }) as string[])
          .filter((file) => file.endsWith('.mkv'))
          .sort()
      : [];

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

    const signIn = await request(app.getHttpServer())
      .post('/auth')
      .send({ name: 'admin', password: 'password' })
      .expect(200);
    token = signIn.body.accessToken;
    userId = signIn.body.user.id;

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
      seasons: [1],
      episodes: [],
    });
    expect(releases[0]).not.toHaveProperty('magnetUrl');
    expect(releases[0]).not.toHaveProperty('downloadUrl');

    const query = indexer.requests.at(-1).searchParams;
    expect(Object.fromEntries(query)).toEqual({
      apikey: 'secret',
      t: 'tvsearch',
      tmdbid: TMDB_ID,
      season: '1',
    });
  });

  it('lists the releases of an episode, most seeded first', async () => {
    const releases = await search('season=1&episode=2');

    expect(releases.map((r) => r.title)).toEqual([
      'Test.Show.S01E02.720p.WEB-GRP',
      'Test.Show.S01E02.1080p.WEB-GRP',
    ]);
    expect(indexer.requests.at(-1).searchParams.get('ep')).toBe('2');
  });

  it('does not download when a torrent is selected but nothing is requested', async () => {
    const [pack] = await search('season=1');

    const res = await api(
      'put',
      `/v2/downloads/series/${TMDB_ID}/seasons/1/selection`,
    )
      .send({ releaseId: pack.id })
      .expect(200);
    expect(res.body).toMatchObject({
      season: 1,
      episode: 0,
      title: pack.title,
    });
    expect(res.body).not.toHaveProperty('magnetUrl');

    await settle();
    expect(engine.torrents).toEqual([]);

    const downloads = await getDownloads();
    expect(downloads.selections).toHaveLength(1);
    expect(downloads.torrents).toEqual([]);
  });

  it('does not download a requested episode without a torrent', async () => {
    await api(
      'delete',
      `/v2/downloads/series/${TMDB_ID}/seasons/1/selection`,
    ).expect(200);
    await setRequested([1], true);
    await settle();

    expect(engine.torrents).toEqual([]);

    await setRequested([1], false);
  });

  it('downloads only the requested episodes of a season pack', async () => {
    const [pack] = await search('season=1');
    await api('put', `/v2/downloads/series/${TMDB_ID}/seasons/1/selection`)
      .send({ releaseId: pack.id })
      .expect(200);

    const res = await setRequested([1, 2], true);
    expect(res.body.map((r) => [r.season, r.episode, r.approved])).toEqual([
      [1, 1, true],
      [1, 2, true],
    ]);
    await settle();

    const torrent = engine.running(PACK_MAGNET);
    expect(torrent.wanted).toEqual([0, 1]);

    const downloads = await getDownloads();
    expect(downloads.torrents).toMatchObject([
      { status: 'downloading', peers: 3 },
    ]);
    expect(downloads.episodes).toMatchObject([
      { season: 1, episode: 1, progress: 0.5 },
      { season: 1, episode: 2, progress: 0.5 },
    ]);
    expect(downloads.onDisk).toEqual([]);
  });

  it('prefers the torrent selected for an episode over the season pack', async () => {
    const releases = await search('season=1&episode=2');
    const release = releases.find((r) => r.title.includes('1080p'));

    await api(
      'put',
      `/v2/downloads/series/${TMDB_ID}/seasons/1/episodes/2/selection`,
    )
      .send({ releaseId: release.id })
      .expect(200);
    await settle();

    expect(indexer.requests.at(-1).pathname).toBe('/dl/episode');
    expect(engine.running(PACK_MAGNET).wanted).toEqual([0]);
    expect(engine.running(EPISODE_TORRENT).wanted).toEqual([0]);
  });

  it('imports finished episodes with hard links and removes finished torrents', async () => {
    const pack = engine.running(PACK_MAGNET);
    const episode = engine.running(EPISODE_TORRENT);

    episode.download(0);
    await settle();

    expect(libraryFiles()).toEqual([
      'Test Show (2020) [tmdbid-100]/Season 01/Test Show - S01E02.mkv',
    ]);
    expect(episode.destroyed).toBe(true);
    expect(existsSync(episode.directory)).toBe(false);
    expect(pack.destroyed).toBe(false);

    const source = pack.getFilePath(0);
    pack.download(0);
    const inode = statSync(source).ino;
    await settle();

    expect(libraryFiles()).toEqual([
      'Test Show (2020) [tmdbid-100]/Season 01/Test Show - S01E01.mkv',
      'Test Show (2020) [tmdbid-100]/Season 01/Test Show - S01E02.mkv',
    ]);
    expect(statSync(path.join(dirs.library, libraryFiles()[0])).ino).toBe(
      inode,
    );
    expect(pack.destroyed).toBe(true);
    expect(existsSync(pack.directory)).toBe(false);

    const downloads = await getDownloads();
    expect(downloads.torrents).toEqual([]);
    expect(downloads.onDisk).toEqual([
      { season: 1, episode: 1 },
      { season: 1, episode: 2 },
    ]);
    expect(downloads.selections.map((s) => s.downloadedBytes)).toEqual([0, 0]);
  });

  it('resolves a download link that redirects to a magnet link', async () => {
    const releases = await search('season=1&episode=2');
    const release = releases.find((r) => r.title.includes('720p'));

    await api(
      'delete',
      `/v2/downloads/series/${TMDB_ID}/seasons/1/episodes/2/selection`,
    ).expect(200);
    await api(
      'put',
      `/v2/downloads/series/${TMDB_ID}/seasons/1/episodes/3/selection`,
    )
      .send({ releaseId: release.id })
      .expect(200);
    await setRequested([3], true);
    await settle();

    // The only video of an episode torrent is used whatever it is called
    expect(engine.running(REDIRECT_MAGNET).wanted).toEqual([0]);

    await api(
      'delete',
      `/v2/downloads/series/${TMDB_ID}/seasons/1/episodes/3/selection`,
    ).expect(200);
    await settle();

    expect(engine.running(REDIRECT_MAGNET)).toBeUndefined();
    expect(engine.running(PACK_MAGNET).wanted).toEqual([2]);
  });

  it('stops downloading an episode that is no longer requested', async () => {
    const pack = engine.running(PACK_MAGNET);

    await setRequested([3], false);
    await settle();

    expect(pack.destroyed).toBe(true);
    expect((await getDownloads()).torrents).toEqual([]);
  });

  it('seeds until the ratio is reached, also after a restart', async () => {
    await api('put', '/v2/downloads/settings')
      .send({ seedRatio: 2 })
      .expect(200);
    await setRequested([3], true);
    await settle();

    let pack = engine.running(PACK_MAGNET);
    pack.download(2);
    pack.stats.uploaded = 50;
    await settle();

    expect(libraryFiles()).toHaveLength(3);
    expect(pack.destroyed).toBe(false);

    let downloads = await getDownloads();
    expect(downloads.torrents).toMatchObject([{ status: 'seeding' }]);
    expect(downloads.selections[0]).toMatchObject({
      downloadedBytes: 100,
      uploadedBytes: 50,
    });

    await app.close();
    await startApp();
    await settle();

    pack = engine.running(PACK_MAGNET);
    expect(pack).toBeDefined();
    expect(pack.wanted).toEqual([]);

    downloads = await getDownloads();
    expect(downloads.torrents).toMatchObject([{ status: 'seeding' }]);
    expect(downloads.selections[0]).toMatchObject({
      downloadedBytes: 100,
      uploadedBytes: 50,
    });

    // Reaching 2 x 100 bytes in total ends the seeding
    pack.stats.uploaded = 150;
    await setRequested([], true);
    await settle();

    expect(pack.destroyed).toBe(true);
    expect(existsSync(pack.directory)).toBe(false);
    expect(libraryFiles()).toHaveLength(3);

    downloads = await getDownloads();
    expect(downloads.torrents).toEqual([]);
    expect(downloads.selections[0]).toMatchObject({
      downloadedBytes: 0,
      uploadedBytes: 0,
    });
  });

  it('rejects requests for episodes that do not exist', async () => {
    await api(
      'put',
      `/v2/users/${userId}/media-requests/series/tmdb/${TMDB_ID}`,
    )
      .send({ episodes: [{ season: 1, episode: 9 }], requested: true })
      .expect(400);
  });

  it('lets any user select a torrent but waits for approval to download', async () => {
    const created = await request(app.getHttpServer())
      .post('/users')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'guest', password: 'password', isAdmin: false });
    expect(created.status).toBeLessThan(300);

    const signIn = await request(app.getHttpServer())
      .post('/auth')
      .send({ name: 'guest', password: 'password' })
      .expect(200);
    const asGuest = (method: 'get' | 'put', url: string) =>
      request(app.getHttpServer())
        [method](url)
        .set('Authorization', `Bearer ${signIn.body.accessToken}`);

    await asGuest('get', '/v2/indexers').expect(403);
    await asGuest('put', '/v2/downloads/settings')
      .send({ seedRatio: 5 })
      .expect(403);

    const [pack] = await asGuest(
      'get',
      `/v2/indexers/search/series/${TMDB_ID}?season=2`,
    )
      .expect(200)
      .then((res) => res.body);
    await asGuest('put', `/v2/downloads/series/${TMDB_ID}/seasons/2/selection`)
      .send({ releaseId: pack.id })
      .expect(200);

    const res = await asGuest(
      'put',
      `/v2/users/${signIn.body.user.id}/media-requests/series/tmdb/${TMDB_ID}`,
    )
      .send({ episodes: [{ season: 2, episode: 1 }], requested: true })
      .expect(200);
    expect(res.body).toMatchObject([
      { season: 2, episode: 1, approved: false },
    ]);
    await settle();

    expect(engine.running(SEASON_2_TORRENT)).toBeUndefined();

    await api('put', `/v2/media-requests/${res.body[0].id}`)
      .send({ approved: true })
      .expect(200);
    await settle();

    expect(engine.running(SEASON_2_TORRENT).wanted).toEqual([0]);
  });
});
