import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPlayStateAndMyList1721052160110 implements MigrationInterface {
    name = 'AddPlayStateAndMyList1721052160110'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "play_state" ("id" varchar PRIMARY KEY NOT NULL, "tmdbId" integer NOT NULL, "seasonNumber" integer, "episodeNumber" integer, "progress" double NOT NULL, "watched" boolean NOT NULL DEFAULT (0), "showInUpNext" boolean NOT NULL DEFAULT (1), "userId" varchar)`);
        await queryRunner.query(`CREATE TABLE "my_list_item" ("id" varchar PRIMARY KEY NOT NULL, "tmdbId" integer NOT NULL, "userId" varchar, CONSTRAINT "UQ_a14dd1370f05c5feffe21f043e9" UNIQUE ("tmdbId"))`);
        await queryRunner.query(`CREATE TABLE "temporary_play_state" ("id" varchar PRIMARY KEY NOT NULL, "tmdbId" integer NOT NULL, "seasonNumber" integer, "episodeNumber" integer, "progress" double NOT NULL, "watched" boolean NOT NULL DEFAULT (0), "showInUpNext" boolean NOT NULL DEFAULT (1), "userId" varchar, CONSTRAINT "FK_76a6e68bbf655b2a2bc54916803" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "temporary_play_state"("id", "tmdbId", "seasonNumber", "episodeNumber", "progress", "watched", "showInUpNext", "userId") SELECT "id", "tmdbId", "seasonNumber", "episodeNumber", "progress", "watched", "showInUpNext", "userId" FROM "play_state"`);
        await queryRunner.query(`DROP TABLE "play_state"`);
        await queryRunner.query(`ALTER TABLE "temporary_play_state" RENAME TO "play_state"`);
        await queryRunner.query(`CREATE TABLE "temporary_my_list_item" ("id" varchar PRIMARY KEY NOT NULL, "tmdbId" integer NOT NULL, "userId" varchar, CONSTRAINT "UQ_a14dd1370f05c5feffe21f043e9" UNIQUE ("tmdbId"), CONSTRAINT "FK_3657174b1c5a1bbcb4e75a237bd" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "temporary_my_list_item"("id", "tmdbId", "userId") SELECT "id", "tmdbId", "userId" FROM "my_list_item"`);
        await queryRunner.query(`DROP TABLE "my_list_item"`);
        await queryRunner.query(`ALTER TABLE "temporary_my_list_item" RENAME TO "my_list_item"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "my_list_item" RENAME TO "temporary_my_list_item"`);
        await queryRunner.query(`CREATE TABLE "my_list_item" ("id" varchar PRIMARY KEY NOT NULL, "tmdbId" integer NOT NULL, "userId" varchar, CONSTRAINT "UQ_a14dd1370f05c5feffe21f043e9" UNIQUE ("tmdbId"))`);
        await queryRunner.query(`INSERT INTO "my_list_item"("id", "tmdbId", "userId") SELECT "id", "tmdbId", "userId" FROM "temporary_my_list_item"`);
        await queryRunner.query(`DROP TABLE "temporary_my_list_item"`);
        await queryRunner.query(`ALTER TABLE "play_state" RENAME TO "temporary_play_state"`);
        await queryRunner.query(`CREATE TABLE "play_state" ("id" varchar PRIMARY KEY NOT NULL, "tmdbId" integer NOT NULL, "seasonNumber" integer, "episodeNumber" integer, "progress" double NOT NULL, "watched" boolean NOT NULL DEFAULT (0), "showInUpNext" boolean NOT NULL DEFAULT (1), "userId" varchar)`);
        await queryRunner.query(`INSERT INTO "play_state"("id", "tmdbId", "seasonNumber", "episodeNumber", "progress", "watched", "showInUpNext", "userId") SELECT "id", "tmdbId", "seasonNumber", "episodeNumber", "progress", "watched", "showInUpNext", "userId" FROM "temporary_play_state"`);
        await queryRunner.query(`DROP TABLE "temporary_play_state"`);
        await queryRunner.query(`DROP TABLE "my_list_item"`);
        await queryRunner.query(`DROP TABLE "play_state"`);
    }

}
