import { MikroORM } from '@mikro-orm/sqlite';
import { Job } from '../jobs/job.entity.js';
import { JobsService } from '../jobs/jobs.service.js';
import { LocalMediaService } from '../local-media/local-media.service.js';
import mikroOrmConfig from '../mikro-orm.config.js';
import { RequestsService } from '../requests/requests.service.js';
import { CleanupSchedule } from './downloads.dto.js';
import { DownloadsService } from './downloads.service.js';
import { RetentionService } from './retention.service.js';

describe('RetentionService', () => {
  let orm: MikroORM;
  let retention: RetentionService;
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
    retention = new RetentionService(
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
    await retention.onCleanupHour();

    expect(await queued()).toEqual([
      ['library.scan', { folder: '/anime' }],
      ['library.scan', { folder: '/movies' }],
      ['library.scan', { folder: '/tv' }],
    ]);

    // The scans that have not run yet are not queued twice
    cleanup = CleanupSchedule.Daily;
    await retention.onCleanupHour();

    expect(await queued()).toEqual([
      ['library.cleanup', {}],
      ['library.scan', { folder: '/anime' }],
      ['library.scan', { folder: '/movies' }],
      ['library.scan', { folder: '/tv' }],
    ]);
  });
});
