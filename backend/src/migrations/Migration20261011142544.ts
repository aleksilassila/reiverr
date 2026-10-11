import { Migration } from '@mikro-orm/migrations';

/**
 * The job types are named after the module that runs them. A queued job of
 * an old type would never run; the start queues every title and torrent
 * again, and the crons queue the scans and the cleanup.
 */
export class Migration20261011142544 extends Migration {
  override name = 'Migration20261011142544';

  override up(): void | Promise<void> {
    this.addSql(`
      delete from jobs
      where type in (
        'title.reconcile',
        'torrent.reconcile',
        'file.import',
        'title.sync',
        'library.scan',
        'title.cleanup',
        'library.cleanup'
      );
    `);
  }

  override down(): void | Promise<void> {
    this.addSql(`
      delete from jobs
      where type in (
        'downloads.reconcileTitle',
        'downloads.reconcileTorrent',
        'localMedia.importTorrentFile',
        'localMedia.scanTitle',
        'localMedia.scanFolder',
        'localMedia.cleanUpTitle',
        'localMedia.cleanUpLibrary'
      );
    `);
  }
}
