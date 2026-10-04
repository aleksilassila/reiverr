import { Migration } from '@mikro-orm/migrations';

export class Migration20261003232352 extends Migration {
  override name = 'Migration20261003232352';

  override up(): void | Promise<void> {
    this.addSql(`
      create table request_rule (
        id text not null primary key,
        user_id text not null,
        tmdb_id text not null,
        keep_next integer null,
        keep_watched integer null,
        keep_watched_hours integer null,
        constraint request_rule_user_id_foreign foreign key (user_id) references user (id) on delete cascade
      );
    `);
    this.addSql(`
      create index request_rule_user_id_index
      on request_rule (user_id);
    `);
    this.addSql(`
      create unique index request_rule_user_id_tmdb_id_unique
      on request_rule (user_id, tmdb_id);
    `);

    this.addSql(`alter table play_state add column watched_at datetime null;`);
    // The closest there is to when the media became watched
    this.addSql(`
      update play_state
      set watched_at = last_played_at
      where watched = true;
    `);
  }

  override down(): void | Promise<void> {
    this.addSql(`drop table if exists request_rule;`);

    this.addSql(`alter table play_state drop column watched_at;`);
  }
}
