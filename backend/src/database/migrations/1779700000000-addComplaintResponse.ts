import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddComplaintResponse1779700000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "complaints" ADD COLUMN IF NOT EXISTS "response" text`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "complaints" DROP COLUMN IF EXISTS "response"`,
    );
  }
}
