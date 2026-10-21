import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import * as path from 'node:path';
import parseTorrent from 'parse-torrent';
import {
  TorrentEngine,
  TorrentFileInfo,
  TorrentHandle,
} from '../src/downloads/torrent-engine.js';

/**
 * The files of torrents known by magnet link, which a real client learns
 * from its peers, by info hash
 */
export const magnetFiles: Record<string, { path: string; length: number }[]> =
  {};

/** A torrent in the fake engine: files appear on disk when a test downloads them */
export class FakeTorrent implements TorrentHandle {
  readonly infoHash: string;
  readonly files: TorrentFileInfo[];
  readonly ready: Promise<TorrentFileInfo[]>;
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
  private errorListeners: ((error: Error) => void)[] = [];

  constructor(
    source: string | Buffer,
    readonly directory: string,
  ) {
    const parsed = parseTorrent(source);

    this.infoHash = parsed.infoHash;
    this.files = (parsed.files ?? magnetFiles[parsed.infoHash] ?? []).map(
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

  onError(listener: (error: Error) => void) {
    this.errorListeners.push(listener);
  }

  fail(error: Error) {
    this.errorListeners.forEach((listener) => listener(error));
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

  /** Downloads a file: it appears on disk and the engine reports it complete */
  download(index: number) {
    const filePath = this.getFilePath(index);
    mkdirSync(path.dirname(filePath), { recursive: true });
    writeFileSync(filePath, `video ${index}`);
    this.stats.downloaded += this.files[index].length;
    this.listeners.forEach((listener) => listener(index));
  }
}

export class FakeEngine implements TorrentEngine {
  torrents: FakeTorrent[] = [];

  add(source: string | Buffer, directory: string) {
    const torrent = new FakeTorrent(source, directory);
    this.torrents.push(torrent);
    return torrent;
  }

  /** The torrent that runs for an info hash, if one does */
  running(infoHash: string): FakeTorrent | undefined {
    const running = this.torrents.filter(
      (t) => t.infoHash === infoHash && !t.destroyed,
    );
    if (running.length > 1) {
      throw new Error(`${infoHash} runs ${running.length} times`);
    }

    return running[0];
  }
}
