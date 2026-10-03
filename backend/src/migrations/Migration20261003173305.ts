import { Migration } from '@mikro-orm/migrations';

export class Migration20261003173305 extends Migration {
  override name = 'Migration20261003173305';

  override up(): void | Promise<void> {
    // The selections so far were server wide and held the torrent themselves.
    // They were made with a prototype and are not carried over.
    this.addSql(`drop table torrent_selection;`);

    this.addSql(`
      create table torrent (
        id text not null primary key,
        info_hash text not null,
        title text not null,
        indexer text not null,
        size integer not null,
        magnet_url text null,
        torrent_file blob null,
        files json null,
        downloaded_bytes integer not null default 0,
        uploaded_bytes integer not null default 0,
        created_at datetime not null
      );
    `);
    this.addSql(`
      create unique index torrent_info_hash_unique
      on torrent (info_hash);
    `);

    this.addSql(`
      create table torrent_selection (
        id text not null primary key,
        user_id text not null,
        media_type text not null,
        tmdb_id text not null,
        season integer not null default 0,
        episode integer not null default 0,
        torrent_id text not null,
        release_id text not null,
        created_at datetime not null,
        constraint torrent_selection_user_id_foreign foreign key (user_id) references user (id) on delete cascade,
        constraint torrent_selection_torrent_id_foreign foreign key (torrent_id) references torrent (id)
      );
    `);
    this.addSql(`
      create index torrent_selection_user_id_index
      on torrent_selection (user_id);
    `);
    this.addSql(`
      create index torrent_selection_torrent_id_index
      on torrent_selection (torrent_id);
    `);
    this.addSql(`
      create unique index torrent_selection_user_id_media_type_tmdb_id_season_episode_unique
      on torrent_selection (user_id, media_type, tmdb_id, season, episode);
    `);
  }

  override down(): void | Promise<void> {
    this.addSql(`drop table torrent_selection;`);
    this.addSql(`drop table torrent;`);

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
}
