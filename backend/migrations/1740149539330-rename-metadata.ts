import { MigrationInterface, QueryRunner } from 'typeorm';

export class RenameMetadata1740149539330 implements MigrationInterface {
  name = 'RenameMetadata1740149539330';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "movie_metadata" ("id" varchar PRIMARY KEY NOT NULL, "tmdbId" varchar NOT NULL, "tmdbMovie" json NOT NULL, "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), CONSTRAINT "UQ_c76bb822f86ef23ba7fddb9e626" UNIQUE ("tmdbId"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "series_metadata" ("id" varchar PRIMARY KEY NOT NULL, "tmdbId" varchar NOT NULL, "tmdbSeries" json NOT NULL, "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), CONSTRAINT "UQ_751986e5b93acdabc33a8d62cd9" UNIQUE ("tmdbId"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "temporary_library_item" ("id" varchar NOT NULL, "tmdbId" varchar NOT NULL, "userId" varchar NOT NULL, "mediaType" varchar NOT NULL, "updatedAt" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP), "createdAt" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP), CONSTRAINT "UQ_d1794fd0082c98017895ea6afa4" UNIQUE ("tmdbId"), CONSTRAINT "UQ_d1794fd0082c98017895ea6afa4" UNIQUE ("tmdbId", "userId"), CONSTRAINT "UQ_97081ef9b13ccb55daec682da1a" UNIQUE ("tmdbId", "userId"), CONSTRAINT "FK_44e2a69f2788510e190dd3ac5ec" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE NO ACTION, PRIMARY KEY ("id", "userId"))`,
    );
    await queryRunner.query(
      `INSERT INTO "temporary_library_item"("id", "tmdbId", "userId", "mediaType", "updatedAt", "createdAt") SELECT "id", "tmdbId", "userId", "mediaType", "updatedAt", "createdAt" FROM "library_item"`,
    );
    await queryRunner.query(`DROP TABLE "library_item"`);
    await queryRunner.query(`DROP TABLE "movie"`);
    await queryRunner.query(`DROP TABLE "series"`);
    await queryRunner.query(
      `ALTER TABLE "temporary_library_item" RENAME TO "library_item"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "library_item" RENAME TO "temporary_library_item"`,
    );
    await queryRunner.query(
      `CREATE TABLE "library_item" ("id" varchar NOT NULL, "tmdbId" varchar NOT NULL, "userId" varchar NOT NULL, "mediaType" varchar NOT NULL, "updatedAt" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP), "createdAt" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP), CONSTRAINT "UQ_d1794fd0082c98017895ea6afa4" UNIQUE ("tmdbId"), CONSTRAINT "UQ_d1794fd0082c98017895ea6afa4" UNIQUE ("tmdbId", "userId"), CONSTRAINT "FK_44e2a69f2788510e190dd3ac5ec" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE NO ACTION, PRIMARY KEY ("id", "userId"))`,
    );
    await queryRunner.query(
      `INSERT INTO "library_item"("id", "tmdbId", "userId", "mediaType", "updatedAt", "createdAt") SELECT "id", "tmdbId", "userId", "mediaType", "updatedAt", "createdAt" FROM "temporary_library_item"`,
    );
    await queryRunner.query(`DROP TABLE "temporary_library_item"`);
    await queryRunner.query(`DROP TABLE "series_metadata"`);
    await queryRunner.query(`DROP TABLE "movie_metadata"`);
  }
}
