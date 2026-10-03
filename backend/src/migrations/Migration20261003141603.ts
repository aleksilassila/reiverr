import { Migration } from '@mikro-orm/migrations';

export class Migration20261003141603 extends Migration {
  override name = 'Migration20261003141603';

  override up(): void | Promise<void> {
    // Early versions stored some episode play states with the movie type
    this.addSql(`
      update play_state
      set media_type = 'episode'
      where media_type = 'movie' and (season != 0 or episode != 0);
    `);

    this.addSql(`drop index play_state_tmdb_id_user_id_season_episode_unique;`);
    this.addSql(`
      create unique index play_state_user_id_media_type_tmdb_id_season_episode_unique
      on play_state (user_id, media_type, tmdb_id, season, episode);
    `);

    this.addSql(`drop index request_user_id_tmdb_id_season_episode_unique;`);
    this.addSql(`
      create unique index request_user_id_media_type_tmdb_id_season_episode_unique
      on request (user_id, media_type, tmdb_id, season, episode);
    `);

    this.addSql(`drop index library_item_tmdb_id_user_id_unique;`);
    this.addSql(`
      create unique index library_item_user_id_media_type_tmdb_id_unique
      on library_item (user_id, media_type, tmdb_id);
    `);
  }

  override down(): void | Promise<void> {
    this.addSql(`drop index library_item_user_id_media_type_tmdb_id_unique;`);
    this.addSql(`
      create unique index library_item_tmdb_id_user_id_unique
      on library_item (tmdb_id, user_id);
    `);

    this.addSql(
      `drop index play_state_user_id_media_type_tmdb_id_season_episode_unique;`,
    );
    this.addSql(`
      create unique index play_state_tmdb_id_user_id_season_episode_unique
      on play_state (tmdb_id, user_id, season, episode);
    `);

    this.addSql(
      `drop index request_user_id_media_type_tmdb_id_season_episode_unique;`,
    );
    this.addSql(`
      create unique index request_user_id_tmdb_id_season_episode_unique
      on request (user_id, tmdb_id, season, episode);
    `);
  }
}
