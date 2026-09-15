import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixUserIsActiveDefault1788200000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // `is_active` is the admin-controlled "account enabled" flag (see
    // UsersController lock/unlock/activate/deactivate and
    // NotificationsService's active-recipient queries) — it must default to
    // enabled. It previously defaulted to false and was never set on
    // self-registration/Google signup/seed data, so every such account
    // showed as "Inactive" until auth.service.ts's login/logout handlers
    // (incorrectly reusing this same column as a session-liveness flag)
    // flipped it back and forth.
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "is_active" SET DEFAULT true`,
    );
    await queryRunner.query(
      `UPDATE "users" SET "is_active" = true WHERE "is_active" = false`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "is_active" SET DEFAULT false`,
    );
  }
}
