import { EntityManager } from '@mikro-orm/sqlite';
import {
  Injectable,
  OnApplicationBootstrap,
  OnModuleInit,
} from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { MediaType, Title, titleOf } from '../common/common.dto.js';
import { DownloadsService } from '../downloads/downloads.service.js';
import { EventsService } from '../events/events.service.js';
import { JobContext, JobsService } from '../jobs/jobs.service.js';
import { MetadataService } from '../metadata/metadata.service.js';
import { isNeeded, mediaOf } from '../requests/requests.utils.js';
import { RequestsService } from '../requests/requests.service.js';
import { coversMedia, expectedBytes } from './library.utils.js';
import { MediaFile } from './media-file.entity.js';
import { FulfilmentError, RequestBinding } from './request-binding.entity.js';
import { StorageService } from './storage.service.js';

const READ = { disableIdentityMap: true };

/** What a binding is to say, in the columns that change */
interface BindingChange {
  torrentItemId: string | null;
  /** With a torrent item: what its download is expected to take */
  pendingBytes?: number | null;
  /** Unchanged when left out */
  mediaFileId?: string | null;
  error: FulfilmentError | null;
  /** With an error: the same for people to read */
  errorMessage?: string | null;
}

/** Bound to nothing, which is no binding at all */
const NOTHING: BindingChange = {
  torrentItemId: null,
  mediaFileId: null,
  error: null,
};

/** What a binding says of a request that does not fit the quota of its user, which keeps nothing */
const OVER_QUOTA: BindingChange = {
  torrentItemId: null,
  mediaFileId: null,
  error: FulfilmentError.OverQuota,
  errorMessage: 'Over quota',
};

/** What a binding says of a download that waits for room on a disk, which keeps nothing */
const DISK_FULL: BindingChange = {
  torrentItemId: null,
  mediaFileId: null,
  error: FulfilmentError.DiskFull,
  errorMessage: 'Disk full',
};

/**
 * Fulfils requests: gives an active request the file it wants from the
 * library, or has downloads get it, as far as the quota of its user and
 * the disk limit allow. The binding of a request is what it waits for or
 * has, and this service is its only writer. The job
 * `library.reconcileBinding` decides what a request gets, whatever changed;
 * the other writes react to one thing, in the transaction of what
 * happened: `filesForgotten` lets the bindings go of files the library
 * forgot, `itemImported` gives the file of an import to the bindings of
 * its torrent item, and `itemImportFailed` keeps the failure on them.
 * `library.sweepRequests` has every active request
 * that is bound to nothing looked at again, which is how a request that
 * was held back gets what it wants once there is room. Every write of a
 * binding tells the clients that show its title.
 */
@Injectable()
export class FulfilmentService implements OnModuleInit, OnApplicationBootstrap {
  constructor(
    private readonly em: EntityManager,
    private readonly jobs: JobsService,
    private readonly requestsService: RequestsService,
    private readonly downloadsService: DownloadsService,
    private readonly metadataService: MetadataService,
    private readonly storage: StorageService,
    private readonly events: EventsService,
  ) {}

  onModuleInit() {
    this.jobs.define('library.reconcileBinding', {
      concurrency: 4,
      run: ({ requestId }, context) =>
        this.reconcileBinding(requestId, context),
    });
    this.jobs.define('library.sweepRequests', {
      run: (payload, context) => this.sweep(context.em),
    });
  }

  /** A change that was made while the server was down has no job */
  onApplicationBootstrap(): Promise<void> {
    return this.sweepLater(this.em.fork());
  }

  /** Before the requests are reconciled at 03:50 */
  @Cron('40 3 * * *')
  sweepNightly(): Promise<void> {
    return this.sweepLater(this.em.fork());
  }

  /**
   * Has the sweep run, in the caller's transaction when it has one, when
   * room may have been made here: a binding let go of a file or a torrent item,
   * or an import settled what a request takes. The other services and
   * modules enqueue the job themselves when they delete files or data, or
   * set a quota or the disk limit.
   */
  private sweepLater(em: EntityManager): Promise<void> {
    return this.jobs.enqueue(em, 'library.sweepRequests', {});
  }

  /**
   * Has every request that wants a file and is bound to nothing looked at,
   * in user, title and episode order, and every binding whose request is
   * gone. A request that was held back by the quota of its user or by the
   * disk limit has only that error on its binding, so this is how it gets
   * what it wants once there is room.
   */
  async sweep(em: EntityManager = this.em.fork()): Promise<void> {
    await em.transactional(async (tx) => {
      const requests = await this.requestsService.findRequests(tx);
      const all = new Set(requests.map((request) => request.id));
      const bindings = await tx.find(RequestBinding, {}, READ);
      const attached = new Set(
        bindings
          .filter((binding) => !!binding.torrentItemId || !!binding.mediaFileId)
          .map((binding) => binding.requestId),
      );

      const toReconcile = new Set([
        ...requests
          .filter(isNeeded)
          .map((request) => request.id)
          .filter((requestId) => !attached.has(requestId)),
        ...bindings
          .map((binding) => binding.requestId)
          .filter((requestId) => !all.has(requestId)),
      ]);
      for (const requestId of toReconcile) {
        await this.jobs.enqueue(tx, 'library.reconcileBinding', { requestId });
      }
    });
  }

  /** How many requests hold a file, for every file that is held */
  async countByMediaFile(): Promise<Map<string, number>> {
    const bindings = await this.em.find(
      RequestBinding,
      { mediaFileId: { $ne: null } },
      { ...READ, fields: ['mediaFileId'] },
    );

    const counts = new Map<string, number>();
    for (const { mediaFileId } of bindings) {
      counts.set(mediaFileId, (counts.get(mediaFileId) ?? 0) + 1);
    }

    return counts;
  }

  /**
   * Brings the binding of a request in line with the request and its source.
   *
   * 1. Clear binding if request does not exist
   * 2. Clear torrent if request is not active
   * 3. If requests a file
   *      - record error and clear binding if file does not exist
   *      - else bind if user has quota for the file, else record why
   * 4. If requests a torrent
   *      - keep the bound file if it is from the torrent, or any bound file
   *        if the torrent is for the whole season
   *      - else bind the torrent's file in the library if user has quota for
   *        it, else record why
   *      - else keep the download if it is under way, else start it if user
   *        has quota and the disk is not full, else record why
   */
  private async reconcileBinding(
    requestId: string,
    context: JobContext,
  ): Promise<void> {
    // Read and measured outside the transaction: the settings are read
    // outside it, and the disk is not what the transaction keeps consistent
    const diskFull = await this.storage.isDiskFull();

    await context.em.transactional(async (tx) => {
      const request = await this.requestsService.readRequestWithSource(
        tx,
        requestId,
      );
      const binding =
        (await tx.findOne(RequestBinding, { requestId }, READ)) ?? undefined;
      const title = request
        ? titleOf(request)
        : await this.titleOfBinding(tx, binding);
      const write = (change: BindingChange) =>
        this.writeBinding(tx, requestId, binding, change, title);

      if (!request) {
        await this.releaseTorrentItemOf(tx, binding);
        await write(NOTHING);
        return;
      }

      const { source } = request;
      const isActive = isNeeded(request) && !!source;
      if (!isActive) {
        await this.releaseTorrentItemOf(tx, binding);
        // The file it has stays its own, unless the library forgot it
        const held = await this.heldFile(tx, binding);
        await write({
          torrentItemId: null,
          mediaFileId: held?.id ?? null,
          error: null,
        });
        return;
      }
      // The movie or the episode the request is for, as the files are keyed
      const media = mediaOf(request);

      if (source.kind === 'file') {
        const file = await tx.findOne(
          MediaFile,
          { id: source.mediaFileId },
          READ,
        );
        await this.releaseTorrentItemOf(tx, binding);
        if (!file || !coversMedia(file, media)) {
          await write({
            torrentItemId: null,
            mediaFileId: null,
            error: file
              ? FulfilmentError.FileNotOfMedia
              : FulfilmentError.FileNotInLibrary,
            errorMessage: !file
              ? 'The file is not in the library'
              : media.mediaType === MediaType.Movie
                ? 'The file is not of this movie'
                : 'The file is not of this episode',
          });
          return;
        }
        if (
          binding?.mediaFileId !== file.id &&
          !(await this.storage.fitsQuota(tx, request, file.size))
        ) {
          await write(OVER_QUOTA);
          return;
        }
        await write({ torrentItemId: null, mediaFileId: file.id, error: null });
        return;
      }

      // A file it has from this torrent is what it wants; a season's torrent
      // picked later replaces nothing that is on disk, an episode's or a
      // movie's does
      const { release } = source;
      const { infoHash } = release;
      const held = await this.heldFile(tx, binding);
      const keepsHeld =
        !!held &&
        coversMedia(held, media) &&
        (held.infoHash === infoHash || !source.forEpisode);
      if (keepsHeld) {
        await this.releaseTorrentItemOf(tx, binding);
        await write({
          torrentItemId: null,
          error: null,
        });
        return;
      }

      // A version from the torrent that is in the library already
      const version = await tx.findOne(
        MediaFile,
        {
          mediaType: media.mediaType,
          tmdbId: media.tmdbId,
          infoHash,
          season: media.season,
          episode: { $lte: media.episode },
          lastEpisode: { $gte: media.episode },
        },
        { ...READ, orderBy: { path: 'asc' } },
      );
      if (version) {
        await this.releaseTorrentItemOf(tx, binding);
        if (!(await this.storage.fitsQuota(tx, request, version.size))) {
          await write(OVER_QUOTA);
          return;
        }
        await write({
          torrentItemId: null,
          mediaFileId: version.id,
          error: null,
        });
        return;
      }

      // The torrent item of its source that it waits for is kept; a torrent
      // item it is to get is a download, gated by what the download is
      // expected to take
      const [waited] = binding?.torrentItemId
        ? await this.downloadsService.findTorrentItems(tx, [
            binding.torrentItemId,
          ])
        : [];
      const keepsTorrentItem =
        !!waited && waited.torrentHash === infoHash && !waited.releasedAt;
      let pendingBytes = binding?.pendingBytes ?? null;
      if (!keepsTorrentItem) {
        // A season's torrent is shared by its episodes
        const counts = source.forEpisode
          ? undefined
          : await this.metadataService.getEpisodeCounts(tx, media.tmdbId);
        const bytes = expectedBytes(
          release.size,
          source.forEpisode,
          counts?.get(media.season),
        );
        if (!(await this.storage.fitsQuota(tx, request, bytes))) {
          await this.releaseTorrentItemOf(tx, binding);
          await write(OVER_QUOTA);
          return;
        }
        if (diskFull) {
          await this.releaseTorrentItemOf(tx, binding);
          await write(DISK_FULL);
          return;
        }
        pendingBytes = bytes;
      }

      await this.downloadsService.getOrCreateTorrent(tx, release);
      const torrentItem = await this.downloadsService.requestTorrentItem(
        tx,
        infoHash,
        {
          ...media,
          onlyVideo: source.forEpisode,
        },
      );
      await this.releaseTorrentItemOf(tx, binding, torrentItem.id);
      await write({
        torrentItemId: torrentItem.id,
        pendingBytes,
        mediaFileId: null,
        // An import that failed is tried again by the torrent, not here
        ...(binding?.torrentItemId === torrentItem.id
          ? { error: binding.error ?? null, errorMessage: binding.errorMessage }
          : { error: null }),
      });
    });
  }

  /**
   * Lets the bindings go of files whose rows the library deletes, in that
   * transaction, and has their requests looked at again, so that they
   * download the files again. So a bound file always has its row.
   */
  async filesForgotten(
    tx: EntityManager,
    files: Pick<MediaFile, 'id' | 'mediaType' | 'tmdbId'>[],
  ): Promise<void> {
    const byId = new Map(files.map((file) => [file.id, file]));
    if (!byId.size) return;

    const bindings = await tx.find(
      RequestBinding,
      { mediaFileId: { $in: [...byId.keys()] } },
      READ,
    );
    for (const binding of bindings) {
      await this.writeBinding(
        tx,
        binding.requestId,
        binding,
        {
          torrentItemId: binding.torrentItemId ?? null,
          pendingBytes: binding.pendingBytes,
          mediaFileId: null,
          error: binding.error ?? null,
          errorMessage: binding.errorMessage,
        },
        titleOf(byId.get(binding.mediaFileId)),
      );
      await this.jobs.enqueue(tx, 'library.reconcileBinding', {
        requestId: binding.requestId,
      });
    }
  }

  /**
   * Gives the file an import placed to every request that waited for the
   * torrent item, and lets the torrent item go, in the import's transaction.
   * What the requests take is settled, which can be less than expected, so the
   * sweep runs.
   */
  async torrentItemImported(
    tx: EntityManager,
    torrentItemId: string,
    mediaFileId: string,
  ): Promise<void> {
    await tx.nativeUpdate(
      RequestBinding,
      { torrentItemId },
      {
        torrentItemId: null,
        pendingBytes: null,
        mediaFileId,
        error: null,
        errorMessage: null,
        updatedAt: new Date(),
      },
    );
    await this.downloadsService.releaseTorrentItem(tx, torrentItemId);
    await this.sweepLater(tx);
  }

  /** Keeps the failure of an import on the requests that wait for the torrent item, which the status shows */
  async torrentItemImportFailed(
    em: EntityManager,
    torrentItemId: string,
    message: string,
  ): Promise<void> {
    await em.nativeUpdate(
      RequestBinding,
      { torrentItemId },
      {
        error: FulfilmentError.ImportFailed,
        errorMessage: `Import failed: ${message}`,
        updatedAt: new Date(),
      },
    );
  }

  /** The title of what a binding refers to, for a request that is gone */
  private async titleOfBinding(
    tx: EntityManager,
    binding: RequestBinding | undefined,
  ): Promise<Title | undefined> {
    const file = await this.heldFile(tx, binding);
    if (file) return titleOf(file);
    const [torrentItem] = binding?.torrentItemId
      ? await this.downloadsService.findTorrentItems(tx, [
          binding.torrentItemId,
        ])
      : [];

    return torrentItem && titleOf(torrentItem);
  }

  /** The file a binding has, as long as its row is in the index */
  private async heldFile(
    tx: EntityManager,
    binding: RequestBinding | undefined,
  ): Promise<MediaFile | undefined> {
    if (!binding?.mediaFileId) return undefined;

    return (
      (await tx.findOne(MediaFile, { id: binding.mediaFileId }, READ)) ??
      undefined
    );
  }

  /** Lets go of the torrent item a binding waits for, unless it is kept or another request waits for it */
  private async releaseTorrentItemOf(
    tx: EntityManager,
    binding: RequestBinding | undefined,
    keptTorrentItemId?: string,
  ): Promise<void> {
    const torrentItemId = binding?.torrentItemId;
    if (!torrentItemId || torrentItemId === keptTorrentItemId) return;

    const others = await tx.count(RequestBinding, {
      torrentItemId,
      requestId: { $ne: binding.requestId },
    });
    if (!others)
      await this.downloadsService.releaseTorrentItem(tx, torrentItemId);
  }

  /**
   * Writes what a binding is to say, when that is not what it says, and
   * tells the clients that show the title. A binding that lets go of a
   * file or a torrent item may make room for a request that was held back, so
   * the sweep runs.
   */
  private async writeBinding(
    tx: EntityManager,
    requestId: string,
    current: RequestBinding | undefined,
    change: BindingChange,
    title: Title | undefined,
  ): Promise<void> {
    const next = {
      torrentItemId: change.torrentItemId,
      pendingBytes: change.torrentItemId ? (change.pendingBytes ?? null) : null,
      mediaFileId:
        change.mediaFileId === undefined
          ? (current?.mediaFileId ?? null)
          : change.mediaFileId,
      error: change.error,
      errorMessage: change.error ? (change.errorMessage ?? null) : null,
    };
    const isEmpty = !next.torrentItemId && !next.mediaFileId && !next.error;
    const letsGo =
      (!!current?.torrentItemId &&
        current.torrentItemId !== next.torrentItemId) ||
      (!!current?.mediaFileId && current.mediaFileId !== next.mediaFileId);

    if (!current) {
      if (isEmpty) return;
      await tx.insert(RequestBinding, {
        requestId,
        ...next,
        updatedAt: new Date(),
      });
      this.bindingChanged(title);
      return;
    }
    if (isEmpty) {
      await tx.nativeDelete(RequestBinding, { requestId });
      this.bindingChanged(title);
      if (letsGo) await this.sweepLater(tx);
      return;
    }
    const isSame =
      (current.torrentItemId ?? null) === next.torrentItemId &&
      (current.pendingBytes ?? null) === next.pendingBytes &&
      (current.mediaFileId ?? null) === next.mediaFileId &&
      (current.error ?? null) === next.error &&
      (current.errorMessage ?? null) === next.errorMessage;
    if (isSame) return;

    await tx.nativeUpdate(
      RequestBinding,
      { requestId },
      { ...next, updatedAt: new Date() },
    );
    this.bindingChanged(title);
    if (letsGo) await this.sweepLater(tx);
  }

  /** What the requests of users have of the title changed, which the pages of the title show */
  private bindingChanged(title: Title | undefined): void {
    if (title) this.events.emit({ type: 'library', data: title });
  }
}
