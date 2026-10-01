import { Migration } from '@mikro-orm/migrations';

export class Migration20261001211837 extends Migration {
  override name = 'Migration20261001211837';

  override up(): void | Promise<void> {
    this.addSql(`
      create table jobs (
        id text not null primary key,
        type text not null,
        payload json null,
        status text not null default 'queued',
        lock_key text null,
        dedupe_key text null,
        run_at datetime not null,
        error text null,
        created_at datetime not null,
        started_at datetime null,
        finished_at datetime null
      );
    `);
    this.addSql(`
      create index jobs_status_run_at_index
      on jobs (status, run_at);
    `);
    this.addSql(`
      create unique index jobs_lock_key_unique
      on jobs (lock_key) where status = 'running';
    `);
    this.addSql(`
      create unique index jobs_dedupe_key_unique
      on jobs (dedupe_key) where status = 'queued';
    `);
  }

  override down(): void | Promise<void> {
    this.addSql(`drop table if exists jobs;`);
  }
}
