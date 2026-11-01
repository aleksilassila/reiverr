import { Migration } from '@mikro-orm/migrations';

/**
 * The my list rows become the title states: what a user has with a title,
 * listed or not. Whether a title is listed, and since when, moves from the
 * row existing to added_to_my_list_at (every row so far is listed), and
 * the next episode to watch is stamped on the rows at the next boot.
 */
export class Migration20261101135034 extends Migration {
  override name = 'Migration20261101135034';

  override async up(): Promise<void> {
    this.addSql(`alter table library_item rename to title_state;`);
    this.addSql(`
      alter table title_state
      add column added_to_my_list_at datetime null;
    `);
    this.addSql(`alter table title_state add column next_season integer null;`);
    this.addSql(`
      alter table title_state
      add column next_episode integer null;
    `);
    this.addSql(`
      alter table title_state
      add column next_air_date datetime null;
    `);
    this.addSql(`update title_state set added_to_my_list_at = created_at;`);
    this.addSql(`alter table title_state drop column updated_at;`);

    this.addSql(`drop index library_item_user_id_index;`);
    this.addSql(`
      create index title_state_user_id_index
      on title_state (user_id);
    `);
    this.addSql(`drop index library_item_user_id_media_type_tmdb_id_unique;`);
    this.addSql(`
      create unique index title_state_user_id_media_type_tmdb_id_unique
      on title_state (user_id, media_type, tmdb_id);
    `);
  }

  override async down(): Promise<void> {
    this.addSql(`drop index title_state_user_id_media_type_tmdb_id_unique;`);
    this.addSql(`drop index title_state_user_id_index;`);

    // The rows that are not listed have no place in the my list
    this.addSql(`delete from title_state where added_to_my_list_at is null;`);
    this.addSql(`
      alter table title_state
      add column updated_at datetime not null default 0;
    `);
    this.addSql(`update title_state set updated_at = created_at;`);
    this.addSql(`alter table title_state drop column next_air_date;`);
    this.addSql(`alter table title_state drop column next_episode;`);
    this.addSql(`alter table title_state drop column next_season;`);
    this.addSql(`alter table title_state drop column added_to_my_list_at;`);
    this.addSql(`alter table title_state rename to library_item;`);

    this.addSql(`
      create index library_item_user_id_index
      on library_item (user_id);
    `);
    this.addSql(`
      create unique index library_item_user_id_media_type_tmdb_id_unique
      on library_item (user_id, media_type, tmdb_id);
    `);
  }
}
