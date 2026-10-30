import { EntityManager } from '@mikro-orm/sqlite';
import {
  Injectable,
  OnApplicationBootstrap,
  OnModuleInit,
} from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { MediaType } from '../common/common.dto.js';
import { DownloadsService } from '../downloads/downloads.service.js';
import { JobContext, JobsService } from '../jobs/jobs.service.js';
import { MetadataService } from '../metadata/metadata.service.js';
import { isNeeded, mediaOf } from '../requests/requests.utils.js';
import { RequestsService } from '../requests/requests.service.js';
import { coversMedia } from './library.utils.js';
import { MediaFile } from './media-file.entity.js';
import { RequestBinding } from './request-binding.entity.js';
import { expectedBytes, roomFor, StorageService } from './storage.service.js';

const READ = { disableIdentityMap: true };

/** What a binding is to say, in the columns that change */
interface BindingChange {
  torrentItemId: string | null;
  /** With an item: what its download is expected to take */
  pendingBytes?: number | null;
  /** Unchanged when left out */
  mediaFileId?: string | null;
  error: string | null;
}

/** Bound to nothing, which is no binding at all */
const NOTHING: BindingChange = {
  torrentItemId: null,
  mediaFileId: null,
  error: null,
};

/**
 * Fulfils requests: gives an active request the file it wants from the
 * library, or has downloads get it, as far as the quota of its user and
 * the disk limit allow. The binding of a request is what it waits for or
 * has, and this service is its only writer. The job
 * `library.reconcileRequest` decides what a request gets, whatever changed;
 * the other writes react to one thing, in the transaction of what
 * happened: `filesForgotten` lets the bindings go of files the library
 * forgot, `itemImported` gives the file of an import to the bindings of
 * its item, and `itemImportFailed` keeps the failure on them.
 * `library.sweepRequests` has every active request
 * that is bound to nothing looked at again, which is how a request that
 * was held back gets what it wants once there is room.
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
  ) {}

  onModuleInit() {
    this.jobs.define('library.reconcileRequest', {
      concurrency: 4,
      run: ({ requestId }, context) =>
        this.reconcileRequest(requestId, context),
    });
    this.jobs.define('library.sweepRequests', {
      run: (payload, context) => this.sweep(context.em),
    });
  }

  /** A change that was made while the server was down has no job */
  onApplicationBootstrap(): Promise<void> {
    return this.sweepLater(this.em.fork());
  }

  /** Before the rules are applied to everything at 03:50 */
  @Cron('40 3 * * *')
  sweepNightly(): Promise<void> {
    return this.sweepLater(this.em.fork());
  }

  /**
   * Has the sweep run, in the caller's transaction when it has one, when
   * room may have been made here: a binding let go of a file or an item,
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
   * disk limit is bound to nothing, so this is how it gets what it wants
   * once there is room.
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
        await this.jobs.enqueue(tx, 'library.reconcileRequest', { requestId });
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
   *      - else bind if user has quota for the file, else clear binding
   * 4. If requests a torrent
   *      - keep the bound file if it is from the torrent, or any bound file
   *        if the torrent is for the whole season
   *      - else bind the torrent's file in the library if user has quota for
   *        it, else clear binding
   *      - else record error and clear binding if the release is not known
   *      - else keep the download if it is under way, else start it if user
   *        has quota and the disk is not full, else clear binding
   */
  private async reconcileRequest(
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

      if (!request) {
        await this.releaseItemOf(tx, binding);
        await this.writeBinding(tx, requestId, binding, NOTHING);
        return;
      }

      const { source } = request;
      const isActive = isNeeded(request) && !!source;
      if (!isActive) {
        await this.releaseItemOf(tx, binding);
        // The file it has stays its own, unless the library forgot it
        const held = await this.heldFile(tx, binding);
        await this.writeBinding(tx, requestId, binding, {
          torrentItemId: null,
          mediaFileId: held?.id ?? null,
          error: null,
        });
        return;
      }
      const gate = await this.storage.gateOf(tx, request.userId, {
        diskFull,
        except: request.id,
      });
      // The movie or the episode the request is for, as the files are keyed
      const media = mediaOf(request);

      if (source.kind === 'file') {
        const file = await tx.findOne(
          MediaFile,
          { id: source.mediaFileId },
          READ,
        );
        await this.releaseItemOf(tx, binding);
        if (!file || !coversMedia(file, media)) {
          await this.writeBinding(tx, requestId, binding, {
            torrentItemId: null,
            mediaFileId: null,
            error: !file
              ? 'The file is not in the library'
              : media.mediaType === MediaType.Movie
                ? 'The file is not of this movie'
                : 'The file is not of this episode',
          });
          return;
        }
        const room =
          binding?.mediaFileId === file.id
            ? 'ok'
            : roomFor(gate, { bytes: file.size, download: false });
        await this.writeBinding(
          tx,
          requestId,
          binding,
          room === 'ok'
            ? { torrentItemId: null, mediaFileId: file.id, error: null }
            : NOTHING,
        );
        return;
      }

      // A file it has from this torrent is what it wants; a season's torrent
      // picked later replaces nothing that is on disk, an episode's or a
      // movie's does
      const { infoHash } = source;
      const held = await this.heldFile(tx, binding);
      const keepsHeld =
        !!held &&
        coversMedia(held, media) &&
        (held.infoHash === infoHash || !source.forEpisode);
      if (keepsHeld) {
        await this.releaseItemOf(tx, binding);
        await this.writeBinding(tx, requestId, binding, {
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
        await this.releaseItemOf(tx, binding);
        const room = roomFor(gate, { bytes: version.size, download: false });
        await this.writeBinding(
          tx,
          requestId,
          binding,
          room === 'ok'
            ? { torrentItemId: null, mediaFileId: version.id, error: null }
            : NOTHING,
        );
        return;
      }

      const [release] = await this.requestsService.findSelectedReleases(tx, [
        infoHash,
      ]);
      if (!release) {
        await this.releaseItemOf(tx, binding);
        await this.writeBinding(tx, requestId, binding, {
          torrentItemId: null,
          mediaFileId: null,
          error: 'The release is not known any more',
        });
        return;
      }

      // The item of its source that it waits for is kept; an item it is to
      // get is a download, gated by what the download is expected to take
      const [waited] = binding?.torrentItemId
        ? await this.downloadsService.findItems(tx, [binding.torrentItemId])
        : [];
      const keepsItem =
        !!waited && waited.torrentHash === infoHash && !waited.releasedAt;
      let pendingBytes = binding?.pendingBytes ?? null;
      if (!keepsItem) {
        // A season's torrent is shared by its episodes; a movie's is the movie
        const counts =
          media.mediaType === MediaType.Series
            ? await this.metadataService.getEpisodeCounts(tx, media.tmdbId)
            : undefined;
        const bytes = expectedBytes(
          release.size,
          source.forEpisode,
          counts?.get(media.season),
        );
        const room = roomFor(gate, { bytes, download: true });
        if (room !== 'ok') {
          await this.releaseItemOf(tx, binding);
          await this.writeBinding(tx, requestId, binding, NOTHING);
          return;
        }
        pendingBytes = bytes;
      }

      await this.downloadsService.ensureTorrent(tx, release);
      const item = await this.downloadsService.requestItem(tx, infoHash, {
        ...media,
        onlyVideo: source.forEpisode,
      });
      await this.releaseItemOf(tx, binding, item.id);
      await this.writeBinding(tx, requestId, binding, {
        torrentItemId: item.id,
        pendingBytes,
        mediaFileId: null,
        // An import that failed is tried again by the torrent, not here
        error:
          binding?.torrentItemId === item.id ? (binding.error ?? null) : null,
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
    files: Pick<MediaFile, 'id'>[],
  ): Promise<void> {
    const ids = files.map((file) => file.id);
    if (!ids.length) return;

    const bindings = await tx.find(
      RequestBinding,
      { mediaFileId: { $in: ids } },
      READ,
    );
    for (const binding of bindings) {
      await this.writeBinding(tx, binding.requestId, binding, {
        torrentItemId: binding.torrentItemId ?? null,
        pendingBytes: binding.pendingBytes,
        mediaFileId: null,
        error: binding.error ?? null,
      });
      await this.jobs.enqueue(tx, 'library.reconcileRequest', {
        requestId: binding.requestId,
      });
    }
  }

  /**
   * Gives the file an import placed to every request that waited for the
   * item, and lets the item go, in the import's transaction. What the
   * requests take is settled, which can be less than expected, so the
   * sweep runs.
   */
  async itemImported(
    tx: EntityManager,
    itemId: string,
    mediaFileId: string,
  ): Promise<void> {
    await tx.nativeUpdate(
      RequestBinding,
      { torrentItemId: itemId },
      {
        torrentItemId: null,
        pendingBytes: null,
        mediaFileId,
        error: null,
        updatedAt: new Date(),
      },
    );
    await this.downloadsService.releaseItem(tx, itemId);
    await this.sweepLater(tx);
  }

  /** Keeps the failure of an import on the requests that wait for the item, which the status shows */
  async itemImportFailed(
    em: EntityManager,
    itemId: string,
    message: string,
  ): Promise<void> {
    await em.nativeUpdate(
      RequestBinding,
      { torrentItemId: itemId },
      { error: `Import failed: ${message}`, updatedAt: new Date() },
    );
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

  /** Lets go of the item a binding waits for, unless it is kept or another request waits for it */
  private async releaseItemOf(
    tx: EntityManager,
    binding: RequestBinding | undefined,
    keptItemId?: string,
  ): Promise<void> {
    const itemId = binding?.torrentItemId;
    if (!itemId || itemId === keptItemId) return;

    const others = await tx.count(RequestBinding, {
      torrentItemId: itemId,
      requestId: { $ne: binding.requestId },
    });
    if (!others) await this.downloadsService.releaseItem(tx, itemId);
  }

  /**
   * Writes what a binding is to say, when that is not what it says. A
   * binding that lets go of a file or an item may make room for a request
   * that was held back, so the sweep runs.
   */
  private async writeBinding(
    tx: EntityManager,
    requestId: string,
    current: RequestBinding | undefined,
    change: BindingChange,
  ): Promise<void> {
    const next = {
      torrentItemId: change.torrentItemId,
      pendingBytes: change.torrentItemId ? (change.pendingBytes ?? null) : null,
      mediaFileId:
        change.mediaFileId === undefined
          ? (current?.mediaFileId ?? null)
          : change.mediaFileId,
      error: change.error,
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
      return;
    }
    if (isEmpty) {
      await tx.nativeDelete(RequestBinding, { requestId });
      if (letsGo) await this.sweepLater(tx);
      return;
    }
    const isSame =
      (current.torrentItemId ?? null) === next.torrentItemId &&
      (current.pendingBytes ?? null) === next.pendingBytes &&
      (current.mediaFileId ?? null) === next.mediaFileId &&
      (current.error ?? null) === next.error;
    if (isSame) return;

    await tx.nativeUpdate(
      RequestBinding,
      { requestId },
      { ...next, updatedAt: new Date() },
    );
    if (letsGo) await this.sweepLater(tx);
  }
}
