import { Migration } from '@mikro-orm/migrations';

/**
 * Requests store their activity and why they have no file. The torrents a
 * user prefers move from the torrent_selection table into the rule row of
 * the user and series, as the release they picked.
 */
export class Migration20261010200450 extends Migration {
  override name = 'Migration20261010200450';

  override up(): void | Promise<void> {
    this.addSql(`
      alter table request
      add column activity text not null default 'waiting';
    `);
    this.addSql(`alter table request add column error text null;`);
    this.addSql(`
      alter table request
      add column attempts integer not null default 0;
    `);
    this.addSql(`alter table request add column retry_at datetime null;`);
    // The rules are applied when the server starts
    this.addSql(`update request set activity = 'active' where approved = 1;`);

    this.addSql(`drop index request_rule_user_id_tmdb_id_unique;`);
    this.addSql(`
      alter table request_rule
      add column media_type text not null default 'series';
    `);
    this.addSql(
      `alter table request_rule add column season_torrents json null;`,
    );
    this.addSql(
      `alter table request_rule add column episode_torrents json null;`,
    );
    this.addSql(`
      create unique index request_rule_user_id_media_type_tmdb_id_unique
      on request_rule (user_id, media_type, tmdb_id);
    `);

    // A rule row for every user and series that has a selection but no rule
    this.addSql(`
      insert into request_rule (id, user_id, media_type, tmdb_id)
      select lower(hex(randomblob(16))), user_id, 'series', tmdb_id
      from (
        select distinct user_id, tmdb_id from torrent_selection s
        where not exists (
          select 1 from request_rule r
          where r.user_id = s.user_id and r.tmdb_id = s.tmdb_id
        )
      );
    `);
    this.addSql(`
      update request_rule set season_torrents = (
        select json_group_array(json_object(
          'season', s.season,
          'release', json_object(
            'releaseId', s.release_id, 'indexer', t.indexer, 'title', t.title,
            'size', t.size, 'infoHash', t.info_hash, 'magnetUrl', t.magnet_url
          )
        ))
        from torrent_selection s join torrent t on t.id = s.torrent_id
        where s.user_id = request_rule.user_id and s.tmdb_id = request_rule.tmdb_id
        and s.episode = 0
      )
      where exists (
        select 1 from torrent_selection s
        where s.user_id = request_rule.user_id and s.tmdb_id = request_rule.tmdb_id
        and s.episode = 0
      );
    `);
    this.addSql(`
      update request_rule set episode_torrents = (
        select json_group_array(json_object(
          'season', s.season,
          'episode', s.episode,
          'release', json_object(
            'releaseId', s.release_id, 'indexer', t.indexer, 'title', t.title,
            'size', t.size, 'infoHash', t.info_hash, 'magnetUrl', t.magnet_url
          )
        ))
        from torrent_selection s join torrent t on t.id = s.torrent_id
        where s.user_id = request_rule.user_id and s.tmdb_id = request_rule.tmdb_id
        and s.episode > 0
      )
      where exists (
        select 1 from torrent_selection s
        where s.user_id = request_rule.user_id and s.tmdb_id = request_rule.tmdb_id
        and s.episode > 0
      );
    `);
    this.addSql(`drop table if exists torrent_selection;`);

    // The job types change, and the start queues every title and torrent again
    this.addSql(`delete from jobs;`);
  }

  override down(): void | Promise<void> {
    this.addSql(`
      create table torrent_selection (
        created_at datetime not null,
        episode integer not null default 0,
        id text not null primary key,
        media_type text not null,
        release_id text not null,
        season integer not null default 0,
        tmdb_id text not null,
        torrent_id text not null,
        user_id text not null,
        constraint torrent_selection_torrent_id_foreign foreign key (torrent_id) references torrent (id),
        constraint torrent_selection_user_id_foreign foreign key (user_id) references user (id) on delete cascade
      );
    `);
    this.addSql(`
      create index torrent_selection_torrent_id_index
      on torrent_selection (torrent_id);
    `);
    this.addSql(`
      create index torrent_selection_user_id_index
      on torrent_selection (user_id);
    `);
    this.addSql(`
      create unique index torrent_selection_user_id_media_type_tmdb_id_season_episode_unique
      on torrent_selection (user_id, media_type, tmdb_id, season, episode);
    `);

    this.addSql(`alter table request drop column activity;`);
    this.addSql(`alter table request drop column error;`);
    this.addSql(`alter table request drop column attempts;`);
    this.addSql(`alter table request drop column retry_at;`);

    this.addSql(`drop index request_rule_user_id_media_type_tmdb_id_unique;`);
    this.addSql(`alter table request_rule drop column media_type;`);
    this.addSql(`alter table request_rule drop column season_torrents;`);
    this.addSql(`alter table request_rule drop column episode_torrents;`);
    this.addSql(`
      create unique index request_rule_user_id_tmdb_id_unique
      on request_rule (user_id, tmdb_id);
    `);
  }
}
