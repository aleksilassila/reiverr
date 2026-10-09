import { MikroORM } from '@mikro-orm/sqlite';
import { CleanupSchedule } from '../downloads/downloads.dto.js';
import { DownloadsService } from '../downloads/downloads.service.js';
import { Job } from '../jobs/job.entity.js';
import { JobsService } from '../jobs/jobs.service.js';
import mikroOrmConfig from '../mikro-orm.config.js';
import { RequestsService } from '../requests/requests.service.js';
import { CleanupService } from './cleanup.service.js';
import { LocalMediaService } from './local-media.service.js';

describe('CleanupService', () => {
  let orm: MikroORM;
  let cleanupService: CleanupService;
  let cleanup: CleanupSchedule;

  const queued = async () =>
    (await orm.em.fork().find(Job, {}, { orderBy: { dedupeKey: 'asc' } })).map(
      (job) => [job.type, job.payload],
    );

  beforeEach(async () => {
    orm = await MikroORM.init({ ...mikroOrmConfig, dbName: ':memory:' });
    await orm.migrator.up();

    const localMedia = {
      getSettings: async () => ({
        movieFolders: ['/movies'],
        seriesFolders: ['/tv', '/anime'],
      }),
    };
    const downloads = {
      getSettings: async () => ({ seedRatio: 0, cleanup }),
    };
    cleanupService = new CleanupService(
      orm.em,
      new JobsService(orm.em),
      localMedia as unknown as LocalMediaService,
      downloads as unknown as DownloadsService,
      {} as RequestsService,
    );
  });

  afterEach(() => orm.close());

  it('queues a scan of every library folder every night, and the cleanup on cleanup days', async () => {
    cleanup = CleanupSchedule.Off;
    await cleanupService.onCleanupHour();

    expect(await queued()).toEqual([
      ['localMedia.scanFolder', { folder: '/anime' }],
      ['localMedia.scanFolder', { folder: '/movies' }],
      ['localMedia.scanFolder', { folder: '/tv' }],
    ]);

    // The scans that have not run yet are not queued twice
    cleanup = CleanupSchedule.Daily;
    await cleanupService.onCleanupHour();

    expect(await queued()).toEqual([
      ['localMedia.cleanUpLibrary', {}],
      ['localMedia.scanFolder', { folder: '/anime' }],
      ['localMedia.scanFolder', { folder: '/movies' }],
      ['localMedia.scanFolder', { folder: '/tv' }],
    ]);
  });
});
