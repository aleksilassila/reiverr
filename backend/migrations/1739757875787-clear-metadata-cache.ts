import { MigrationInterface, QueryRunner } from 'typeorm';

export class ClearMetadataCache1739757875787 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Drop all rows in SERIES table
    await queryRunner.query('DELETE FROM "series"');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
