import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTitleWatched1721338340748 implements MigrationInterface {
    name = 'AddTitleWatched1721338340748'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "temporary_title" ("id" varchar PRIMARY KEY NOT NULL, "tmdbId" integer NOT NULL, "upNext" boolean NOT NULL DEFAULT (0), "isInLibrary" boolean NOT NULL DEFAULT (0), "userId" varchar, "watched" boolean NOT NULL DEFAULT (0), CONSTRAINT "FK_feed27b6c765803cc09d45dd6d0" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "temporary_title"("id", "tmdbId", "upNext", "isInLibrary", "userId") SELECT "id", "tmdbId", "upNext", "isInLibrary", "userId" FROM "title"`);
        await queryRunner.query(`DROP TABLE "title"`);
        await queryRunner.query(`ALTER TABLE "temporary_title" RENAME TO "title"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "title" RENAME TO "temporary_title"`);
        await queryRunner.query(`CREATE TABLE "title" ("id" varchar PRIMARY KEY NOT NULL, "tmdbId" integer NOT NULL, "upNext" boolean NOT NULL DEFAULT (0), "isInLibrary" boolean NOT NULL DEFAULT (0), "userId" varchar, CONSTRAINT "FK_feed27b6c765803cc09d45dd6d0" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "title"("id", "tmdbId", "upNext", "isInLibrary", "userId") SELECT "id", "tmdbId", "upNext", "isInLibrary", "userId" FROM "temporary_title"`);
        await queryRunner.query(`DROP TABLE "temporary_title"`);
    }

}
