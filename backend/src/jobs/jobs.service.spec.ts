import { MikroORM } from '@mikro-orm/sqlite';
import { Logger } from '@nestjs/common';
import { MediaType } from '../common/common.dto.js';
import mikroOrmConfig from '../mikro-orm.config.js';
import { Job, JobStatus } from './job.entity.js';
import { JobsService, retryDelay } from './jobs.service.js';

const MINUTE = 60 * 1000;

describe('JobsService', () => {
  let orm: MikroORM;
  let jobs: JobsService;

  vi.spyOn(Logger.prototype, 'warn').mockImplementation(() => {});

  const all = () =>
    orm.em.fork().find(Job, {}, { orderBy: { createdAt: 'asc' } });
  const cleanup = (tmdbId: string) => ({
    mediaType: MediaType.Series,
    tmdbId,
  });

  beforeEach(async () => {
    orm = await MikroORM.init({ ...mikroOrmConfig, dbName: ':memory:' });
    await orm.migrator.up();
    jobs = new JobsService(orm.em);
  });

  afterEach(async () => {
    await jobs.onModuleDestroy();
    await orm.close();
  });

  it('runs a job with its payload in an entity manager of its own', async () => {
    const run = vi.fn(async () => {});
    jobs.define('title.cleanup', { run });

    await jobs.enqueue(orm.em.fork(), 'title.cleanup', cleanup('1'));
    await jobs.drain();

    expect(run).toHaveBeenCalledWith(
      cleanup('1'),
      expect.objectContaining({
        job: expect.objectContaining({ lockKey: 'media:series:1' }),
      }),
    );
    expect(run.mock.calls[0][1].em).not.toBe(orm.em);
    expect(await all()).toEqual([]);
  });

  it('refuses a type that is defined twice', () => {
    jobs.define('library.cleanup', { run: async () => {} });

    expect(() =>
      jobs.define('library.cleanup', { run: async () => {} }),
    ).toThrow('defined already');
  });

  it('queues one job per key with the earlier of the run times', async () => {
    const em = orm.em.fork();
    const later = new Date(Date.now() + 10 * MINUTE);
    const sooner = new Date(Date.now() + 5 * MINUTE);

    await jobs.enqueue(em, 'title.cleanup', cleanup('1'), { runAt: later });
    await jobs.enqueue(em, 'title.cleanup', cleanup('1'), { runAt: sooner });
    await jobs.enqueue(em, 'title.cleanup', cleanup('1'), { runAt: later });
    await jobs.enqueue(em, 'title.cleanup', cleanup('2'));

    expect((await all()).map((job) => [job.dedupeKey, job.runAt])).toEqual([
      ['cleanup:series:1', sooner],
      ['cleanup:series:2', expect.any(Date)],
    ]);
  });

  it('commits and rolls back a job with the transaction of the caller', async () => {
    await orm.em.fork().transactional(async (tx) => {
      await jobs.enqueue(tx, 'title.cleanup', cleanup('1'));
    });
    await orm.em
      .fork()
      .transactional(async (tx) => {
        await jobs.enqueue(tx, 'title.cleanup', cleanup('2'));
        throw new Error('rolled back');
      })
      .catch(() => {});

    expect((await all()).map((job) => job.dedupeKey)).toEqual([
      'cleanup:series:1',
    ]);
  });

  it('refuses an entity manager outside the transaction that is running', async () => {
    await orm.em.fork().transactional(async () => {
      expect(() =>
        jobs.enqueue(orm.em.fork(), 'title.cleanup', cleanup('1')),
      ).toThrow('outside the transaction');
    });
  });

  it('runs what the jobs enqueue, and leaves the jobs that are not due', async () => {
    const ran: string[] = [];
    jobs.define('library.cleanup', {
      run: async (payload, { em }) => {
        ran.push('library');
        await jobs.enqueue(em, 'title.cleanup', cleanup('1'));
        await jobs.enqueue(em, 'title.cleanup', cleanup('2'), {
          runAt: new Date(Date.now() + MINUTE),
        });
      },
    });
    jobs.define('title.cleanup', {
      run: async ({ tmdbId }) => {
        ran.push(tmdbId);
      },
    });

    await jobs.enqueue(orm.em.fork(), 'library.cleanup', {});
    await jobs.drain();

    expect(ran).toEqual(['library', '1']);
    expect((await all()).map((job) => job.dedupeKey)).toEqual([
      'cleanup:series:2',
    ]);
  });

  it('runs one job per lock key and as many of a type as it allows', async () => {
    let running = 0;
    let most = 0;
    const run = async () => {
      most = Math.max(most, ++running);
      await new Promise((resolve) => setTimeout(resolve, 5));
      running--;
    };
    jobs.define('torrent.import', { concurrency: 2, run });

    const em = orm.em.fork();
    // Two files of one torrent, then one of each of two others
    for (const [torrentId, fileIndex] of [
      ['a', 0],
      ['a', 1],
      ['b', 0],
      ['c', 0],
    ] as const) {
      await jobs.enqueue(em, 'torrent.import', { torrentId, fileIndex });
    }
    await jobs.drain();

    expect(most).toBe(2);
    expect(await all()).toEqual([]);
  });

  it('queues a job that may retry again with a growing delay', async () => {
    jobs.define('torrent.reconcile', {
      retry: true,
      run: async () => {
        throw new Error('library not mounted');
      },
    });
    await jobs.enqueue(orm.em.fork(), 'torrent.reconcile', { torrentId: 'a' });

    const before = Date.now();
    await jobs.drain();

    const [job] = await all();
    expect(job).toMatchObject({
      status: JobStatus.Queued,
      attempts: 1,
      error: 'library not mounted',
    });
    expect(job.runAt.getTime()).toBeGreaterThanOrEqual(before + MINUTE);
    expect([1, 2, 3, 7, 8].map(retryDelay)).toEqual([
      MINUTE,
      2 * MINUTE,
      4 * MINUTE,
      60 * MINUTE,
      60 * MINUTE,
    ]);
  });

  it('merges a retry into the copy that was enqueued while the job ran', async () => {
    let calls = 0;
    jobs.define('torrent.reconcile', {
      retry: true,
      run: async (payload, { em }) => {
        calls++;
        if (calls > 1) return;

        await jobs.enqueue(em, 'torrent.reconcile', payload);
        throw new Error('failed once');
      },
    });
    await jobs.enqueue(orm.em.fork(), 'torrent.reconcile', { torrentId: 'a' });

    await jobs.drain();

    // The copy kept its run time, ran at once and succeeded
    expect(calls).toBe(2);
    expect(await all()).toEqual([]);
  });

  it('fails a job that may not retry, and keeps the newest failure of a key', async () => {
    let fail = true;
    jobs.define('title.cleanup', {
      run: async () => {
        if (fail) throw new Error('unlink failed');
      },
    });
    const em = orm.em.fork();

    await jobs.enqueue(em, 'title.cleanup', cleanup('1'));
    await jobs.drain();
    await jobs.enqueue(em, 'title.cleanup', cleanup('1'));
    await jobs.drain();

    expect(await all()).toMatchObject([
      { status: JobStatus.Failed, error: 'unlink failed', attempts: 1 },
    ]);

    // A success clears the failure of its key
    fail = false;
    await jobs.enqueue(em, 'title.cleanup', cleanup('1'));
    await jobs.drain();
    expect(await all()).toEqual([]);
  });

  it('claims nothing of a paused type until it is resumed', async () => {
    const run = vi.fn(async () => {});
    jobs.define('library.cleanup', { run });
    await jobs.enqueue(orm.em.fork(), 'library.cleanup', {});

    const resume = jobs.pause('library.cleanup');
    await jobs.drain();
    expect(run).not.toHaveBeenCalled();

    resume();
    await jobs.drain();
    expect(run).toHaveBeenCalledTimes(1);
  });

  it('fails the jobs that a restart interrupted', async () => {
    await orm.em.fork().insert(Job, {
      ...new Job(),
      type: 'library.cleanup',
      dedupeKey: 'cleanup',
      lockKey: 'cleanup',
      status: JobStatus.Running,
    });

    await jobs.start();

    expect(await all()).toMatchObject([
      { status: JobStatus.Failed, error: 'Interrupted by a restart' },
    ]);
  });

  it('keeps only the interrupted failure of a key at a restart', async () => {
    jobs.define('title.cleanup', {
      run: async () => {
        throw new Error('unlink failed');
      },
    });
    await jobs.enqueue(orm.em.fork(), 'title.cleanup', cleanup('1'));
    await jobs.drain();
    await orm.em.fork().insert(Job, {
      ...new Job(),
      type: 'title.cleanup',
      dedupeKey: 'cleanup:series:1',
      lockKey: 'media:series:1',
      status: JobStatus.Running,
    });

    await jobs.start();

    expect(await all()).toMatchObject([
      { status: JobStatus.Failed, error: 'Interrupted by a restart' },
    ]);
  });

  it('fails a job that rejects with something that is not an error', async () => {
    jobs.define('torrent.reconcile', {
      retry: true,
      run: () => Promise.reject(undefined),
    });
    await jobs.enqueue(orm.em.fork(), 'torrent.reconcile', { torrentId: 'a' });

    await jobs.drain();

    expect(await all()).toMatchObject([
      { status: JobStatus.Queued, error: 'undefined', attempts: 1 },
    ]);
  });

  it('fails the queued jobs of a type that does not wait across a restart', async () => {
    const cleaned = vi.fn(async () => {});
    let reconciled: () => void;
    const reconcile = new Promise<void>((resolve) => (reconciled = resolve));
    jobs.define('title.cleanup', { dropAtRestart: true, run: cleaned });
    jobs.define('torrent.reconcile', { run: async () => reconciled() });
    const em = orm.em.fork();
    await jobs.enqueue(em, 'title.cleanup', cleanup('1'));
    await jobs.enqueue(em, 'torrent.reconcile', { torrentId: 'a' });

    await jobs.start();
    await reconcile;

    expect(cleaned).not.toHaveBeenCalled();
    expect(
      (await all()).filter((job) => job.type === 'title.cleanup'),
    ).toMatchObject([{ status: JobStatus.Failed }]);
  });

  it('runs jobs from the loop once started', async () => {
    const ran = new Promise<void>((resolve) =>
      jobs.define('library.cleanup', { run: async () => resolve() }),
    );

    await jobs.start();
    await jobs.enqueue(orm.em.fork(), 'library.cleanup', {});

    await ran;
  });

  describe('for an admin', () => {
    const failed = async () => {
      jobs.define('title.cleanup', {
        run: async () => {
          throw new Error('unlink failed');
        },
      });
      await jobs.enqueue(orm.em.fork(), 'title.cleanup', cleanup('1'));
      await jobs.drain();

      return (await all())[0];
    };

    it('queues a failed job again', async () => {
      const job = await failed();

      await orm.em.fork().transactional(() => jobs.retry(job.id));

      expect(await all()).toMatchObject([
        { id: job.id, status: JobStatus.Queued },
      ]);
    });

    it('drops a failed job when its key is queued already', async () => {
      const job = await failed();
      await jobs.enqueue(orm.em.fork(), 'title.cleanup', cleanup('1'));

      await orm.em.fork().transactional(() => jobs.retry(job.id));

      expect(await all()).toMatchObject([{ status: JobStatus.Queued }]);
      expect((await all())[0].id).not.toBe(job.id);
    });

    it('deletes only a failed job', async () => {
      const job = await failed();
      await orm.em.fork().transactional(() => jobs.delete(job.id));
      expect(await all()).toEqual([]);

      await jobs.enqueue(orm.em.fork(), 'title.cleanup', cleanup('1'));
      const [queued] = await all();
      await expect(
        orm.em.fork().transactional(() => jobs.delete(queued.id)),
      ).rejects.toThrow('Only a failed job');
    });
  });
});
