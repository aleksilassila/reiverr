import { Migration } from '@mikro-orm/migrations';

/**
 * The job that brings the binding of a request in line is renamed: a queued
 * job of the old name would never run, since only the types that are defined
 * are claimed.
 */
export class Migration20261105000000 extends Migration {
  override name = 'Migration20261105000000';

  override up(): void | Promise<void> {
    this.addSql(`
      update jobs
      set
        type = 'library.reconcileBinding',
        dedupe_key = replace(dedupe_key, 'library.reconcileRequest:', 'library.reconcileBinding:')
      where type = 'library.reconcileRequest'
    `);
  }

  override down(): void | Promise<void> {
    this.addSql(`
      update jobs
      set
        type = 'library.reconcileRequest',
        dedupe_key = replace(dedupe_key, 'library.reconcileBinding:', 'library.reconcileRequest:')
      where type = 'library.reconcileBinding'
    `);
  }
}
