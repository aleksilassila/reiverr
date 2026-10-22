import { Migration } from '@mikro-orm/migrations';

/**
 * Storage quotas: the quota of a user on their row, and on the binding of a
 * request what the download it waits for is expected to take, which is what
 * the request takes of the quota until it has the file.
 */
export class Migration20261021224817 extends Migration {
  override name = 'Migration20261021224817';

  override up(): void | Promise<void> {
    this.addSql(`
      alter table request_binding add column pending_bytes integer null;
    `);
    this.addSql(`
      alter table user add column quota_bytes integer null;
    `);
  }

  override down(): void | Promise<void> {
    this.addSql(`
      alter table request_binding drop column pending_bytes;
    `);
    this.addSql(`
      alter table user drop column quota_bytes;
    `);
  }
}
