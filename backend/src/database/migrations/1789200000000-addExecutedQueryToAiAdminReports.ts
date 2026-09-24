import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddExecutedQueryToAiAdminReports1789200000000
  implements MigrationInterface
{
  name = 'AddExecutedQueryToAiAdminReports1789200000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "ai_admin_reports" ADD COLUMN "executed_query" text',
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "ai_admin_reports" DROP COLUMN "executed_query"',
    );
  }
}
