import { Migration } from '@mikro-orm/migrations';

/**
 * Play states and requests carry the type of their title, as the title
 * states and the rules do: those of the episodes of a series are of the
 * series, told apart from a movie's by their season and episode
 */
export class Migration20261102180228 extends Migration {
  override name = 'Migration20261102180228';

  override up(): void | Promise<void> {
    this.addSql(`
      update play_state
      set media_type = 'series'
      where media_type = 'episode';
    `);
    this.addSql(`
      update request
      set media_type = 'series'
      where media_type = 'episode';
    `);
  }

  override down(): void | Promise<void> {
    this.addSql(`
      update request
      set media_type = 'episode'
      where media_type = 'series';
    `);
    this.addSql(`
      update play_state
      set media_type = 'episode'
      where media_type = 'series';
    `);
  }
}
