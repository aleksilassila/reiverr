import { EntityManager } from '@mikro-orm/sqlite';
import {
  BadRequestException,
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
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
import { findTorrentItemFile, findSubtitleFiles } from './torrent-match.js';
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
export interface WantedTorrentItem {
  mediaType: MediaType;
  tmdbId: string;
  season: number;
  episode: number;
  /** The torrent was picked for this episode alone: its only video is the episode */
  onlyVideo: boolean;
}

/** The complete file of a torrent item, where the import reads it, with its subtitle files */
export interface TorrentItemFile {
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

/** The files of the torrent that a torrent item downloads: its file with its subtitles, once matched */
const torrentItemFileIndexes = (
  torrentItem: Pick<TorrentItem, 'fileIndex' | 'subtitleFileIndexes'>,
): number[] =>
  torrentItem.fileIndex === null || torrentItem.fileIndex === undefined
    ? []
    : [torrentItem.fileIndex, ...(torrentItem.subtitleFileIndexes ?? [])];

/** The titles that torrent items are of, each once */
const titlesOf = (torrentItems: TorrentItem[]): Title[] => [
  ...new Map(
    torrentItems.map(({ mediaType, tmdbId }) => [
      `${mediaType}:${tmdbId}`,
      { mediaType, tmdbId },
    ]),
  ).values(),
];

/**
 * The status of a torrent item by its rows: what the reconcile of its torrent
 * wrote of the file list, the match, the completion and the failure. Whether
 * the torrent is running is the engine's.
 */
function torrentItemStatusOf(
  torrentItem: TorrentItem,
  files: TorrentFileInfo[] | undefined,
  error: string | undefined,
): Pick<TorrentItemDto, 'status' | 'error'> {
  if (torrentItem.releasedAt) return { status: TorrentItemStatus.Released };
  if (error) return { status: TorrentItemStatus.Failed, error };
  if (torrentItem.completedAt) return { status: TorrentItemStatus.Complete };
  if (!files) return { status: TorrentItemStatus.Resolving };
  if (!fileOf(files, torrentItem.fileIndex)) {
    return {
      status: TorrentItemStatus.NoMatch,
      error: 'The torrent has no file for this episode',
    };
  }

  return { status: TorrentItemStatus.Downloading };
}

/**
 * Downloads the torrent items that the library wants from torrents and seeds
 * the torrents up to the seed ratio. It knows torrents, their files and the
 * torrent items wanted of them, and nothing of requests or the library: the
 * library asks for torrent items and releases them, and is told through
 * `library.importTorrentItem` when a torrent item's file is complete. The job
 * of a torrent decides what the torrent does from its torrent items, the engine
 * and the settings, does it, and tells the clients that show the titles of its
 * torrent items.
 */
@Injectable()
export class DownloadsService implements OnModuleInit {
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

  /** Has every torrent decide again */
  async enqueueEveryTorrent(em: EntityManager) {
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
   * Wants a torrent item from a torrent, in the caller's transaction, and
   * returns the torrent item: a new one in a starting state, or the one there
   * is. A torrent item that was released is wanted again, from the start, so
   * that a file that is gone from the library downloads again.
   */
  async requestTorrentItem(
    em: EntityManager,
    infoHash: string,
    torrentItem: WantedTorrentItem,
  ): Promise<TorrentItem> {
    const { mediaType, tmdbId, season, episode } = torrentItem;
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
      created.onlyVideo = torrentItem.onlyVideo;
      await em.insert(TorrentItem, { ...created });
      await this.jobs.enqueue(em, 'downloads.reconcileTorrent', { infoHash });

      return created;
    }

    const changes: Partial<TorrentItem> = {};
    if (existing.releasedAt) {
      changes.releasedAt = null;
      changes.completedAt = null;
    }
    if (torrentItem.onlyVideo && !existing.onlyVideo) changes.onlyVideo = true;
    if (Object.keys(changes).length) {
      await em.nativeUpdate(TorrentItem, { id: existing.id }, changes);
      await this.jobs.enqueue(em, 'downloads.reconcileTorrent', { infoHash });
    }

    return Object.assign(existing, changes);
  }

  /** Lets a torrent item go, in the caller's transaction: imported, or no longer needed */
  async releaseTorrentItem(
    em: EntityManager,
    torrentItemId: string,
  ): Promise<void> {
    const torrentItem = await em.findOne(
      TorrentItem,
      { id: torrentItemId },
      { ...READ, fields: ['id', 'torrentHash', 'releasedAt'] },
    );
    if (!torrentItem || torrentItem.releasedAt) return;

    await em.nativeUpdate(
      TorrentItem,
      { id: torrentItemId },
      { releasedAt: new Date() },
    );
    await this.jobs.enqueue(em, 'downloads.reconcileTorrent', {
      infoHash: torrentItem.torrentHash,
    });
  }

  findTorrentItems(em: EntityManager, ids: string[]): Promise<TorrentItem[]> {
    if (!ids.length) return Promise.resolve([]);

    return em.find(TorrentItem, { id: { $in: ids } }, READ);
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
   * torrent items: those with a torrent item wanted of them that are starting
   * or downloading, newest first. What the downloads page polls
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
   * The torrents that something of a title is or was wanted from, as the engine
   * has them, with the torrent items of the title: what the title pages poll
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

  /** Torrents as the engine has them, with their torrent items, or only the torrent items of a title */
  private async describe(
    em: EntityManager,
    torrents: Torrent[],
    ofTitle?: Title,
  ): Promise<TorrentWithItemsDto[]> {
    if (!torrents.length) return [];
    const torrentItems = await em.find(
      TorrentItem,
      { torrentHash: { $in: torrents.map((torrent) => torrent.infoHash) } },
      { ...READ, orderBy: { season: 'asc', episode: 'asc' } },
    );

    return torrents.map((torrent) => {
      const snapshot = this.runtime.snapshot(torrent.infoHash);
      const ofTorrent = torrentItems.filter(
        (torrentItem) => torrentItem.torrentHash === torrent.infoHash,
      );

      return {
        ...this.toTorrentDto(torrent, ofTorrent, snapshot),
        torrentItems: ofTorrent
          .filter(
            (torrentItem) =>
              !ofTitle ||
              (torrentItem.mediaType === ofTitle.mediaType &&
                torrentItem.tmdbId === ofTitle.tmdbId),
          )
          .map((torrentItem) =>
            this.toTorrentItemDto(torrentItem, torrent, snapshot),
          ),
      };
    });
  }

  /** The complete file of a torrent item, for the import */
  async getTorrentItemFile(
    em: EntityManager,
    torrentItemId: string,
  ): Promise<TorrentItemFile | undefined> {
    const torrentItem = await em.findOne(
      TorrentItem,
      { id: torrentItemId },
      READ,
    );
    if (
      !torrentItem ||
      torrentItem.fileIndex === null ||
      torrentItem.fileIndex === undefined
    ) {
      return undefined;
    }
    const torrent = await em.findOne(
      Torrent,
      { infoHash: torrentItem.torrentHash },
      { ...READ, fields: ['infoHash', 'files'] },
    );
    const file = fileOf(torrent?.files, torrentItem.fileIndex);
    if (!file) return undefined;

    const directory = this.getDirectory(torrentItem.torrentHash);
    return {
      path: path.join(directory, file.path),
      name: file.name,
      subtitles: (torrentItem.subtitleFileIndexes ?? []).flatMap((index) => {
        const subtitle = fileOf(torrent.files, index);
        return subtitle
          ? [{ path: path.join(directory, subtitle.path), name: subtitle.name }]
          : [];
      }),
    };
  }

  /** Torrent rows that nothing ever wanted, or that were picked and never needed, go */
  async purgeTorrents(): Promise<void> {
    const em = this.em.fork();
    const unwanted: { info_hash: string }[] = await em.execute(
      `select info_hash from torrent
       where not exists (select 1 from torrent_item where torrent_hash = torrent.info_hash)`,
    );
    for (const { info_hash: infoHash } of unwanted) {
      if (this.runtime.snapshot(infoHash)) continue;
      if (await exists(this.getDirectory(infoHash))) continue;

      // A torrent item wanted meanwhile keeps the row
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

      const torrentItems = await tx.find(
        TorrentItem,
        { torrentHash: infoHash },
        READ,
      );
      const wanted = torrentItems.filter(
        (torrentItem) => !torrentItem.releasedAt,
      );
      const now = new Date();
      for (const torrentItem of wanted) {
        if (
          files &&
          (torrentItem.fileIndex === null ||
            torrentItem.fileIndex === undefined)
        ) {
          const file = findTorrentItemFile(torrentItem, files);
          if (file) {
            // Matched once, with the file: the setting at the time decides
            const subtitles = downloadSubtitles
              ? findSubtitleFiles(torrentItem, file, files).map((f) => f.index)
              : [];
            torrentItem.fileIndex = file.index;
            torrentItem.subtitleFileIndexes = subtitles;
            await tx.nativeUpdate(
              TorrentItem,
              { id: torrentItem.id },
              { fileIndex: file.index, subtitleFileIndexes: subtitles },
            );
          }
        }
        const isComplete =
          torrentItem.fileIndex !== null &&
          torrentItem.fileIndex !== undefined &&
          !torrentItem.completedAt &&
          snapshot?.ready &&
          torrentItemFileIndexes(torrentItem).every((index) =>
            snapshot.complete.includes(index),
          );
        if (isComplete) {
          torrentItem.completedAt = now;
          await tx.nativeUpdate(
            TorrentItem,
            { id: torrentItem.id },
            { completedAt: now },
          );
        }
      }

      // Whatever the torrent does, a complete torrent item is the library's to import
      for (const torrentItem of wanted) {
        if (!torrentItem.completedAt) continue;
        await this.jobs.enqueue(tx, 'library.importTorrentItem', {
          infoHash,
          torrentItemId: torrentItem.id,
        });
      }

      return { torrent, torrentItems, wanted, hasFiles: !!files };
    });
    if (!state) return;
    const { torrent, torrentItems, wanted, hasFiles } = state;

    // Whatever the torrent does next, the pages of its titles show it
    for (const title of titlesOf(torrentItems)) {
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
      (torrentItem) =>
        torrentItem.fileIndex !== null &&
        torrentItem.fileIndex !== undefined &&
        !torrentItem.completedAt,
    );
    const needsFiles =
      !hasFiles && wanted.some((torrentItem) => torrentItem.fileIndex == null);
    const hasData = snapshot?.ready ? snapshot.hasData : hasDirectory;
    // A failed torrent does not seed: its data goes once nothing wants it
    const isSeeding =
      !torrent.error &&
      hasData &&
      torrent.downloadedBytes > 0 &&
      torrent.uploadedBytes < seedRatio * torrent.downloadedBytes;

    if (!isDownloading && !needsFiles && !isSeeding) {
      // Nothing downloads: a torrent item that waits for its import keeps the data
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
      ...new Set(wanted.flatMap(torrentItemFileIndexes)),
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

  /** A torrent item and the file of the torrent it is, when matched */
  private toTorrentItemRef(
    torrentItem: TorrentItem,
    files: TorrentFileInfo[] | undefined,
  ): Omit<TorrentItemDto, 'status'> {
    return {
      id: torrentItem.id,
      infoHash: torrentItem.torrentHash,
      mediaType: torrentItem.mediaType,
      tmdbId: torrentItem.tmdbId,
      season: torrentItem.season,
      episode: torrentItem.episode,
      fileName: fileOf(files, torrentItem.fileIndex)?.name,
    };
  }

  /** The status of a torrent item as the engine has it: resolving until the torrent is ready, then with the progress of its file */
  private toTorrentItemDto(
    torrentItem: TorrentItem,
    torrent: Torrent | undefined,
    snapshot: TorrentState | undefined,
  ): TorrentItemDto {
    const files = torrent?.files ?? snapshot?.files;
    const error = snapshot ? snapshot.error : torrent?.error;
    const dto = {
      ...this.toTorrentItemRef(torrentItem, files),
      ...torrentItemStatusOf(torrentItem, files, error ?? undefined),
    };
    if (dto.status !== TorrentItemStatus.Downloading) return dto;
    if (!snapshot?.ready)
      return { ...dto, status: TorrentItemStatus.Resolving };

    return {
      ...dto,
      progress: this.runtime.getFileProgress(
        torrentItem.torrentHash,
        torrentItem.fileIndex,
      ),
    };
  }

  private toTorrentDto(
    torrent: Torrent,
    torrentItems: TorrentItem[],
    snapshot: TorrentState | undefined,
  ): TorrentDto {
    const error = snapshot ? snapshot.error : torrent.error;
    const files = torrent.files ?? snapshot?.files;
    const wanted = torrentItems.filter(
      (torrentItem) => !torrentItem.releasedAt && !torrentItem.completedAt,
    );
    const isDownloading = wanted.some(
      (torrentItem) =>
        torrentItem.fileIndex !== null && torrentItem.fileIndex !== undefined,
    );
    // The files the torrent downloads, each once: those of the torrent items not released, the complete ones whole
    const notReleased = torrentItems.filter(
      (torrentItem) => !torrentItem.releasedAt,
    );
    const wantedFiles = new Map(
      notReleased.flatMap((torrentItem) => {
        const file = fileOf(files, torrentItem.fileIndex);
        return file ? [[file.index, file] as const] : [];
      }),
    );
    const complete = new Set(
      notReleased
        .filter((torrentItem) => torrentItem.completedAt)
        .map((torrentItem) => torrentItem.fileIndex),
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

  private getDirectory(infoHash: string): string {
    return path.join(DOWNLOADS_DIR, infoHash);
  }
}
