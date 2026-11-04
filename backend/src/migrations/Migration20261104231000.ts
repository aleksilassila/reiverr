import { Migration } from '@mikro-orm/migrations';

/**
 * The error of a binding as a reason, with the text for people in a column
 * of its own. A text that is no longer written says nothing to go by, so it
 * goes, and a binding left with nothing goes with it: the sweep at boot looks
 * at its request again, and writes the bindings of the requests held back.
 */
export class Migration20261104231000 extends Migration {
  override name = 'Migration20261104231000';

  override up(): void | Promise<void> {
    this.addSql(
      `alter table request_binding add column error_message text null`,
    );
    this.addSql(`
      update request_binding
      set
        error_message = error,
        error = case
          when error like 'Import failed:%' then 'import-failed'
          when error = 'The file is not in the library' then 'file-not-in-library'
          when error like 'The file is not of this %' then 'file-not-of-media'
        end
      where error is not null
    `);
    this.addSql(
      `update request_binding set error_message = null where error is null`,
    );
    this.addSql(`
      delete from request_binding
      where error is null and torrent_item_id is null and media_file_id is null
    `);
  }

  override down(): void | Promise<void> {
    this.addSql(
      `delete from request_binding where error in ('over-quota', 'disk-full')`,
    );
    this.addSql(
      `update request_binding set error = error_message where error is not null`,
    );
    this.addSql(`alter table request_binding drop column error_message`);
  }
}
