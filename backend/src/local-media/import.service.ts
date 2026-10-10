import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { MediaType } from '../common/common.dto.js';
import { DownloadsService } from '../downloads/downloads.service.js';
import { JobPayloads } from '../jobs/job-types.js';
import { JobContext, JobsService } from '../jobs/jobs.service.js';
import { LocalMediaService } from './local-media.service.js';

/** Puts the files that downloads finish into the library: the job `file.import` */
@Injectable()
export class ImportService implements OnModuleInit {
  private readonly logger = new Logger(ImportService.name);

  constructor(
    private readonly jobs: JobsService,
    private readonly localMediaService: LocalMediaService,
    private readonly downloadsService: DownloadsService,
  ) {}

  onModuleInit() {
    this.jobs.define('file.import', {
      concurrency: 2,
      retry: true,
      // A library that was not mounted is noticed soon after it is again
      maxRetryDelay: 5 * 60 * 1000,
      run: (payload, context) => this.import(payload, context),
    });
  }

  /**
   * Places a finished file in the library for the requests that want it, and
   * gives it to them. A file that is not whole any more, or that nothing
   * wants, is left where it is: the torrent decides again when it is.
   */
  private async import(
    { torrentId, fileIndex }: JobPayloads['file.import'],
    context: JobContext,
  ): Promise<void> {
    const target = await this.downloadsService.getImportTarget(
      torrentId,
      fileIndex,
    );
    if (!target) return;

    try {
      const placed = await this.localMediaService.placeEpisodeFile(target);
      await context.em.transactional(async (tx) => {
        await this.localMediaService.indexImportedFile(tx, placed);
        await this.downloadsService.fileImported(tx, {
          torrentId,
          mediaType: MediaType.Series,
          tmdbId: target.tmdbId,
        });
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await this.downloadsService
        .importFailed(torrentId, fileIndex, message)
        .catch((reason: Error) =>
          this.logger.error(`Recording the failure failed: ${reason.message}`),
        );
      throw error;
    }
  }
}
