import { Migration } from '@mikro-orm/migrations';

export class Migration20261003171145 extends Migration {
  override name = 'Migration20261003171145';

  override up(): void | Promise<void> {
    this.addSql(`
      create table media_file (
        id text not null primary key,
        path text not null,
        media_type text not null,
        tmdb_id text not null,
        season integer not null default 0,
        episode integer not null default 0,
        last_episode integer not null default 0,
        size integer not null,
        modified_at datetime not null,
        info_hash text null,
        managed integer not null default false,
        created_at datetime not null
      );
    `);
    this.addSql(`
      create unique index media_file_path_unique
      on media_file (path);
    `);
    this.addSql(`
      create index media_file_media_type_tmdb_id_index
      on media_file (media_type, tmdb_id);
    `);
  }

  override down(): void | Promise<void> {
    this.addSql(`drop table if exists media_file;`);
  }
}
