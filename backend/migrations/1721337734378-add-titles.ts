import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTitles1721337734378 implements MigrationInterface {
    name = 'AddTitles1721337734378'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "my_list_item" ("id" varchar PRIMARY KEY NOT NULL, "tmdbId" integer NOT NULL, "userId" varchar, CONSTRAINT "UQ_a14dd1370f05c5feffe21f043e9" UNIQUE ("tmdbId"))`);
        await queryRunner.query(`CREATE TABLE "media" ("id" varchar PRIMARY KEY NOT NULL, "progress" integer NOT NULL DEFAULT (0), "watched" boolean NOT NULL DEFAULT (0), "seasonNumber" integer, "episodeNumber" integer, "titleId" varchar)`);
        await queryRunner.query(`CREATE TABLE "title" ("id" varchar PRIMARY KEY NOT NULL, "tmdbId" integer NOT NULL, "upNext" boolean NOT NULL DEFAULT (0), "isInLibrary" boolean NOT NULL DEFAULT (0), "userId" varchar)`);
        await queryRunner.query(`CREATE TABLE "temporary_my_list_item" ("id" varchar PRIMARY KEY NOT NULL, "tmdbId" integer NOT NULL, "userId" varchar, CONSTRAINT "UQ_a14dd1370f05c5feffe21f043e9" UNIQUE ("tmdbId"), CONSTRAINT "FK_3657174b1c5a1bbcb4e75a237bd" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "temporary_my_list_item"("id", "tmdbId", "userId") SELECT "id", "tmdbId", "userId" FROM "my_list_item"`);
        await queryRunner.query(`DROP TABLE "my_list_item"`);
        await queryRunner.query(`ALTER TABLE "temporary_my_list_item" RENAME TO "my_list_item"`);
        await queryRunner.query(`CREATE TABLE "temporary_media" ("id" varchar PRIMARY KEY NOT NULL, "progress" integer NOT NULL DEFAULT (0), "watched" boolean NOT NULL DEFAULT (0), "seasonNumber" integer, "episodeNumber" integer, "titleId" varchar, CONSTRAINT "FK_7dec680069dc12a77e96c78e27e" FOREIGN KEY ("titleId") REFERENCES "title" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "temporary_media"("id", "progress", "watched", "seasonNumber", "episodeNumber", "titleId") SELECT "id", "progress", "watched", "seasonNumber", "episodeNumber", "titleId" FROM "media"`);
        await queryRunner.query(`DROP TABLE "media"`);
        await queryRunner.query(`ALTER TABLE "temporary_media" RENAME TO "media"`);
        await queryRunner.query(`CREATE TABLE "temporary_title" ("id" varchar PRIMARY KEY NOT NULL, "tmdbId" integer NOT NULL, "upNext" boolean NOT NULL DEFAULT (0), "isInLibrary" boolean NOT NULL DEFAULT (0), "userId" varchar, CONSTRAINT "FK_feed27b6c765803cc09d45dd6d0" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "temporary_title"("id", "tmdbId", "upNext", "isInLibrary", "userId") SELECT "id", "tmdbId", "upNext", "isInLibrary", "userId" FROM "title"`);
        await queryRunner.query(`DROP TABLE "title"`);
        await queryRunner.query(`ALTER TABLE "temporary_title" RENAME TO "title"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "title" RENAME TO "temporary_title"`);
        await queryRunner.query(`CREATE TABLE "title" ("id" varchar PRIMARY KEY NOT NULL, "tmdbId" integer NOT NULL, "upNext" boolean NOT NULL DEFAULT (0), "isInLibrary" boolean NOT NULL DEFAULT (0), "userId" varchar)`);
        await queryRunner.query(`INSERT INTO "title"("id", "tmdbId", "upNext", "isInLibrary", "userId") SELECT "id", "tmdbId", "upNext", "isInLibrary", "userId" FROM "temporary_title"`);
        await queryRunner.query(`DROP TABLE "temporary_title"`);
        await queryRunner.query(`ALTER TABLE "media" RENAME TO "temporary_media"`);
        await queryRunner.query(`CREATE TABLE "media" ("id" varchar PRIMARY KEY NOT NULL, "progress" integer NOT NULL DEFAULT (0), "watched" boolean NOT NULL DEFAULT (0), "seasonNumber" integer, "episodeNumber" integer, "titleId" varchar)`);
        await queryRunner.query(`INSERT INTO "media"("id", "progress", "watched", "seasonNumber", "episodeNumber", "titleId") SELECT "id", "progress", "watched", "seasonNumber", "episodeNumber", "titleId" FROM "temporary_media"`);
        await queryRunner.query(`DROP TABLE "temporary_media"`);
        await queryRunner.query(`ALTER TABLE "my_list_item" RENAME TO "temporary_my_list_item"`);
        await queryRunner.query(`CREATE TABLE "my_list_item" ("id" varchar PRIMARY KEY NOT NULL, "tmdbId" integer NOT NULL, "userId" varchar, CONSTRAINT "UQ_a14dd1370f05c5feffe21f043e9" UNIQUE ("tmdbId"))`);
        await queryRunner.query(`INSERT INTO "my_list_item"("id", "tmdbId", "userId") SELECT "id", "tmdbId", "userId" FROM "temporary_my_list_item"`);
        await queryRunner.query(`DROP TABLE "temporary_my_list_item"`);
        await queryRunner.query(`DROP TABLE "title"`);
        await queryRunner.query(`DROP TABLE "media"`);
        await queryRunner.query(`DROP TABLE "my_list_item"`);
    }

}
