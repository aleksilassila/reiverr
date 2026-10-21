import { Migration } from '@mikro-orm/migrations';
import { randomUUID } from 'node:crypto';
import { existsSync, renameSync } from 'node:fs';
import * as path from 'node:path';

// As consts.ts resolves it: a migration is loaded on its own
const DOWNLOADS_DIR = path.resolve(
  process.env.DOWNLOADS_DIR ||
    process.env.TORRENT_STREAM_DOWNLOADS ||
    './downloads',
);

const NOW = `cast(strftime('%s', 'now') as integer) * 1000`;

/** The data folder of a torrent is renamed, when it is there and the name is free */
function renameFolder(from: string, to: string) {
  const source = path.join(DOWNLOADS_DIR, from);
  const target = path.join(DOWNLOADS_DIR, to);
  if (existsSync(source) && !existsSync(target)) renameSync(source, target);
}

/**
 * The library becomes the hub of requests and downloads. A request row says
 * what its user wants and which gates it passed; what it waits for or has is
 * the library's request_binding. Downloads keys torrents by info hash and
 * keeps the claims on them in torrent_item, one per torrent and episode. The
 * releases users picked move from the rule rows into selected_release, and
 * the rules refer to them by info hash. The data folders are named after
 * the info hash.
 */
export class Migration20261020224803 extends Migration {
  override name = 'Migration20261020224803';

  override async up(): Promise<void> {
    const torrents = (await this.execute(
      'select id, info_hash from torrent',
    )) as { id: string; info_hash: string }[];
    for (const { id, info_hash } of torrents) renameFolder(id, info_hash);

    // What the requests had, before the tables change. A torrent picked for
    // the episode itself is wanted as its only video.
    this.addSql(`
      create table migrated_request (
        request_id text not null primary key,
        info_hash text null,
        media_file_id text null,
        only_video integer not null default 0
      );
    `);
    this.addSql(`
      insert into migrated_request (request_id, info_hash, media_file_id, only_video)
      select r.id, t.info_hash, r.media_file_id, exists (
        select 1 from request_rule rule, json_each(rule.episode_sources) as s
        where rule.user_id = r.user_id and rule.media_type = 'series'
        and rule.tmdb_id = r.tmdb_id
        and json_extract(s.value, '$.season') = r.season
        and json_extract(s.value, '$.episode') = r.episode
        and json_extract(s.value, '$.kind') = 'torrent'
        and json_extract(s.value, '$.release.infoHash') = t.info_hash
      )
      from request r left join torrent t on t.id = r.torrent_id
      where r.torrent_id is not null or r.media_file_id is not null;
    `);

    // The releases users picked, with the .torrent files the torrents have
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
    this.addSql(`
      insert or ignore into selected_release (info_hash, title, indexer, size, magnet_url, torrent_file, created_at)
      select
        json_extract(picked.release, '$.infoHash'),
        json_extract(picked.release, '$.title'),
        json_extract(picked.release, '$.indexer'),
        json_extract(picked.release, '$.size'),
        coalesce(json_extract(picked.release, '$.magnetUrl'), t.magnet_url),
        t.torrent_file,
        ${NOW}
      from (
        select json_extract(s.value, '$.release') as release
        from request_rule rule, json_each(rule.season_torrents) as s
        union all
        select json_extract(s.value, '$.release') as release
        from request_rule rule, json_each(rule.episode_sources) as s
        where json_extract(s.value, '$.kind') = 'torrent'
      ) as picked
      left join torrent t on t.info_hash = json_extract(picked.release, '$.infoHash')
      where json_extract(picked.release, '$.infoHash') is not null;
    `);

    // The rules refer to releases by info hash and to files by id
    this.addSql(`
      update request_rule set season_torrents = nullif((
        select json_group_array(json_object(
          'season', json_extract(s.value, '$.season'),
          'infoHash', json_extract(s.value, '$.release.infoHash')
        ))
        from json_each(request_rule.season_torrents) as s
        where json_extract(s.value, '$.release.infoHash') is not null
      ), '[]')
      where season_torrents is not null;
    `);
    this.addSql(`
      update request_rule set episode_sources = nullif((
        select json_group_array(
          case when json_extract(s.value, '$.kind') = 'file' then json_object(
            'season', json_extract(s.value, '$.season'),
            'episode', json_extract(s.value, '$.episode'),
            'kind', 'file',
            'mediaFileId', json_extract(s.value, '$.file.mediaFileId')
          ) else json_object(
            'season', json_extract(s.value, '$.season'),
            'episode', json_extract(s.value, '$.episode'),
            'kind', 'torrent',
            'infoHash', json_extract(s.value, '$.release.infoHash')
          ) end
        )
        from json_each(request_rule.episode_sources) as s
        where json_extract(s.value, '$.kind') = 'file'
        or json_extract(s.value, '$.release.infoHash') is not null
      ), '[]')
      where episode_sources is not null;
    `);
    this.addSql(`
      delete from request_rule
      where keep_next is null and keep_watched is null and keep_watched_hours is null
      and season_torrents is null and episode_sources is null;
    `);

    // The request table, without what the library keeps now. It is rebuilt
    // because SQLite cannot drop the columns with the foreign keys.
    this.addSql(`
      create table request__new (
        id text not null primary key,
        user_id text not null,
        tmdb_id text not null,
        media_type text not null,
        season integer not null default 0,
        episode integer not null default 0,
        approved integer not null default false,
        needed_since datetime null,
        watched_at datetime null,
        created_at datetime not null,
        updated_at datetime not null,
        constraint request_user_id_foreign foreign key (user_id) references user (id) on delete cascade
      );
    `);
    this.addSql(`
      insert into request__new (id, user_id, tmdb_id, media_type, season, episode, approved, needed_since, watched_at, created_at, updated_at)
      select id, user_id, tmdb_id, media_type, season, episode, approved, activated_at, watched_at, created_at, updated_at
      from request;
    `);
    this.addSql(`drop table request;`);
    this.addSql(`alter table request__new rename to request;`);
    this.addSql(`create index request_user_id_index on request (user_id);`);
    this.addSql(`
      create unique index request_user_id_media_type_tmdb_id_season_episode_unique
      on request (user_id, media_type, tmdb_id, season, episode);
    `);

    // The torrent table, keyed by the info hash. Old failures are dropped:
    // they were to be retried.
    this.addSql(`
      create table torrent__new (
        info_hash text not null primary key,
        title text not null,
        indexer text not null,
        size integer not null,
        magnet_url text null,
        torrent_file blob null,
        files json null,
        downloaded_bytes integer not null default 0,
        uploaded_bytes integer not null default 0,
        error text null,
        created_at datetime not null
      );
    `);
    this.addSql(`
      insert into torrent__new (info_hash, title, indexer, size, magnet_url, torrent_file, files, downloaded_bytes, uploaded_bytes, error, created_at)
      select info_hash, title, indexer, size, magnet_url, torrent_file, files, downloaded_bytes, uploaded_bytes, null, created_at
      from torrent;
    `);
    this.addSql(`drop table torrent;`);
    this.addSql(`alter table torrent__new rename to torrent;`);

    // The claims of the requests that were downloading
    this.addSql(`
      create table torrent_item (
        id text not null primary key,
        torrent_hash text not null,
        media_type text not null,
        tmdb_id text not null,
        season integer not null default 0,
        episode integer not null default 0,
        only_video integer not null default false,
        file_index integer null,
        completed_at datetime null,
        released_at datetime null,
        created_at datetime not null,
        constraint torrent_item_torrent_hash_foreign foreign key (torrent_hash) references torrent (info_hash) on delete cascade
      );
    `);
    this.addSql(`
      create index torrent_item_torrent_hash_index on torrent_item (torrent_hash);
    `);
    this.addSql(`
      create index torrent_item_released_at_index on torrent_item (released_at);
    `);
    this.addSql(`
      create unique index torrent_item_torrent_hash_media_type_tmdb_id_season_episode_unique
      on torrent_item (torrent_hash, media_type, tmdb_id, season, episode);
    `);
    this.addSql(`
      insert into torrent_item (id, torrent_hash, media_type, tmdb_id, season, episode, only_video, created_at)
      select lower(hex(randomblob(16))), m.info_hash, 'series', r.tmdb_id, r.season, r.episode, max(m.only_video), ${NOW}
      from migrated_request m join request r on r.id = m.request_id
      where m.info_hash is not null and m.media_file_id is null
      group by m.info_hash, r.tmdb_id, r.season, r.episode;
    `);

    // What the requests wait for or have
    this.addSql(`
      create table request_binding (
        request_id text not null primary key,
        torrent_item_id text null,
        media_file_id text null,
        error text null,
        updated_at datetime not null
      );
    `);
    this.addSql(`
      create index request_binding_media_file_id_index on request_binding (media_file_id);
    `);
    this.addSql(`
      create index request_binding_torrent_item_id_index on request_binding (torrent_item_id);
    `);
    this.addSql(`
      insert into request_binding (request_id, torrent_item_id, media_file_id, error, updated_at)
      select m.request_id, (
        select i.id from torrent_item i join request r on r.id = m.request_id
        where i.torrent_hash = m.info_hash and i.tmdb_id = r.tmdb_id
        and i.season = r.season and i.episode = r.episode
      ), m.media_file_id, null, ${NOW}
      from migrated_request m
      where m.media_file_id is not null or m.info_hash is not null;
    `);
    this.addSql(`drop table migrated_request;`);

    this.addSql(
      `update settings set key = 'library' where key = 'local-media';`,
    );
    // The job types change, and the start queues what is needed again
    this.addSql(`delete from jobs;`);
  }

  override async down(): Promise<void> {
    const torrents = (await this.execute('select info_hash from torrent')) as {
      info_hash: string;
    }[];
    const ids = torrents.map(({ info_hash }) => ({
      infoHash: info_hash,
      id: randomUUID(),
    }));
    for (const { id, infoHash } of ids) renameFolder(infoHash, id);

    this.addSql(`
      create table torrent_id_map (info_hash text not null primary key, id text not null);
    `);
    for (const { id, infoHash } of ids) {
      this.addSql(
        `insert into torrent_id_map (info_hash, id) values ('${infoHash}', '${id}');`,
      );
    }

    // What the requests have, before the tables change
    this.addSql(`
      create table migrated_request (
        request_id text not null primary key,
        torrent_id text null,
        media_file_id text null,
        error text null
      );
    `);
    this.addSql(`
      insert into migrated_request (request_id, torrent_id, media_file_id, error)
      select b.request_id, map.id, b.media_file_id, b.error
      from request_binding b
      left join torrent_item i on i.id = b.torrent_item_id
      left join torrent_id_map map on map.info_hash = i.torrent_hash;
    `);
    this.addSql(`drop table request_binding;`);
    this.addSql(`drop table torrent_item;`);

    this.addSql(`
      create table torrent__old (
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
        created_at datetime not null,
        error text null,
        attempts integer not null default 0,
        retry_at datetime null
      );
    `);
    this.addSql(`
      insert into torrent__old (id, info_hash, title, indexer, size, magnet_url, torrent_file, files, downloaded_bytes, uploaded_bytes, created_at, error)
      select map.id, t.info_hash, t.title, t.indexer, t.size, t.magnet_url, t.torrent_file, t.files, t.downloaded_bytes, t.uploaded_bytes, t.created_at, t.error
      from torrent t join torrent_id_map map on map.info_hash = t.info_hash;
    `);
    this.addSql(`drop table torrent;`);
    this.addSql(`alter table torrent__old rename to torrent;`);
    this.addSql(`
      create unique index torrent_info_hash_unique on torrent (info_hash);
    `);

    this.addSql(`
      create table request__old (
        id text not null primary key,
        user_id text not null,
        tmdb_id text not null,
        media_type text not null,
        season integer not null default 0,
        episode integer not null default 0,
        approved integer not null default false,
        created_at datetime not null,
        updated_at datetime not null,
        torrent_id text null constraint request_torrent_id_foreign references torrent (id) on delete set null,
        media_file_id text null constraint request_media_file_id_foreign references media_file (id) on delete set null,
        activated_at datetime null,
        watched_at datetime null,
        error text null,
        attempts integer not null default 0,
        retry_at datetime null,
        constraint request_user_id_foreign foreign key (user_id) references user (id) on delete cascade
      );
    `);
    this.addSql(`
      insert into request__old (id, user_id, tmdb_id, media_type, season, episode, approved, created_at, updated_at, torrent_id, media_file_id, activated_at, watched_at, error)
      select r.id, r.user_id, r.tmdb_id, r.media_type, r.season, r.episode, r.approved, r.created_at, r.updated_at,
        m.torrent_id, m.media_file_id, r.needed_since, r.watched_at, m.error
      from request r left join migrated_request m on m.request_id = r.id;
    `);
    this.addSql(`drop table request;`);
    this.addSql(`alter table request__old rename to request;`);
    this.addSql(`create index request_user_id_index on request (user_id);`);
    this.addSql(`
      create unique index request_user_id_media_type_tmdb_id_season_episode_unique
      on request (user_id, media_type, tmdb_id, season, episode);
    `);
    this.addSql(
      `create index request_torrent_id_index on request (torrent_id);`,
    );
    this.addSql(
      `create index request_media_file_id_index on request (media_file_id);`,
    );
    this.addSql(`drop table migrated_request;`);
    this.addSql(`drop table torrent_id_map;`);

    // The rules carry the releases again, as far as they are known
    this.addSql(`
      update request_rule set season_torrents = (
        select json_group_array(json_object(
          'season', json_extract(s.value, '$.season'),
          'release', json_object(
            'releaseId', sr.info_hash, 'indexer', sr.indexer, 'title', sr.title,
            'size', sr.size, 'infoHash', sr.info_hash, 'magnetUrl', sr.magnet_url
          )
        ))
        from json_each(request_rule.season_torrents) as s
        join selected_release sr on sr.info_hash = json_extract(s.value, '$.infoHash')
      )
      where season_torrents is not null;
    `);
    this.addSql(`
      update request_rule set episode_sources = (
        select json_group_array(
          case when json_extract(s.value, '$.kind') = 'file' then json_object(
            'season', json_extract(s.value, '$.season'),
            'episode', json_extract(s.value, '$.episode'),
            'kind', 'file',
            'file', json_object(
              'mediaFileId', json_extract(s.value, '$.mediaFileId'),
              'fileName', coalesce(replace(f.path, rtrim(f.path, replace(f.path, '/', '')), ''), ''),
              'size', coalesce(f.size, 0)
            )
          ) else json_object(
            'season', json_extract(s.value, '$.season'),
            'episode', json_extract(s.value, '$.episode'),
            'kind', 'torrent',
            'release', json_object(
              'releaseId', sr.info_hash, 'indexer', sr.indexer, 'title', sr.title,
              'size', sr.size, 'infoHash', sr.info_hash, 'magnetUrl', sr.magnet_url
            )
          ) end
        )
        from json_each(request_rule.episode_sources) as s
        left join selected_release sr on sr.info_hash = json_extract(s.value, '$.infoHash')
        left join media_file f on f.id = json_extract(s.value, '$.mediaFileId')
        where json_extract(s.value, '$.kind') = 'file' or sr.info_hash is not null
      )
      where episode_sources is not null;
    `);
    this.addSql(`drop table selected_release;`);

    this.addSql(
      `update settings set key = 'local-media' where key = 'library';`,
    );
    this.addSql(`delete from jobs;`);
  }
}
