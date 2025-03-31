import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddLastPlayedAtAndMetadataToLibraryAndMetadata1743408772472
  implements MigrationInterface
{
  name = 'AddLastPlayedAtAndMetadataToLibraryAndMetadata1743408772472';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ???
    await queryRunner.query(
      `CREATE TABLE "temporary_library_item" ("id" varchar NOT NULL, "tmdbId" varchar NOT NULL, "userId" varchar NOT NULL, "mediaType" varchar NOT NULL, "updatedAt" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP), "createdAt" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP), CONSTRAINT "UQ_d1794fd0082c98017895ea6afa4" UNIQUE ("tmdbId"), CONSTRAINT "FK_44e2a69f2788510e190dd3ac5ec" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE NO ACTION, PRIMARY KEY ("id", "userId"))`,
    );
    await queryRunner.query(
      `INSERT INTO "temporary_library_item"("id", "tmdbId", "userId", "mediaType", "updatedAt", "createdAt") SELECT "id", "tmdbId", "userId", "mediaType", "updatedAt", "createdAt" FROM "library_item"`,
    );
    await queryRunner.query(`DROP TABLE "library_item"`);
    await queryRunner.query(
      `ALTER TABLE "temporary_library_item" RENAME TO "library_item"`,
    );

    await queryRunner.query(
      `CREATE TABLE "temporary_movie_metadata" ("id" varchar PRIMARY KEY NOT NULL, "tmdbId" varchar NOT NULL, "tmdbMovie" json NOT NULL, "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "name" varchar, "releaseDate" datetime, CONSTRAINT "UQ_c76bb822f86ef23ba7fddb9e626" UNIQUE ("tmdbId"))`,
    );
    // await queryRunner.query(
    //   `INSERT INTO "temporary_movie_metadata"("id", "tmdbId", "tmdbMovie", "updatedAt") SELECT "id", "tmdbId", "tmdbMovie", "updatedAt" FROM "movie_metadata"`,
    // );
    await queryRunner.query(`DROP TABLE "movie_metadata"`);
    await queryRunner.query(
      `ALTER TABLE "temporary_movie_metadata" RENAME TO "movie_metadata"`,
    );
    await queryRunner.query(
      `CREATE TABLE "temporary_series_metadata" ("id" varchar PRIMARY KEY NOT NULL, "tmdbId" varchar NOT NULL, "tmdbSeries" json NOT NULL, "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "name" varchar, "firstReleaseDate" datetime, "lastReleaseDate" datetime, "nextReleaseDate" datetime, "lastSeasonNumber" integer, "lastEpisodeNumber" integer, CONSTRAINT "UQ_751986e5b93acdabc33a8d62cd9" UNIQUE ("tmdbId"))`,
    );
    // await queryRunner.query(
    //   `INSERT INTO "temporary_series_metadata"("id", "tmdbId", "tmdbSeries", "updatedAt") SELECT "id", "tmdbId", "tmdbSeries", "updatedAt" FROM "series_metadata"`,
    // );
    await queryRunner.query(`DROP TABLE "series_metadata"`);
    await queryRunner.query(
      `ALTER TABLE "temporary_series_metadata" RENAME TO "series_metadata"`,
    );

    // Make tmdbId not unique
    await queryRunner.query(
      `CREATE TABLE "temporary_library_item" ("id" varchar NOT NULL, "tmdbId" varchar NOT NULL, "userId" varchar NOT NULL, "mediaType" varchar NOT NULL, "updatedAt" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP), "createdAt" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP), "lastPlayedAt" datetime, CONSTRAINT "UQ_d1794fd0082c98017895ea6afa4" UNIQUE ("tmdbId"), CONSTRAINT "FK_44e2a69f2788510e190dd3ac5ec" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE NO ACTION, PRIMARY KEY ("id", "userId"))`,
    );
    await queryRunner.query(
      `INSERT INTO "temporary_library_item"("id", "tmdbId", "userId", "mediaType", "updatedAt", "createdAt") SELECT "id", "tmdbId", "userId", "mediaType", "updatedAt", "createdAt" FROM "library_item"`,
    );
    await queryRunner.query(`DROP TABLE "library_item"`);
    await queryRunner.query(
      `ALTER TABLE "temporary_library_item" RENAME TO "library_item"`,
    );

    // Add lastPlayedAt
    await queryRunner.query(
      `CREATE TABLE "temporary_library_item" ("id" varchar NOT NULL, "tmdbId" varchar NOT NULL, "userId" varchar NOT NULL, "mediaType" varchar NOT NULL, "updatedAt" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP), "createdAt" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP), "lastPlayedAt" datetime, CONSTRAINT "UQ_d1794fd0082c98017895ea6afa4" UNIQUE ("tmdbId"), CONSTRAINT "FK_44e2a69f2788510e190dd3ac5ec" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE NO ACTION, PRIMARY KEY ("id", "userId"))`,
    );
    await queryRunner.query(
      `INSERT INTO "temporary_library_item"("id", "tmdbId", "userId", "mediaType", "updatedAt", "createdAt", "lastPlayedAt") SELECT "id", "tmdbId", "userId", "mediaType", "updatedAt", "createdAt", "lastPlayedAt" FROM "library_item"`,
    );
    await queryRunner.query(`DROP TABLE "library_item"`);
    await queryRunner.query(
      `ALTER TABLE "temporary_library_item" RENAME TO "library_item"`,
    );

    // Fix (add) unique constraints
    await queryRunner.query(
      `CREATE TABLE "temporary_library_item" ("id" varchar NOT NULL, "tmdbId" varchar NOT NULL, "userId" varchar NOT NULL, "mediaType" varchar NOT NULL, "updatedAt" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP), "createdAt" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP), "lastPlayedAt" datetime, CONSTRAINT "UQ_97081ef9b13ccb55daec682da1a" UNIQUE ("tmdbId", "userId"), CONSTRAINT "FK_44e2a69f2788510e190dd3ac5ec" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE NO ACTION, PRIMARY KEY ("id", "userId"))`,
    );
    await queryRunner.query(
      `INSERT INTO "temporary_library_item"("id", "tmdbId", "userId", "mediaType", "updatedAt", "createdAt", "lastPlayedAt") SELECT "id", "tmdbId", "userId", "mediaType", "updatedAt", "createdAt", "lastPlayedAt" FROM "library_item"`,
    );
    await queryRunner.query(`DROP TABLE "library_item"`);
    await queryRunner.query(
      `ALTER TABLE "temporary_library_item" RENAME TO "library_item"`,
    );

    // Update lastPlayedAt in library_item based on the max lastPlayedAt from related play_state entries
    await queryRunner.query(`
      UPDATE library_item
      SET lastPlayedAt = (
        SELECT MAX(ps.lastPlayedAt)
        FROM play_state ps
        WHERE ps.tmdbId = library_item.tmdbId AND ps.userId = library_item.userId
      )
      WHERE EXISTS (
        SELECT 1
        FROM play_state ps
        WHERE ps.tmdbId = library_item.tmdbId AND ps.userId = library_item.userId
        AND ps.lastPlayedAt IS NOT NULL
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "library_item" RENAME TO "temporary_library_item"`,
    );
    await queryRunner.query(
      `CREATE TABLE "library_item" ("id" varchar NOT NULL, "tmdbId" varchar NOT NULL, "userId" varchar NOT NULL, "mediaType" varchar NOT NULL, "updatedAt" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP), "createdAt" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP), "lastPlayedAt" datetime, CONSTRAINT "UQ_d1794fd0082c98017895ea6afa4" UNIQUE ("tmdbId"), CONSTRAINT "FK_44e2a69f2788510e190dd3ac5ec" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE NO ACTION, PRIMARY KEY ("id", "userId"))`,
    );
    await queryRunner.query(
      `INSERT INTO "library_item"("id", "tmdbId", "userId", "mediaType", "updatedAt", "createdAt", "lastPlayedAt") SELECT "id", "tmdbId", "userId", "mediaType", "updatedAt", "createdAt", "lastPlayedAt" FROM "temporary_library_item"`,
    );
    await queryRunner.query(`DROP TABLE "temporary_library_item"`);
    await queryRunner.query(
      `ALTER TABLE "library_item" RENAME TO "temporary_library_item"`,
    );
    await queryRunner.query(
      `CREATE TABLE "library_item" ("id" varchar NOT NULL, "tmdbId" varchar NOT NULL, "userId" varchar NOT NULL, "mediaType" varchar NOT NULL, "updatedAt" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP), "createdAt" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP), "lastPlayedAt" datetime, CONSTRAINT "UQ_d1794fd0082c98017895ea6afa4" UNIQUE ("tmdbId"), CONSTRAINT "FK_44e2a69f2788510e190dd3ac5ec" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE NO ACTION, PRIMARY KEY ("id", "userId"))`,
    );
    await queryRunner.query(
      `INSERT INTO "library_item"("id", "tmdbId", "userId", "mediaType", "updatedAt", "createdAt", "lastPlayedAt") SELECT "id", "tmdbId", "userId", "mediaType", "updatedAt", "createdAt", "lastPlayedAt" FROM "temporary_library_item"`,
    );
    await queryRunner.query(`DROP TABLE "temporary_library_item"`);
    await queryRunner.query(
      `ALTER TABLE "library_item" RENAME TO "temporary_library_item"`,
    );
    await queryRunner.query(
      `CREATE TABLE "library_item" ("id" varchar NOT NULL, "tmdbId" varchar NOT NULL, "userId" varchar NOT NULL, "mediaType" varchar NOT NULL, "updatedAt" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP), "createdAt" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP), CONSTRAINT "UQ_d1794fd0082c98017895ea6afa4" UNIQUE ("tmdbId"), CONSTRAINT "FK_44e2a69f2788510e190dd3ac5ec" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE NO ACTION, PRIMARY KEY ("id", "userId"))`,
    );
    await queryRunner.query(
      `INSERT INTO "library_item"("id", "tmdbId", "userId", "mediaType", "updatedAt", "createdAt") SELECT "id", "tmdbId", "userId", "mediaType", "updatedAt", "createdAt" FROM "temporary_library_item"`,
    );
    await queryRunner.query(`DROP TABLE "temporary_library_item"`);
    await queryRunner.query(
      `ALTER TABLE "series_metadata" RENAME TO "temporary_series_metadata"`,
    );
    await queryRunner.query(
      `CREATE TABLE "series_metadata" ("id" varchar PRIMARY KEY NOT NULL, "tmdbId" varchar NOT NULL, "tmdbSeries" json NOT NULL, "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), CONSTRAINT "UQ_751986e5b93acdabc33a8d62cd9" UNIQUE ("tmdbId"))`,
    );
    await queryRunner.query(
      `INSERT INTO "series_metadata"("id", "tmdbId", "tmdbSeries", "updatedAt") SELECT "id", "tmdbId", "tmdbSeries", "updatedAt" FROM "temporary_series_metadata"`,
    );
    await queryRunner.query(`DROP TABLE "temporary_series_metadata"`);
    await queryRunner.query(
      `ALTER TABLE "movie_metadata" RENAME TO "temporary_movie_metadata"`,
    );
    await queryRunner.query(
      `CREATE TABLE "movie_metadata" ("id" varchar PRIMARY KEY NOT NULL, "tmdbId" varchar NOT NULL, "tmdbMovie" json NOT NULL, "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), CONSTRAINT "UQ_c76bb822f86ef23ba7fddb9e626" UNIQUE ("tmdbId"))`,
    );
    await queryRunner.query(
      `INSERT INTO "movie_metadata"("id", "tmdbId", "tmdbMovie", "updatedAt") SELECT "id", "tmdbId", "tmdbMovie", "updatedAt" FROM "temporary_movie_metadata"`,
    );
    await queryRunner.query(`DROP TABLE "temporary_movie_metadata"`);
    await queryRunner.query(
      `ALTER TABLE "library_item" RENAME TO "temporary_library_item"`,
    );
    await queryRunner.query(
      `CREATE TABLE "library_item" ("id" varchar NOT NULL, "tmdbId" varchar NOT NULL, "userId" varchar NOT NULL, "mediaType" varchar NOT NULL, "updatedAt" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP), "createdAt" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP), CONSTRAINT "UQ_d1794fd0082c98017895ea6afa4" UNIQUE ("tmdbId", "userId"), CONSTRAINT "UQ_d1794fd0082c98017895ea6afa4" UNIQUE ("tmdbId"), CONSTRAINT "FK_44e2a69f2788510e190dd3ac5ec" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE NO ACTION, PRIMARY KEY ("id", "userId"))`,
    );
    await queryRunner.query(
      `INSERT INTO "library_item"("id", "tmdbId", "userId", "mediaType", "updatedAt", "createdAt") SELECT "id", "tmdbId", "userId", "mediaType", "updatedAt", "createdAt" FROM "temporary_library_item"`,
    );
    await queryRunner.query(`DROP TABLE "temporary_library_item"`);
  }
}
