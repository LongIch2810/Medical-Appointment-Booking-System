import { MigrationInterface, QueryRunner } from 'typeorm';

export class EditFieldOldDataAndNewDataAuditLog1775114914383
  implements MigrationInterface
{
  name = 'EditFieldOldDataAndNewDataAuditLog1775114914383';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "audit_log" ALTER COLUMN "old_data" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "audit_log" ALTER COLUMN "new_data" DROP NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "audit_log" ALTER COLUMN "new_data" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "audit_log" ALTER COLUMN "old_data" SET NOT NULL`,
    );
  }
}
