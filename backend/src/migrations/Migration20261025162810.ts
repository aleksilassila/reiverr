import { Migration } from '@mikro-orm/migrations';

/**
 * The subtitle files of a torrent that belong to the file of an item are
 * downloaded with it: `torrent_item.subtitle_file_indexes` holds their
 * indexes, matched together with the file. Items matched before have null,
 * which reads as no subtitles.
 */
export class Migration20261025162810 extends Migration {
  override name = 'Migration20261025162810';

  override up(): void | Promise<void> {
    this.addSql(`
      alter table torrent_item
      add column subtitle_file_indexes json null;
    `);
  }

  override down(): void | Promise<void> {
    this.addSql(`
      alter table torrent_item
      drop column subtitle_file_indexes;
    `);
  }
}
