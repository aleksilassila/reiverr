import { Migration } from '@mikro-orm/migrations';

export class Migration20261105175216 extends Migration {
  override name = 'Migration20261105175216';

  override up(): void | Promise<void> {
    this.addSql(`alter table request drop column watched_at;`);
  }

  override down(): void | Promise<void> {
    this.addSql(`alter table request add column watched_at datetime null;`);
  }
}
