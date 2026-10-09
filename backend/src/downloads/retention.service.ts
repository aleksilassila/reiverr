import { EntityManager } from '@mikro-orm/sqlite';
import {
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { MediaType, MediaTypeFull } from '../common/common.dto.js';
import { JobsService } from '../jobs/jobs.service.js';
import { DeletedLibraryEntriesDto } from '../local-media/local-media.dto.js';
import { LocalMediaService } from '../local-media/local-media.service.js';
import { MediaFile } from '../local-media/media-file.entity.js';
import { evaluateActivity } from '../requests/request-activity.js';
import { RequestRule } from '../requests/request-rule.entity.js';
import { RequestsService } from '../requests/requests.service.js';
import { MediaRequest } from '../requests/request.entity.js';
import { PlayState } from '../user-data/play-state/play-state.entity.js';
import { CLEANUP_HOUR, isCleanupDay } from './cleanup.utils.js';
import { DownloadsService } from './downloads.service.js';
import { heldFiles, Holdings, requestsOfFiles } from './retention.js';
import { Torrent } from './torrent.entity.js';

const READ = { disableIdentityMap: true };

/**
 * What the library keeps: the cleanup of the files that no request holds, and
 * the deletion of files by an admin together with the requests they fulfil
 */
@Injectable()
export class RetentionService implements OnModuleInit {
  private readonly logger = new Logger(RetentionService.name);

  constructor(
    private readonly em: EntityManager,
    private readonly jobs: JobsService,
    private readonly localMediaService: LocalMediaService,
    private readonly downloadsService: DownloadsService,
    private readonly requestsService: RequestsService,
  ) {}

  onModuleInit() {
    // A cleanup that did not run at 04:00 waits for the next one
    this.jobs.define('library.cleanup', {
      dropAtRestart: true,
      run: (payload, { em }) => this.enqueueTitleCleanups(em),
    });
    this.jobs.define('title.cleanup', {
      dropAtRestart: true,
      run: ({ tmdbId }) => this.cleanUpSeries(tmdbId),
    });
  }

  /**
   * The nightly jobs: a scan of every library folder, and the cleanup on a
   * cleanup day. Nothing makes the cleanup wait for the scans.
   */
  @Cron(`0 ${CLEANUP_HOUR} * * *`)
  async onCleanupHour(): Promise<void> {
    const { movieFolders, seriesFolders } =
      await this.localMediaService.getSettings();
    const { cleanup } = await this.downloadsService.getSettings();
    const isCleanup = isCleanupDay(new Date(), cleanup);

    await this.em.fork().transactional(async (tx) => {
      for (const folder of [...seriesFolders, ...movieFolders]) {
        await this.jobs.enqueue(tx, 'library.scan', { folder });
      }
      if (isCleanup) await this.jobs.enqueue(tx, 'library.cleanup', {});
    });
  }

  /**
   * Deletes what an admin selected in a library folder, and with it the
   * requests that have the deleted files, which would download them again.
   * The requests are found before anything is deleted, so that a sync that
   * forgets the rows meanwhile does not keep them.
   */
  async deleteLibraryEntries(
    folder: string,
    paths: string[],
    reason: string,
  ): Promise<DeletedLibraryEntriesDto> {
    const files = await this.localMediaService.findLibraryFiles(folder, paths);
    const before = await this.findRequestsOfFiles(files);

    const { deleted, failed } =
      await this.localMediaService.deleteLibraryEntries(
        folder,
        paths,
        reason,
        async (tx, gone) => {
          const goneIds = new Set(gone.map((file) => file.id));
          const requests = await tx.find(
            MediaRequest,
            {
              $or: [
                { id: { $in: [...before.keys()] } },
                { mediaFileId: { $in: [...goneIds] } },
              ],
            },
            READ,
          );
          // A request that a selection bound again since keeps going
          const toDelete = requests.filter((request) => {
            if (goneIds.has(request.mediaFileId)) return true;

            const found = before.get(request.id);
            return (
              !!found &&
              goneIds.has(found.fileId) &&
              !request.mediaFileId &&
              request.torrentId === found.torrentId
            );
          });

          // What the other requests of their series want changes too
          await this.requestsService.enqueueTorrentsOfPairs(tx, toDelete);
          await this.requestsService.enqueueTorrentsOfFiles(tx, [...goneIds]);
          if (toDelete.length) {
            await tx.nativeDelete(MediaRequest, {
              id: { $in: toDelete.map((request) => request.id) },
            });
          }
        },
      );

    return { deleted, failed };
  }

  private async enqueueTitleCleanups(em: EntityManager): Promise<void> {
    const titles = await this.localMediaService.findTitlesWithManagedFiles(
      MediaType.Series,
    );

    await em.transactional(async (tx) => {
      for (const tmdbId of titles) {
        await this.jobs.enqueue(tx, 'title.cleanup', {
          mediaType: MediaType.Series,
          tmdbId,
        });
      }
    });
  }

  /**
   * Deletes the imported files of a series that no request holds. A file
   * that cannot be deleted is left for the next cleanup.
   */
  private async cleanUpSeries(tmdbId: string): Promise<void> {
    const holdings = await this.em.transactional((tx) =>
      this.readHoldings(tx, tmdbId),
    );
    const held = heldFiles(holdings);
    const unheld = holdings.files.filter(
      (file) => file.managed && !held.has(file.id),
    );

    let failed = 0;
    for (const file of unheld) {
      await this.localMediaService
        .deleteManagedFile(file.id, 'no request holds it', (tx, files) =>
          this.requestsService.enqueueTorrentsOfFiles(
            tx,
            files.map((file) => file.id),
          ),
        )
        .catch((error) => {
          // An admin deleted it meanwhile
          if (error instanceof NotFoundException) return;

          failed++;
          this.logger.warn(`Could not delete "${file.path}": ${error.message}`);
        });
    }

    if (failed) {
      throw new Error(`${failed} of ${unheld.length} files were not deleted`);
    }
  }

  /** The requests whose file is one of the given ones, by request id */
  private async findRequestsOfFiles(files: MediaFile[]) {
    const fileIds = new Set(files.map((file) => file.id));
    const series = new Set(
      files
        .filter((file) => file.mediaType === MediaType.Series)
        .map((file) => file.tmdbId),
    );

    return this.em.transactional(async (tx) => {
      const found = new Map<string, { torrentId?: string; fileId: string }>();
      for (const tmdbId of series) {
        const holdings = await this.readHoldings(tx, tmdbId);
        for (const [id, request] of requestsOfFiles(holdings, fileIds)) {
          found.set(id, request);
        }
      }
      // Movie requests only refer to their files
      const referring = await tx.find(
        MediaRequest,
        { mediaFileId: { $in: [...fileIds] } },
        READ,
      );
      for (const request of referring) {
        if (found.has(request.id)) continue;
        found.set(request.id, {
          torrentId: request.torrentId,
          fileId: request.mediaFileId,
        });
      }

      return found;
    });
  }

  /** Everything that decides which files of a series its requests hold */
  private async readHoldings(
    tx: EntityManager,
    tmdbId: string,
  ): Promise<Holdings<MediaFile>> {
    const requests = await tx.find(
      MediaRequest,
      { mediaType: MediaTypeFull.Episode, tmdbId },
      READ,
    );
    const rules = await tx.find(RequestRule, { tmdbId }, READ);
    const playStates = rules.length
      ? await tx.find(
          PlayState,
          {
            mediaType: MediaTypeFull.Episode,
            tmdbId,
            userId: { $in: rules.map((rule) => rule.userId) },
          },
          READ,
        )
      : [];
    const torrents = await tx.find(
      Torrent,
      { id: { $in: requests.flatMap((request) => request.torrentId ?? []) } },
      { ...READ, fields: ['id', 'infoHash'] },
    );
    const files = await tx.find(
      MediaFile,
      { mediaType: MediaType.Series, tmdbId },
      READ,
    );

    return {
      requests,
      activity: evaluateActivity({
        requests,
        rules,
        playStates,
        now: Date.now(),
      }),
      infoHashes: new Map(
        torrents.map((torrent) => [torrent.id, torrent.infoHash]),
      ),
      files,
    };
  }
}
