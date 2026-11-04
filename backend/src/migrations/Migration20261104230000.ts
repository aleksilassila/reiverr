import { Migration } from '@mikro-orm/migrations';

/**
 * The job that imports a torrent item is renamed: a queued job of the old
 * name would never run, since only the types that are defined are claimed.
 */
export class Migration20261104230000 extends Migration {
  override name = 'Migration20261104230000';

  override up(): void | Promise<void> {
    this.addSql(`
      update jobs
      set
        type = 'library.importTorrentItem',
        dedupe_key = replace(dedupe_key, 'library.importItem:', 'library.importTorrentItem:'),
        payload = json_set(
          json_remove(payload, '$.itemId'),
          '$.torrentItemId',
          json_extract(payload, '$.itemId')
        )
      where type = 'library.importItem'
    `);
  }

  override down(): void | Promise<void> {
    this.addSql(`
      update jobs
      set
        type = 'library.importItem',
        dedupe_key = replace(dedupe_key, 'library.importTorrentItem:', 'library.importItem:'),
        payload = json_set(
          json_remove(payload, '$.torrentItemId'),
          '$.itemId',
          json_extract(payload, '$.torrentItemId')
        )
      where type = 'library.importTorrentItem'
    `);
  }
}
