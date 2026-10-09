import { RequestContext, TransactionContext } from '@mikro-orm/core';
import { EntityManager, raw, sql } from '@mikro-orm/sqlite';
import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleDestroy,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Job, JobStatus } from './job.entity.js';
import { JOB_KEYS, JobPayloads, JobType } from './job-types.js';

export interface JobContext {
  job: Job;
  /** The entity manager of the job, a fresh one for every run */
  em: EntityManager;
}

export interface JobDefinition<T extends JobType> {
  /** How many jobs of the type run at a time, 1 by default */
  concurrency?: number;
  /**
   * A job that fails goes back to the queue with a backoff. Without it the
   * job is failed and waits for whatever enqueues it next.
   */
  retry?: boolean;
  run: (payload: JobPayloads[T], context: JobContext) => Promise<void>;
}

const POLL_INTERVAL = 1000;
const MINUTE = 60 * 1000;
const RETRY_DELAY = MINUTE;
const MAX_RETRY_DELAY = 60 * MINUTE;
const FAILED_KEPT_FOR = 30 * 24 * 60 * MINUTE;
const SHUTDOWN_GRACE = 5000;

/** The delay before the next attempt of a job that failed its nth one */
export const retryDelay = (attempts: number) =>
  Math.min(RETRY_DELAY * 2 ** Math.max(attempts - 1, 0), MAX_RETRY_DELAY);

/**
 * Runs jobs from the jobs table in this process. A module defines the types
 * it handles at init, `main.ts` starts the loop once the server listens, and
 * anyone enqueues in the transaction of the change that calls for the job.
 */
@Injectable()
export class JobsService implements OnModuleDestroy {
  private readonly logger = new Logger(JobsService.name);
  private readonly definitions = new Map<JobType, JobDefinition<JobType>>();
  private readonly running = new Map<string, Promise<void>>();
  private readonly runningOfType = new Map<JobType, number>();
  private readonly paused = new Set<JobType>();
  private readonly enqueues = new Set<Promise<void>>();
  private loop?: Promise<void>;
  private stopping = false;
  /** Something was enqueued or settled since the loop last looked */
  private changed = false;
  private wake?: () => void;

  constructor(private readonly em: EntityManager) {}

  define<T extends JobType>(type: T, definition: JobDefinition<T>): void {
    if (this.definitions.has(type)) {
      throw new Error(`Job type "${type}" is defined already`);
    }

    this.definitions.set(type, definition as JobDefinition<JobType>);
  }

  /**
   * Queues a job with the entity manager of the caller, inside its
   * transaction when it has one, so that the job is there exactly when the
   * change that calls for it is. A job with the same dedupe key that is
   * queued already gets the earlier of the two run times instead.
   */
  enqueue<T extends JobType>(
    em: EntityManager,
    type: T,
    payload: JobPayloads[T],
    options: { runAt?: Date } = {},
  ): Promise<void> {
    // That insert would wait for the connection the transaction holds
    if (
      TransactionContext.currentTransactionContext() &&
      !em.getContext(false).isInTransaction()
    ) {
      throw new Error(
        `Enqueueing "${type}" outside the transaction that is running`,
      );
    }

    const keys = JOB_KEYS[type](payload);
    const job = new Job();
    const inserted = em
      .createQueryBuilder(Job)
      .insert({
        ...job,
        type,
        payload,
        dedupeKey: keys.dedupe,
        lockKey: keys.lock,
        runAt: options.runAt ?? job.runAt,
      })
      .onConflict(raw(`(dedupe_key) where status = '${JobStatus.Queued}'`))
      .merge({ runAt: raw('min(jobs.run_at, excluded.run_at)') })
      .execute()
      .then(() => this.notify());

    // The caller handles a failure, drain only waits for it
    const tracked: Promise<void> = inserted
      .catch(() => undefined)
      .finally(() => this.enqueues.delete(tracked));
    this.enqueues.add(tracked);

    return inserted;
  }

  /** Runs the queued jobs of a type that wait for a later time now */
  async runNow(em: EntityManager, type: JobType): Promise<void> {
    const now = new Date();
    await em.nativeUpdate(
      Job,
      { type, status: JobStatus.Queued, runAt: { $gt: now } },
      { runAt: now },
    );
    this.notify();
  }

  /** Fails the jobs that a restart interrupted and starts running jobs */
  async start(): Promise<void> {
    if (this.loop) throw new Error('The jobs are running already');

    await this.em.fork().transactional(async (tx) => {
      // A key keeps only its newest failure
      await tx.execute(
        `delete from jobs where status = '${JobStatus.Failed}'
         and dedupe_key in (select dedupe_key from jobs where status = '${JobStatus.Running}')`,
        [],
        'run',
      );
      await tx.nativeUpdate(
        Job,
        { status: JobStatus.Running },
        {
          status: JobStatus.Failed,
          error: 'Interrupted by a restart',
          finishedAt: new Date(),
        },
      );
    });
    this.loop = this.runLoop();
  }

  /**
   * Stops claiming and waits a while for the running jobs. A job that does
   * not end in time stays running in the table and is failed at the next
   * start.
   */
  async onModuleDestroy(): Promise<void> {
    this.stopping = true;
    this.notify();

    const stopped = (async () => {
      await this.loop;
      await Promise.allSettled(this.running.values());
    })();
    let timer: NodeJS.Timeout;
    const timeout = new Promise<boolean>((resolve) => {
      timer = setTimeout(() => resolve(true), SHUTDOWN_GRACE);
    });
    const timedOut = await Promise.race([stopped.then(() => false), timeout]);
    clearTimeout(timer);

    if (timedOut) {
      this.logger.warn(
        `Stopped without waiting for ${this.running.size} running jobs`,
      );
    }
  }

  /**
   * For tests, where the loop does not run: runs every job that is due, and
   * what those enqueue, until none is due and none is running
   */
  async drain(): Promise<void> {
    if (this.loop) throw new Error('The loop runs the jobs');

    for (;;) {
      await Promise.allSettled(this.enqueues);
      let job: Job | null;
      while ((job = await this.claim())) this.run(job);
      if (!this.running.size) return;

      await Promise.allSettled(this.running.values());
    }
  }

  /** Stops claiming jobs of a type until the returned function is called */
  pause(type: JobType): () => void {
    this.paused.add(type);

    return () => {
      this.paused.delete(type);
      this.notify();
    };
  }

  list(filter: { status?: JobStatus; type?: string }): Promise<Job[]> {
    return this.em.find(
      Job,
      {
        ...(filter.status && { status: filter.status }),
        ...(filter.type && { type: filter.type }),
      },
      { orderBy: { createdAt: 'desc' }, limit: 500, disableIdentityMap: true },
    );
  }

  /** Queues a failed job again, or drops it when its key is queued already */
  async retry(id: string): Promise<void> {
    await this.em.transactional(async (tx) => {
      const job = await this.findFailed(tx, id);
      const twin = await tx.count(Job, {
        dedupeKey: job.dedupeKey,
        status: JobStatus.Queued,
      });

      if (twin) {
        await tx.nativeDelete(Job, { id });
      } else {
        await tx.nativeUpdate(
          Job,
          { id },
          { status: JobStatus.Queued, runAt: new Date(), finishedAt: null },
        );
      }
    });
    this.notify();
  }

  /**
   * Deletes a failed job. A queued one stays: nothing would enqueue it
   * again.
   */
  async delete(id: string): Promise<void> {
    await this.em.transactional(async (tx) => {
      await this.findFailed(tx, id);
      await tx.nativeDelete(Job, { id });
    });
  }

  @Cron(CronExpression.EVERY_DAY_AT_4AM)
  async purge(): Promise<void> {
    await this.em.fork().nativeDelete(Job, {
      status: { $in: [JobStatus.Failed, JobStatus.Completed] },
      finishedAt: { $lt: new Date(Date.now() - FAILED_KEPT_FOR) },
    });
  }

  private async findFailed(tx: EntityManager, id: string): Promise<Job> {
    const job = await tx.findOne(Job, { id }, { disableIdentityMap: true });
    if (!job) throw new NotFoundException('Job not found');
    if (job.status !== JobStatus.Failed) {
      throw new BadRequestException('Only a failed job can be changed');
    }

    return job;
  }

  private notify() {
    this.changed = true;
    this.wake?.();
  }

  private async runLoop(): Promise<void> {
    while (!this.stopping) {
      this.changed = false;
      const job = await this.claim().catch((error) => {
        this.logger.error(`Claiming a job failed: ${error.message}`);
        return null;
      });
      if (job) {
        this.run(job);
        continue;
      }
      if (this.changed) continue;

      await new Promise<void>((resolve) => {
        const timer = setTimeout(resolve, POLL_INTERVAL);
        this.wake = () => {
          clearTimeout(timer);
          resolve();
        };
      });
      this.wake = undefined;
    }
  }

  /**
   * Claims the oldest due job of a type that has a free slot and whose lock
   * key no running job holds
   */
  private async claim(): Promise<Job | null> {
    const types = [...this.definitions]
      .filter(
        ([type, definition]) =>
          !this.paused.has(type) &&
          (this.runningOfType.get(type) ?? 0) < (definition.concurrency ?? 1),
      )
      .map(([type]) => type);
    if (!types.length) return null;

    const em = this.em.fork();
    const now = new Date();
    const next = em
      .createQueryBuilder(Job, 'next')
      .select('id')
      .where({
        status: JobStatus.Queued,
        runAt: { $lte: now },
        type: { $in: types },
      })
      .andWhere(
        sql`not exists (select 1 from jobs as running where running.status = ${JobStatus.Running} and running.lock_key = next.lock_key)`,
      )
      .orderBy({ runAt: 'asc', createdAt: 'asc' })
      .limit(1);

    return em
      .createQueryBuilder(Job)
      .update({
        status: JobStatus.Running,
        startedAt: now,
        attempts: raw('attempts + 1'),
      })
      .where({ id: { $in: next.getNativeQuery() } })
      .returning('*')
      .getSingleResult();
  }

  private run(job: Job): void {
    const type = job.type as JobType;
    const definition = this.definitions.get(type);
    this.runningOfType.set(type, (this.runningOfType.get(type) ?? 0) + 1);

    const run = RequestContext.create(this.em, async () =>
      definition.run(job.payload, {
        job,
        em: RequestContext.getEntityManager() as EntityManager,
      }),
    );
    const settled = run
      .then(
        () => this.settle(job),
        (reason: unknown) => {
          const error =
            reason instanceof Error ? reason : new Error(String(reason));
          this.logger.warn(`Job ${job.type} failed: ${error.message}`);
          return this.settle(job, error);
        },
      )
      .catch((error: Error) =>
        // The row stays running and holds its lock key until a restart
        this.logger.error(`Settling job ${job.id} failed: ${error.message}`),
      )
      .finally(() => {
        this.running.delete(job.id);
        this.runningOfType.set(type, this.runningOfType.get(type) - 1);
        this.notify();
      });
    this.running.set(job.id, settled);
  }

  private async settle(job: Job, error?: Error): Promise<void> {
    await this.em.fork().transactional(async (tx) => {
      if (!error) {
        await tx.nativeDelete(Job, {
          $or: [
            { id: job.id },
            { dedupeKey: job.dedupeKey, status: JobStatus.Failed },
          ],
        });
        return;
      }

      const message = error.message;
      if (this.definitions.get(job.type as JobType).retry) {
        const runAt = new Date(Date.now() + retryDelay(job.attempts));
        // A copy of the job that was enqueued while it ran takes over
        const twin = await tx.findOne(
          Job,
          { dedupeKey: job.dedupeKey, status: JobStatus.Queued },
          { disableIdentityMap: true },
        );

        if (twin) {
          await tx.nativeDelete(Job, { id: job.id });
          await tx.nativeUpdate(
            Job,
            { id: twin.id },
            {
              error: message,
              attempts: job.attempts,
              runAt: twin.runAt < runAt ? twin.runAt : runAt,
            },
          );
        } else {
          await tx.nativeUpdate(
            Job,
            { id: job.id },
            { status: JobStatus.Queued, error: message, runAt },
          );
        }
        return;
      }

      // A key keeps only its newest failure
      await tx.nativeDelete(Job, {
        dedupeKey: job.dedupeKey,
        status: JobStatus.Failed,
      });
      await tx.nativeUpdate(
        Job,
        { id: job.id },
        { status: JobStatus.Failed, error: message, finishedAt: new Date() },
      );
    });
  }
}
