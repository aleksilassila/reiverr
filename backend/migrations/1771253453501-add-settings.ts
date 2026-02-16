import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSettings1771253453501 implements MigrationInterface {
  name = 'AddSettings1771253453501';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "settings" ("key" varchar PRIMARY KEY NOT NULL, "value" json NOT NULL, "updatedAt" datetime NOT NULL DEFAULT (datetime('now')))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "settings"`);
  }
}
