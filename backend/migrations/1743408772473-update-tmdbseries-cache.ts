import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateTmdbSeriesCacheType1743408772473 implements MigrationInterface {
  name = 'UpdateTmdbSeriesCacheType1743408772473';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // For each row in series_metadata set updatedAt to 0
    await queryRunner.query(
      `UPDATE series_metadata SET "updatedAt" = '1980-01-01T00:00:00.000Z'`,
    );
    // await queryRunner.query(`DELETE FROM series_metadata`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Addition is backwards compatible
  }
}
