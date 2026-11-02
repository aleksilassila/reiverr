import { Migration } from '@mikro-orm/migrations';

/**
 * The poster and a movie's runtime, what the cards of the catalogues
 * show, on columns of the metadata cache next to the name, filled from
 * the cached documents once; the lists read the columns, not the documents
 */
export class Migration20261102234523 extends Migration {
  override name = 'Migration20261102234523';

  override up(): void | Promise<void> {
    this.addSql(`
      alter table movie_metadata
      add column poster_path text null;
    `);
    this.addSql(`
      alter table movie_metadata
      add column runtime integer null;
    `);
    this.addSql(`
      alter table series_metadata
      add column poster_path text null;
    `);
    this.addSql(`
      update movie_metadata
      set poster_path = json_extract(tmdb_movie, '$.poster_path'),
        runtime = json_extract(tmdb_movie, '$.runtime');
    `);
    this.addSql(`
      update series_metadata
      set poster_path = json_extract(tmdb_series, '$.poster_path');
    `);
  }

  override down(): void | Promise<void> {
    this.addSql(`
      alter table series_metadata
      drop column poster_path;
    `);
    this.addSql(`
      alter table movie_metadata
      drop column runtime;
    `);
    this.addSql(`
      alter table movie_metadata
      drop column poster_path;
    `);
  }
}
