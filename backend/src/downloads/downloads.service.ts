import {
  CreateRequestContext,
  EnsureRequestContext,
} from '@mikro-orm/decorators/legacy';
import { EntityManager, raw } from '@mikro-orm/sqlite';
import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  OnApplicationBootstrap,
  OnModuleDestroy,
} from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { randomUUID } from 'node:crypto';
import { rm, stat } from 'node:fs/promises';
import * as path from 'node:path';
import { EpisodeRefDto, MediaType } from '../common/common.dto.js';
import { DOWNLOADS_DIR } from '../consts.js';
import { IndexersService } from '../indexers/indexers.service.js';
import { LOCAL_MEDIA_VERSION_GONE } from '../local-media/local-media.events.js';
import { LocalMediaService } from '../local-media/local-media.service.js';
import { parseEpisodeNumbers } from '../local-media/local-media.utils.js';
import { MetadataService } from '../metadata/metadata.service.js';
import { hasEpisode, hasSeason } from '../metadata/metadata.utils.js';
import { REQUESTS_CHANGED } from '../requests/requests.events.js';
import { RequestsService } from '../requests/requests.service.js';
import { LogType } from '../server-log/log-entry.entity.js';
import { ServerLogService } from '../server-log/server-log.service.js';
import { SettingsService } from '../settings/settings.service.js';
import { WATCH_STATUS_CHANGED } from '../user-data/play-state/play-state.events.js';
import { PlayStatesService } from '../user-data/play-state/play-states.service.js';
import { getNextCleanup } from './cleanup.utils.js';
import {
  CleanupSchedule,
  DownloadSettingsDto,
  EpisodeDownloadStatus,
  EpisodeStatusDto,
  SeriesDownloadsDto,
  TorrentDto,
  TorrentStatus,
} from './downloads.dto.js';
import {
  type DownloadsState,
  planDownloads,
  type PlannedRequest,
  PlannedStatus,
  type WantedFile,
} from './downloads.plan.js';
import {
  type TorrentHandle,
  TORRENT_ENGINE,
  type TorrentEngine,
} from './torrent-engine.js';
import { TorrentSelection } from '../requests/torrent-selection.entity.js';
import { Torrent } from './torrent.entity.js';

const SETTINGS_KEY = 'downloads';
const DEFAULT_SETTINGS: DownloadSettingsDto = {
  seedRatio: 0,
  cleanup: CleanupSchedule.Daily,
};
const TICK_INTERVAL = 30_000;

/** A torrent that runs in the engine */
interface ActiveTorrent {
  torrentId: string;
  stopped: boolean;
  handle?: TorrentHandle;
  /** The engine knows the files and has verified the data of an earlier run */
  ready: boolean;
  error?: string;
  /** The files it downloads, as of the last plan */
  wanted: number[];
  importErrors: Map<number, string>;
  /** How much of the engine's transfer counters is stored in the torrent row */
  stored: { downloaded: number; uploaded: number };
}

const episodeKey = (e: EpisodeRefDto) => `${e.season}-${e.episode}`;

/**
 * Downloads what is requested from the torrents that are selected for it.
 * A request remembers the torrent it is bound to and the file that fulfils
 * it. Nothing else about a download is stored apart from the transfer
 * counters: what every torrent has to do is planned from the requests, the
 * selections and the files in the library (see planDownloads), and applied
 * whenever one of them changes.
 */
@Injectable()
export class DownloadsService
  implements OnApplicationBootstrap, OnModuleDestroy
{
  private readonly logger = new Logger(DownloadsService.name);
  private readonly active = new Map<string, ActiveTorrent>();
  private readonly importing = new Set<string>();
  private queue: Promise<unknown> = Promise.resolve();
  /** The reconciliation that waits in the queue */
  private pending?: Promise<void>;
  private timer?: NodeJS.Timeout;
  /** Nothing starts once the server stops */
  private stopping = false;

  constructor(
    private readonly em: EntityManager,
    private readonly settingsService: SettingsService,
    private readonly metadataService: MetadataService,
    private readonly requestsService: RequestsService,
    private readonly playStatesService: PlayStatesService,
    private readonly indexersService: IndexersService,
    private readonly localMediaService: LocalMediaService,
    private readonly serverLog: ServerLogService,
    @Inject(TORRENT_ENGINE) private readonly engine: TorrentEngine,
  ) {}

  async onApplicationBootstrap() {
    // Also removes what a torrent left behind when the server was stopped
    await this.serialize(() => this.apply(true)).catch((error) =>
      this.logFailure(error),
    );

    // Stores the transfer counters, ends finished seeding and retries imports
    this.timer = setInterval(() => {
      if (this.active.size) this.reconcile();
    }, TICK_INTERVAL);
    this.timer.unref();
  }

  async onModuleDestroy() {
    this.stopping = true;
    clearInterval(this.timer);

    await this.serialize(() => this.shutDown());
  }

  // Not awaited, so whoever emits the event does not wait for the torrents
  @OnEvent(REQUESTS_CHANGED)
  @OnEvent(WATCH_STATUS_CHANGED)
  @OnEvent(LOCAL_MEDIA_VERSION_GONE)
  onWantedChanged() {
    this.reconcile();
  }

  getSettings(): Promise<DownloadSettingsDto> {
    return this.settingsService.getOrCreateValue(
      SETTINGS_KEY,
      DEFAULT_SETTINGS,
    );
  }

  async updateSettings(
    settings: DownloadSettingsDto,
  ): Promise<DownloadSettingsDto> {
    const { seedRatio, cleanup } = settings ?? {};
    if (typeof seedRatio !== 'number' || !(seedRatio >= 0)) {
      throw new BadRequestException('seedRatio must be a number, 0 or greater');
    }
    if (!Object.values(CleanupSchedule).includes(cleanup)) {
      throw new BadRequestException(
        `cleanup must be one of ${Object.values(CleanupSchedule).join(', ')}`,
      );
    }

    return this.settingsService.saveValue(SETTINGS_KEY, { seedRatio, cleanup });
  }

  /** Where the requests and the selected torrents of a user stand for a series */
  async getSeriesDownloads(
    userId: string,
    tmdbId: string,
  ): Promise<SeriesDownloadsDto> {
    const onDisk = new Map<string, EpisodeRefDto>();
    for (const file of await this.localMediaService.getSeriesFiles(tmdbId)) {
      for (const episode of file.episodes) {
        const ref = { season: file.season, episode };
        onDisk.set(episodeKey(ref), ref);
      }
    }

    // The series is planned for everyone, because anyone's request can be
    // what keeps a file from the next cleanup
    const selectionsOfEveryone = await this.em.find(
      TorrentSelection,
      { mediaType: MediaType.Series, tmdbId },
      { orderBy: { season: 'asc', episode: 'asc' }, disableIdentityMap: true },
    );
    const requestsOfEveryone =
      await this.requestsService.findAllSeriesRequests(tmdbId);
    const torrents = await this.findTorrents([
      ...selectionsOfEveryone,
      ...requestsOfEveryone,
    ]);
    const files = await this.localMediaService.findIndexedFiles(
      MediaType.Series,
      tmdbId,
    );
    const { seedRatio, cleanup } = await this.getSettings();
    const plan = planDownloads({
      requests: requestsOfEveryone,
      selections: selectionsOfEveryone,
      torrents: [...torrents.values()],
      files,
      ...(await this.getRuleState(
        await this.requestsService.findRules(tmdbId),
      )),
      seedRatio,
    });

    const requested = new Map(
      plan.requests
        .filter((planned) => planned.request.userId === userId)
        .map((planned) => [episodeKey(planned.request), planned]),
    );
    const episodes = [
      ...[...requested.values()].map((planned) => planned.request),
      ...[...onDisk.values()].filter((e) => !requested.has(episodeKey(e))),
    ];

    const nextCleanup = getNextCleanup(new Date(), cleanup);
    const unretained = new Set(plan.unretained);
    const isCleanedUp = (e: EpisodeRefDto) => {
      const ofEpisode = files.filter(
        (file) =>
          file.season === e.season &&
          file.episode <= e.episode &&
          e.episode <= file.lastEpisode,
      );

      return ofEpisode.length > 0 && ofEpisode.every((f) => unretained.has(f));
    };

    return {
      selections: selectionsOfEveryone
        .filter((selection) => selection.userId === userId)
        .map((selection) => ({
          id: selection.id,
          season: selection.season,
          episode: selection.episode,
          releaseId: selection.releaseId,
          torrent: this.toTorrentDto(torrents.get(selection.torrentId)),
        })),
      episodes: episodes
        .map((episode): EpisodeStatusDto => ({
          season: episode.season,
          episode: episode.episode,
          requested: requested.has(episodeKey(episode)),
          onDisk: onDisk.has(episodeKey(episode)),
          ...this.getRequestStatus(requested.get(episodeKey(episode))),
          torrent: this.toTorrentDto(
            torrents.get(requested.get(episodeKey(episode))?.torrentId),
          ),
          cleanupAt: isCleanedUp(episode) ? nextCleanup : undefined,
        }))
        .sort((a, b) => a.season - b.season || a.episode - b.episode),
      onServer: [
        ...new Set([
          ...[...torrents.values()].map((t) => t.infoHash),
          ...files.flatMap((file) => file.infoHash ?? []),
        ]),
      ],
    };
  }

  /**
   * Selects the torrent that the requests of a user for an episode, or with
   * episode 0 for the rest of a season, are bound to. For an episode this
   * replaces what its request has: the request is bound again and lets go of
   * its file. For a season the requests that have no file yet are bound again
   * and the ones that have their file keep it.
   */
  async selectRelease(
    userId: string,
    tmdbId: string,
    season: number,
    episode: number,
    releaseId: string,
  ): Promise<void> {
    const series = await this.metadataService.getSeriesByTmdbId(tmdbId);
    if (!series) throw new NotFoundException('Series not found');

    const exists =
      episode === 0
        ? hasSeason(series.tmdbSeries, season)
        : hasEpisode(series.tmdbSeries, season, episode);
    if (!exists) throw new NotFoundException('Season or episode not found');

    const release = this.indexersService.getRelease(releaseId);
    if (!release) {
      throw new NotFoundException('Release not found, search again');
    }
    const source = await this.indexersService.resolveTorrent(release);

    // Behind the reconciliation that the changes before it queued, which
    // gives a request that holds its file the file before the unbind
    await this.serialize(async () => {
      const torrentId = await this.em.transactional(async (tx) => {
        let torrent = await tx.findOne(
          Torrent,
          { infoHash: source.infoHash },
          { disableIdentityMap: true },
        );
        if (!torrent) {
          torrent = new Torrent();
          torrent.infoHash = source.infoHash;
          torrent.title = release.title;
          torrent.indexer = release.indexer;
          torrent.size = release.size;
          torrent.magnetUrl = source.magnetUrl;
          torrent.torrentFile = source.torrentFile;
          torrent.files = source.files;
          await tx.insert(Torrent, { ...torrent });
        }

        await this.requestsService.select(
          tx,
          { userId, tmdbId, season, episode },
          { torrentId: torrent.id, releaseId: release.id },
        );

        return torrent.id;
      });

      // Selecting a failed torrent again is the way to retry it
      const failed = this.active.get(torrentId);
      if (failed?.error) await this.stop(failed);
    });
    this.reconcile();
  }

  async clearSelection(
    userId: string,
    tmdbId: string,
    season: number,
    episode: number,
  ): Promise<boolean> {
    const deleted = await this.serialize(() =>
      this.em.transactional((tx) =>
        this.requestsService.deselect(tx, { userId, tmdbId, season, episode }),
      ),
    );
    this.reconcile();

    return deleted;
  }

  /**
   * Brings the torrents in line with what is wanted. Never rejects. A run that
   * has not started covers every change made until it does, so at most one
   * waits in the queue.
   */
  reconcile(): Promise<void> {
    if (this.stopping) return Promise.resolve();

    this.pending ??= this.serialize(() => {
      this.pending = undefined;

      return this.apply(false);
    }).catch((error) => this.logFailure(error));

    return this.pending;
  }

  /** Runs changes to torrents one at a time */
  private serialize<T>(run: () => Promise<T>): Promise<T> {
    const result = this.queue.then(run);
    this.queue = result.catch(() => {});

    return result;
  }

  /** The plan for every request, torrent and imported file of the server */
  private async planServer() {
    const torrents = await this.em.find(
      Torrent,
      {},
      { disableIdentityMap: true },
    );
    const { seedRatio } = await this.getSettings();
    const plan = planDownloads({
      requests: await this.requestsService.findEpisodeRequests(),
      selections: await this.em.find(
        TorrentSelection,
        {},
        { disableIdentityMap: true },
      ),
      torrents,
      files: await this.localMediaService.findVersions(MediaType.Series),
      ...(await this.getRuleState(await this.requestsService.findRules())),
      seedRatio,
    });

    return { plan, torrents };
  }

  @CreateRequestContext()
  private async apply(sweep: boolean): Promise<void> {
    for (const active of this.active.values()) await this.storeCounters(active);

    const { plan, torrents } = await this.planServer();
    // Requests remember what they were bound to and what fulfils them
    await this.requestsService.setReferences(
      plan.requests
        .filter(
          ({ request, torrentId, mediaFileId }) =>
            (request.torrentId ?? undefined) !== torrentId ||
            (request.mediaFileId ?? undefined) !== mediaFileId,
        )
        .map(({ request, torrentId, mediaFileId }) => ({
          id: request.id,
          torrentId,
          mediaFileId,
        })),
    );

    const torrentsById = new Map(torrents.map((t) => [t.id, t]));
    for (const planned of plan.torrents) {
      const torrent = torrentsById.get(planned.torrentId);
      const active = this.active.get(torrent.id);
      const isNeeded = planned.wanted.length > 0 || planned.needsFiles;

      // A torrent that nothing refers to and that is done seeding is forgotten
      const release = async () => {
        if (
          active ||
          sweep ||
          torrent.downloadedBytes ||
          torrent.uploadedBytes
        ) {
          await this.discard(torrent);
        }
        if (!planned.referenced) {
          await this.em.nativeDelete(Torrent, { id: torrent.id });
        }
      };

      if (!isNeeded && !planned.seeds) {
        await release();
        continue;
      }
      if (!active) {
        this.start(torrent);
        continue;
      }
      if (!active.ready) continue;

      active.wanted = [...new Set(planned.wanted.map((w) => w.fileIndex))];
      active.handle.setWantedFiles(active.wanted);

      for (const wanted of planned.wanted) {
        if (active.handle.isFileComplete(wanted.fileIndex)) {
          this.import(active, torrent, wanted);
        }
      }

      // There is nothing to seed from
      if (!isNeeded && !active.handle.hasData()) await release();
    }
  }

  private start(torrent: Torrent) {
    if (this.stopping) return;

    const active: ActiveTorrent = {
      torrentId: torrent.id,
      stopped: false,
      ready: false,
      wanted: [],
      importErrors: new Map(),
      stored: { downloaded: 0, uploaded: 0 },
    };
    this.active.set(torrent.id, active);

    this.run(active, torrent)
      .catch((error) => {
        this.logger.warn(`"${torrent.title}" failed: ${error.message}`);
        active.error = error.message;
      })
      .then(() => {
        if (!active.stopped) return this.reconcile();
      });
  }

  @CreateRequestContext()
  private async run(active: ActiveTorrent, torrent: Torrent): Promise<void> {
    const { torrentFile } = await this.em.findOneOrFail(
      Torrent,
      { id: torrent.id },
      { populate: ['torrentFile'], disableIdentityMap: true },
    );
    if (active.stopped) return;

    active.handle = this.engine.add(
      torrentFile ?? torrent.magnetUrl,
      this.getDirectory(torrent),
    );
    active.handle.onFileComplete(() => this.reconcile());

    const files = await active.handle.ready;
    if (!torrent.files) {
      await this.em.nativeUpdate(Torrent, { id: torrent.id }, { files });
    }
    active.ready = true;
  }

  /**
   * Adds a finished file to the library. Runs outside the queue, because
   * copying a file to another filesystem takes its time.
   */
  private import(active: ActiveTorrent, torrent: Torrent, wanted: WantedFile) {
    const key = `${torrent.id}:${wanted.fileIndex}:${wanted.tmdbId}`;
    if (this.importing.has(key)) return;
    this.importing.add(key);

    this.importFile(active, torrent, wanted).then(
      () => {
        this.importing.delete(key);
        active.importErrors.delete(wanted.fileIndex);

        // The requests for the file are fulfilled, which can finish the torrent
        return this.reconcile();
      },
      (error) => {
        this.importing.delete(key);
        this.logger.warn(
          `Importing "${torrent.files[wanted.fileIndex].name}" failed: ${error.message}`,
        );
        active.importErrors.set(
          wanted.fileIndex,
          `Import failed: ${error.message}`,
        );
      },
    );
  }

  @CreateRequestContext()
  private async importFile(
    active: ActiveTorrent,
    torrent: Torrent,
    wanted: WantedFile,
  ): Promise<string> {
    const numbers = parseEpisodeNumbers(torrent.files[wanted.fileIndex].name);

    return this.localMediaService.importEpisodeFile({
      tmdbId: wanted.tmdbId,
      season: wanted.season,
      episodes:
        numbers?.season === wanted.season ? numbers.episodes : wanted.episodes,
      sourcePath: active.handle.getFilePath(wanted.fileIndex),
      infoHash: torrent.infoHash,
    });
  }

  private async shutDown() {
    for (const active of [...this.active.values()]) {
      await this.storeCounters(active);
      await this.stop(active);
    }
  }

  private async stop(active: ActiveTorrent) {
    active.stopped = true;
    this.active.delete(active.torrentId);
    await active.handle?.destroy();
  }

  /** Stops a torrent and deletes what it downloaded */
  private async discard(torrent: Torrent) {
    const active = this.active.get(torrent.id);
    if (active) await this.stop(active);

    const directory = this.getDirectory(torrent);
    const hasData = await stat(directory).then(
      () => true,
      () => false,
    );
    await rm(directory, { recursive: true, force: true });
    if (hasData) {
      await this.serverLog.write(
        LogType.DownloadDeleted,
        `Deleted the downloaded data of "${torrent.title}"`,
        { directory, torrentId: torrent.id, infoHash: torrent.infoHash },
      );
    }

    if (torrent.downloadedBytes || torrent.uploadedBytes) {
      await this.em.nativeUpdate(
        Torrent,
        { id: torrent.id },
        { downloadedBytes: 0, uploadedBytes: 0 },
      );
    }
  }

  @EnsureRequestContext()
  private async storeCounters(active: ActiveTorrent) {
    const stats = active.handle?.getStats();
    if (!stats) return;

    const downloaded = stats.downloaded - active.stored.downloaded;
    const uploaded = stats.uploaded - active.stored.uploaded;
    if (!downloaded && !uploaded) return;

    await this.em.nativeUpdate(
      Torrent,
      { id: active.torrentId },
      {
        downloadedBytes: raw(`downloaded_bytes + ${downloaded}`),
        uploadedBytes: raw(`uploaded_bytes + ${uploaded}`),
      },
    );
    active.stored = { downloaded: stats.downloaded, uploaded: stats.uploaded };
  }

  /** The rules with what they are evaluated against */
  private async getRuleState(
    rules: DownloadsState['rules'],
  ): Promise<Pick<DownloadsState, 'rules' | 'playStates' | 'now'>> {
    return {
      rules,
      playStates: await this.playStatesService.findEpisodePlayStates(rules),
      now: Date.now(),
    };
  }

  /** The torrents that selections and requests refer to */
  private async findTorrents(
    references: { torrentId?: string }[],
  ): Promise<Map<string, Torrent>> {
    const torrents = await this.em.find(
      Torrent,
      { id: { $in: references.flatMap(({ torrentId }) => torrentId ?? []) } },
      { disableIdentityMap: true },
    );

    return new Map(torrents.map((torrent) => [torrent.id, torrent]));
  }

  private getRequestStatus(
    planned?: PlannedRequest,
  ): Pick<EpisodeStatusDto, 'status' | 'progress' | 'error'> {
    if (!planned) return {};

    switch (planned.status) {
      case PlannedStatus.WaitingForApproval:
        return { status: EpisodeDownloadStatus.WaitingForApproval };
      case PlannedStatus.InactiveAhead:
        return { status: EpisodeDownloadStatus.InactiveAhead };
      case PlannedStatus.InactiveWatched:
        return { status: EpisodeDownloadStatus.InactiveWatched };
      case PlannedStatus.NoSelection:
        return { status: EpisodeDownloadStatus.NoSelection };
      case PlannedStatus.Available:
        return { status: EpisodeDownloadStatus.Available };
      case PlannedStatus.NoFileInTorrent:
        return {
          status: EpisodeDownloadStatus.NoFileInTorrent,
          error: 'The torrent has no file for this episode',
        };
    }

    const active = this.active.get(planned.torrentId);
    if (active?.error) {
      return { status: EpisodeDownloadStatus.Failed, error: active.error };
    }
    if (planned.status === PlannedStatus.Resolving || !active?.ready) {
      return { status: EpisodeDownloadStatus.Resolving };
    }

    const importError = active.importErrors.get(planned.fileIndex);
    if (importError) {
      return { status: EpisodeDownloadStatus.Failed, error: importError };
    }

    return {
      status: EpisodeDownloadStatus.Downloading,
      progress: active.handle.getFileProgress(planned.fileIndex),
    };
  }

  private toTorrentDto(torrent?: Torrent): TorrentDto | undefined {
    if (!torrent) return undefined;

    const active = this.active.get(torrent.id);
    const stats = active?.handle?.getStats();

    return {
      id: torrent.id,
      infoHash: torrent.infoHash,
      title: torrent.title,
      indexer: torrent.indexer,
      size: torrent.size,
      downloadedBytes:
        torrent.downloadedBytes +
        (stats ? stats.downloaded - active.stored.downloaded : 0),
      uploadedBytes:
        torrent.uploadedBytes +
        (stats ? stats.uploaded - active.stored.uploaded : 0),
      status: !active
        ? TorrentStatus.Stopped
        : active.error
          ? TorrentStatus.Failed
          : !active.ready
            ? TorrentStatus.Starting
            : active.wanted.length
              ? TorrentStatus.Downloading
              : TorrentStatus.Seeding,
      error: active?.error,
      peers: stats?.peers ?? 0,
      downloadSpeed: stats?.downloadSpeed ?? 0,
      uploadSpeed: stats?.uploadSpeed ?? 0,
    };
  }

  private logFailure(error: Error) {
    this.logger.error(`Reconciling failed: ${error.message}`, error.stack);
  }

  private getDirectory(torrent: Pick<Torrent, 'id'>): string {
    return path.join(DOWNLOADS_DIR, torrent.id);
  }
}
