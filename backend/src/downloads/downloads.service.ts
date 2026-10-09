import { EntityManager } from '@mikro-orm/sqlite';
import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  OnApplicationBootstrap,
  OnModuleInit,
} from '@nestjs/common';
import { rm, stat } from 'node:fs/promises';
import * as path from 'node:path';
import {
  EpisodeRefDto,
  MediaType,
  MediaTypeFull,
} from '../common/common.dto.js';
import { DOWNLOADS_DIR } from '../consts.js';
import { IndexersService } from '../indexers/indexers.service.js';
import { Job, JobStatus } from '../jobs/job.entity.js';
import { JobPayloads } from '../jobs/job-types.js';
import { JobContext, JobsService } from '../jobs/jobs.service.js';
import { LocalMediaService } from '../local-media/local-media.service.js';
import { parseEpisodeNumbers } from '../local-media/local-media.utils.js';
import { MediaFile } from '../local-media/media-file.entity.js';
import { MetadataService } from '../metadata/metadata.service.js';
import { hasEpisode, hasSeason } from '../metadata/metadata.utils.js';
import { Activity, fileOf } from '../requests/request-activity.js';
import { MediaRequest } from '../requests/request.entity.js';
import { RequestsService } from '../requests/requests.service.js';
import { TorrentSelection } from '../requests/torrent-selection.entity.js';
import { LogType } from '../server-log/log-entry.entity.js';
import { ServerLogService } from '../server-log/server-log.service.js';
import { SettingsService } from '../settings/settings.service.js';
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
  DEFAULT_DOWNLOADS_SETTINGS,
  DOWNLOADS_SETTINGS_KEY,
} from './downloads.settings.js';
import { heldFiles } from './retention.js';
import { TorrentRuntime } from './torrent-runtime.js';
import {
  Demand,
  DemandState,
  decideTorrent,
  TorrentDecision,
  torrentDemand,
} from './torrent.decide.js';
import { Torrent } from './torrent.entity.js';

const READ = { disableIdentityMap: true };

const episodeKey = (e: EpisodeRefDto) => `${e.season}-${e.episode}`;

const exists = (filePath: string) =>
  stat(filePath).then(
    () => true,
    () => false,
  );

/**
 * Downloads what is requested from the torrents that the requests are bound
 * to. Every torrent decides what it does in its own job, `torrent.reconcile`,
 * from the requests that are bound to it, whenever something they depend on
 * changes; `torrent.import` puts a finished file into the library.
 */
@Injectable()
export class DownloadsService implements OnModuleInit, OnApplicationBootstrap {
  private readonly logger = new Logger(DownloadsService.name);

  constructor(
    private readonly em: EntityManager,
    private readonly settingsService: SettingsService,
    private readonly metadataService: MetadataService,
    private readonly requestsService: RequestsService,
    private readonly indexersService: IndexersService,
    private readonly localMediaService: LocalMediaService,
    private readonly serverLog: ServerLogService,
    private readonly jobs: JobsService,
    private readonly runtime: TorrentRuntime,
  ) {}

  onModuleInit() {
    this.jobs.define('torrent.reconcile', {
      concurrency: 2,
      retry: true,
      run: ({ torrentId }, context) => this.reconcile(torrentId, context),
    });
    this.jobs.define('torrent.import', {
      concurrency: 2,
      retry: true,
      // A library that was not mounted is noticed soon after it is again
      maxRetryDelay: 5 * 60 * 1000,
      run: (payload, context) => this.import(payload, context),
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
    const { seedRatio, cleanup } = settings ?? {};
    if (typeof seedRatio !== 'number' || !(seedRatio >= 0)) {
      throw new BadRequestException('seedRatio must be a number, 0 or greater');
    }
    if (!Object.values(CleanupSchedule).includes(cleanup)) {
      throw new BadRequestException(
        `cleanup must be one of ${Object.values(CleanupSchedule).join(', ')}`,
      );
    }

    const saved = await this.settingsService.saveValue(DOWNLOADS_SETTINGS_KEY, {
      seedRatio,
      cleanup,
    });
    // How long torrents seed changes
    await this.enqueueEveryTorrent(this.em);

    return saved;
  }

  /** Where the requests and the selected torrents of a user stand for a series */
  async getSeriesDownloads(
    userId: string,
    tmdbId: string,
  ): Promise<SeriesDownloadsDto> {
    // As of the last sync of the series
    const onDisk = new Map<string, EpisodeRefDto>();
    for (const file of await this.localMediaService.getSeriesFiles(tmdbId)) {
      for (const episode of file.episodes) {
        const ref = { season: file.season, episode };
        onDisk.set(episodeKey(ref), ref);
      }
    }

    const series = await this.em.transactional((tx) =>
      this.readSeries(tx, tmdbId),
    );
    const { requests, activity, selections, torrents, files } = series;
    const demands = new Map(
      [...torrents.values()].map((torrent) => [
        torrent.id,
        torrentDemand({
          torrent,
          requests: requests.filter((r) => r.torrentId === torrent.id),
          activity,
          files,
          selections,
        }),
      ]),
    );
    const { cleanup } = await this.getSettings();
    const nextCleanup = getNextCleanup(new Date(), cleanup);
    const held = heldFiles({
      requests,
      activity,
      infoHashes: new Map(
        [...torrents.values()].map((torrent) => [torrent.id, torrent.infoHash]),
      ),
      files,
    });
    const isCleanedUp = (e: EpisodeRefDto) => {
      const ofEpisode = files.filter(
        (file) =>
          file.season === e.season &&
          file.episode <= e.episode &&
          e.episode <= file.lastEpisode,
      );

      return (
        ofEpisode.length > 0 &&
        ofEpisode.every((file) => file.managed && !held.has(file.id))
      );
    };

    const requested = new Map(
      requests
        .filter((request) => request.userId === userId)
        .map((request) => [episodeKey(request), request]),
    );
    const episodes = [
      ...requested.values(),
      ...[...onDisk.values()].filter((e) => !requested.has(episodeKey(e))),
    ];

    return {
      selections: selections
        .filter((selection) => selection.userId === userId)
        .map((selection) => ({
          id: selection.id,
          season: selection.season,
          episode: selection.episode,
          releaseId: selection.releaseId,
          torrent: this.toTorrentDto(torrents.get(selection.torrentId)),
        })),
      episodes: episodes
        .map((episode): EpisodeStatusDto => {
          const request = requested.get(episodeKey(episode));
          const torrent = torrents.get(request?.torrentId);

          return {
            season: episode.season,
            episode: episode.episode,
            requested: !!request,
            onDisk: onDisk.has(episodeKey(episode)),
            ...(request &&
              this.describe(
                request,
                activity.get(request.id),
                torrent,
                demands.get(torrent?.id),
                series,
              )),
            torrent: this.toTorrentDto(torrent),
            cleanupAt: isCleanedUp(episode) ? nextCleanup : undefined,
          };
        })
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
   * and the ones that have their file keep it. Selecting a torrent that
   * failed starts it again.
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

    await this.em.transactional(async (tx) => {
      let torrent = await tx.findOne(
        Torrent,
        { infoHash: source.infoHash },
        READ,
      );
      if (torrent) {
        await tx.nativeUpdate(
          Torrent,
          { id: torrent.id },
          { error: null, attempts: 0, retryAt: null },
        );
      } else {
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
    });
  }

  clearSelection(
    userId: string,
    tmdbId: string,
    season: number,
    episode: number,
  ): Promise<boolean> {
    return this.em.transactional((tx) =>
      this.requestsService.deselect(tx, { userId, tmdbId, season, episode }),
    );
  }

  /** Starts a torrent that failed again, at once */
  async retryTorrent(torrentId: string): Promise<void> {
    await this.em.transactional(async (tx) => {
      const affected = await tx.nativeUpdate(
        Torrent,
        { id: torrentId },
        { error: null, attempts: 0, retryAt: null },
      );
      if (!affected) throw new NotFoundException('Torrent not found');

      await this.jobs.enqueue(tx, 'torrent.reconcile', { torrentId });
    });
  }

  /** What a torrent does next, decided and done */
  private async reconcile(
    torrentId: string,
    context: JobContext,
  ): Promise<void> {
    const snapshot = this.runtime.snapshot(torrentId);
    const hasDirectory = await exists(this.getDirectory(torrentId));

    const decided = await context.em.transactional(async (tx) => {
      const torrent = await tx.findOne(Torrent, { id: torrentId }, READ);
      if (!torrent) return undefined;

      if (!torrent.files && snapshot?.files) {
        torrent.files = snapshot.files;
        await tx.nativeUpdate(
          Torrent,
          { id: torrentId },
          { files: snapshot.files },
        );
      }
      const demand = torrentDemand(await this.readDemand(tx, torrent));
      await this.requestsService.attach(
        tx,
        demand.attach.map((file) => ({ ...file, torrentId })),
      );

      const { seedRatio } = await this.getSettings();
      const decision = decideTorrent({
        demand,
        torrent: {
          downloadedBytes:
            torrent.downloadedBytes + (snapshot?.unflushed.downloaded ?? 0),
          uploadedBytes:
            torrent.uploadedBytes + (snapshot?.unflushed.uploaded ?? 0),
          attempts: torrent.attempts,
          retryAt: torrent.retryAt,
        },
        runtime: snapshot,
        hasData: snapshot?.ready ? snapshot.hasData : hasDirectory,
        seedRatio,
        now: new Date(),
      });
      await this.store(tx, torrent, decision);

      return { torrent, decision };
    });

    if (decided) await this.act(context, decided.torrent, decided.decision);
  }

  /** What a decision changes in the database, in its transaction */
  private async store(
    tx: EntityManager,
    torrent: Torrent,
    decision: TorrentDecision,
  ) {
    const torrentId = torrent.id;

    switch (decision.kind) {
      case 'fail':
        this.logger.warn(`"${torrent.title}" failed: ${decision.error}`);
        await tx.nativeUpdate(
          Torrent,
          { id: torrentId },
          {
            error: decision.error,
            attempts: torrent.attempts + 1,
            retryAt: decision.retryAt,
          },
        );
        await this.jobs.enqueue(
          tx,
          'torrent.reconcile',
          { torrentId },
          { runAt: decision.retryAt },
        );
        break;
      case 'backoff':
        await this.jobs.enqueue(
          tx,
          'torrent.reconcile',
          { torrentId },
          { runAt: decision.retryAt },
        );
        break;
      case 'run':
        if (torrent.error || torrent.attempts) {
          await tx.nativeUpdate(
            Torrent,
            { id: torrentId },
            { error: null, attempts: 0, retryAt: null },
          );
        }
        for (const fileIndex of decision.imports) {
          await this.jobs.enqueue(tx, 'torrent.import', {
            torrentId,
            fileIndex,
          });
        }
        break;
    }
  }

  /** What a decision does to the engine and the downloads folder */
  private async act(
    context: JobContext,
    torrent: Torrent,
    decision: TorrentDecision,
  ) {
    switch (decision.kind) {
      case 'fail':
        await this.runtime.stop(context, torrent.id);
        break;
      case 'release':
        await this.release(context, torrent);
        break;
      case 'start': {
        const { torrentFile } = await context.em.findOneOrFail(
          Torrent,
          { id: torrent.id },
          { populate: ['torrentFile'], ...READ },
        );
        this.runtime.start(
          context,
          { id: torrent.id, magnetUrl: torrent.magnetUrl, torrentFile },
          this.getDirectory(torrent.id),
        );
        break;
      }
      case 'run':
        this.runtime.setWantedFiles(context, torrent.id, decision.wanted);
        break;
    }
  }

  /**
   * Stops a torrent that nothing wants and that seeds no more, deletes what it
   * downloaded, and forgets it when nothing refers to it
   */
  private async release(context: JobContext, torrent: Torrent) {
    await this.runtime.stop(context, torrent.id);

    const directory = this.getDirectory(torrent.id);
    const hasData = await exists(directory);
    if (hasData) await rm(directory, { recursive: true, force: true });

    await context.em.transactional(async (tx) => {
      if (hasData) {
        await this.serverLog.writeIn(
          tx,
          LogType.DownloadDeleted,
          `Deleted the downloaded data of "${torrent.title}"`,
          { directory, torrentId: torrent.id, infoHash: torrent.infoHash },
        );
      }
      await tx.nativeUpdate(
        Torrent,
        { id: torrent.id },
        // Nothing retries a torrent that nothing wants
        {
          downloadedBytes: 0,
          uploadedBytes: 0,
          error: null,
          attempts: 0,
          retryAt: null,
        },
      );
      await tx.execute(
        `delete from torrent where id = ?
         and not exists (select 1 from request where torrent_id = torrent.id)
         and not exists (select 1 from torrent_selection where torrent_id = torrent.id)`,
        [torrent.id],
        'run',
      );
    });
  }

  /**
   * Puts a finished file into the library for the requests that want it, and
   * gives it to them
   */
  private async import(
    { torrentId, fileIndex }: JobPayloads['torrent.import'],
    context: JobContext,
  ): Promise<void> {
    // The torrent stopped since, or the file is not whole: the next
    // reconciliation enqueues the import again
    const snapshot = this.runtime.snapshot(torrentId);
    if (!snapshot?.ready || !snapshot.complete.has(fileIndex)) return;

    const read = await context.em.transactional(async (tx) => {
      const torrent = await tx.findOne(Torrent, { id: torrentId }, READ);
      if (!torrent) return undefined;

      const state = await this.readDemand(tx, torrent);
      return { torrent, state, demand: torrentDemand(state) };
    });
    if (!read) return;

    const { torrent, state, demand } = read;
    const name = snapshot.files[fileIndex].name;
    for (const wanted of demand.wanted) {
      if (wanted.fileIndex !== fileIndex) continue;

      const numbers = parseEpisodeNumbers(name);
      const episodes =
        numbers?.season === wanted.season ? numbers.episodes : wanted.episodes;
      // A rerun puts the file where the version of the torrent is already
      const version = state.files.find(
        (file) =>
          file.infoHash === torrent.infoHash &&
          file.tmdbId === wanted.tmdbId &&
          file.season === wanted.season &&
          file.episode === Math.min(...episodes) &&
          file.lastEpisode === Math.max(...episodes),
      );
      const placed = await this.localMediaService.placeEpisodeFile({
        tmdbId: wanted.tmdbId,
        season: wanted.season,
        episodes,
        sourcePath: snapshot.filePath(fileIndex),
        infoHash: torrent.infoHash,
        destination: version?.path,
      });

      await context.em.transactional(async (tx) => {
        // Read again: a request can have been bound elsewhere or held back
        // while the file was placed
        const now = await this.readDemand(tx, torrent);
        const wants = torrentDemand(now);
        const wantedBy = now.requests.filter((request) => {
          const result = wants.requests.get(request.id);
          return (
            result?.kind === 'wanted' &&
            result.fileIndex === fileIndex &&
            request.tmdbId === wanted.tmdbId &&
            request.season === wanted.season
          );
        });

        const mediaFileId = await this.localMediaService.indexImportedFile(
          tx,
          placed,
        );
        // Every request that wants the file has it, also one whose episode
        // the name of the file does not cover
        await this.requestsService.attach(
          tx,
          wantedBy.map((request) => ({
            requestId: request.id,
            torrentId,
            mediaFileId,
          })),
        );
        await this.jobs.enqueue(tx, 'torrent.reconcile', { torrentId });
      });
    }
  }

  /** What the requests that are bound to a torrent depend on */
  private async readDemand(
    tx: EntityManager,
    torrent: Torrent,
  ): Promise<
    Omit<DemandState, 'files' | 'requests'> & {
      files: MediaFile[];
      requests: MediaRequest[];
    }
  > {
    const bound = await tx.find(
      MediaRequest,
      { torrentId: torrent.id, mediaType: MediaTypeFull.Episode },
      { ...READ, fields: ['userId', 'tmdbId'] },
    );
    const { requests, activity } = await this.requestsService.readActivity(
      tx,
      bound,
    );
    const files = await tx.find(
      MediaFile,
      {
        mediaType: MediaType.Series,
        tmdbId: { $in: [...new Set(bound.map((r) => r.tmdbId))] },
        infoHash: torrent.infoHash,
      },
      READ,
    );
    const selections = await tx.find(
      TorrentSelection,
      { mediaType: MediaType.Series, torrentId: torrent.id },
      READ,
    );

    return {
      torrent,
      requests: requests.filter((r) => r.torrentId === torrent.id),
      activity,
      files,
      selections,
    };
  }

  /** Everything the status of a series is derived from, for every user */
  private async readSeries(tx: EntityManager, tmdbId: string) {
    const users = await tx.find(
      MediaRequest,
      { mediaType: MediaTypeFull.Episode, tmdbId },
      { ...READ, fields: ['userId', 'tmdbId'] },
    );
    const { requests, activity } = await this.requestsService.readActivity(
      tx,
      users,
    );
    const selections = await tx.find(
      TorrentSelection,
      { mediaType: MediaType.Series, tmdbId },
      { ...READ, orderBy: { season: 'asc', episode: 'asc' } },
    );
    const torrents = await tx.find(
      Torrent,
      {
        id: {
          $in: [...requests, ...selections].flatMap((r) => r.torrentId ?? []),
        },
      },
      READ,
    );
    const files = await tx.find(
      MediaFile,
      { mediaType: MediaType.Series, tmdbId },
      READ,
    );
    // A failed import row is one that a restart interrupted, and the boot
    // queues the import again
    const imports = await tx.find(
      Job,
      {
        type: 'torrent.import',
        status: { $in: [JobStatus.Queued, JobStatus.Running] },
        lockKey: { $in: torrents.map((torrent) => `torrent:${torrent.id}`) },
      },
      READ,
    );

    return {
      requests,
      activity,
      selections,
      torrents: new Map(torrents.map((torrent) => [torrent.id, torrent])),
      files,
      imports,
    };
  }

  /** Where the request of a user stands */
  private describe(
    request: MediaRequest,
    activity: Activity,
    torrent: Torrent | undefined,
    demand: Demand | undefined,
    series: { files: MediaFile[]; imports: Job[] },
  ): Pick<EpisodeStatusDto, 'status' | 'progress' | 'error'> {
    switch (activity) {
      case 'waiting':
        return { status: EpisodeDownloadStatus.WaitingForApproval };
      case 'ahead':
        return { status: EpisodeDownloadStatus.InactiveAhead };
      case 'watched':
        return { status: EpisodeDownloadStatus.InactiveWatched };
    }

    if (fileOf(request, activity, torrent?.infoHash, series.files)) {
      return { status: EpisodeDownloadStatus.Available };
    }
    if (activity === 'kept') {
      return { status: EpisodeDownloadStatus.InactiveWatched };
    }
    if (!torrent) return { status: EpisodeDownloadStatus.NoSelection };

    const wants = demand?.requests.get(request.id);
    if (wants?.kind === 'no-file-in-torrent') {
      return {
        status: EpisodeDownloadStatus.NoFileInTorrent,
        error: 'The torrent has no file for this episode',
      };
    }

    const snapshot = this.runtime.snapshot(torrent.id);
    // A torrent that runs again after its backoff is no longer failed
    const failure = snapshot ? snapshot.error : torrent.error;
    if (failure) {
      return { status: EpisodeDownloadStatus.Failed, error: failure };
    }
    if (wants?.kind !== 'wanted' || !snapshot?.ready) {
      return { status: EpisodeDownloadStatus.Resolving };
    }

    const importJob = series.imports.find(
      (job) => job.dedupeKey === `import:${torrent.id}:${wants.fileIndex}`,
    );
    if (importJob?.error) {
      return {
        status: EpisodeDownloadStatus.Failed,
        error: `Import failed: ${importJob.error}`,
      };
    }

    return {
      status: EpisodeDownloadStatus.Downloading,
      progress: snapshot.progress(wants.fileIndex),
    };
  }

  private toTorrentDto(torrent?: Torrent): TorrentDto | undefined {
    if (!torrent) return undefined;

    const snapshot = this.runtime.snapshot(torrent.id);
    const error = snapshot ? snapshot.error : torrent.error;

    return {
      id: torrent.id,
      infoHash: torrent.infoHash,
      title: torrent.title,
      indexer: torrent.indexer,
      size: torrent.size,
      downloadedBytes:
        torrent.downloadedBytes + (snapshot?.unflushed.downloaded ?? 0),
      uploadedBytes:
        torrent.uploadedBytes + (snapshot?.unflushed.uploaded ?? 0),
      status: error
        ? TorrentStatus.Failed
        : !snapshot
          ? TorrentStatus.Stopped
          : !snapshot.ready
            ? TorrentStatus.Starting
            : snapshot.wanted.length
              ? TorrentStatus.Downloading
              : TorrentStatus.Seeding,
      error: error ?? undefined,
      retryAt: (!snapshot && torrent.retryAt) || undefined,
      peers: snapshot?.peers ?? 0,
      downloadSpeed: snapshot?.downloadSpeed ?? 0,
      uploadSpeed: snapshot?.uploadSpeed ?? 0,
    };
  }

  private async enqueueEveryTorrent(em: EntityManager) {
    await em.transactional(async (tx) => {
      const torrents = await tx.find(Torrent, {}, { ...READ, fields: ['id'] });
      for (const { id } of torrents) {
        await this.jobs.enqueue(tx, 'torrent.reconcile', { torrentId: id });
      }
    });
  }

  private getDirectory(torrentId: string): string {
    return path.join(DOWNLOADS_DIR, torrentId);
  }
}
