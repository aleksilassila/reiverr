import { Migration } from '@mikro-orm/migrations';

/**
 * The preference of a user for an episode can be a file in the library
 * besides a torrent: the column holds sources with a kind. A season
 * preference is still a torrent.
 */
export class Migration20261011222917 extends Migration {
  override name = 'Migration20261011222917';

  override up(): void | Promise<void> {
    this.addSql(`
      alter table request_rule rename column episode_torrents to episode_sources;
    `);
    this.addSql(`
      update request_rule
      set episode_sources = (
        select json_group_array(json_patch(each.value, '{"kind":"torrent"}'))
        from json_each(request_rule.episode_sources) as each
      )
      where episode_sources is not null;
    `);
  }

  override down(): void | Promise<void> {
    this.addSql(`
      update request_rule
      set episode_sources = nullif(
        (
          select json_group_array(json_remove(each.value, '$.kind'))
          from json_each(request_rule.episode_sources) as each
          where json_extract(each.value, '$.kind') = 'torrent'
        ),
        '[]'
      )
      where episode_sources is not null;
    `);
    this.addSql(`
      alter table request_rule rename column episode_sources to episode_torrents;
    `);
  }
}
