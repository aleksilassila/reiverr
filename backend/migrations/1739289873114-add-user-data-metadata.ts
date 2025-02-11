import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserDataMetadata1739289873114 implements MigrationInterface {
  name = 'AddUserDataMetadata1739289873114';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "media_source" ("id" varchar NOT NULL, "pluginId" varchar NOT NULL, "name" varchar NOT NULL, "userId" varchar NOT NULL, "enabled" boolean NOT NULL DEFAULT (0), "adminControlled" boolean NOT NULL DEFAULT (0), "pluginSettings" json NOT NULL DEFAULT ('{}'), "priority" integer NOT NULL DEFAULT (0), PRIMARY KEY ("id", "userId"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "play_state" ("id" varchar NOT NULL, "tmdbId" varchar NOT NULL, "mediaType" varchar NOT NULL, "userId" varchar NOT NULL, "season" integer NOT NULL DEFAULT (0), "episode" integer NOT NULL DEFAULT (0), "watched" boolean NOT NULL DEFAULT (0), "progress" double NOT NULL DEFAULT (0), "lastPlayedAt" datetime NOT NULL DEFAULT (datetime('now')), CONSTRAINT "UQ_562d9fec6426abba9fac1f0765c" UNIQUE ("tmdbId", "userId", "season", "episode"), PRIMARY KEY ("id", "season", "episode"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "library_item" ("id" varchar NOT NULL, "tmdbId" varchar NOT NULL, "mediaType" varchar NOT NULL, "userId" varchar NOT NULL, CONSTRAINT "UQ_d1794fd0082c98017895ea6afa4" UNIQUE ("tmdbId"), CONSTRAINT "UQ_97081ef9b13ccb55daec682da1a" UNIQUE ("tmdbId", "userId"), PRIMARY KEY ("id", "userId"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "movie" ("id" varchar PRIMARY KEY NOT NULL, "tmdbId" varchar NOT NULL, "tmdbMovie" json NOT NULL, "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), CONSTRAINT "UQ_e67ea82f6973f5b9a6747fba346" UNIQUE ("tmdbId"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "series" ("id" varchar PRIMARY KEY NOT NULL, "tmdbId" varchar NOT NULL, "tmdbSeries" json NOT NULL, "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), CONSTRAINT "UQ_a45d0b46da5afd904af2f7b2b40" UNIQUE ("tmdbId"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "temporary_media_source" ("id" varchar NOT NULL, "pluginId" varchar NOT NULL, "name" varchar NOT NULL, "userId" varchar NOT NULL, "enabled" boolean NOT NULL DEFAULT (0), "adminControlled" boolean NOT NULL DEFAULT (0), "pluginSettings" json NOT NULL DEFAULT ('{}'), "priority" integer NOT NULL DEFAULT (0), CONSTRAINT "FK_60b1171b7dae981ca25b13757a8" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION, PRIMARY KEY ("id", "userId"))`,
    );
    await queryRunner.query(
      `INSERT INTO "temporary_media_source"("id", "pluginId", "name", "userId", "enabled", "adminControlled", "pluginSettings", "priority") SELECT "id", "pluginId", "name", "userId", "enabled", "adminControlled", "pluginSettings", "priority" FROM "media_source"`,
    );
    await queryRunner.query(`DROP TABLE "media_source"`);
    await queryRunner.query(
      `ALTER TABLE "temporary_media_source" RENAME TO "media_source"`,
    );
    await queryRunner.query(
      `CREATE TABLE "temporary_play_state" ("id" varchar NOT NULL, "tmdbId" varchar NOT NULL, "mediaType" varchar NOT NULL, "userId" varchar NOT NULL, "season" integer NOT NULL DEFAULT (0), "episode" integer NOT NULL DEFAULT (0), "watched" boolean NOT NULL DEFAULT (0), "progress" double NOT NULL DEFAULT (0), "lastPlayedAt" datetime NOT NULL DEFAULT (datetime('now')), CONSTRAINT "UQ_562d9fec6426abba9fac1f0765c" UNIQUE ("tmdbId", "userId", "season", "episode"), CONSTRAINT "FK_76a6e68bbf655b2a2bc54916803" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE NO ACTION, PRIMARY KEY ("id", "season", "episode"))`,
    );
    await queryRunner.query(
      `INSERT INTO "temporary_play_state"("id", "tmdbId", "mediaType", "userId", "season", "episode", "watched", "progress", "lastPlayedAt") SELECT "id", "tmdbId", "mediaType", "userId", "season", "episode", "watched", "progress", "lastPlayedAt" FROM "play_state"`,
    );
    await queryRunner.query(`DROP TABLE "play_state"`);
    await queryRunner.query(
      `ALTER TABLE "temporary_play_state" RENAME TO "play_state"`,
    );
    await queryRunner.query(
      `CREATE TABLE "temporary_library_item" ("id" varchar NOT NULL, "tmdbId" varchar NOT NULL, "mediaType" varchar NOT NULL, "userId" varchar NOT NULL, CONSTRAINT "UQ_d1794fd0082c98017895ea6afa4" UNIQUE ("tmdbId"), CONSTRAINT "UQ_97081ef9b13ccb55daec682da1a" UNIQUE ("tmdbId", "userId"), CONSTRAINT "FK_44e2a69f2788510e190dd3ac5ec" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE NO ACTION, PRIMARY KEY ("id", "userId"))`,
    );
    await queryRunner.query(
      `INSERT INTO "temporary_library_item"("id", "tmdbId", "mediaType", "userId") SELECT "id", "tmdbId", "mediaType", "userId" FROM "library_item"`,
    );
    await queryRunner.query(`DROP TABLE "library_item"`);
    await queryRunner.query(
      `ALTER TABLE "temporary_library_item" RENAME TO "library_item"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "library_item" RENAME TO "temporary_library_item"`,
    );
    await queryRunner.query(
      `CREATE TABLE "library_item" ("id" varchar NOT NULL, "tmdbId" varchar NOT NULL, "mediaType" varchar NOT NULL, "userId" varchar NOT NULL, CONSTRAINT "UQ_d1794fd0082c98017895ea6afa4" UNIQUE ("tmdbId"), CONSTRAINT "UQ_97081ef9b13ccb55daec682da1a" UNIQUE ("tmdbId", "userId"), PRIMARY KEY ("id", "userId"))`,
    );
    await queryRunner.query(
      `INSERT INTO "library_item"("id", "tmdbId", "mediaType", "userId") SELECT "id", "tmdbId", "mediaType", "userId" FROM "temporary_library_item"`,
    );
    await queryRunner.query(`DROP TABLE "temporary_library_item"`);
    await queryRunner.query(
      `ALTER TABLE "play_state" RENAME TO "temporary_play_state"`,
    );
    await queryRunner.query(
      `CREATE TABLE "play_state" ("id" varchar NOT NULL, "tmdbId" varchar NOT NULL, "mediaType" varchar NOT NULL, "userId" varchar NOT NULL, "season" integer NOT NULL DEFAULT (0), "episode" integer NOT NULL DEFAULT (0), "watched" boolean NOT NULL DEFAULT (0), "progress" double NOT NULL DEFAULT (0), "lastPlayedAt" datetime NOT NULL DEFAULT (datetime('now')), CONSTRAINT "UQ_562d9fec6426abba9fac1f0765c" UNIQUE ("tmdbId", "userId", "season", "episode"), PRIMARY KEY ("id", "season", "episode"))`,
    );
    await queryRunner.query(
      `INSERT INTO "play_state"("id", "tmdbId", "mediaType", "userId", "season", "episode", "watched", "progress", "lastPlayedAt") SELECT "id", "tmdbId", "mediaType", "userId", "season", "episode", "watched", "progress", "lastPlayedAt" FROM "temporary_play_state"`,
    );
    await queryRunner.query(`DROP TABLE "temporary_play_state"`);
    await queryRunner.query(
      `ALTER TABLE "media_source" RENAME TO "temporary_media_source"`,
    );
    await queryRunner.query(
      `CREATE TABLE "media_source" ("id" varchar NOT NULL, "pluginId" varchar NOT NULL, "name" varchar NOT NULL, "userId" varchar NOT NULL, "enabled" boolean NOT NULL DEFAULT (0), "adminControlled" boolean NOT NULL DEFAULT (0), "pluginSettings" json NOT NULL DEFAULT ('{}'), "priority" integer NOT NULL DEFAULT (0), PRIMARY KEY ("id", "userId"))`,
    );
    await queryRunner.query(
      `INSERT INTO "media_source"("id", "pluginId", "name", "userId", "enabled", "adminControlled", "pluginSettings", "priority") SELECT "id", "pluginId", "name", "userId", "enabled", "adminControlled", "pluginSettings", "priority" FROM "temporary_media_source"`,
    );
    await queryRunner.query(`DROP TABLE "temporary_media_source"`);
    await queryRunner.query(`DROP TABLE "series"`);
    await queryRunner.query(`DROP TABLE "movie"`);
    await queryRunner.query(`DROP TABLE "library_item"`);
    await queryRunner.query(`DROP TABLE "play_state"`);
    await queryRunner.query(`DROP TABLE "media_source"`);
  }
}
