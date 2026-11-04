import { Migration } from '@mikro-orm/migrations';

const NOW = `cast(strftime('%s', 'now') as integer) * 1000`;

/**
 * The sources of a user's requests as rows of their own, one per season,
 * episode or movie, each carrying the release the user picked: in place
 * of the JSON preferences on the rule row and the releases shared by info
 * hash. A rule row stays only while it has a limit.
 */
export class Migration20261104150548 extends Migration {
  override name = 'Migration20261104150548';

  override up(): void | Promise<void> {
    this.addSql(`
      create table request_source (
        id text not null primary key,
        user_id text not null,
        media_type text not null,
        tmdb_id text not null,
        season integer not null,
        episode integer not null,
        kind text not null,
        media_file_id text null,
        info_hash text null,
        title text null,
        indexer text null,
        size integer null,
        magnet_url text null,
        torrent_file blob null,
        created_at datetime not null,
        constraint request_source_user_id_foreign foreign key (user_id) references user (id) on delete cascade
      );
    `);
    this.addSql(`
      create index request_source_user_id_index
      on request_source (user_id);
    `);
    this.addSql(`
      create unique index request_source_user_id_media_type_tmdb_id_season_episode_unique
      on request_source (user_id, media_type, tmdb_id, season, episode);
    `);

    this.addSql(`
      insert into request_source (
        id, user_id, media_type, tmdb_id, season, episode, kind,
        info_hash, title, indexer, size, magnet_url, torrent_file, created_at
      )
      select lower(hex(randomblob(16))), r.user_id, r.media_type, r.tmdb_id,
        json_extract(each.value, '$.season'), 0, 'torrent',
        s.info_hash, s.title, s.indexer, s.size, s.magnet_url, s.torrent_file, s.created_at
      from request_rule r
      join json_each(r.season_torrents) as each
      join selected_release s on s.info_hash = json_extract(each.value, '$.infoHash');
    `);
    this.addSql(`
      insert into request_source (
        id, user_id, media_type, tmdb_id, season, episode, kind,
        info_hash, title, indexer, size, magnet_url, torrent_file, created_at
      )
      select lower(hex(randomblob(16))), r.user_id, r.media_type, r.tmdb_id,
        json_extract(each.value, '$.season'), json_extract(each.value, '$.episode'), 'torrent',
        s.info_hash, s.title, s.indexer, s.size, s.magnet_url, s.torrent_file, s.created_at
      from request_rule r
      join json_each(r.episode_sources) as each
      join selected_release s on s.info_hash = json_extract(each.value, '$.infoHash')
      where json_extract(each.value, '$.kind') = 'torrent';
    `);
    this.addSql(`
      insert into request_source (
        id, user_id, media_type, tmdb_id, season, episode, kind,
        media_file_id, created_at
      )
      select lower(hex(randomblob(16))), r.user_id, r.media_type, r.tmdb_id,
        json_extract(each.value, '$.season'), json_extract(each.value, '$.episode'), 'file',
        json_extract(each.value, '$.mediaFileId'), ${NOW}
      from request_rule r
      join json_each(r.episode_sources) as each
      where json_extract(each.value, '$.kind') = 'file';
    `);

    this.addSql(`
      delete from request_rule
      where keep_next is null and keep_watched is null and keep_watched_hours is null;
    `);
    this.addSql(`alter table request_rule drop column episode_sources;`);
    this.addSql(`alter table request_rule drop column season_torrents;`);
    this.addSql(`drop table selected_release;`);
  }

  override down(): void | Promise<void> {
    this.addSql(`
      create table selected_release (
        info_hash text not null primary key,
        title text not null,
        indexer text not null,
        size integer not null,
        magnet_url text null,
        torrent_file blob null,
        created_at datetime not null
      );
    `);
    this.addSql(
      `alter table request_rule add column season_torrents json null;`,
    );
    this.addSql(
      `alter table request_rule add column episode_sources json null;`,
    );

    this.addSql(`
      insert into selected_release (info_hash, title, indexer, size, magnet_url, torrent_file, created_at)
      select info_hash, title, indexer, size, magnet_url, torrent_file, min(created_at)
      from request_source
      where kind = 'torrent'
      group by info_hash;
    `);
    // A rule row for every pair that has a source but no rule
    this.addSql(`
      insert into request_rule (id, user_id, media_type, tmdb_id)
      select lower(hex(randomblob(16))), user_id, media_type, tmdb_id
      from (
        select distinct user_id, media_type, tmdb_id from request_source s
        where not exists (
          select 1 from request_rule r
          where r.user_id = s.user_id and r.media_type = s.media_type and r.tmdb_id = s.tmdb_id
        )
      );
    `);
    this.addSql(`
      update request_rule
      set season_torrents = nullif(
        (
          select json_group_array(json_object('season', s.season, 'infoHash', s.info_hash))
          from request_source s
          where s.user_id = request_rule.user_id and s.media_type = request_rule.media_type
          and s.tmdb_id = request_rule.tmdb_id and s.media_type = 'series' and s.episode = 0
        ),
        '[]'
      );
    `);
    this.addSql(`
      update request_rule
      set episode_sources = nullif(
        (
          select json_group_array(
            case s.kind
              when 'file' then json_object(
                'season', s.season, 'episode', s.episode, 'kind', 'file', 'mediaFileId', s.media_file_id
              )
              else json_object(
                'season', s.season, 'episode', s.episode, 'kind', 'torrent', 'infoHash', s.info_hash
              )
            end
          )
          from request_source s
          where s.user_id = request_rule.user_id and s.media_type = request_rule.media_type
          and s.tmdb_id = request_rule.tmdb_id and not (s.media_type = 'series' and s.episode = 0)
        ),
        '[]'
      );
    `);
    this.addSql(`drop table request_source;`);
  }
}
