import { Injectable, Logger, OnApplicationShutdown } from '@nestjs/common';
import * as path from 'node:path';
import WebTorrent from 'webtorrent';
import {
  TORRENT_DHT_PORT,
  TORRENT_NAT_PMP,
  TORRENT_PORT,
  TORRENT_UPNP,
  TORRENT_WEBRTC,
} from '../consts.js';
import {
  TorrentEngine,
  TorrentFileInfo,
  TorrentHandle,
  TorrentStats,
} from './torrent-engine.js';

const COMPLETION_CHECK_INTERVAL = 1000;

export class WebTorrentHandle implements TorrentHandle {
  readonly ready: Promise<TorrentFileInfo[]>;

  private readonly logger = new Logger(WebTorrentHandle.name);
  // Untyped: @types/webtorrent types the parse-torrent 4 of the indexers as version 11
  private readonly torrent: any;
  // The torrent empties its file list when it closes
  private files: any[] = [];
  private readonly wanted = new Set<number>();
  private readonly completed = new Set<number>();
  private readonly listeners: ((index: number) => void)[] = [];
  private readonly errorListeners: ((error: Error) => void)[] = [];
  private readonly completionCheck: NodeJS.Timeout;
  private failed = false;
  private closed = false;
  private destroying = false;

  constructor(
    client: any,
    source: string | Buffer,
    private readonly directory: string,
  ) {
    // The client would fetch any other string as a URL or read it as a path
    if (typeof source === 'string' && !source.startsWith('magnet:')) {
      throw new Error('The source is not a magnet link');
    }

    this.torrent = client.add(source, { path: directory, deselect: true });

    this.ready = new Promise((resolve, reject) => {
      this.torrent.once('ready', () => {
        this.files = [...this.torrent.files];
        resolve(this.getFiles());
      });
      this.onError(reject);
    });
    this.torrent.on('error', (error: Error | string) =>
      this.fail(typeof error === 'string' ? new Error(error) : error),
    );
    this.torrent.once('close', () => {
      this.closed = true;
      if (!this.destroying) this.fail(new Error('The torrent client stopped'));
    });

    this.completionCheck = setInterval(
      () => this.notifyCompleted(),
      COMPLETION_CHECK_INTERVAL,
    );
    this.completionCheck.unref();
  }

  setWantedFiles(indexes: number[]): void {
    const next = new Set(indexes);
    if (
      next.size === this.wanted.size &&
      [...next].every((index) => this.wanted.has(index))
    ) {
      return;
    }

    this.wanted.clear();
    next.forEach((index) => this.wanted.add(index));
    if (this.closed) return;

    // Deselecting a file would also deselect the pieces it shares with the files next to it
    this.torrent.deselect(0, this.torrent.pieces.length - 1);
    for (const index of this.wanted) this.files[index].select();
  }

  getFileProgress(index: number): number {
    const [first, last] = this.getPieceRange(index);
    if (last < first) return 1;

    let pieces = 0;
    for (let piece = first; piece <= last; piece++) {
      if (this.isPieceStored(piece)) pieces++;
    }

    return pieces / (last - first + 1);
  }

  isFileComplete(index: number): boolean {
    return this.getFileProgress(index) === 1;
  }

  onFileComplete(listener: (index: number) => void): void {
    this.listeners.push(listener);
  }

  onError(listener: (error: Error) => void): void {
    this.errorListeners.push(listener);
  }

  getFilePath(index: number): string {
    return path.join(this.directory, this.files[index].path);
  }

  hasData(): boolean {
    return this.torrent.pieces.some((_: unknown, piece: number) =>
      this.isPieceStored(piece),
    );
  }

  getStats(): TorrentStats {
    return {
      peers: this.torrent.numPeers,
      downloadSpeed: this.torrent.downloadSpeed,
      uploadSpeed: this.torrent.uploadSpeed,
      downloaded: this.torrent.received,
      uploaded: this.torrent.uploaded,
    };
  }

  destroy(): Promise<void> {
    clearInterval(this.completionCheck);
    if (this.closed) return Promise.resolve();

    this.destroying = true;
    return new Promise((resolve) => this.torrent.destroy({}, () => resolve()));
  }

  // The torrent drops a piece once it is verified and written to disk
  private isPieceStored(piece: number): boolean {
    return this.torrent.pieces[piece] === null;
  }

  private fail(error: Error) {
    if (this.failed) return;
    this.failed = true;

    // A source that does not parse has no info hash
    const name = this.torrent.infoHash ?? this.directory;
    this.logger.error(`${name}: ${error.message}`);
    this.errorListeners.forEach((listener) => listener(error));
  }

  private getFiles(): TorrentFileInfo[] {
    return this.files.map((file, index: number): TorrentFileInfo => ({
      index,
      name: file.name,
      path: file.path,
      length: file.length,
    }));
  }

  private getPieceRange(index: number): [number, number] {
    const { offset, length } = this.files[index];
    const { pieceLength } = this.torrent;

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

/**
 * One client for every torrent, so that they share the port and the DHT
 * node. It starts with the first torrent, and again after it stops on an error.
 */
@Injectable()
export class WebTorrentEngine implements TorrentEngine, OnApplicationShutdown {
  private readonly logger = new Logger(WebTorrentEngine.name);
  private client?: any;

  add(source: string | Buffer, directory: string): TorrentHandle {
    return new WebTorrentHandle(this.getClient(), source, directory);
  }

  async onApplicationShutdown(): Promise<void> {
    const { client } = this;
    this.client = undefined;
    if (client && !client.destroyed) {
      await new Promise<void>((resolve) => client.destroy(() => resolve()));
    }
  }

  private getClient(): any {
    if (this.client && !this.client.destroyed) return this.client;

    const client = new WebTorrent({
      torrentPort: TORRENT_PORT,
      dhtPort: TORRENT_DHT_PORT,
      natUpnp: TORRENT_UPNP,
      natPmp: TORRENT_NAT_PMP,
      tracker: { wrtc: TORRENT_WEBRTC },
    });
    client.on('error', (error: Error | string) => {
      const message = typeof error === 'string' ? error : error.message;
      this.logger.error(
        client.destroyed
          ? `The torrent client stopped: ${message}`
          : `The torrent client: ${message}`,
      );
    });
    this.client = client;

    return client;
  }
}
