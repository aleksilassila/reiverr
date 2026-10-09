import { Migration } from '@mikro-orm/migrations';

export class Migration20261009203715 extends Migration {
  override name = 'Migration20261009203715';

  override up(): void | Promise<void> {
    this.addSql(`alter table torrent add column error text null;`);
    this.addSql(`
      alter table torrent
      add column attempts integer not null default 0;
    `);
    this.addSql(`alter table torrent add column retry_at datetime null;`);
  }

  override down(): void | Promise<void> {
    this.addSql(`alter table torrent drop column error;`);
    this.addSql(`alter table torrent drop column attempts;`);
    this.addSql(`alter table torrent drop column retry_at;`);
  }
}
