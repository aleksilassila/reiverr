import { EnsureRequestContext } from '@mikro-orm/decorators/legacy';
import { EntityManager, raw, sql } from '@mikro-orm/sqlite';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { Job, JobStatus } from './job.entity.js';

export interface EnqueueJobOptions {
  type: string;
  payload?: any;
  lockKey?: string;
  dedupeKey?: string;
  runAt?: Date;
}

@Injectable()
export class JobsService implements OnModuleInit {
  constructor(private readonly em: EntityManager) {}

  // Workers live in this process, so a job that is still running at boot was
  // interrupted and would hold its lock key forever
  @EnsureRequestContext()
  async onModuleInit() {
    await this.em.nativeUpdate(
      Job,
      { status: JobStatus.Running },
      {
        status: JobStatus.Failed,
        error: 'Interrupted by a restart',
        finishedAt: new Date(),
      },
    );
  }

  /**
   * Queue a job. When a job with the same dedupe key is already queued,
   * nothing is added and that job is returned instead.
   */
  @EnsureRequestContext()
  async enqueue(options: EnqueueJobOptions): Promise<Job> {
    return (
      this.em
        .createQueryBuilder(Job)
        .insert({
          ...new Job(),
          type: options.type,
          payload: options.payload,
          lockKey: options.lockKey,
          dedupeKey: options.dedupeKey,
          runAt: options.runAt ?? new Date(),
        })
        // The no-op update makes a conflicting insert return the queued job
        .onConflict(raw(`(dedupe_key) where status = '${JobStatus.Queued}'`))
        .merge(['dedupeKey'])
        .returning('*')
        .getSingleResult()
    );
  }

  /**
   * Claim the oldest queued job that is due and whose lock key is not held by
   * a running job. A claimed job has to be passed to complete or fail.
   */
  @EnsureRequestContext()
  async dequeue(types?: string[]): Promise<Job | null> {
    const now = new Date();

    const next = this.em
      .createQueryBuilder(Job, 'next')
      .select('id')
      .where({ status: JobStatus.Queued, runAt: { $lte: now } })
      .andWhere(
        sql`not exists (select 1 from jobs as running where running.status = ${JobStatus.Running} and running.lock_key = next.lock_key)`,
      )
      .orderBy({ runAt: 'asc', createdAt: 'asc' })
      .limit(1);

    if (types) next.andWhere({ type: { $in: types } });

    return this.em
      .createQueryBuilder(Job)
      .update({ status: JobStatus.Running, startedAt: now })
      .where({ id: { $in: next.getNativeQuery() } })
      .returning('*')
      .getSingleResult();
  }

  async complete(id: string): Promise<void> {
    await this.finish(id, { status: JobStatus.Completed });
  }

  async fail(id: string, error: string): Promise<void> {
    await this.finish(id, { status: JobStatus.Failed, error });
  }

  @EnsureRequestContext()
  private async finish(id: string, result: Partial<Job>): Promise<void> {
    const affected = await this.em.nativeUpdate(
      Job,
      { id, status: JobStatus.Running },
      { ...result, finishedAt: new Date() },
    );
    if (!affected) throw new Error(`Job ${id} is not running`);
  }
}
