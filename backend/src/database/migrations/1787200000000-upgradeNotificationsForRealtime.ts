import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpgradeNotificationsForRealtime1787200000000 implements MigrationInterface {
  name = 'UpgradeNotificationsForRealtime1787200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "notifications" RENAME COLUMN "is_notified" TO "is_read"`,
    );
    await queryRunner.query(
      `ALTER TABLE "notifications" ADD "type" character varying NOT NULL DEFAULT 'MANUAL'`,
    );
    await queryRunner.query(
      `ALTER TABLE "notifications" ADD "action_url" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "notifications" ADD "metadata" jsonb NOT NULL DEFAULT '{}'::jsonb`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_notifications_user_read_created" ON "notifications" ("user_id", "is_read", "created_at") WHERE "deleted_at" IS NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_notifications_user_read_created"`);
    await queryRunner.query(
      `ALTER TABLE "notifications" DROP COLUMN "metadata"`,
    );
    await queryRunner.query(
      `ALTER TABLE "notifications" DROP COLUMN "action_url"`,
    );
    await queryRunner.query(`ALTER TABLE "notifications" DROP COLUMN "type"`);
    await queryRunner.query(
      `ALTER TABLE "notifications" RENAME COLUMN "is_read" TO "is_notified"`,
    );
  }
}
