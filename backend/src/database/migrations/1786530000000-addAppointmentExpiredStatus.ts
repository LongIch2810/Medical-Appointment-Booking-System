import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAppointmentExpiredStatus1786530000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "public"."appointment_status" ADD VALUE IF NOT EXISTS 'EXPIRED'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `UPDATE "appointments" SET "status" = 'ABSENT' WHERE "status" = 'EXPIRED'`,
    );
    await queryRunner.query(
      `ALTER TABLE "appointments" ALTER COLUMN "status" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."appointment_status" RENAME TO "appointment_status_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."appointment_status" AS ENUM('PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'ABSENT')`,
    );
    await queryRunner.query(
      `ALTER TABLE "appointments" ALTER COLUMN "status" TYPE "public"."appointment_status" USING "status"::text::"public"."appointment_status"`,
    );
    await queryRunner.query(
      `ALTER TABLE "appointments" ALTER COLUMN "status" SET DEFAULT 'PENDING'`,
    );
    await queryRunner.query(`DROP TYPE "public"."appointment_status_old"`);
  }
}
