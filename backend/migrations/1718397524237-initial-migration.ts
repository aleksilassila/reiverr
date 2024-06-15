import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialMigration1718397524237 implements MigrationInterface {
  name = 'InitialMigration1718397524237';

  public async up(queryRunner: QueryRunner): Promise<void> {
    try {
      await queryRunner.query(
        `CREATE TABLE "user" ("id" varchar PRIMARY KEY NOT NULL, "name" varchar NOT NULL, "password" varchar NOT NULL, "isAdmin" boolean NOT NULL DEFAULT (0), "onboardingDone" boolean NOT NULL DEFAULT (0), "settings" json NOT NULL DEFAULT ('{"autoplayTrailers":true,"language":"en","animationDuration":300,"sonarr":{"apiKey":"","baseUrl":"","qualityProfileId":0,"rootFolderPath":"","languageProfileId":0},"radarr":{"apiKey":"","baseUrl":"","qualityProfileId":0,"rootFolderPath":""},"jellyfin":{"apiKey":"","baseUrl":"","userId":""},"tmdb":{"sessionId":"","userId":""}}'), CONSTRAINT "UQ_065d4d8f3b5adb4a08841eae3c8" UNIQUE ("name"))`,
      );
    } catch (ignored) {}
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "user"`);
  }
}
