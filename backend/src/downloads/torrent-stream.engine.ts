import { Injectable, Logger } from '@nestjs/common';
import * as path from 'node:path';
import torrentStream from 'torrent-stream';
import {
  TorrentHandle,
  TorrentEngine,
  TorrentFile,
  TorrentStats,
} from './torrent-engine.js';

const COMPLETION_CHECK_INTERVAL = 1000;

export class TorrentStreamHandle implements TorrentHandle {
  readonly ready: Promise<TorrentFile[]>;

  private readonly logger = new Logger(TorrentStreamHandle.name);
  // The typings cover a fraction of the engine (no torrent, bitfield, store or swarm speeds)
  private readonly engine: any;
  private readonly wanted = new Set<number>();
  private readonly completed = new Set<number>();
  private readonly listeners: ((index: number) => void)[] = [];
  private readonly completionCheck: NodeJS.Timeout;

  constructor(
    source: string | Buffer,
    private readonly directory: string,
    options: TorrentStream.TorrentEngineOptions = {},
  ) {
    this.engine = torrentStream(source, {
      ...options,
      path: directory,
      tmp: directory,
    });

    this.ready = new Promise((resolve, reject) => {
      this.engine.on('ready', () => resolve(this.getFiles()));
      this.engine.on('error', reject);
    });
    this.engine.on('error', (error: Error) =>
      this.logger.error(`${this.engine.infoHash}: ${error.message}`),
    );

    this.completionCheck = setInterval(
      () => this.notifyCompleted(),
      COMPLETION_CHECK_INTERVAL,
    );
    this.completionCheck.unref();
  }

  get infoHash(): string {
    return this.engine.infoHash;
  }

  setWantedFiles(indexes: number[]): void {
    const next = new Set(indexes);

    for (const index of this.wanted) {
      if (!next.has(index)) this.engine.files[index].deselect();
    }
    for (const index of next) {
      if (!this.wanted.has(index)) this.engine.files[index].select();
    }

    this.wanted.clear();
    next.forEach((index) => this.wanted.add(index));
  }

  getFileProgress(index: number): number {
    const [first, last] = this.getPieceRange(index);
    if (last < first) return 1;

    let pieces = 0;
    for (let piece = first; piece <= last; piece++) {
      if (this.engine.bitfield.get(piece)) pieces++;
    }

    return pieces / (last - first + 1);
  }

  isFileComplete(index: number): boolean {
    if (this.getFileProgress(index) < 1) return false;

    // Verified pieces are written to disk asynchronously and wait in memory until then
    const [first, last] = this.getPieceRange(index);
    for (let piece = first; piece <= last; piece++) {
      if (this.engine.store.mem[piece]) return false;
    }

    return true;
  }

  onFileComplete(listener: (index: number) => void): void {
    this.listeners.push(listener);
  }

  getFilePath(index: number): string {
    return path.join(this.directory, this.engine.files[index].path);
  }

  hasData(): boolean {
    for (let piece = 0; piece < this.engine.torrent.pieces.length; piece++) {
      if (this.engine.bitfield.get(piece)) return true;
    }

    return false;
  }

  getStats(): TorrentStats {
    const { swarm } = this.engine;

    return {
      peers: swarm.wires.length,
      downloadSpeed: swarm.downloadSpeed(),
      uploadSpeed: swarm.uploadSpeed(),
      downloaded: swarm.downloaded,
      uploaded: swarm.uploaded,
    };
  }

  destroy(): Promise<void> {
    clearInterval(this.completionCheck);

    return new Promise((resolve) => this.engine.destroy(() => resolve()));
  }

  private getFiles(): TorrentFile[] {
    return this.engine.files.map(
      (file: TorrentStream.TorrentFile, index: number): TorrentFile => ({
        index,
        name: file.name,
        path: file.path,
        length: file.length,
      }),
    );
  }

  private getPieceRange(index: number): [number, number] {
    const { offset, length } = this.engine.files[index];
    const { pieceLength } = this.engine.torrent;

    return [
      Math.floor(offset / pieceLength),
      Math.floor((offset + length - 1) / pieceLength),
    ];
  }

  private notifyCompleted() {
    for (const index of this.wanted) {
      if (this.completed.has(index) || !this.isFileComplete(index)) continue;

      this.completed.add(index);
      this.listeners.forEach((listener) => listener(index));
    }
  }
}

@Injectable()
export class TorrentStreamEngine implements TorrentEngine {
  add(source: string | Buffer, directory: string): TorrentHandle {
    return new TorrentStreamHandle(source, directory);
  }
}
