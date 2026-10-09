import { Migration } from '@mikro-orm/migrations';

export class Migration20261009201800 extends Migration {
  override name = 'Migration20261009201800';

  override up(): void | Promise<void> {
    // Requests are bound when they are made and when a preference changes
    // from now on, so the ones that are not bound yet get their preference:
    // the selection for the episode, or else for the season
    this.addSql(`
      update request set torrent_id = coalesce(
        (
          select s.torrent_id from torrent_selection s
          where s.user_id = request.user_id and s.media_type = 'series'
          and s.tmdb_id = request.tmdb_id and s.season = request.season
          and s.episode = request.episode
        ),
        (
          select s.torrent_id from torrent_selection s
          where s.user_id = request.user_id and s.media_type = 'series'
          and s.tmdb_id = request.tmdb_id and s.season = request.season
          and s.episode = 0
        )
      )
      where media_type = 'episode' and torrent_id is null;
    `);
  }

  override down(): void | Promise<void> {
    // The bindings stay: the planner before this keeps a stored torrent
  }
}
