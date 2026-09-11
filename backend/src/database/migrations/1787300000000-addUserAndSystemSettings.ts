import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserAndSystemSettings1787300000000 implements MigrationInterface {
  name = 'AddUserAndSystemSettings1787300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user_settings" RENAME COLUMN "is_notification_email" TO "email_notifications_enabled"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_settings" RENAME COLUMN "is_reminder_appoinments" TO "appointment_reminders_enabled"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_settings" ADD "realtime_toasts_enabled" boolean NOT NULL DEFAULT true`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_settings" ADD "theme" character varying NOT NULL DEFAULT 'SYSTEM'`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_settings" ADD CONSTRAINT "CHK_user_settings_theme" CHECK ("theme" IN ('SYSTEM', 'LIGHT', 'DARK'))`,
    );
    await queryRunner.query(`
      INSERT INTO "user_settings" (
        "email_notifications_enabled",
        "appointment_reminders_enabled",
        "realtime_toasts_enabled",
        "theme",
        "user_id"
      )
      SELECT true, true, true, 'SYSTEM', u."id"
      FROM "users" u
      LEFT JOIN "user_settings" us ON us."user_id" = u."id"
      WHERE us."id" IS NULL AND u."deleted_at" IS NULL
    `);
    await queryRunner.query(
      `ALTER TABLE "user_settings" ALTER COLUMN "user_id" SET NOT NULL`,
    );

    await queryRunner.query(
      `ALTER TABLE "system_configs" ALTER COLUMN "reminder_appointment_before_minutes" SET DEFAULT 1440`,
    );
    await queryRunner.query(
      `UPDATE "system_configs" SET "reminder_appointment_before_minutes" = 1440 WHERE "reminder_appointment_before_minutes" = 60`,
    );
    await queryRunner.query(
      `ALTER TABLE "system_configs" ADD "appointment_reminders_enabled" boolean NOT NULL DEFAULT true`,
    );
    await queryRunner.query(
      `ALTER TABLE "system_configs" ADD "appointment_emails_enabled" boolean NOT NULL DEFAULT true`,
    );
    await queryRunner.query(
      `ALTER TABLE "system_configs" ADD "default_realtime_toasts_enabled" boolean NOT NULL DEFAULT true`,
    );
    await queryRunner.query(
      `ALTER TABLE "system_configs" ADD "default_email_notifications_enabled" boolean NOT NULL DEFAULT true`,
    );
    await queryRunner.query(
      `ALTER TABLE "system_configs" ADD "default_appointment_reminders_enabled" boolean NOT NULL DEFAULT true`,
    );
    await queryRunner.query(`
      INSERT INTO "system_configs" (
        "reminder_appointment_before_minutes",
        "reminder_update_health_profile_after_minutes"
      )
      SELECT 1440, 60
      WHERE NOT EXISTS (SELECT 1 FROM "system_configs")
    `);

    await queryRunner.query(
      `ALTER TABLE "notifications" ADD "dedupe_key" text`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_notifications_dedupe_key" ON "notifications" ("dedupe_key") WHERE "dedupe_key" IS NOT NULL`,
    );

    await queryRunner.query(`
      INSERT INTO "role_permissions" ("role_id", "permission_id")
      SELECT r.id, p.id
      FROM "roles" r
      CROSS JOIN "permissions" p
      WHERE r."deleted_at" IS NULL
        AND p."deleted_at" IS NULL
        AND p."name" IN (
          'setting:read',
          'setting:update',
          'notification:read'
        )
        AND NOT EXISTS (
          SELECT 1
          FROM "role_permissions" rp
          WHERE rp."role_id" = r.id
            AND rp."permission_id" = p.id
        )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_notifications_dedupe_key"`);
    await queryRunner.query(
      `ALTER TABLE "notifications" DROP COLUMN "dedupe_key"`,
    );
    await queryRunner.query(
      `ALTER TABLE "system_configs" DROP COLUMN "default_appointment_reminders_enabled"`,
    );
    await queryRunner.query(
      `ALTER TABLE "system_configs" DROP COLUMN "default_email_notifications_enabled"`,
    );
    await queryRunner.query(
      `ALTER TABLE "system_configs" DROP COLUMN "default_realtime_toasts_enabled"`,
    );
    await queryRunner.query(
      `ALTER TABLE "system_configs" DROP COLUMN "appointment_emails_enabled"`,
    );
    await queryRunner.query(
      `ALTER TABLE "system_configs" DROP COLUMN "appointment_reminders_enabled"`,
    );
    await queryRunner.query(
      `ALTER TABLE "system_configs" ALTER COLUMN "reminder_appointment_before_minutes" SET DEFAULT 60`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_settings" ALTER COLUMN "user_id" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_settings" DROP CONSTRAINT "CHK_user_settings_theme"`,
    );
    await queryRunner.query(`ALTER TABLE "user_settings" DROP COLUMN "theme"`);
    await queryRunner.query(
      `ALTER TABLE "user_settings" DROP COLUMN "realtime_toasts_enabled"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_settings" RENAME COLUMN "appointment_reminders_enabled" TO "is_reminder_appoinments"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_settings" RENAME COLUMN "email_notifications_enabled" TO "is_notification_email"`,
    );
  }
}
