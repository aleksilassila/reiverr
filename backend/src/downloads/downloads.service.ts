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
import { TorrentSource } from '../indexers/torrent-source.utils.js';
import { JobPayloads } from '../jobs/job-types.js';
import { JobContext, JobsService } from '../jobs/jobs.service.js';
import { parseEpisodeNumbers } from '../local-media/local-media.utils.js';
import { MediaFile } from '../local-media/media-file.entity.js';
import { RequestRule } from '../requests/request-rule.entity.js';
import { MediaRequest } from '../requests/request.entity.js';
import {
  hasEpisodePreference,
  preferenceOf,
  ReleaseSnapshot,
} from '../requests/torrent-preference.js';
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
  TorrentSelectionDto,
  TorrentStatus,
} from './downloads.dto.js';
import {
  DEFAULT_DOWNLOADS_SETTINGS,
  DOWNLOADS_SETTINGS_KEY,
} from './downloads.settings.js';
import { findEpisodeFile, findOnlyVideoFile } from './downloads.utils.js';
import { TorrentFile } from './torrent-engine.js';
import { TorrentRuntime } from './torrent-runtime.js';
import {
  decideTorrent,
  DemandState,
  retryDelay,
  TorrentDecision,
  torrentDemand,
} from './torrent.decide.js';
import { Torrent } from './torrent.entity.js';

const READ = { disableIdentityMap: true };

// How soon the index of a series that is looked at is brought in line with the disk
const SYNC_DELAY = 30_000;

const episodeKey = (e: EpisodeRefDto) => `${e.season}-${e.episode}`;

const exists = (filePath: string) =>
  stat(filePath).then(
    () => true,
    () => false,
  );

/** What a release resolves to, by the one thing that identifies it */
const releaseKey = (release: ReleaseSnapshot) =>
  release.infoHash ??
  release.magnetUrl ??
  release.downloadUrl ??
  release.releaseId;

/** A finished file of a torrent that a request wants, for the import */
export interface ImportTarget {
  sourcePath: string;
  infoHash: string;
  tmdbId: string;
  season: number;
  /** The episodes the file is, by its name or by the requests that want it */
  episodes: number[];
}

/**
 * Downloads what the requests want. The job of a title binds its activated
 * requests that have no file to the torrent their user prefers and hands
 * out the files that are in the library already; the job of a torrent
 * decides what the torrent does from the requests bound to it. A finished
 * file is imported by local media, which asks for it here.
 */
@Injectable()
export class DownloadsService implements OnModuleInit, OnApplicationBootstrap {
  private readonly logger = new Logger(DownloadsService.name);

  constructor(
    private readonly em: EntityManager,
    private readonly settingsService: SettingsService,
    private readonly indexersService: IndexersService,
    private readonly serverLog: ServerLogService,
    private readonly jobs: JobsService,
    private readonly runtime: TorrentRuntime,
  ) {}

  onModuleInit() {
    this.jobs.define('title.reconcile', {
      retry: true,
      run: (payload, context) => this.reconcileTitle(payload, context),
    });
    this.jobs.define('torrent.reconcile', {
      concurrency: 2,
      retry: true,
      run: ({ torrentId }, context) =>
        this.reconcileTorrent(torrentId, context),
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

  /** Where the requests and the preferred torrents of a user stand for a series */
  async getSeriesDownloads(
    userId: string,
    tmdbId: string,
  ): Promise<SeriesDownloadsDto> {
    const { requests, rules, files, torrents } = await this.em.transactional(
      (tx) => this.readSeries(tx, tmdbId),
    );
    // The index of the series is brought in line with the disk soon
    await this.jobs.enqueue(
      this.em,
      'title.sync',
      { mediaType: MediaType.Series, tmdbId },
      { runAt: new Date(Date.now() + SYNC_DELAY) },
    );
    const { cleanup } = await this.getSettings();
    const nextCleanup = getNextCleanup(new Date(), cleanup);

    const rule = rules.find((rule) => rule.userId === userId);
    const byHash = new Map(
      [...torrents.values()].map((torrent) => [torrent.infoHash, torrent]),
    );
    const held = new Set(requests.flatMap((r) => r.mediaFileId ?? []));
    const filesOf = (e: EpisodeRefDto) =>
      files.filter(
        (file) =>
          file.season === e.season &&
          file.episode <= e.episode &&
          e.episode <= file.lastEpisode,
      );
    const isCleanedUp = (e: EpisodeRefDto) => {
      const ofEpisode = filesOf(e);

      return (
        ofEpisode.length > 0 &&
        ofEpisode.every((file) => file.managed && !held.has(file.id))
      );
    };

    const onDisk = new Map<string, EpisodeRefDto>();
    for (const file of files) {
      for (let episode = file.episode; episode <= file.lastEpisode; episode++) {
        const ref = { season: file.season, episode };
        onDisk.set(episodeKey(ref), ref);
      }
    }
    const requested = new Map(
      requests
        .filter((request) => request.userId === userId)
        .map((request) => [episodeKey(request), request]),
    );
    const episodes = [
      ...requested.values(),
      ...[...onDisk.values()].filter((e) => !requested.has(episodeKey(e))),
    ];

    const selections: TorrentSelectionDto[] = [
      ...(rule?.seasonTorrents ?? []).map((t) => ({
        season: t.season,
        episode: 0,
        release: t.release,
      })),
      ...(rule?.episodeTorrents ?? []),
    ].map(({ season, episode, release }) => ({
      season,
      episode,
      releaseId: release.releaseId,
      torrent: this.describeRelease(release, byHash.get(release.infoHash)),
    }));

    return {
      selections: selections.sort(
        (a, b) => a.season - b.season || a.episode - b.episode,
      ),
      episodes: episodes
        .map((episode): EpisodeStatusDto => {
          const request = requested.get(episodeKey(episode));
          const torrent = torrents.get(request?.torrentId);

          return {
            season: episode.season,
            episode: episode.episode,
            requested: !!request,
            onDisk: onDisk.has(episodeKey(episode)),
            ...(request && this.describe(request, torrent, rule, files)),
            torrent: torrent && this.toTorrentDto(torrent),
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

  /**
   * A finished file of a torrent, for the import: where it is and what it is.
   * Nothing when the file is not whole or no request wants it any more.
   */
  async getImportTarget(
    torrentId: string,
    fileIndex: number,
  ): Promise<ImportTarget | undefined> {
    const snapshot = this.runtime.snapshot(torrentId);
    if (!snapshot?.ready || !snapshot.complete.has(fileIndex)) return undefined;

    const read = await this.em.transactional(async (tx) => {
      const torrent = await tx.findOne(Torrent, { id: torrentId }, READ);
      if (!torrent) return undefined;

      return {
        torrent,
        demand: torrentDemand(await this.readDemand(tx, torrent)),
      };
    });
    const wanted = read?.demand.wanted.find((w) => w.fileIndex === fileIndex);
    if (!wanted) return undefined;

    const numbers = parseEpisodeNumbers(snapshot.files[fileIndex].name);

    return {
      sourcePath: snapshot.filePath(fileIndex),
      infoHash: read.torrent.infoHash,
      tmdbId: wanted.tmdbId,
      season: wanted.season,
      episodes:
        numbers?.season === wanted.season ? numbers.episodes : wanted.episodes,
    };
  }

  /**
   * Gives an imported file to the requests of its torrent, in the
   * transaction that indexed it, and has the torrent decide again
   */
  async fileImported(
    tx: EntityManager,
    file: { torrentId: string; mediaType: MediaType; tmdbId: string },
  ): Promise<void> {
    if (file.mediaType === MediaType.Series) {
      await this.attachVersions(tx, file.tmdbId);
    }
    await this.jobs.enqueue(tx, 'torrent.reconcile', {
      torrentId: file.torrentId,
    });
  }

  /** Tells the requests that want a file that its import failed */
  async importFailed(
    torrentId: string,
    fileIndex: number,
    message: string,
  ): Promise<void> {
    await this.em.transactional(async (tx) => {
      const torrent = await tx.findOne(Torrent, { id: torrentId }, READ);
      if (!torrent) return;

      const state = await this.readDemand(tx, torrent);
      const demand = torrentDemand(state);
      const ids = state.requests
        .filter((request) => {
          const result = demand.requests.get(request.id);
          return result?.kind === 'wanted' && result.fileIndex === fileIndex;
        })
        .map((request) => request.id);
      if (ids.length) {
        await tx.nativeUpdate(
          MediaRequest,
          { id: { $in: ids } },
          { error: `Import failed: ${message}` },
        );
      }
    });
  }

  /**
   * Binds the activated requests of a title that have no file and no torrent
   * to the torrent their user prefers, gives the bound requests the files of
   * their torrents that are in the library, and has every torrent of the
   * title decide again, with the ones that no request refers to any more
   */
  private async reconcileTitle(
    { mediaType, tmdbId }: JobPayloads['title.reconcile'],
    context: JobContext,
  ): Promise<void> {
    if (mediaType !== MediaType.Series) return;

    const now = new Date();
    const { unbound, known: knownHashes } = await context.em.transactional(
      (tx) => this.readUnbound(tx, tmdbId, now),
    );
    // Resolving fetches .torrent files, outside any transaction
    const resolvedTorrentSources = new Map<string, TorrentSource | Error>();
    for (const { release } of unbound) {
      const key = releaseKey(release);
      if (resolvedTorrentSources.has(key) || knownHashes.has(release.infoHash))
        continue;

      resolvedTorrentSources.set(
        key,
        await this.indexersService
          .resolveTorrent(release)
          .catch((error: Error) => error),
      );
    }

    await context.em.transactional(async (tx) => {
      for (const { request, release } of unbound) {
        await this.bind(
          tx,
          request,
          release,
          resolvedTorrentSources.get(releaseKey(release)),
          now,
        );
      }
      await this.attachVersions(tx, tmdbId);

      const torrents: { id: string }[] = await tx.execute(
        `select id from torrent
         where id in (
           select torrent_id from request
           where media_type = '${MediaTypeFull.Episode}' and tmdb_id = ? and torrent_id is not null
         )
         or not exists (select 1 from request where request.torrent_id = torrent.id)`,
        [tmdbId],
      );
      for (const { id } of torrents) {
        await this.jobs.enqueue(tx, 'torrent.reconcile', { torrentId: id });
      }

      // A request whose torrent could not be resolved is tried again
      const next = await tx.findOne(
        MediaRequest,
        {
          mediaType: MediaTypeFull.Episode,
          tmdbId,
          torrentId: null,
          retryAt: { $gt: now },
        },
        { ...READ, fields: ['retryAt'], orderBy: { retryAt: 'asc' } },
      );
      if (next) {
        await this.jobs.enqueue(
          tx,
          'title.reconcile',
          { mediaType, tmdbId },
          { runAt: next.retryAt },
        );
      }
    });
  }

  /** The activated requests of a series without a file or a torrent, with what their user prefers */
  private async readUnbound(tx: EntityManager, tmdbId: string, now: Date) {
    const requests = await tx.find(
      MediaRequest,
      {
        mediaType: MediaTypeFull.Episode,
        tmdbId,
        approved: true,
        activatedAt: { $ne: null },
        torrentId: null,
        mediaFileId: null,
        $or: [{ retryAt: null }, { retryAt: { $lte: now } }],
      },
      READ,
    );
    const rules = requests.length
      ? await tx.find(
          RequestRule,
          {
            mediaType: MediaType.Series,
            tmdbId,
            userId: { $in: [...new Set(requests.map((r) => r.userId))] },
          },
          READ,
        )
      : [];
    const unbound = requests.flatMap((request) => {
      const rule = rules.find((rule) => rule.userId === request.userId);
      const release = preferenceOf(rule, request.season, request.episode);

      return release ? [{ request, release }] : [];
    });
    const hashes = unbound.flatMap(({ release }) => release.infoHash ?? []);
    const known = new Set(
      hashes.length
        ? (
            await tx.find(
              Torrent,
              { infoHash: { $in: hashes } },
              { ...READ, fields: ['infoHash'] },
            )
          ).map((torrent) => torrent.infoHash)
        : [],
    );

    return { unbound, known };
  }

  /** Binds a request to the torrent of its preference, or records why it could not be */
  private async bind(
    tx: EntityManager,
    request: MediaRequest,
    release: ReleaseSnapshot,
    resolved: TorrentSource | Error | undefined,
    now: Date,
  ): Promise<void> {
    const find = (infoHash: string) =>
      tx.findOne(Torrent, { infoHash }, { ...READ, fields: ['id'] });

    let torrent = release.infoHash ? await find(release.infoHash) : undefined;
    if (!torrent) {
      const failure = !resolved
        ? new Error('The release could not be resolved')
        : resolved instanceof Error
          ? resolved
          : undefined;
      if (failure) {
        const attempts = request.attempts + 1;
        const message = failure.message;
        this.logger.warn(`"${release.title}" was not resolved: ${message}`);
        await tx.nativeUpdate(
          MediaRequest,
          { id: request.id, torrentId: null },
          {
            error: message,
            attempts,
            retryAt: new Date(now.getTime() + retryDelay(attempts)),
          },
        );
        return;
      }

      const source = resolved as TorrentSource;
      // Another request of this run, or of another title, can have added it
      torrent = await find(source.infoHash);
      if (!torrent) {
        const row = new Torrent();
        row.infoHash = source.infoHash;
        row.title = release.title;
        row.indexer = release.indexer;
        row.size = release.size;
        row.magnetUrl = source.magnetUrl;
        row.torrentFile = source.torrentFile;
        row.files = source.files;
        await tx.insert(Torrent, { ...row });
        torrent = row;
      }
    }

    await tx.nativeUpdate(
      MediaRequest,
      { id: request.id, torrentId: null },
      { torrentId: torrent.id, error: null, attempts: 0, retryAt: null },
    );
  }

  /**
   * Gives every bound request of a series that has no file the version
   * imported from its torrent that covers its episode
   */
  private async attachVersions(tx: EntityManager, tmdbId: string) {
    const version = `
      select f.id from media_file f, torrent t
      where t.id = request.torrent_id and f.info_hash = t.info_hash
      and f.media_type = '${MediaType.Series}' and f.tmdb_id = request.tmdb_id
      and f.season = request.season
      and f.episode <= request.episode and request.episode <= f.last_episode
      order by f.path limit 1`;

    await tx.execute(
      `update request set media_file_id = (${version}), error = null
       where media_type = '${MediaTypeFull.Episode}' and tmdb_id = ?
       and media_file_id is null and torrent_id is not null
       and exists (${version})`,
      [tmdbId],
      'run',
    );
  }

  /** What a torrent does next, decided and done */
  private async reconcileTorrent(
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
          await this.jobs.enqueue(tx, 'file.import', { torrentId, fileIndex });
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
   * downloaded, and forgets it when no request refers to it
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
         and not exists (select 1 from request where torrent_id = torrent.id)`,
        [torrent.id],
        'run',
      );
    });
  }

  /** What the requests that are bound to a torrent want of it */
  private async readDemand(
    tx: EntityManager,
    torrent: Torrent,
  ): Promise<DemandState & { requests: MediaRequest[] }> {
    const requests = await tx.find(
      MediaRequest,
      { torrentId: torrent.id, mediaType: MediaTypeFull.Episode },
      READ,
    );
    const pairs = [
      ...new Map(requests.map((r) => [`${r.userId}/${r.tmdbId}`, r])).values(),
    ];
    const rules = pairs.length
      ? await tx.find(
          RequestRule,
          {
            mediaType: MediaType.Series,
            $or: pairs.map(({ userId, tmdbId }) => ({ userId, tmdbId })),
          },
          READ,
        )
      : [];
    const episodePreferences = rules.flatMap((rule) =>
      (rule.episodeTorrents ?? [])
        .filter((t) => t.release.infoHash === torrent.infoHash)
        .map((t) => ({
          userId: rule.userId,
          tmdbId: rule.tmdbId,
          season: t.season,
          episode: t.episode,
        })),
    );

    return { torrent, requests, episodePreferences };
  }

  /** Everything the status of a series is derived from, for every user */
  private async readSeries(tx: EntityManager, tmdbId: string) {
    const requests = await tx.find(
      MediaRequest,
      { mediaType: MediaTypeFull.Episode, tmdbId },
      READ,
    );
    const rules = await tx.find(
      RequestRule,
      { mediaType: MediaType.Series, tmdbId },
      READ,
    );
    const files = await tx.find(
      MediaFile,
      { mediaType: MediaType.Series, tmdbId },
      READ,
    );
    const preferred = rules.flatMap((rule) =>
      [...(rule.seasonTorrents ?? []), ...(rule.episodeTorrents ?? [])].flatMap(
        (t) => t.release.infoHash ?? [],
      ),
    );
    const torrents = await tx.find(
      Torrent,
      {
        $or: [
          { id: { $in: requests.flatMap((r) => r.torrentId ?? []) } },
          { infoHash: { $in: preferred } },
        ],
      },
      READ,
    );

    return {
      requests,
      rules,
      files,
      torrents: new Map(torrents.map((torrent) => [torrent.id, torrent])),
    };
  }

  /** Where the request of a user stands */
  private describe(
    request: MediaRequest,
    torrent: Torrent | undefined,
    rule: RequestRule | undefined,
    files: MediaFile[],
  ): Pick<EpisodeStatusDto, 'status' | 'progress' | 'error'> {
    if (!request.approved) {
      return { status: EpisodeDownloadStatus.WaitingForApproval };
    }
    if (!request.activatedAt) {
      return { status: EpisodeDownloadStatus.InactiveAhead };
    }
    if (files.some((file) => file.id === request.mediaFileId)) {
      return { status: EpisodeDownloadStatus.Available };
    }
    if (request.error) {
      return { status: EpisodeDownloadStatus.Failed, error: request.error };
    }
    if (!torrent) {
      return {
        status: preferenceOf(rule, request.season, request.episode)
          ? EpisodeDownloadStatus.Resolving
          : EpisodeDownloadStatus.NoSelection,
      };
    }

    const snapshot = this.runtime.snapshot(torrent.id);
    // A torrent that runs again after its backoff is no longer failed
    const failure = snapshot ? snapshot.error : torrent.error;
    if (failure) {
      return { status: EpisodeDownloadStatus.Failed, error: failure };
    }
    const torrentFiles = torrent.files ?? snapshot?.files;
    if (!torrentFiles) return { status: EpisodeDownloadStatus.Resolving };

    const wanted = this.wantedFile(torrent, torrentFiles, request, rule);
    if (!wanted) {
      return {
        status: EpisodeDownloadStatus.NoFileInTorrent,
        error: 'The torrent has no file for this episode',
      };
    }
    if (!snapshot?.ready) return { status: EpisodeDownloadStatus.Resolving };

    return {
      status: EpisodeDownloadStatus.Downloading,
      progress: snapshot.progress(wanted.index),
    };
  }

  /** The file of a torrent that a request downloads, as the demand finds it */
  private wantedFile(
    torrent: Torrent,
    files: TorrentFile[],
    request: MediaRequest,
    rule: RequestRule | undefined,
  ): TorrentFile | undefined {
    const { season, episode } = request;
    const isPreferredForEpisode =
      hasEpisodePreference(rule, season, episode) &&
      preferenceOf(rule, season, episode)?.infoHash === torrent.infoHash;

    return (
      findEpisodeFile(files, season, episode) ??
      (isPreferredForEpisode ? findOnlyVideoFile(files) : undefined)
    );
  }

  /** A preferred torrent: the row when a request downloads from it, else the release as picked */
  private describeRelease(
    release: ReleaseSnapshot,
    torrent: Torrent | undefined,
  ): TorrentDto {
    if (torrent) return this.toTorrentDto(torrent);

    return {
      infoHash: release.infoHash,
      title: release.title,
      indexer: release.indexer,
      size: release.size,
      downloadedBytes: 0,
      uploadedBytes: 0,
      status: TorrentStatus.Stopped,
      peers: 0,
      downloadSpeed: 0,
      uploadSpeed: 0,
    };
  }

  private toTorrentDto(torrent: Torrent): TorrentDto {
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
