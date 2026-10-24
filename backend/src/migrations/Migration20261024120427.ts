import { Migration } from '@mikro-orm/migrations';

/**
 * Library folders by path: the `library` setting keeps the movie folders and
 * the series folders as objects keyed by path, each with `primary`, the
 * folder new titles are imported into, in place of the lists. The first
 * folder of a list becomes the primary one; the lists come back in stored
 * order.
 */
export class Migration20261024120427 extends Migration {
  override name = 'Migration20261024120427';

  override up(): void | Promise<void> {
    this.addSql(`
      update settings
      set value = json_set(
        value,
        '$.movieFolders', json((
          select coalesce(
            json_group_object(
              folder.value,
              json_object('primary', json(iif(folder.key = 0, 'true', 'false')))
            ),
            '{}'
          )
          from json_each(settings.value, '$.movieFolders') as folder
        )),
        '$.seriesFolders', json((
          select coalesce(
            json_group_object(
              folder.value,
              json_object('primary', json(iif(folder.key = 0, 'true', 'false')))
            ),
            '{}'
          )
          from json_each(settings.value, '$.seriesFolders') as folder
        ))
      )
      where settings.key = 'library'
        and json_type(value, '$.movieFolders') = 'array';
    `);
  }

  override down(): void | Promise<void> {
    this.addSql(`
      update settings
      set value = json_set(
        value,
        '$.movieFolders', json((
          select coalesce(json_group_array(folder.key), '[]')
          from json_each(settings.value, '$.movieFolders') as folder
        )),
        '$.seriesFolders', json((
          select coalesce(json_group_array(folder.key), '[]')
          from json_each(settings.value, '$.seriesFolders') as folder
        ))
      )
      where settings.key = 'library'
        and json_type(value, '$.movieFolders') = 'object';
    `);
  }
}
