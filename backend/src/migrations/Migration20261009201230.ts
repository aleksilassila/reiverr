import { Migration } from '@mikro-orm/migrations';

export class Migration20261009201230 extends Migration {
  override name = 'Migration20261009201230';

  override up(): void | Promise<void> {
    this.addSql(`
      alter table jobs
      add column attempts integer not null default 0;
    `);
    this.addSql(`
      create index jobs_dedupe_key_index
      on jobs (dedupe_key);
    `);
  }

  override down(): void | Promise<void> {
    this.addSql(`drop index jobs_dedupe_key_index;`);
    this.addSql(`alter table jobs drop column attempts;`);
  }
}
