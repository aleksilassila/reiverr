import { MigrationInterface, QueryRunner } from 'typeorm';

export class RenameMediatype1743155964012 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    queryRunner.query(
      `UPDATE library_item SET mediaType = 'movie' WHERE mediaType = 'Movie';`,
    );
    queryRunner.query(
      `UPDATE library_item SET mediaType = 'series' WHERE mediaType = 'Series';`,
    );
    queryRunner.query(
      `UPDATE library_item SET mediaType = 'episode' WHERE mediaType = 'Episode';`,
    );
    queryRunner.query(
      `UPDATE play_state SET mediaType = 'movie' WHERE mediaType = 'Movie';`,
    );
    queryRunner.query(
      `UPDATE play_state SET mediaType = 'series' WHERE mediaType = 'Series';`,
    );
    queryRunner.query(
      `UPDATE play_state SET mediaType = 'episode' WHERE mediaType = 'Episode';`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    queryRunner.query(
      `UPDATE library_item SET mediaType = 'Movie' WHERE mediaType = 'movie';`,
    );
    queryRunner.query(
      `UPDATE library_item SET mediaType = 'Series' WHERE mediaType = 'series';`,
    );
    queryRunner.query(
      `UPDATE library_item SET mediaType = 'Episode' WHERE mediaType = 'episode';`,
    );
    queryRunner.query(
      `UPDATE play_state SET mediaType = 'Movie' WHERE mediaType = 'movie';`,
    );
    queryRunner.query(
      `UPDATE play_state SET mediaType = 'Series' WHERE mediaType = 'series';`,
    );
    queryRunner.query(
      `UPDATE play_state SET mediaType = 'Episode' WHERE mediaType = 'episode';`,
    );
  }
}
