import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * SpecialtiesService.filterAndPagination dùng hàm UNACCENT() của Postgres để
 * tìm kiếm chuyên khoa không phân biệt dấu tiếng Việt, nhưng extension
 * "unaccent" chưa từng được bật trên DB — mọi lượt tìm kiếm chuyên khoa theo
 * tên đều crash với lỗi "function unaccent(text) does not exist" (500).
 */
export class EnableUnaccentExtension1788400000000
  implements MigrationInterface
{
  name = 'EnableUnaccentExtension1788400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS unaccent;`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP EXTENSION IF EXISTS unaccent;`);
  }
}
