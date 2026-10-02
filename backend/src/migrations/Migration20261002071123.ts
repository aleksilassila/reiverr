import { Migration } from '@mikro-orm/migrations';

export class Migration20261002071123 extends Migration {
  override name = 'Migration20261002071123';

  override up(): void | Promise<void> {
    this.addSql(`
      create table torrent_selection (
        id text not null primary key,
        media_type text not null,
        tmdb_id text not null,
        season integer not null default 0,
        episode integer not null default 0,
        release_id text not null,
        title text not null,
        indexer text not null,
        size integer not null,
        info_hash text null,
        magnet_url text null,
        download_url text null,
        downloaded_bytes integer not null default 0,
        uploaded_bytes integer not null default 0,
        created_at datetime not null
      );
    `);
    this.addSql(`
      create unique index torrent_selection_media_type_tmdb_id_season_episode_unique
      on torrent_selection (media_type, tmdb_id, season, episode);
    `);
  }

  override down(): void | Promise<void> {
    this.addSql(`drop table if exists torrent_selection;`);
  }
}
