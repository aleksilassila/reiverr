import { CreateRequestContext } from '@mikro-orm/decorators/legacy';
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
import { rm } from 'node:fs/promises';
import * as path from 'node:path';
import {
  EpisodeRefDto,
  MediaType,
  MediaTypeFull,
} from '../common/common.dto.js';
import { DOWNLOADS_DIR } from '../consts.js';
import { IndexersService } from '../indexers/indexers.service.js';
import { LocalMediaService } from '../local-media/local-media.service.js';
import { parseEpisodeNumbers } from '../local-media/local-media.utils.js';
import {
  MEDIA_REQUESTS_CHANGED,
  type MediaRequestsChangedEvent,
} from '../media-requests/media-requests.events.js';
import { MediaRequestsService } from '../media-requests/media-requests.service.js';
import { MetadataService } from '../metadata/metadata.service.js';
import { hasEpisode, hasSeason } from '../metadata/metadata.utils.js';
import { SettingsService } from '../settings/settings.service.js';
import {
  DownloadSettingsDto,
  SeriesDownloadsDto,
  TorrentSelectionDto,
  TorrentStatus,
} from './downloads.dto.js';
import { findEpisodeFile, findOnlyVideoFile } from './downloads.utils.js';
import {
  TORRENT_ENGINE,
  type Torrent,
  type TorrentEngine,
  type TorrentFile,
} from './torrent-engine.js';
import { TorrentSelection } from './torrent-selection.entity.js';

const SETTINGS_KEY = 'downloads';
const DEFAULT_SETTINGS: DownloadSettingsDto = { seedRatio: 0 };
const TICK_INTERVAL = 30_000;

interface EpisodeDownload extends EpisodeRefDto {
  fileIndex?: number;
  error?: string;
}

/** A selection whose torrent is running */
interface ActiveTorrent {
  selectionId: string;
  tmdbId: string;
  stopped: boolean;
  torrent?: Torrent;
  /** Known once the torrent is ready */
  files?: TorrentFile[];
  error?: string;
  /** The wanted episodes this torrent downloads */
  episodes: EpisodeDownload[];
  /** How much of the torrent's transfer counters is stored in the selection */
  stored: { downloaded: number; uploaded: number };
}

const episodeKey = (e: EpisodeRefDto) => `${e.season}-${e.episode}`;

/**
 * Downloads the episodes that are requested and have a torrent selected.
 * Nothing about a download is stored apart from the transfer counters: what
 * should run is derived from the requests, the selections and the library,
 * and reconciled whenever one of them changes.
 */
@Injectable()
export class DownloadsService
  implements OnApplicationBootstrap, OnModuleDestroy
{
  private readonly logger = new Logger(DownloadsService.name);
  private readonly torrents = new Map<string, ActiveTorrent>();
  private queue: Promise<unknown> = Promise.resolve();
  private timer?: NodeJS.Timeout;

  constructor(
    private readonly em: EntityManager,
    private readonly settingsService: SettingsService,
    private readonly metadataService: MetadataService,
    private readonly mediaRequestsService: MediaRequestsService,
    private readonly indexersService: IndexersService,
    private readonly localMediaService: LocalMediaService,
    @Inject(TORRENT_ENGINE) private readonly engine: TorrentEngine,
  ) {}

  @CreateRequestContext()
  async onApplicationBootstrap() {
    const series: { tmdbId: string }[] = await this.em
      .createQueryBuilder(TorrentSelection)
      .select('tmdbId', true)
      .where({ mediaType: MediaType.Series })
      .execute();

    for (const { tmdbId } of series) await this.reconcile(tmdbId);

    // Stores the transfer counters, ends finished seeding and retries imports
    this.timer = setInterval(() => {
      const active = [...this.torrents.values()].map((t) => t.tmdbId);
      new Set(active).forEach((tmdbId) => this.reconcile(tmdbId));
    }, TICK_INTERVAL);
    this.timer.unref();
  }

  async onModuleDestroy() {
    clearInterval(this.timer);

    await this.serialize(async () => {
      for (const active of [...this.torrents.values()]) {
        await this.storeCounters(active);
        await this.stop(active);
      }
    });
  }

  @OnEvent(MEDIA_REQUESTS_CHANGED)
  async onMediaRequestsChanged(event: MediaRequestsChangedEvent) {
    if (event.mediaType === MediaTypeFull.Episode) {
      await this.reconcile(event.tmdbId);
    }
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
    const seedRatio = settings?.seedRatio;
    if (typeof seedRatio !== 'number' || !(seedRatio >= 0)) {
      throw new BadRequestException('seedRatio must be a number, 0 or greater');
    }

    return this.settingsService.saveValue(SETTINGS_KEY, { seedRatio });
  }

  async getSeriesDownloads(tmdbId: string): Promise<SeriesDownloadsDto> {
    const onDisk = await this.getEpisodesOnDisk(tmdbId);
    const selections = await this.findSelections(tmdbId);
    const active = [...this.torrents.values()].filter(
      (t) => t.tmdbId === tmdbId,
    );

    return {
      selections: selections.map((selection) => {
        const torrent = this.torrents.get(selection.id);
        const stats = torrent?.torrent?.getStats();

        return toSelectionDto({
          ...selection,
          downloadedBytes:
            selection.downloadedBytes +
            (stats ? stats.downloaded - torrent.stored.downloaded : 0),
          uploadedBytes:
            selection.uploadedBytes +
            (stats ? stats.uploaded - torrent.stored.uploaded : 0),
        });
      }),
      torrents: active.map((t) => {
        const stats = t.torrent?.getStats();

        return {
          selectionId: t.selectionId,
          status: t.error
            ? TorrentStatus.Failed
            : !t.files
              ? TorrentStatus.Starting
              : t.episodes.length
                ? TorrentStatus.Downloading
                : TorrentStatus.Seeding,
          error: t.error,
          peers: stats?.peers ?? 0,
          downloadSpeed: stats?.downloadSpeed ?? 0,
          uploadSpeed: stats?.uploadSpeed ?? 0,
        };
      }),
      episodes: active.flatMap((t) =>
        t.episodes.map((e) => ({
          season: e.season,
          episode: e.episode,
          selectionId: t.selectionId,
          progress:
            e.fileIndex === undefined
              ? 0
              : t.torrent.getFileProgress(e.fileIndex),
          error: e.error ?? t.error,
        })),
      ),
      onDisk,
    };
  }

  /**
   * Selects the torrent that an episode, or with episode 0 the rest of a
   * season, is downloaded from. Replaces the previous selection and discards
   * what was downloaded for it.
   */
  async selectRelease(
    tmdbId: string,
    season: number,
    episode: number,
    releaseId: string,
  ): Promise<TorrentSelectionDto> {
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

    const selection = new TorrentSelection();
    selection.mediaType = MediaType.Series;
    selection.tmdbId = tmdbId;
    selection.season = season;
    selection.episode = episode;
    selection.releaseId = release.id;
    selection.title = release.title;
    selection.indexer = release.indexer;
    selection.size = release.size;
    selection.infoHash = release.infoHash;
    selection.magnetUrl = release.magnetUrl;
    selection.downloadUrl = release.downloadUrl;

    await this.serialize(async () => {
      await this.deleteSelection(tmdbId, season, episode);
      await this.em.insert(TorrentSelection, { ...selection });
    });
    await this.reconcile(tmdbId);

    return toSelectionDto(selection);
  }

  async clearSelection(
    tmdbId: string,
    season: number,
    episode: number,
  ): Promise<boolean> {
    const deleted = await this.serialize(() =>
      this.deleteSelection(tmdbId, season, episode),
    );
    await this.reconcile(tmdbId);

    return deleted;
  }

  /** Brings the torrents of a series in line with what is wanted. Never rejects. */
  reconcile(tmdbId: string): Promise<void> {
    return this.serialize(() => this.reconcileSeries(tmdbId)).catch((error) =>
      this.logger.error(
        `Reconciling series ${tmdbId} failed: ${error.message}`,
        error.stack,
      ),
    );
  }

  /** Runs changes to torrents one at a time */
  private serialize<T>(run: () => Promise<T>): Promise<T> {
    const result = this.queue.then(run);
    this.queue = result.catch(() => {});

    return result;
  }

  @CreateRequestContext()
  private async reconcileSeries(tmdbId: string): Promise<void> {
    for (const active of this.torrents.values()) {
      if (active.tmdbId === tmdbId) await this.storeCounters(active);
    }

    const { seedRatio } = await this.getSettings();
    const selections = await this.findSelections(tmdbId);
    const requested =
      await this.mediaRequestsService.findApprovedEpisodes(tmdbId);
    const onDisk = new Set(
      (await this.getEpisodesOnDisk(tmdbId)).map(episodeKey),
    );
    const wanted = requested.filter((e) => !onDisk.has(episodeKey(e)));

    let imported = false;

    for (const selection of selections) {
      // An episode uses its own torrent before the season pack
      const episodes = wanted.filter(
        (e) =>
          selection ===
          (selections.find(
            (s) => s.season === e.season && s.episode === e.episode,
          ) ??
            selections.find((s) => s.season === e.season && s.episode === 0)),
      );
      const seeds =
        selection.downloadedBytes > 0 &&
        selection.uploadedBytes < seedRatio * selection.downloadedBytes;

      if (!episodes.length && !seeds) {
        await this.discard(selection);
        continue;
      }

      const active = this.torrents.get(selection.id);
      if (!active) {
        this.start(selection, episodes);
        continue;
      }

      active.episodes = episodes.map((e) => ({ ...e }));
      if (!active.files) continue;

      for (const state of active.episodes) {
        const file =
          findEpisodeFile(active.files, state.season, state.episode) ??
          (selection.episode !== 0
            ? findOnlyVideoFile(active.files)
            : undefined);

        if (file) state.fileIndex = file.index;
        else state.error = 'The torrent has no file for this episode';
      }

      const fileIndexes = [
        ...new Set(active.episodes.flatMap((e) => e.fileIndex ?? [])),
      ];
      active.torrent.setWantedFiles(fileIndexes);

      for (const fileIndex of fileIndexes) {
        if (!active.torrent.isFileComplete(fileIndex)) continue;

        const states = active.episodes.filter((e) => e.fileIndex === fileIndex);
        const season = states[0].season;
        const numbers = parseEpisodeNumbers(active.files[fileIndex].name);

        await this.localMediaService
          .importEpisodeFile({
            tmdbId,
            season,
            episodes:
              numbers?.season === season
                ? numbers.episodes
                : states.map((e) => e.episode),
            sourcePath: active.torrent.getFilePath(fileIndex),
          })
          .then(
            () => (imported = true),
            (error) => {
              this.logger.warn(
                `Importing "${active.files[fileIndex].name}" failed: ${error.message}`,
              );
              states.forEach(
                (e) => (e.error = `Import failed: ${error.message}`),
              );
            },
          );
      }

      if (!episodes.length && !active.torrent.hasData()) {
        await this.discard(selection);
      }
    }

    // Imported episodes are no longer wanted, which can finish their torrents
    if (imported) await this.reconcileSeries(tmdbId);
  }

  private start(selection: TorrentSelection, episodes: EpisodeRefDto[]) {
    const active: ActiveTorrent = {
      selectionId: selection.id,
      tmdbId: selection.tmdbId,
      stopped: false,
      episodes: episodes.map((e) => ({ ...e })),
      stored: { downloaded: 0, uploaded: 0 },
    };
    this.torrents.set(selection.id, active);

    this.indexersService
      .getTorrentSource(selection)
      .then((source) => {
        if (active.stopped) return;

        active.torrent = this.engine.add(source, this.getDirectory(selection));
        active.torrent.onFileComplete(() => this.reconcile(active.tmdbId));

        return active.torrent.ready.then((files) => {
          active.files = files;
        });
      })
      .catch((error) => {
        this.logger.warn(`"${selection.title}" failed: ${error.message}`);
        active.error = error.message;
      })
      .then(() => {
        if (!active.stopped) return this.reconcile(active.tmdbId);
      });
  }

  private async stop(active: ActiveTorrent) {
    active.stopped = true;
    this.torrents.delete(active.selectionId);
    await active.torrent?.destroy();
  }

  /** Stops the torrent of a selection and deletes what it downloaded */
  private async discard(selection: TorrentSelection) {
    const active = this.torrents.get(selection.id);
    if (active) await this.stop(active);

    await rm(this.getDirectory(selection), { recursive: true, force: true });

    if (selection.downloadedBytes || selection.uploadedBytes) {
      await this.em.nativeUpdate(
        TorrentSelection,
        { id: selection.id },
        { downloadedBytes: 0, uploadedBytes: 0 },
      );
    }
  }

  private async deleteSelection(
    tmdbId: string,
    season: number,
    episode: number,
  ): Promise<boolean> {
    const selection = await this.em.findOne(
      TorrentSelection,
      { mediaType: MediaType.Series, tmdbId, season, episode },
      { disableIdentityMap: true },
    );
    if (!selection) return false;

    await this.em.nativeDelete(TorrentSelection, { id: selection.id });
    await this.discard({ ...selection, downloadedBytes: 0, uploadedBytes: 0 });

    return true;
  }

  private async storeCounters(active: ActiveTorrent) {
    const stats = active.torrent?.getStats();
    if (!stats) return;

    const downloaded = stats.downloaded - active.stored.downloaded;
    const uploaded = stats.uploaded - active.stored.uploaded;
    if (!downloaded && !uploaded) return;

    await this.em.nativeUpdate(
      TorrentSelection,
      { id: active.selectionId },
      {
        downloadedBytes: raw(`downloaded_bytes + ${downloaded}`),
        uploadedBytes: raw(`uploaded_bytes + ${uploaded}`),
      },
    );
    active.stored = { downloaded: stats.downloaded, uploaded: stats.uploaded };
  }

  private findSelections(tmdbId: string): Promise<TorrentSelection[]> {
    return this.em.find(
      TorrentSelection,
      { mediaType: MediaType.Series, tmdbId },
      { orderBy: { season: 'asc', episode: 'asc' }, disableIdentityMap: true },
    );
  }

  private async getEpisodesOnDisk(tmdbId: string): Promise<EpisodeRefDto[]> {
    const files = await this.localMediaService.getSeriesFiles(tmdbId);
    const episodes = new Map<string, EpisodeRefDto>();

    for (const file of files) {
      for (const episode of file.episodes) {
        const ref = { season: file.season, episode };
        episodes.set(episodeKey(ref), ref);
      }
    }

    return [...episodes.values()];
  }

  private getDirectory(selection: Pick<TorrentSelection, 'id'>): string {
    return path.join(DOWNLOADS_DIR, selection.id);
  }
}

function toSelectionDto(selection: TorrentSelection): TorrentSelectionDto {
  const { magnetUrl, downloadUrl, ...dto } = selection;

  return dto;
}
