import { EntityManager } from '@mikro-orm/sqlite';
import {
  BadRequestException,
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnModuleInit,
} from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { rm, stat } from 'node:fs/promises';
import * as path from 'node:path';
import { MediaType } from '../common/common.dto.js';
import { DOWNLOADS_DIR } from '../consts.js';
import { parseTorrentSource } from '../indexers/torrent-source.utils.js';
import { JobContext, JobsService } from '../jobs/jobs.service.js';
import { LogType } from '../server-log/log-entry.entity.js';
import { ServerLogService } from '../server-log/server-log.service.js';
import { SettingsService } from '../settings/settings.service.js';
import {
  DownloadSettingsDto,
  TorrentDto,
  TorrentItemDto,
  TorrentItemStatus,
  TorrentStatus,
  TorrentWithItemsDto,
} from './downloads.dto.js';
import {
  DEFAULT_DOWNLOADS_SETTINGS,
  DOWNLOADS_SETTINGS_KEY,
} from './downloads.settings.js';
import { TorrentFileInfo } from './torrent-engine.js';
import { TorrentItem } from './torrent-item.entity.js';
import { findItemFile } from './torrent-match.js';
import { TorrentRuntime, TorrentSnapshot } from './torrent-runtime.js';
import { decideTorrent, TorrentDecision } from './torrent.decide.js';
import { Torrent } from './torrent.entity.js';

const READ = { disableIdentityMap: true };

const exists = (filePath: string) =>
  stat(filePath).then(
    () => true,
    () => false,
  );

/** A release a user picked, as far as the torrent row needs it */
export interface TorrentRelease {
  infoHash: string;
  title: string;
  indexer: string;
  size: number;
  magnetUrl?: string;
  torrentFile?: Buffer;
}

/** What is wanted from a torrent: an episode, or a movie with season and episode 0 */
export interface WantedItem {
  mediaType: MediaType;
  tmdbId: string;
  season: number;
  episode: number;
  /** The torrent was picked for this episode alone: its only video is the episode */
  onlyVideo: boolean;
}

/** The complete file of an item, where the import reads it */
export interface ItemFile {
  path: string;
  name: string;
}

const fileOf = (
  files: TorrentFileInfo[] | undefined,
  index: number | undefined,
): TorrentFileInfo | undefined =>
  index === null || index === undefined
    ? undefined
    : files?.find((file) => file.index === index);

/**
 * Downloads the items that the library wants from torrents and seeds the
 * torrents up to the seed ratio. It knows torrents, their files and the
 * items wanted of them, and nothing of requests or the library: the library
 * asks for items and releases them, and is told through
 * `library.importItem` when an item's file is complete. The job of a torrent
 * decides what the torrent does from its items, the engine and the settings,
 * and does it.
 */
@Injectable()
export class DownloadsService implements OnModuleInit, OnApplicationBootstrap {
  private readonly logger = new Logger(DownloadsService.name);

  constructor(
    private readonly em: EntityManager,
    private readonly settingsService: SettingsService,
    private readonly serverLog: ServerLogService,
    private readonly jobs: JobsService,
    private readonly runtime: TorrentRuntime,
  ) {}

  onModuleInit() {
    this.jobs.define('downloads.reconcileTorrent', {
      concurrency: 2,
      run: ({ infoHash }, context) => this.reconcileTorrent(infoHash, context),
    });
  }

  /** Engine handles live in memory, so every torrent decides again */
  async onApplicationBootstrap() {
    await this.enqueueEveryTorrent(this.em.fork());
  }

  getSettings(): Promise<DownloadSettingsDto> {
    return this.settingsService.getOrCreateValue(
      DOWNLOADS_SETTINGS_KEY,
      DEFAULT_DOWNLOADS_SETTINGS,
    );
  }

  async updateSettings(
    settings: DownloadSettingsDto,
  ): Promise<DownloadSettingsDto> {
    const { seedRatio } = settings ?? {};
    if (typeof seedRatio !== 'number' || !(seedRatio >= 0)) {
      throw new BadRequestException('seedRatio must be a number, 0 or greater');
    }

    const saved = await this.settingsService.saveValue(DOWNLOADS_SETTINGS_KEY, {
      seedRatio,
    });
    // How long torrents seed changes
    await this.enqueueEveryTorrent(this.em);

    return saved;
  }

  /**
   * Makes sure the torrent of a release exists, in the caller's
   * transaction. The row is there at once, idle; a torrent that failed is
   * given another go.
   */
  async ensureTorrent(
    em: EntityManager,
    release: TorrentRelease,
  ): Promise<void> {
    const { infoHash } = release;
    const existing = await em.findOne(
      Torrent,
      { infoHash },
      { ...READ, fields: ['infoHash', 'error', 'magnetUrl'] },
    );

    if (!existing) {
      await em.insert(Torrent, {
        infoHash,
        title: release.title,
        indexer: release.indexer,
        size: release.size,
        magnetUrl: release.magnetUrl,
        torrentFile: release.torrentFile,
        files: release.torrentFile
          ? parseTorrentSource(release.torrentFile).files
          : undefined,
        downloadedBytes: 0,
        uploadedBytes: 0,
        createdAt: new Date(),
      });
      return;
    }

    const changes = {
      ...(existing.error && { error: null }),
      ...(!existing.magnetUrl &&
        release.magnetUrl && { magnetUrl: release.magnetUrl }),
      ...(release.torrentFile && { torrentFile: release.torrentFile }),
    };
    if (Object.keys(changes).length) {
      await em.nativeUpdate(Torrent, { infoHash }, changes);
    }
    if (existing.error) {
      await this.jobs.enqueue(em, 'downloads.reconcileTorrent', { infoHash });
    }
  }

  /**
   * Wants an item from a torrent, in the caller's transaction, and returns
   * the item: a new one in a starting state, or the one there is. An item
   * that was released is wanted again, from the start, so that a file that
   * is gone from the library downloads again.
   */
  async requestItem(
    em: EntityManager,
    infoHash: string,
    item: WantedItem,
  ): Promise<TorrentItem> {
    const { mediaType, tmdbId, season, episode } = item;
    const existing = await em.findOne(
      TorrentItem,
      { torrentHash: infoHash, mediaType, tmdbId, season, episode },
      READ,
    );

    if (!existing) {
      const created = new TorrentItem();
      created.torrentHash = infoHash;
      created.mediaType = mediaType;
      created.tmdbId = tmdbId;
      created.season = season;
      created.episode = episode;
      created.onlyVideo = item.onlyVideo;
      await em.insert(TorrentItem, { ...created });
      await this.jobs.enqueue(em, 'downloads.reconcileTorrent', { infoHash });

      return created;
    }

    const changes: Partial<TorrentItem> = {};
    if (existing.releasedAt) {
      changes.releasedAt = null;
      changes.completedAt = null;
    }
    if (item.onlyVideo && !existing.onlyVideo) changes.onlyVideo = true;
    if (Object.keys(changes).length) {
      await em.nativeUpdate(TorrentItem, { id: existing.id }, changes);
      await this.jobs.enqueue(em, 'downloads.reconcileTorrent', { infoHash });
    }

    return Object.assign(existing, changes);
  }

  /** Lets an item go, in the caller's transaction: imported, or no longer needed */
  async releaseItem(em: EntityManager, itemId: string): Promise<void> {
    const item = await em.findOne(
      TorrentItem,
      { id: itemId },
      { ...READ, fields: ['id', 'torrentHash', 'releasedAt'] },
    );
    if (!item || item.releasedAt) return;

    await em.nativeUpdate(
      TorrentItem,
      { id: itemId },
      { releasedAt: new Date() },
    );
    await this.jobs.enqueue(em, 'downloads.reconcileTorrent', {
      infoHash: item.torrentHash,
    });
  }

  findItems(em: EntityManager, ids: string[]): Promise<TorrentItem[]> {
    if (!ids.length) return Promise.resolve([]);

    return em.find(TorrentItem, { id: { $in: ids } }, READ);
  }

  /** Where items stand, with the progress of their files */
  async describeItems(
    em: EntityManager,
    ids: string[],
  ): Promise<TorrentItemDto[]> {
    const items = await this.findItems(em, ids);
    const torrents = await this.findTorrentsOf(em, items);

    return items.map((item) =>
      this.toItemDto(
        item,
        torrents.get(item.torrentHash),
        this.runtime.snapshot(item.torrentHash),
      ),
    );
  }

  /** Where torrents stand, all of them or the given ones, with what is wanted of them */
  async describeTorrents(
    infoHashes?: string[],
  ): Promise<TorrentWithItemsDto[]> {
    const em = this.em.fork();
    const torrents = await em.find(
      Torrent,
      infoHashes ? { infoHash: { $in: infoHashes } } : {},
      { ...READ, orderBy: { createdAt: 'desc' } },
    );
    const items = await em.find(
      TorrentItem,
      { torrentHash: { $in: torrents.map((torrent) => torrent.infoHash) } },
      { ...READ, orderBy: { season: 'asc', episode: 'asc' } },
    );

    return torrents.map((torrent) => {
      const snapshot = this.runtime.snapshot(torrent.infoHash);
      const ofTorrent = items.filter(
        (item) => item.torrentHash === torrent.infoHash,
      );

      return {
        ...this.toTorrentDto(torrent, ofTorrent, snapshot),
        items: ofTorrent.map((item) => this.toItemDto(item, torrent, snapshot)),
      };
    });
  }

  /** The complete file of an item, for the import */
  async getItemFile(
    em: EntityManager,
    itemId: string,
  ): Promise<ItemFile | undefined> {
    const item = await em.findOne(TorrentItem, { id: itemId }, READ);
    if (!item || item.fileIndex === null || item.fileIndex === undefined) {
      return undefined;
    }
    const torrent = await em.findOne(
      Torrent,
      { infoHash: item.torrentHash },
      { ...READ, fields: ['infoHash', 'files'] },
    );
    const file = fileOf(torrent?.files, item.fileIndex);

    return (
      file && {
        path: path.join(this.getDirectory(item.torrentHash), file.path),
        name: file.name,
      }
    );
  }

  /** Torrent rows that nothing ever wanted, or that were picked and never needed, go */
  @Cron('10 4 * * *')
  async purgeTorrents(): Promise<void> {
    const em = this.em.fork();
    const unwanted: { info_hash: string }[] = await em.execute(
      `select info_hash from torrent
       where not exists (select 1 from torrent_item where torrent_hash = torrent.info_hash)`,
    );
    for (const { info_hash: infoHash } of unwanted) {
      if (this.runtime.snapshot(infoHash)) continue;
      if (await exists(this.getDirectory(infoHash))) continue;

      // An item wanted meanwhile keeps the row
      await em.execute(
        `delete from torrent where info_hash = ?
         and not exists (select 1 from torrent_item where torrent_hash = torrent.info_hash)`,
        [infoHash],
        'run',
      );
    }
  }

  /** What a torrent does next, decided and done */
  private async reconcileTorrent(
    infoHash: string,
    context: JobContext,
  ): Promise<void> {
    const snapshot = this.runtime.snapshot(infoHash);
    const hasDirectory = await exists(this.getDirectory(infoHash));
    const { seedRatio } = await this.getSettings();

    const decided = await context.em.transactional(async (tx) => {
      const torrent = await tx.findOne(Torrent, { infoHash }, READ);
      if (!torrent) return undefined;

      let { files } = torrent;
      if (!files && snapshot?.files) {
        files = snapshot.files;
        await tx.nativeUpdate(Torrent, { infoHash }, { files });
      }

      const items = await tx.find(TorrentItem, { torrentHash: infoHash }, READ);
      const wanted = items.filter((item) => !item.releasedAt);
      const now = new Date();
      for (const item of wanted) {
        if (
          files &&
          (item.fileIndex === null || item.fileIndex === undefined)
        ) {
          const file = findItemFile(item, files);
          if (file) {
            item.fileIndex = file.index;
            await tx.nativeUpdate(
              TorrentItem,
              { id: item.id },
              { fileIndex: file.index },
            );
          }
        }
        const isComplete =
          item.fileIndex !== null &&
          item.fileIndex !== undefined &&
          !item.completedAt &&
          snapshot?.ready &&
          snapshot.complete.has(item.fileIndex);
        if (isComplete) {
          item.completedAt = now;
          await tx.nativeUpdate(
            TorrentItem,
            { id: item.id },
            { completedAt: now },
          );
        }
      }

      const decision = decideTorrent({
        wanted,
        hasFiles: !!files,
        torrent: {
          downloadedBytes:
            torrent.downloadedBytes + (snapshot?.unflushed.downloaded ?? 0),
          uploadedBytes:
            torrent.uploadedBytes + (snapshot?.unflushed.uploaded ?? 0),
          error: torrent.error,
        },
        runtime: snapshot,
        hasData: snapshot?.ready ? snapshot.hasData : hasDirectory,
        seedRatio,
      });
      await this.store(tx, torrent, wanted, decision);

      return { torrent, decision };
    });

    if (decided) await this.act(context, decided.torrent, decided.decision);
  }

  /** What a decision changes in the database, in its transaction */
  private async store(
    tx: EntityManager,
    torrent: Torrent,
    wanted: TorrentItem[],
    decision: TorrentDecision,
  ) {
    const { infoHash } = torrent;

    switch (decision.kind) {
      case 'fail':
        this.logger.warn(`"${torrent.title}" failed: ${decision.error}`);
        await tx.nativeUpdate(Torrent, { infoHash }, { error: decision.error });
        break;
      case 'run':
        if (torrent.error) {
          await tx.nativeUpdate(Torrent, { infoHash }, { error: null });
        }
        break;
    }

    // Whatever the torrent does, a complete item is the library's to import
    for (const item of wanted) {
      if (!item.completedAt) continue;
      await this.jobs.enqueue(tx, 'library.importItem', {
        infoHash,
        itemId: item.id,
      });
    }
  }

  /** What a decision does to the engine and the downloads folder */
  private async act(
    context: JobContext,
    torrent: Torrent,
    decision: TorrentDecision,
  ) {
    const { infoHash } = torrent;

    switch (decision.kind) {
      case 'fail':
      case 'stop':
        await this.runtime.stop(context, infoHash);
        break;
      case 'release':
        await this.release(context, torrent);
        break;
      case 'start': {
        const { torrentFile } = await context.em.findOneOrFail(
          Torrent,
          { infoHash },
          { ...READ, populate: ['torrentFile'] },
        );
        try {
          this.runtime.start(
            context,
            { infoHash, magnetUrl: torrent.magnetUrl, torrentFile },
            this.getDirectory(infoHash),
          );
        } catch (error) {
          // A source that the engine refuses would fail every start
          const message =
            error instanceof Error ? error.message : String(error);
          this.logger.warn(`"${torrent.title}" did not start: ${message}`);
          await context.em.nativeUpdate(
            Torrent,
            { infoHash },
            { error: message },
          );
        }
        break;
      }
      case 'run':
        this.runtime.setWantedFiles(context, infoHash, decision.wanted);
        break;
    }
  }

  /** Stops a torrent that nothing wants and that seeds no more, and deletes what it downloaded */
  private async release(context: JobContext, torrent: Torrent) {
    const { infoHash } = torrent;
    await this.runtime.stop(context, infoHash);

    const directory = this.getDirectory(infoHash);
    const hasData = await exists(directory);
    if (hasData) await rm(directory, { recursive: true, force: true });

    await context.em.transactional(async (tx) => {
      if (hasData) {
        await this.serverLog.writeIn(
          tx,
          LogType.DownloadDeleted,
          `Deleted the downloaded data of "${torrent.title}"`,
          { directory, infoHash },
        );
      }
      await tx.nativeUpdate(
        Torrent,
        { infoHash },
        { downloadedBytes: 0, uploadedBytes: 0 },
      );
    });
  }

  private async findTorrentsOf(em: EntityManager, items: TorrentItem[]) {
    const hashes = [...new Set(items.map((item) => item.torrentHash))];
    const torrents = hashes.length
      ? await em.find(Torrent, { infoHash: { $in: hashes } }, READ)
      : [];

    return new Map(torrents.map((torrent) => [torrent.infoHash, torrent]));
  }

  private toItemDto(
    item: TorrentItem,
    torrent: Torrent | undefined,
    snapshot: TorrentSnapshot | undefined,
  ): TorrentItemDto {
    const files = torrent?.files ?? snapshot?.files;
    const file = fileOf(files, item.fileIndex);
    const dto: TorrentItemDto = {
      id: item.id,
      infoHash: item.torrentHash,
      mediaType: item.mediaType,
      tmdbId: item.tmdbId,
      season: item.season,
      episode: item.episode,
      status: TorrentItemStatus.Resolving,
      fileName: file?.name,
    };
    const error = snapshot ? snapshot.error : torrent?.error;

    if (item.releasedAt) return { ...dto, status: TorrentItemStatus.Released };
    if (error) return { ...dto, status: TorrentItemStatus.Failed, error };
    if (item.completedAt) return { ...dto, status: TorrentItemStatus.Complete };
    if (!files) return dto;
    if (!file) {
      return {
        ...dto,
        status: TorrentItemStatus.NoMatch,
        error: 'The torrent has no file for this episode',
      };
    }
    if (!snapshot?.ready) return dto;

    return {
      ...dto,
      status: TorrentItemStatus.Downloading,
      progress: snapshot.progress(file.index),
    };
  }

  private toTorrentDto(
    torrent: Torrent,
    items: TorrentItem[],
    snapshot: TorrentSnapshot | undefined,
  ): TorrentDto {
    const error = snapshot ? snapshot.error : torrent.error;
    const isWanted = items.some(
      (item) => !item.releasedAt && !item.completedAt,
    );
    const downloadedBytes =
      torrent.downloadedBytes + (snapshot?.unflushed.downloaded ?? 0);

    return {
      infoHash: torrent.infoHash,
      title: torrent.title,
      indexer: torrent.indexer,
      size: torrent.size,
      downloadedBytes,
      uploadedBytes:
        torrent.uploadedBytes + (snapshot?.unflushed.uploaded ?? 0),
      status: error
        ? TorrentStatus.Failed
        : !snapshot
          ? isWanted
            ? TorrentStatus.Starting
            : downloadedBytes > 0
              ? TorrentStatus.Stopped
              : TorrentStatus.Idle
          : !snapshot.ready
            ? TorrentStatus.Starting
            : snapshot.wanted.length
              ? TorrentStatus.Downloading
              : TorrentStatus.Seeding,
      error: error ?? undefined,
      peers: snapshot?.peers ?? 0,
      downloadSpeed: snapshot?.downloadSpeed ?? 0,
      uploadSpeed: snapshot?.uploadSpeed ?? 0,
    };
  }

  private async enqueueEveryTorrent(em: EntityManager) {
    await em.transactional(async (tx) => {
      const torrents = await tx.find(
        Torrent,
        {},
        { ...READ, fields: ['infoHash'] },
      );
      for (const { infoHash } of torrents) {
        await this.jobs.enqueue(tx, 'downloads.reconcileTorrent', { infoHash });
      }
    });
  }

  private getDirectory(infoHash: string): string {
    return path.join(DOWNLOADS_DIR, infoHash);
  }
}
