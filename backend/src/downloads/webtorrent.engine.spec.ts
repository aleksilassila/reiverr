import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import * as net from 'node:net';
import { tmpdir } from 'node:os';
import * as path from 'node:path';
import WebTorrent from 'webtorrent';
import { createTorrent, PIECE_LENGTH } from '../../test/torrent-fixture.js';
import { TorrentFileInfo } from './torrent-engine.js';
import { WebTorrentHandle } from './webtorrent.engine.js';

// Runs real clients without peer discovery, so nothing leaves the machine
describe('WebTorrentHandle', () => {
  const files = [
    { name: 'Show.S01E01.mkv', data: Buffer.alloc(PIECE_LENGTH * 3, 'a') },
    {
      name: 'Show.S01E02.mkv',
      data: Buffer.alloc(PIECE_LENGTH * 2 + 100, 'b'),
    },
  ];
  let directory: string;
  let client: WebTorrent;
  let torrent: WebTorrentHandle | undefined;

  beforeEach(() => {
    directory = mkdtempSync(path.join(tmpdir(), 'reiverr-torrent-'));
    client = createClient();
  });

  afterEach(async () => {
    await torrent?.destroy();
    torrent = undefined;
    await destroyClient(client);
    rmSync(directory, { recursive: true, force: true });
  });

  const add = (source: string | Buffer = createTorrent('Show.S01', files)) =>
    new WebTorrentHandle(client, source, directory);

  it('lists the files of a torrent once ready and has no data at first', async () => {
    torrent = add();

    expect(torrent.getState()).toMatchObject({
      ready: false,
      files: undefined,
      complete: [],
      hasData: false,
    });
    expect(torrent.getFileProgress(0)).toBe(0);

    await ready(torrent);

    expect(torrent.getState()).toEqual({
      ready: true,
      files: [
        {
          index: 0,
          name: 'Show.S01E01.mkv',
          path: path.join('Show.S01', 'Show.S01E01.mkv'),
          length: PIECE_LENGTH * 3,
        },
        {
          index: 1,
          name: 'Show.S01E02.mkv',
          path: path.join('Show.S01', 'Show.S01E02.mkv'),
          length: PIECE_LENGTH * 2 + 100,
        },
      ],
      error: undefined,
      wanted: [],
      complete: [],
      hasData: false,
      stats: {
        peers: 0,
        downloadSpeed: 0,
        uploadSpeed: 0,
        downloaded: 0,
        uploaded: 0,
      },
    });
    expect(torrent.getFileProgress(0)).toBe(0);
    expect(torrent.getFilePath(1)).toBe(
      path.join(directory, 'Show.S01', 'Show.S01E02.mkv'),
    );
  });

  it('recognises data from an earlier run per file', async () => {
    mkdirSync(path.join(directory, 'Show.S01'));
    writeFileSync(
      path.join(directory, 'Show.S01', files[0].name),
      files[0].data,
    );

    torrent = add();
    await ready(torrent);

    expect(torrent.getState()).toMatchObject({ hasData: true, complete: [0] });
    expect(torrent.getFileProgress(0)).toBe(1);
    expect(torrent.getFileProgress(1)).toBe(0);
  });

  it('reports a wanted file that is complete and accepts changes to the wanted files', async () => {
    mkdirSync(path.join(directory, 'Show.S01'));
    writeFileSync(
      path.join(directory, 'Show.S01', files[1].name),
      files[1].data,
    );

    torrent = add();
    await ready(torrent);

    const changed = nextChange(torrent);
    torrent.setWantedFiles([0, 1]);
    torrent.setWantedFiles([1]);
    await changed;

    expect(torrent.getState()).toMatchObject({ wanted: [1], complete: [1] });
  });

  it('downloads the wanted files from a peer, also when the next file is no longer wanted', async () => {
    // The files share a piece
    const shared = [
      {
        name: 'Show.S01E01.mkv',
        data: Buffer.alloc(PIECE_LENGTH * 2 + 100, 'a'),
      },
      { name: 'Show.S01E02.mkv', data: Buffer.alloc(PIECE_LENGTH * 3, 'b') },
    ];
    const source = createTorrent('Show.S01', shared);
    const seedDirectory = mkdtempSync(path.join(tmpdir(), 'reiverr-seed-'));
    mkdirSync(path.join(seedDirectory, 'Show.S01'));
    for (const file of shared) {
      writeFileSync(path.join(seedDirectory, 'Show.S01', file.name), file.data);
    }
    const seeder = createClient();

    try {
      const seed = seeder.add(source, { path: seedDirectory });
      await new Promise((resolve) => seed.once('ready', resolve));

      torrent = add(source);
      await ready(torrent);
      const changed = nextChange(torrent);
      torrent.setWantedFiles([0, 1]);
      torrent.setWantedFiles([0]);
      seed.addPeer(`127.0.0.1:${client.torrentPort}`);
      await changed;

      const state = torrent.getState();
      expect(state.complete).toEqual([0]);
      expect(state.stats.downloaded).toBeGreaterThan(0);
    } finally {
      await destroyClient(seeder);
      rmSync(seedDirectory, { recursive: true, force: true });
    }
  });

  it('accepts peers on the port of the client', async () => {
    const port = await findFreePort();
    await destroyClient(client);
    client = createClient(port);

    torrent = add();

    await vi.waitFor(() => connect(port));
  });

  it('refuses a string that is not a magnet link and fails a source that is not a torrent', async () => {
    expect(() => add('not a magnet link')).toThrow();

    torrent = add(Buffer.from('not a torrent'));

    await expect(ready(torrent)).rejects.toThrow();
  });

  it('fails when the client stops', async () => {
    torrent = add();
    await ready(torrent);
    const changed = nextChange(torrent);

    await destroyClient(client);
    await changed;

    expect(torrent.getState().error).toBe('The torrent client stopped');
  });
});

/** Resolves with the files once the torrent is ready, rejects once it fails */
function ready(torrent: WebTorrentHandle): Promise<TorrentFileInfo[]> {
  return new Promise((resolve, reject) => {
    const check = () => {
      const state = torrent.getState();
      if (state.error) reject(new Error(state.error));
      else if (state.ready) resolve(state.files);
    };
    torrent.onChange(check);
    check();
  });
}

/** Resolves at the next change the torrent reports */
function nextChange(torrent: WebTorrentHandle): Promise<void> {
  return new Promise((resolve) => torrent.onChange(resolve));
}

function createClient(torrentPort?: number): WebTorrent {
  return new WebTorrent({
    torrentPort,
    dht: false,
    tracker: false,
    lsd: false,
    natUpnp: false,
    natPmp: false,
  });
}

function destroyClient(client: WebTorrent): Promise<void> {
  if (client.destroyed) return Promise.resolve();

  return new Promise((resolve) => client.destroy(() => resolve()));
}

function findFreePort(): Promise<number> {
  return new Promise((resolve) => {
    const server = net.createServer().listen(0, () => {
      const { port } = server.address() as net.AddressInfo;
      server.close(() => resolve(port));
    });
  });
}

function connect(port: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const socket = net.connect(port, '127.0.0.1');
    socket.once('connect', () => {
      socket.destroy();
      resolve();
    });
    socket.once('error', reject);
  });
}
