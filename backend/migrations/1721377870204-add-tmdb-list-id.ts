import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTmdbListId1721377870204 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`UPDATE "user"
                                 SET "settings" = json_set("settings", '$.tmdb.libraryListId', json('""'));`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`UPDATE "user"
                                 SET "settings" = json_remove("settings", '$.tmdb.libraryListId');`);
  }
}
