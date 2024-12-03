import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProfilePicture1718397928862 implements MigrationInterface {
  name = 'AddProfilePicture1718397928862';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "temporary_user" ("id" varchar PRIMARY KEY NOT NULL, "name" varchar NOT NULL, "password" varchar NOT NULL, "isAdmin" boolean NOT NULL DEFAULT (0), "onboardingDone" boolean NOT NULL DEFAULT (0), "settings" json NOT NULL DEFAULT ('{"autoplayTrailers":true,"language":"en","animationDuration":300,"sonarr":{"apiKey":"","baseUrl":"","qualityProfileId":0,"rootFolderPath":"","languageProfileId":0},"radarr":{"apiKey":"","baseUrl":"","qualityProfileId":0,"rootFolderPath":""},"jellyfin":{"apiKey":"","baseUrl":"","userId":""},"tmdb":{"sessionId":"","userId":""}}'), "profilePicture" blob, CONSTRAINT "UQ_065d4d8f3b5adb4a08841eae3c8" UNIQUE ("name"))`,
    );
    await queryRunner.query(
      `INSERT INTO "temporary_user"("id", "name", "password", "isAdmin", "onboardingDone", "settings") SELECT "id", "name", "password", "isAdmin", "onboardingDone", "settings" FROM "user"`,
    );
    await queryRunner.query(`DROP TABLE "user"`);
    await queryRunner.query(`ALTER TABLE "temporary_user" RENAME TO "user"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user" RENAME TO "temporary_user"`);
    await queryRunner.query(
      `CREATE TABLE "user" ("id" varchar PRIMARY KEY NOT NULL, "name" varchar NOT NULL, "password" varchar NOT NULL, "isAdmin" boolean NOT NULL DEFAULT (0), "onboardingDone" boolean NOT NULL DEFAULT (0), "settings" json NOT NULL DEFAULT ('{"autoplayTrailers":true,"language":"en","animationDuration":300,"sonarr":{"apiKey":"","baseUrl":"","qualityProfileId":0,"rootFolderPath":"","languageProfileId":0},"radarr":{"apiKey":"","baseUrl":"","qualityProfileId":0,"rootFolderPath":""},"jellyfin":{"apiKey":"","baseUrl":"","userId":""},"tmdb":{"sessionId":"","userId":""}}'), CONSTRAINT "UQ_065d4d8f3b5adb4a08841eae3c8" UNIQUE ("name"))`,
    );
    await queryRunner.query(
      `INSERT INTO "user"("id", "name", "password", "isAdmin", "onboardingDone", "settings") SELECT "id", "name", "password", "isAdmin", "onboardingDone", "settings" FROM "temporary_user"`,
    );
    await queryRunner.query(`DROP TABLE "temporary_user"`);
  }
}
