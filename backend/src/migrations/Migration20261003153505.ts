import { Migration } from '@mikro-orm/migrations';

export class Migration20261003153505 extends Migration {
  override name = 'Migration20261003153505';

  override up(): void | Promise<void> {
    this.addSql(`drop table if exists media_source;`);

    // The addresses of the gRPC plugins
    this.addSql(`delete from settings where key = 'plugin-clients';`);
  }

  override down(): void | Promise<void> {
    this.addSql(`
      create table media_source (
        id text not null primary key,
        plugin_id text not null,
        name text not null,
        user_id text not null,
        enabled integer not null default false,
        admin_controlled integer not null default false,
        plugin_settings json not null,
        priority integer not null default 0,
        constraint media_source_user_id_foreign foreign key (user_id) references user (id)
      );
    `);
    this.addSql(`
      create index media_source_user_id_index
      on media_source (user_id);
    `);
  }
}
