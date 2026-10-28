import { EntityManager, raw } from '@mikro-orm/sqlite';
import {
  BeforeApplicationShutdown,
  Inject,
  Injectable,
  Logger,
  OnApplicationBootstrap,
} from '@nestjs/common';
import { JobsService } from '../jobs/jobs.service.js';
import {
  TORRENT_ENGINE,
  type TorrentEngine,
  type TorrentHandle,
  type TorrentState,
  type TorrentStats,
} from './torrent-engine.js';
import { Torrent } from './torrent.entity.js';

const FLUSH_INTERVAL = 30_000;

/** A torrent in the engine */
interface Entry {
  handle: TorrentHandle;
  /** How much of the engine's transfer counters is stored in the torrent row */
  flushed: { downloaded: number; uploaded: number };
}

/**
 * The torrents that run in the engine. It decides nothing: only the job of a
 * torrent starts, changes or stops it, and a change the engine reports is
 * turned into that job. It is the only one that adds to the transfer counters.
 */
@Injectable()
export class TorrentRuntime
  implements OnApplicationBootstrap, BeforeApplicationShutdown
{
  private readonly logger = new Logger(TorrentRuntime.name);
  private readonly entries = new Map<string, Entry>();
  private timer?: NodeJS.Timeout;
  private stopping = false;

  constructor(
    private readonly em: EntityManager,
    private readonly jobs: JobsService,
    @Inject(TORRENT_ENGINE) private readonly engine: TorrentEngine,
  ) {}

  onApplicationBootstrap() {
    this.timer = setInterval(() => {
      this.flushAll().catch((error) =>
        this.logger.error(`Storing the counters failed: ${error.message}`),
      );
    }, FLUSH_INTERVAL);
    this.timer.unref();
  }

  /** Stops every torrent, each storing what it transferred */
  async beforeApplicationShutdown(): Promise<void> {
    this.stopping = true;
    clearInterval(this.timer);
    await Promise.all(
      [...this.entries].map(([infoHash, entry]) =>
        this.remove(infoHash, entry).catch((error) =>
          this.logger.error(`Stopping ${infoHash} failed: ${error.message}`),
        ),
      ),
    );
  }

  /** What the engine knows of a torrent, if it runs */
  snapshot(infoHash: string): TorrentState | undefined {
    return this.entries.get(infoHash)?.handle.getState();
  }

  /** Share of a file of a running torrent that is downloaded, from 0 to 1 */
  getFileProgress(infoHash: string, index: number): number {
    return this.entries.get(infoHash)?.handle.getFileProgress(index) ?? 0;
  }

  /** Starts a torrent in the engine. Throws when the engine refuses the source. */
  start(
    torrent: Pick<Torrent, 'infoHash' | 'magnetUrl' | 'torrentFile'>,
    directory: string,
  ): void {
    const { infoHash } = torrent;
    if (this.stopping) return;
    if (this.entries.has(infoHash)) {
      throw new Error(`Torrent ${infoHash} runs already`);
    }

    const handle = this.engine.add(
      torrent.torrentFile ?? torrent.magnetUrl,
      directory,
    );
    const entry: Entry = { handle, flushed: { downloaded: 0, uploaded: 0 } };
    this.entries.set(infoHash, entry);
    // A change of a handle that was stopped since is about another run
    handle.onChange(() => {
      if (this.entries.get(infoHash) === entry) this.reconcileLater(infoHash);
    });
  }

  setWantedFiles(infoHash: string, indexes: number[]): void {
    this.entries.get(infoHash)?.handle.setWantedFiles(indexes);
  }

  /** Stops a torrent and stores what it transferred since the last flush */
  async stop(infoHash: string): Promise<void> {
    const entry = this.entries.get(infoHash);
    if (!entry) return;

    await this.remove(infoHash, entry);
  }

  /** Adds what a torrent transferred to its row, for its job to read current counters */
  async flushTorrent(infoHash: string): Promise<void> {
    const entry = this.entries.get(infoHash);
    if (entry) await this.flushEntry(infoHash, entry);
  }

  /**
   * Adds what every torrent transferred to its row, and has a torrent that
   * only seeds decide again, since it may have reached the seed ratio
   */
  async flushAll(): Promise<void> {
    const changed = [...this.entries].flatMap(([infoHash, entry]) => {
      const state = entry.handle.getState();
      const delta = this.takeDelta(entry, state.stats);
      if (!delta.downloaded && !delta.uploaded) return [];

      return [
        { infoHash, delta, seeding: state.ready && !state.wanted.length },
      ];
    });
    if (!changed.length) return;

    await this.em.fork().transactional(async (tx) => {
      for (const { infoHash, delta, seeding } of changed) {
        await this.writeDelta(tx, infoHash, delta);
        if (seeding) {
          await this.jobs.enqueue(tx, 'downloads.reconcileTorrent', {
            infoHash,
          });
        }
      }
    });
  }

  private async remove(infoHash: string, entry: Entry): Promise<void> {
    if (this.entries.get(infoHash) === entry) this.entries.delete(infoHash);

    try {
      await this.flushEntry(infoHash, entry);
    } finally {
      // Nothing refers to the engine any more, so it has to stop now
      await entry.handle.destroy();
    }
  }

  private async flushEntry(infoHash: string, entry: Entry): Promise<void> {
    const delta = this.takeDelta(entry, entry.handle.getState().stats);
    if (!delta.downloaded && !delta.uploaded) return;

    await this.em
      .fork()
      .transactional((tx) => this.writeDelta(tx, infoHash, delta));
  }

  /** Takes what the counters of a torrent grew by, at once */
  private takeDelta(entry: Entry, stats: TorrentStats) {
    const delta = {
      downloaded: stats.downloaded - entry.flushed.downloaded,
      uploaded: stats.uploaded - entry.flushed.uploaded,
    };
    entry.flushed = { downloaded: stats.downloaded, uploaded: stats.uploaded };

    return delta;
  }

  private writeDelta(
    tx: EntityManager,
    infoHash: string,
    delta: { downloaded: number; uploaded: number },
  ) {
    return tx.nativeUpdate(
      Torrent,
      { infoHash },
      {
        downloadedBytes: raw(`downloaded_bytes + ${delta.downloaded}`),
        uploadedBytes: raw(`uploaded_bytes + ${delta.uploaded}`),
      },
    );
  }

  private reconcileLater(infoHash: string) {
    if (this.stopping) return;

    this.jobs
      .enqueue(this.em.fork(), 'downloads.reconcileTorrent', { infoHash })
      .catch((error) =>
        this.logger.error(
          `Enqueueing the reconcile of ${infoHash} failed: ${error.message}`,
        ),
      );
  }
}
