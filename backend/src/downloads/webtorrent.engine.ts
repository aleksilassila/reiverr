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
  TorrentState,
} from './torrent-engine.js';

const COMPLETION_CHECK_INTERVAL = 1000;

export class WebTorrentHandle implements TorrentHandle {
  private readonly logger = new Logger(WebTorrentHandle.name);
  // Untyped: @types/webtorrent types the parse-torrent 4 of the indexers as version 11
  private readonly torrent: any;
  // The torrent empties its file list when it closes
  private files: any[] = [];
  private ready = false;
  private error?: string;
  private readonly wanted = new Set<number>();
  /** The wanted files found complete by the check */
  private readonly completed = new Set<number>();
  private readonly listeners: (() => void)[] = [];
  private readonly completionCheck: NodeJS.Timeout;
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
    this.torrent.once('ready', () => {
      this.files = [...this.torrent.files];
      this.ready = true;
      this.notify();
    });
    this.torrent.on('error', (error: Error | string) =>
      this.fail(typeof error === 'string' ? error : error.message),
    );
    this.torrent.once('close', () => {
      this.closed = true;
      if (!this.destroying) this.fail('The torrent client stopped');
    });

    this.completionCheck = setInterval(
      () => this.checkCompletion(),
      COMPLETION_CHECK_INTERVAL,
    );
    this.completionCheck.unref();
  }

  getState(): TorrentState {
    return {
      ready: this.ready,
      files: this.ready ? this.getFiles() : undefined,
      error: this.error,
      wanted: [...this.wanted],
      complete: this.ready
        ? this.files.flatMap((_, index) =>
            this.isFileComplete(index) ? [index] : [],
          )
        : [],
      hasData:
        this.ready &&
        this.torrent.pieces.some((_: unknown, piece: number) =>
          this.isPieceStored(piece),
        ),
      stats: {
        peers: this.torrent.numPeers,
        downloadSpeed: this.torrent.downloadSpeed,
        uploadSpeed: this.torrent.uploadSpeed,
        downloaded: this.torrent.received,
        uploaded: this.torrent.uploaded,
      },
    };
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
    if (!this.ready) return 0;

    const [first, last] = this.getPieceRange(index);
    if (last < first) return 1;

    let pieces = 0;
    for (let piece = first; piece <= last; piece++) {
      if (this.isPieceStored(piece)) pieces++;
    }

    return pieces / (last - first + 1);
  }

  getFilePath(index: number): string {
    return path.join(this.directory, this.files[index].path);
  }

  onChange(listener: () => void): void {
    this.listeners.push(listener);
  }

  destroy(): Promise<void> {
    clearInterval(this.completionCheck);
    if (this.closed) return Promise.resolve();

    this.destroying = true;
    return new Promise((resolve) => this.torrent.destroy({}, () => resolve()));
  }

  private isFileComplete(index: number): boolean {
    return this.getFileProgress(index) === 1;
  }

  // The torrent drops a piece once it is verified and written to disk
  private isPieceStored(piece: number): boolean {
    return this.torrent.pieces[piece] === null;
  }

  private fail(message: string) {
    if (this.error) return;
    this.error = message;

    // A source that does not parse has no info hash
    const name = this.torrent.infoHash ?? this.directory;
    this.logger.error(`${name}: ${message}`);
    this.notify();
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

  private checkCompletion() {
    let changed = false;
    for (const index of this.wanted) {
      if (this.completed.has(index) || !this.isFileComplete(index)) continue;

      this.completed.add(index);
      changed = true;
    }
    if (changed) this.notify();
  }

  private notify() {
    this.listeners.forEach((listener) => listener());
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
