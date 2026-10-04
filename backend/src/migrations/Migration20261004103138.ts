import { Migration } from '@mikro-orm/migrations';

export class Migration20261004103138 extends Migration {
  override name = 'Migration20261004103138';

  override up(): void | Promise<void> {
    this.addSql(`
      create table log_entry (
        id text not null primary key,
        type text not null,
        message text not null,
        data json null,
        created_at datetime not null
      );
    `);
    this.addSql(`
      create index log_entry_created_at_index
      on log_entry (created_at);
    `);
  }

  override down(): void | Promise<void> {
    this.addSql(`drop table if exists log_entry;`);
  }
}
