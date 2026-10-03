import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import * as path from 'node:path';
import { createTorrent, PIECE_LENGTH } from '../../test/torrent-fixture.js';
import { TorrentStreamHandle } from './torrent-stream.engine.js';

// Runs the real client without peer discovery, so nothing leaves the machine
describe('TorrentStreamHandle', () => {
  const files = [
    { name: 'Show.S01E01.mkv', data: Buffer.alloc(PIECE_LENGTH * 3, 'a') },
    {
      name: 'Show.S01E02.mkv',
      data: Buffer.alloc(PIECE_LENGTH * 2 + 100, 'b'),
    },
  ];
  let directory: string;
  let torrent: TorrentStreamHandle;

  beforeEach(() => {
    directory = mkdtempSync(path.join(tmpdir(), 'reiverr-torrent-'));
  });

  afterEach(async () => {
    await torrent.destroy();
    rmSync(directory, { recursive: true, force: true });
  });

  const add = () =>
    new TorrentStreamHandle(createTorrent('Show.S01', files), directory, {
      dht: false,
      tracker: false,
    });

  it('lists the files of a torrent and has no data at first', async () => {
    torrent = add();

    // Known before any peer has been asked for the file list
    expect(torrent.infoHash).toMatch(/^[a-f0-9]{40}$/);
    expect(await torrent.ready).toEqual([
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
    ]);
    expect(torrent.hasData()).toBe(false);
    expect(torrent.getFileProgress(0)).toBe(0);
    expect(torrent.isFileComplete(0)).toBe(false);
    expect(torrent.getFilePath(1)).toBe(
      path.join(directory, 'Show.S01', 'Show.S01E02.mkv'),
    );
    expect(torrent.getStats()).toEqual({
      peers: 0,
      downloadSpeed: 0,
      uploadSpeed: 0,
      downloaded: 0,
      uploaded: 0,
    });
  });

  it('recognises data from an earlier run per file', async () => {
    mkdirSync(path.join(directory, 'Show.S01'));
    writeFileSync(
      path.join(directory, 'Show.S01', files[0].name),
      files[0].data,
    );

    torrent = add();
    await torrent.ready;

    expect(torrent.hasData()).toBe(true);
    expect(torrent.getFileProgress(0)).toBe(1);
    expect(torrent.isFileComplete(0)).toBe(true);
    expect(torrent.getFileProgress(1)).toBe(0);
    expect(torrent.isFileComplete(1)).toBe(false);
  });

  it('reports a wanted file that is complete and accepts changes to the wanted files', async () => {
    mkdirSync(path.join(directory, 'Show.S01'));
    writeFileSync(
      path.join(directory, 'Show.S01', files[1].name),
      files[1].data,
    );

    torrent = add();
    await torrent.ready;

    const completed = new Promise<number>((resolve) =>
      torrent.onFileComplete(resolve),
    );
    torrent.setWantedFiles([0, 1]);
    torrent.setWantedFiles([1]);

    expect(await completed).toBe(1);
  });

  it('rejects a source that is not a torrent', () => {
    expect(
      () => new TorrentStreamHandle('not a magnet link', directory),
    ).toThrow();
    torrent = add();
  });
});
