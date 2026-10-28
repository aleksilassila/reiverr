import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import * as path from 'node:path';
import parseTorrent from 'parse-torrent';
import {
  TorrentEngine,
  TorrentFileInfo,
  TorrentHandle,
  TorrentState,
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
  ready = false;
  wanted: number[] = [];
  error?: string;
  destroyed = false;
  stats = {
    peers: 3,
    downloadSpeed: 0,
    uploadSpeed: 0,
    downloaded: 0,
    uploaded: 0,
  };
  private listeners: (() => void)[] = [];

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
    // Ready once the engine's add has returned, as a real client is
    queueMicrotask(() => {
      this.ready = true;
      this.notify();
    });
  }

  getState(): TorrentState {
    const complete = this.ready
      ? this.files
          .filter((file) => this.isFileComplete(file.index))
          .map((file) => file.index)
      : [];

    return {
      ready: this.ready,
      files: this.ready ? this.files : undefined,
      error: this.error,
      wanted: this.wanted,
      complete,
      hasData: complete.length > 0,
      stats: this.stats,
    };
  }

  setWantedFiles(indexes: number[]) {
    this.wanted = indexes;
  }

  getFileProgress(index: number) {
    return this.isFileComplete(index) ? 1 : 0.5;
  }

  getFilePath(index: number) {
    return path.join(this.directory, this.files[index].path);
  }

  onChange(listener: () => void) {
    this.listeners.push(listener);
  }

  async destroy() {
    this.destroyed = true;
  }

  /** Fails the torrent, as the engine does on an error */
  fail(error: Error) {
    this.error = error.message;
    this.notify();
  }

  /** Downloads a file: it appears on disk and the engine reports it complete */
  download(index: number) {
    const filePath = this.getFilePath(index);
    mkdirSync(path.dirname(filePath), { recursive: true });
    writeFileSync(filePath, `video ${index}`);
    this.stats.downloaded += this.files[index].length;
    this.notify();
  }

  // Like a real client, data from an earlier run counts
  private isFileComplete(index: number) {
    return existsSync(this.getFilePath(index));
  }

  private notify() {
    this.listeners.forEach((listener) => listener());
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
