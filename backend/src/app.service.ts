import { EntityManager } from '@mikro-orm/sqlite';
import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { DownloadsService } from './downloads/downloads.service.js';
import { JobsService } from './jobs/jobs.service.js';
import { DeletionService } from './library/deletion.service.js';
import { ScanService } from './library/scan.service.js';
import { RequestsService } from './requests/requests.service.js';
import { ServerLogService } from './server-log/server-log.service.js';
import { TitleStateService } from './user-data/title-state.service.js';

/**
 * The upkeep of the server in one place: what runs at boot and every night,
 * in the order it runs. The work itself is the modules'.
 */
@Injectable()
export class AppService implements OnApplicationBootstrap {
  private readonly logger = new Logger(AppService.name);

  constructor(
    private readonly em: EntityManager,
    private readonly jobs: JobsService,
    private readonly titleStates: TitleStateService,
    private readonly requests: RequestsService,
    private readonly deletion: DeletionService,
    private readonly scan: ScanService,
    private readonly serverLog: ServerLogService,
    private readonly downloads: DownloadsService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    // The requests can be behind after a restart or a migration
    await this.requests.reconcileAllRequests();
    // A change that was made while the server was down has no job
    await this.enqueueLibrarySweep();
    // Engine handles live in memory, so every torrent decides again
    await this.downloads.enqueueEveryTorrent(this.em.fork());
    // Not awaited: the documents are refreshed on the way, which takes a while
    this.titleStates
      .stampAll()
      .catch((e) =>
        this.logger.error(`Failed to stamp the next episodes: ${e.message}`),
      );
  }

  /** Before the cleanup hour: the requests this deletes let go of their files by then, so the files go tonight */
  @Cron('50 3 * * *')
  preNightly(): Promise<void> {
    return this.runSteps({
      'reconcile requests': () => this.requests.reconcileAllRequests(),
      'library sweep': () => this.enqueueLibrarySweep(),
    });
  }

  @Cron('0 4 * * *')
  nightly(): Promise<void> {
    return this.runSteps({
      cleanup: () => this.deletion.onCleanupHour(),
      scans: () => this.scan.scanNightly(),
      'purge jobs': () => this.jobs.purge(),
      'purge server log': () => this.serverLog.purge(),
      'purge torrents': () => this.downloads.purgeTorrents(),
      // Last: the documents are refreshed on the way, which takes a while
      'stamp next episodes': () => this.titleStates.stampAll(),
    });
  }

  private enqueueLibrarySweep(): Promise<void> {
    return this.jobs.enqueue(this.em.fork(), 'library.sweepRequests', {});
  }

  /** One after the other: a step that fails is logged and does not stop the rest */
  private async runSteps(
    steps: Record<string, () => Promise<unknown>>,
  ): Promise<void> {
    for (const [name, run] of Object.entries(steps)) {
      try {
        await run();
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        this.logger.error(`Nightly ${name} failed: ${message}`);
      }
    }
  }
}
