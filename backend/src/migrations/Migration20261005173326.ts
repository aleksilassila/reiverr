import { Migration } from '@mikro-orm/migrations';

export class Migration20261005173326 extends Migration {
  override name = 'Migration20261005173326';

  override up(): void | Promise<void> {
    // Requests are bound by the first reconciliation after the migration
    this.addSql(`
      alter table request
      add column torrent_id text null
      constraint request_torrent_id_foreign references torrent (id) on delete set null;
    `);
    this.addSql(`
      alter table request
      add column media_file_id text null
      constraint request_media_file_id_foreign references media_file (id) on delete set null;
    `);
    this.addSql(`
      create index request_torrent_id_index
      on request (torrent_id);
    `);
    this.addSql(`
      create index request_media_file_id_index
      on request (media_file_id);
    `);
  }

  override down(): void | Promise<void> {
    this.addSql(`drop index request_torrent_id_index;`);
    this.addSql(`drop index request_media_file_id_index;`);
    this.addSql(`alter table request drop column torrent_id;`);
    this.addSql(`alter table request drop column media_file_id;`);
  }
}
