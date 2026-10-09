import { EntityManager, raw } from '@mikro-orm/sqlite';
import {
  BeforeApplicationShutdown,
  Inject,
  Injectable,
  Logger,
  OnApplicationBootstrap,
} from '@nestjs/common';
import { JobContext, JobsService } from '../jobs/jobs.service.js';
import { SettingsService } from '../settings/settings.service.js';
import {
  DEFAULT_DOWNLOADS_SETTINGS,
  DOWNLOADS_SETTINGS_KEY,
} from './downloads.settings.js';
import {
  TORRENT_ENGINE,
  type TorrentEngine,
  type TorrentFile,
  type TorrentHandle,
} from './torrent-engine.js';
import { Torrent } from './torrent.entity.js';

const FLUSH_INTERVAL = 30_000;

/** A torrent in the engine */
interface Entry {
  torrentId: string;
  handle: TorrentHandle;
  files?: TorrentFile[];
  ready: boolean;
  error?: string;
  wanted: number[];
  /** How much of the engine's transfer counters is stored in the torrent row */
  flushed: { downloaded: number; uploaded: number };
}

export interface TorrentSnapshot {
  /** The engine knows the files and has verified the data of an earlier run */
  ready: boolean;
  files?: TorrentFile[];
  error?: string;
  wanted: number[];
  complete: Set<number>;
  hasData: boolean;
  /** Transfer counters that are not in the torrent row yet */
  unflushed: { downloaded: number; uploaded: number };
  peers: number;
  downloadSpeed: number;
  uploadSpeed: number;
  progress: (fileIndex: number) => number;
  filePath: (fileIndex: number) => string;
}

/**
 * The torrents that run in the engine. It decides nothing: only the jobs of a
 * torrent start, change or stop it, and what the engine reports is turned
 * into jobs. It is the only one that adds to the transfer counters.
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
    private readonly settingsService: SettingsService,
    @Inject(TORRENT_ENGINE) private readonly engine: TorrentEngine,
  ) {}

  onApplicationBootstrap() {
    this.timer = setInterval(() => {
      this.flush().catch((error) =>
        this.logger.error(`Storing the counters failed: ${error.message}`),
      );
    }, FLUSH_INTERVAL);
    this.timer.unref();
  }

  async beforeApplicationShutdown(): Promise<void> {
    this.stopping = true;
    clearInterval(this.timer);
    await this.flush().catch((error) =>
      this.logger.error(`Storing the counters failed: ${error.message}`),
    );
    await Promise.allSettled(
      [...this.entries.values()].map((entry) => this.remove(entry)),
    );
  }

  snapshot(torrentId: string): TorrentSnapshot | undefined {
    const entry = this.entries.get(torrentId);
    if (!entry) return undefined;

    const { handle } = entry;
    const stats = handle.getStats();
    const files = entry.ready ? entry.files : undefined;

    return {
      ready: entry.ready,
      files: entry.files,
      error: entry.error,
      wanted: entry.wanted,
      complete: new Set(
        (files ?? [])
          .filter((file) => handle.isFileComplete(file.index))
          .map((file) => file.index),
      ),
      hasData: entry.ready && handle.hasData(),
      unflushed: {
        downloaded: stats.downloaded - entry.flushed.downloaded,
        uploaded: stats.uploaded - entry.flushed.uploaded,
      },
      peers: stats.peers,
      downloadSpeed: stats.downloadSpeed,
      uploadSpeed: stats.uploadSpeed,
      progress: (index) => (entry.ready ? handle.getFileProgress(index) : 0),
      filePath: (index) => handle.getFilePath(index),
    };
  }

  start(
    context: JobContext,
    torrent: Pick<Torrent, 'id' | 'magnetUrl' | 'torrentFile'>,
    directory: string,
  ): void {
    this.assertHolds(context, torrent.id);
    if (this.stopping) return;
    if (this.entries.has(torrent.id)) {
      throw new Error(`Torrent ${torrent.id} runs already`);
    }

    const handle = this.engine.add(
      torrent.torrentFile ?? torrent.magnetUrl,
      directory,
    );
    const entry: Entry = {
      torrentId: torrent.id,
      handle,
      ready: false,
      wanted: [],
      flushed: { downloaded: 0, uploaded: 0 },
    };
    // A callback of a handle that was stopped since is about another run
    const isCurrent = () => this.entries.get(torrent.id) === entry;
    this.entries.set(torrent.id, entry);

    handle.ready.then(
      (files) => {
        if (!isCurrent()) return;
        entry.files = files;
        entry.ready = true;
        this.reconcileLater(torrent.id);
      },
      (error: Error) => {
        if (!isCurrent()) return;
        entry.error = error.message;
        this.reconcileLater(torrent.id);
      },
    );
    handle.onError((error) => {
      if (!isCurrent()) return;
      entry.error = error.message;
      this.reconcileLater(torrent.id);
    });
    handle.onFileComplete((fileIndex) => {
      if (!isCurrent()) return;
      this.enqueue('torrent.import', { torrentId: torrent.id, fileIndex });
    });
  }

  setWantedFiles(
    context: JobContext,
    torrentId: string,
    indexes: number[],
  ): void {
    this.assertHolds(context, torrentId);
    const entry = this.entries.get(torrentId);

    entry.wanted = indexes;
    entry.handle.setWantedFiles(indexes);
  }

  /** Stops a torrent and stores what it transferred since the last flush */
  async stop(context: JobContext, torrentId: string): Promise<void> {
    this.assertHolds(context, torrentId);
    const entry = this.entries.get(torrentId);
    if (!entry) return;

    await this.remove(entry);
  }

  /**
   * Adds what every torrent transferred to its row, and has a torrent that
   * only seeds stop once it reaches the seed ratio
   */
  async flush(): Promise<void> {
    const { seedRatio } = await this.settingsService.getOrCreateValue(
      DOWNLOADS_SETTINGS_KEY,
      DEFAULT_DOWNLOADS_SETTINGS,
    );
    const seeding = new Set(
      [...this.entries.values()]
        .filter((entry) => entry.ready && !entry.wanted.length)
        .map((entry) => entry.torrentId),
    );
    const deltas = [...this.entries.values()].map((entry) =>
      this.takeDelta(entry),
    );
    const changed = deltas.filter((d) => d.downloaded || d.uploaded);
    if (!changed.length) return;

    const seeded = await this.em.fork().transactional(async (tx) => {
      for (const delta of changed) await this.add(tx, delta);

      return tx.find(
        Torrent,
        {
          id: {
            $in: changed
              .map((d) => d.torrentId)
              .filter((id) => seeding.has(id)),
          },
        },
        {
          fields: ['id', 'downloadedBytes', 'uploadedBytes'],
          disableIdentityMap: true,
        },
      );
    });

    for (const torrent of seeded) {
      if (torrent.uploadedBytes >= seedRatio * torrent.downloadedBytes) {
        this.reconcileLater(torrent.id);
      }
    }
  }

  private async remove(entry: Entry): Promise<void> {
    if (this.entries.get(entry.torrentId) === entry) {
      this.entries.delete(entry.torrentId);
    }

    const delta = this.takeDelta(entry);
    try {
      if (delta.downloaded || delta.uploaded) {
        await this.em.fork().transactional((tx) => this.add(tx, delta));
      }
    } finally {
      // Nothing refers to the engine any more, so it has to stop now
      await entry.handle.destroy();
    }
  }

  /** Takes what the counters of a torrent grew by, at once */
  private takeDelta(entry: Entry) {
    const stats = entry.handle.getStats();
    const delta = {
      torrentId: entry.torrentId,
      downloaded: stats.downloaded - entry.flushed.downloaded,
      uploaded: stats.uploaded - entry.flushed.uploaded,
    };
    entry.flushed = { downloaded: stats.downloaded, uploaded: stats.uploaded };

    return delta;
  }

  private async add(
    tx: EntityManager,
    delta: { torrentId: string; downloaded: number; uploaded: number },
  ) {
    await tx.nativeUpdate(
      Torrent,
      { id: delta.torrentId },
      {
        downloadedBytes: raw(`downloaded_bytes + ${delta.downloaded}`),
        uploadedBytes: raw(`uploaded_bytes + ${delta.uploaded}`),
      },
    );
  }

  private reconcileLater(torrentId: string) {
    this.enqueue('torrent.reconcile', { torrentId });
  }

  private enqueue(
    type: 'torrent.reconcile' | 'torrent.import',
    payload: { torrentId: string; fileIndex?: number },
  ) {
    if (this.stopping) return;

    this.jobs
      .enqueue(this.em.fork(), type, payload as never)
      .catch((error) =>
        this.logger.error(`Enqueueing ${type} failed: ${error.message}`),
      );
  }

  /** Only the jobs of a torrent change what it does */
  private assertHolds(context: JobContext, torrentId: string) {
    if (context.job.lockKey !== `torrent:${torrentId}`) {
      throw new Error(`Job ${context.job.type} does not hold ${torrentId}`);
    }
  }
}
