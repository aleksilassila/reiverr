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
import { MediaType, Title } from '../common/common.dto.js';
import { DOWNLOADS_DIR } from '../consts.js';
import { EventsService } from '../events/events.service.js';
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
import { TorrentFileInfo, TorrentState } from './torrent-engine.js';
import { TorrentItem } from './torrent-item.entity.js';
import { findItemFile, findSubtitleFiles } from './torrent-match.js';
import { TorrentRuntime } from './torrent-runtime.js';
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

/** The complete file of an item, where the import reads it, with its subtitle files */
export interface ItemFile {
  path: string;
  name: string;
  subtitles: { path: string; name: string }[];
}

const fileOf = (
  files: TorrentFileInfo[] | undefined,
  index: number | undefined,
): TorrentFileInfo | undefined =>
  index === null || index === undefined
    ? undefined
    : files?.find((file) => file.index === index);

/** The files of the torrent that an item downloads: its file with its subtitles, once matched */
const itemFileIndexes = (
  item: Pick<TorrentItem, 'fileIndex' | 'subtitleFileIndexes'>,
): number[] =>
  item.fileIndex === null || item.fileIndex === undefined
    ? []
    : [item.fileIndex, ...(item.subtitleFileIndexes ?? [])];

/** The titles that items are of, each once */
const titlesOf = (items: TorrentItem[]): Title[] => [
  ...new Map(
    items.map(({ mediaType, tmdbId }) => [
      `${mediaType}:${tmdbId}`,
      { mediaType, tmdbId },
    ]),
  ).values(),
];

/**
 * The status of an item by its rows: what the reconcile of its torrent wrote
 * of the file list, the match, the completion and the failure. Whether the
 * torrent is running is the engine's.
 */
function itemStatusOf(
  item: TorrentItem,
  files: TorrentFileInfo[] | undefined,
  error: string | undefined,
): Pick<TorrentItemDto, 'status' | 'error'> {
  if (item.releasedAt) return { status: TorrentItemStatus.Released };
  if (error) return { status: TorrentItemStatus.Failed, error };
  if (item.completedAt) return { status: TorrentItemStatus.Complete };
  if (!files) return { status: TorrentItemStatus.Resolving };
  if (!fileOf(files, item.fileIndex)) {
    return {
      status: TorrentItemStatus.NoMatch,
      error: 'The torrent has no file for this episode',
    };
  }

  return { status: TorrentItemStatus.Downloading };
}

/**
 * Downloads the items that the library wants from torrents and seeds the
 * torrents up to the seed ratio. It knows torrents, their files and the
 * items wanted of them, and nothing of requests or the library: the library
 * asks for items and releases them, and is told through
 * `library.importItem` when an item's file is complete. The job of a torrent
 * decides what the torrent does from its items, the engine and the settings,
 * does it, and tells the clients that show the titles of its items.
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
    private readonly events: EventsService,
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
    const { seedRatio, downloadSubtitles } = settings ?? {};
    if (typeof seedRatio !== 'number' || !(seedRatio >= 0)) {
      throw new BadRequestException('seedRatio must be a number, 0 or greater');
    }
    if (typeof downloadSubtitles !== 'boolean') {
      throw new BadRequestException('downloadSubtitles must be a boolean');
    }

    const saved = await this.settingsService.saveValue(DOWNLOADS_SETTINGS_KEY, {
      seedRatio,
      downloadSubtitles,
    });
    // How long torrents seed changes
    await this.enqueueEveryTorrent(this.em);

    return saved;
  }

  /**
   * The torrent of a release, created when missing, in the caller's
   * transaction. The row is there at once, idle; a torrent that failed is
   * given another go.
   */
  async getOrCreateTorrent(
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

  /**
   * The status of items by their rows, without the engine: for the library's
   * status, which goes by what was written and is told when that changes
   */
  async describeItems(
    em: EntityManager,
    ids: string[],
  ): Promise<TorrentItemDto[]> {
    const items = await this.findItems(em, ids);
    const torrents = await this.findTorrentsOf(em, items);

    return items.map((item) => {
      const torrent = torrents.get(item.torrentHash);

      return {
        ...this.toItemRef(item, torrent?.files),
        ...itemStatusOf(item, torrent?.files, torrent?.error ?? undefined),
      };
    });
  }

  /** Every torrent as the engine has it, with what is wanted of it: for admins */
  async describeTorrents(): Promise<TorrentWithItemsDto[]> {
    const em = this.em.fork();
    const torrents = await em.find(
      Torrent,
      {},
      { ...READ, orderBy: { createdAt: 'desc' } },
    );

    return this.describe(em, torrents);
  }

  /**
   * The torrents that are downloading, as the engine has them, with their
   * items: those with an item wanted of them that are starting or
   * downloading, newest first. What the downloads page polls
   */
  async describeDownloads(): Promise<TorrentWithItemsDto[]> {
    const em = this.em.fork();
    const wanted = await em.find(
      TorrentItem,
      { releasedAt: null },
      { ...READ, fields: ['torrentHash'] },
    );
    const torrents = await em.find(
      Torrent,
      { infoHash: { $in: [...new Set(wanted.map((i) => i.torrentHash))] } },
      { ...READ, orderBy: { createdAt: 'desc' } },
    );

    return (await this.describe(em, torrents)).filter(
      (torrent) =>
        torrent.status === TorrentStatus.Starting ||
        torrent.status === TorrentStatus.Downloading,
    );
  }

  /**
   * The torrents that something of a title is or was wanted from, as the
   * engine has them, with the items of the title: what the title pages poll
   * while a torrent runs
   */
  async describeTitleTorrents(title: Title): Promise<TorrentWithItemsDto[]> {
    const em = this.em.fork();
    const ofTitle = await em.find(TorrentItem, title, {
      ...READ,
      fields: ['torrentHash'],
    });
    const torrents = await em.find(
      Torrent,
      { infoHash: { $in: [...new Set(ofTitle.map((i) => i.torrentHash))] } },
      { ...READ, orderBy: { createdAt: 'desc' } },
    );

    return this.describe(em, torrents, title);
  }

  /** Torrents as the engine has them, with their items, or only the items of a title */
  private async describe(
    em: EntityManager,
    torrents: Torrent[],
    ofTitle?: Title,
  ): Promise<TorrentWithItemsDto[]> {
    if (!torrents.length) return [];
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
        items: ofTorrent
          .filter(
            (item) =>
              !ofTitle ||
              (item.mediaType === ofTitle.mediaType &&
                item.tmdbId === ofTitle.tmdbId),
          )
          .map((item) => this.toItemDto(item, torrent, snapshot)),
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
    if (!file) return undefined;

    const directory = this.getDirectory(item.torrentHash);
    return {
      path: path.join(directory, file.path),
      name: file.name,
      subtitles: (item.subtitleFileIndexes ?? []).flatMap((index) => {
        const subtitle = fileOf(torrent.files, index);
        return subtitle
          ? [{ path: path.join(directory, subtitle.path), name: subtitle.name }]
          : [];
      }),
    };
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
    // The seed ratio is decided from the counters of the row
    await this.runtime.flushTorrent(infoHash);
    const snapshot = this.runtime.snapshot(infoHash);
    const hasDirectory = await exists(this.getDirectory(infoHash));
    const { seedRatio, downloadSubtitles } = await this.getSettings();

    const state = await context.em.transactional(async (tx) => {
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
            // Matched once, with the file: the setting at the time decides
            const subtitles = downloadSubtitles
              ? findSubtitleFiles(item, file, files).map((f) => f.index)
              : [];
            item.fileIndex = file.index;
            item.subtitleFileIndexes = subtitles;
            await tx.nativeUpdate(
              TorrentItem,
              { id: item.id },
              { fileIndex: file.index, subtitleFileIndexes: subtitles },
            );
          }
        }
        const isComplete =
          item.fileIndex !== null &&
          item.fileIndex !== undefined &&
          !item.completedAt &&
          snapshot?.ready &&
          itemFileIndexes(item).every((index) =>
            snapshot.complete.includes(index),
          );
        if (isComplete) {
          item.completedAt = now;
          await tx.nativeUpdate(
            TorrentItem,
            { id: item.id },
            { completedAt: now },
          );
        }
      }

      // Whatever the torrent does, a complete item is the library's to import
      for (const item of wanted) {
        if (!item.completedAt) continue;
        await this.jobs.enqueue(tx, 'library.importItem', {
          infoHash,
          itemId: item.id,
        });
      }

      return { torrent, items, wanted, hasFiles: !!files };
    });
    if (!state) return;
    const { torrent, items, wanted, hasFiles } = state;

    // Whatever the torrent does next, the pages of its titles show it
    for (const title of titlesOf(items)) {
      this.events.emit({ type: 'downloads', data: title });
    }

    // Stopped with its error, until the torrent is picked or needed again
    if (snapshot?.error) {
      this.logger.warn(`"${torrent.title}" failed: ${snapshot.error}`);
      await context.em.nativeUpdate(
        Torrent,
        { infoHash },
        { error: snapshot.error },
      );
      await this.runtime.stop(infoHash);
      return;
    }

    const isDownloading = wanted.some(
      (item) =>
        item.fileIndex !== null &&
        item.fileIndex !== undefined &&
        !item.completedAt,
    );
    const needsFiles =
      !hasFiles && wanted.some((item) => item.fileIndex == null);
    const hasData = snapshot?.ready ? snapshot.hasData : hasDirectory;
    // A failed torrent does not seed: its data goes once nothing wants it
    const isSeeding =
      !torrent.error &&
      hasData &&
      torrent.downloadedBytes > 0 &&
      torrent.uploadedBytes < seedRatio * torrent.downloadedBytes;

    if (!isDownloading && !needsFiles && !isSeeding) {
      // Nothing downloads: an item that waits for its import keeps the data
      if (wanted.length) await this.runtime.stop(infoHash);
      else await this.release(context, torrent);
      return;
    }
    // A failed torrent stays stopped
    if (!snapshot && torrent.error) return;
    if (!snapshot) {
      await this.start(context, torrent);
      return;
    }
    // Started: the engine says when it is ready
    if (!snapshot.ready) return;

    if (torrent.error) {
      await context.em.nativeUpdate(Torrent, { infoHash }, { error: null });
    }
    this.runtime.setWantedFiles(infoHash, [
      ...new Set(wanted.flatMap(itemFileIndexes)),
    ]);
  }

  /** Starts a torrent in the engine; a source the engine refuses fails it */
  private async start(context: JobContext, torrent: Torrent) {
    const { infoHash } = torrent;
    const { torrentFile } = await context.em.findOneOrFail(
      Torrent,
      { infoHash },
      { ...READ, populate: ['torrentFile'] },
    );
    try {
      this.runtime.start(
        { infoHash, magnetUrl: torrent.magnetUrl, torrentFile },
        this.getDirectory(infoHash),
      );
    } catch (error) {
      // A source that the engine refuses would fail every start
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`"${torrent.title}" did not start: ${message}`);
      await context.em.nativeUpdate(Torrent, { infoHash }, { error: message });
    }
  }

  /** Stops a torrent that nothing wants and that seeds no more, and deletes what it downloaded */
  private async release(context: JobContext, torrent: Torrent) {
    const { infoHash } = torrent;
    await this.runtime.stop(infoHash);

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
        // The library may wait for room on the disk
        await this.jobs.enqueue(tx, 'library.sweepRequests', {});
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

  /** An item and the file of the torrent it is, when matched */
  private toItemRef(
    item: TorrentItem,
    files: TorrentFileInfo[] | undefined,
  ): Omit<TorrentItemDto, 'status'> {
    return {
      id: item.id,
      infoHash: item.torrentHash,
      mediaType: item.mediaType,
      tmdbId: item.tmdbId,
      season: item.season,
      episode: item.episode,
      fileName: fileOf(files, item.fileIndex)?.name,
    };
  }

  /** The status of an item as the engine has it: resolving until the torrent is ready, then with the progress of its file */
  private toItemDto(
    item: TorrentItem,
    torrent: Torrent | undefined,
    snapshot: TorrentState | undefined,
  ): TorrentItemDto {
    const files = torrent?.files ?? snapshot?.files;
    const error = snapshot ? snapshot.error : torrent?.error;
    const dto = {
      ...this.toItemRef(item, files),
      ...itemStatusOf(item, files, error ?? undefined),
    };
    if (dto.status !== TorrentItemStatus.Downloading) return dto;
    if (!snapshot?.ready)
      return { ...dto, status: TorrentItemStatus.Resolving };

    return {
      ...dto,
      progress: this.runtime.getFileProgress(item.torrentHash, item.fileIndex),
    };
  }

  private toTorrentDto(
    torrent: Torrent,
    items: TorrentItem[],
    snapshot: TorrentState | undefined,
  ): TorrentDto {
    const error = snapshot ? snapshot.error : torrent.error;
    const files = torrent.files ?? snapshot?.files;
    const wanted = items.filter(
      (item) => !item.releasedAt && !item.completedAt,
    );
    const isDownloading = wanted.some(
      (item) => item.fileIndex !== null && item.fileIndex !== undefined,
    );
    // The files the torrent downloads, each once: those of the items not released, the complete ones whole
    const notReleased = items.filter((item) => !item.releasedAt);
    const wantedFiles = new Map(
      notReleased.flatMap((item) => {
        const file = fileOf(files, item.fileIndex);
        return file ? [[file.index, file] as const] : [];
      }),
    );
    const complete = new Set(
      notReleased
        .filter((item) => item.completedAt)
        .map((item) => item.fileIndex),
    );
    const wantedBytes = files
      ? [...wantedFiles.values()].reduce((sum, file) => sum + file.length, 0)
      : torrent.size;
    const downloaded = [...wantedFiles.values()].reduce(
      (sum, file) =>
        sum +
        file.length *
          (complete.has(file.index)
            ? 1
            : this.runtime.getFileProgress(torrent.infoHash, file.index)),
      0,
    );

    return {
      infoHash: torrent.infoHash,
      title: torrent.title,
      indexer: torrent.indexer,
      size: torrent.size,
      downloadedBytes: torrent.downloadedBytes,
      uploadedBytes: torrent.uploadedBytes,
      wantedBytes,
      progress: wantedBytes ? downloaded / wantedBytes : 0,
      addedAt: torrent.createdAt.toISOString(),
      status: error
        ? TorrentStatus.Failed
        : !snapshot
          ? wanted.length
            ? TorrentStatus.Starting
            : torrent.downloadedBytes > 0
              ? TorrentStatus.Stopped
              : TorrentStatus.Idle
          : !snapshot.ready
            ? TorrentStatus.Starting
            : isDownloading
              ? TorrentStatus.Downloading
              : TorrentStatus.Seeding,
      error: error ?? undefined,
      peers: snapshot?.stats.peers ?? 0,
      downloadSpeed: snapshot?.stats.downloadSpeed ?? 0,
      uploadSpeed: snapshot?.stats.uploadSpeed ?? 0,
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
