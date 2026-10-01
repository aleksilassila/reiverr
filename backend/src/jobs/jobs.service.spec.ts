import { MikroORM } from '@mikro-orm/sqlite';
import mikroOrmConfig from '../mikro-orm.config.js';
import { Job, JobStatus } from './job.entity.js';
import { JobsService } from './jobs.service.js';

describe('JobsService', () => {
  let orm: MikroORM;
  let jobs: JobsService;

  const findJob = (id: string) => orm.em.fork().findOne(Job, { id });

  beforeEach(async () => {
    orm = await MikroORM.init({ ...mikroOrmConfig, dbName: ':memory:' });
    await orm.migrator.up();
    jobs = new JobsService(orm.em);
  });

  afterEach(() => orm.close());

  it('claims due jobs oldest first', async () => {
    const later = await jobs.enqueue({ type: 'a', runAt: new Date(2) });
    const sooner = await jobs.enqueue({ type: 'a', runAt: new Date(1) });
    await jobs.enqueue({ type: 'a', runAt: new Date(Date.now() + 60_000) });

    const claimed = await jobs.dequeue();
    expect(claimed.id).toBe(sooner.id);
    expect(claimed.status).toBe(JobStatus.Running);
    expect(claimed.startedAt).toBeInstanceOf(Date);
    expect((await jobs.dequeue()).id).toBe(later.id);
    expect(await jobs.dequeue()).toBeNull();
  });

  it('keeps the payload', async () => {
    await jobs.enqueue({ type: 'a', payload: { tmdbId: '1', seasons: [1] } });

    expect((await jobs.dequeue()).payload).toEqual({
      tmdbId: '1',
      seasons: [1],
    });
  });

  it('claims only the given types', async () => {
    const job = await jobs.enqueue({ type: 'a' });

    expect(await jobs.dequeue(['b'])).toBeNull();
    expect((await jobs.dequeue(['a', 'b'])).id).toBe(job.id);
  });

  it('queues one job per dedupe key', async () => {
    const first = await jobs.enqueue({ type: 'a', dedupeKey: 'key' });
    const duplicate = await jobs.enqueue({ type: 'a', dedupeKey: 'key' });
    const other = await jobs.enqueue({ type: 'a', dedupeKey: 'other' });

    expect(duplicate.id).toBe(first.id);
    expect(other.id).not.toBe(first.id);
    expect(await orm.em.fork().count(Job)).toBe(2);
  });

  it('frees the dedupe key once the job is claimed', async () => {
    const first = await jobs.enqueue({ type: 'a', dedupeKey: 'key' });
    await jobs.dequeue();

    const second = await jobs.enqueue({ type: 'a', dedupeKey: 'key' });
    expect(second.id).not.toBe(first.id);
  });

  it('runs one job per lock key at a time', async () => {
    const first = await jobs.enqueue({
      type: 'a',
      lockKey: 'key',
      runAt: new Date(1),
    });
    const blocked = await jobs.enqueue({
      type: 'a',
      lockKey: 'key',
      runAt: new Date(2),
    });
    const unrelated = await jobs.enqueue({ type: 'a', runAt: new Date(3) });

    expect((await jobs.dequeue()).id).toBe(first.id);
    expect((await jobs.dequeue()).id).toBe(unrelated.id);
    expect(await jobs.dequeue()).toBeNull();

    await jobs.complete(first.id);
    expect((await jobs.dequeue()).id).toBe(blocked.id);
  });

  it('finishes running jobs', async () => {
    const completed = await jobs.enqueue({ type: 'a', runAt: new Date(1) });
    const failed = await jobs.enqueue({ type: 'a', runAt: new Date(2) });
    const queued = await jobs.enqueue({ type: 'a', runAt: new Date(3) });
    await jobs.dequeue();
    await jobs.dequeue();

    await jobs.complete(completed.id);
    await jobs.fail(failed.id, 'reason');

    expect(await findJob(completed.id)).toMatchObject({
      status: JobStatus.Completed,
      error: null,
    });
    expect(await findJob(failed.id)).toMatchObject({
      status: JobStatus.Failed,
      error: 'reason',
    });
    expect((await findJob(failed.id)).finishedAt).toBeInstanceOf(Date);
    await expect(jobs.complete(queued.id)).rejects.toThrow('is not running');
    await expect(jobs.fail(completed.id, 'reason')).rejects.toThrow(
      'is not running',
    );
  });

  it('fails jobs that were running before a restart', async () => {
    const interrupted = await jobs.enqueue({
      type: 'a',
      lockKey: 'key',
      runAt: new Date(1),
    });
    const queued = await jobs.enqueue({
      type: 'a',
      lockKey: 'key',
      runAt: new Date(2),
    });
    await jobs.dequeue();

    await jobs.onModuleInit();

    expect((await findJob(interrupted.id)).status).toBe(JobStatus.Failed);
    expect((await jobs.dequeue()).id).toBe(queued.id);
  });
});
