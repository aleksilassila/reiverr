import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRequests1790616662318 implements MigrationInterface {
  name = 'AddRequests1790616662318';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "request" ("id" varchar PRIMARY KEY NOT NULL, "userId" varchar NOT NULL, "tmdbId" varchar NOT NULL, "mediaType" varchar NOT NULL, "season" integer NOT NULL DEFAULT (0), "episode" integer NOT NULL DEFAULT (0), "approved" boolean NOT NULL DEFAULT (0), "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), CONSTRAINT "UQ_18b58dffa9a966df943722c3179" UNIQUE ("userId", "tmdbId", "season", "episode"), CONSTRAINT "FK_38554ade327a061ba620eee948b" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "request"`);
  }
}
