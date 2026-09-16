import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * DoctorsService.getSuggestions ranks doctor-name autocomplete matches with
 * pg_trgm's similarity(), which requires the extension to be enabled. The
 * GIN trigram index on the raw "fullname" column accelerates similarity/LIKE
 * lookups against that column; the UNACCENT()-wrapped branch of the query
 * (for accent-insensitive matches like "nguyen" -> "Nguyễn") still runs as a
 * sequential scan, same cost class as the existing (also unindexed)
 * specialties.name search in SpecialtiesService.filterAndPagination.
 */
export class AddDoctorFullnameTrigramSearch1788600000000 implements MigrationInterface {
  name = 'AddDoctorFullnameTrigramSearch1788600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS pg_trgm;`);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_users_fullname_trgm ON users USING GIN (fullname gin_trgm_ops);`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_users_fullname_trgm;`);
    await queryRunner.query(`DROP EXTENSION IF EXISTS pg_trgm;`);
  }
}
