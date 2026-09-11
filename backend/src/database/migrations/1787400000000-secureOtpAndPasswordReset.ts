import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Thiết kế lại luồng reset password (item P0):
 *  - otps: thay "otpCode" plaintext (unique) bằng "otp_hash" (bcrypt hash),
 *    thêm "purpose"/"attempts"/"consumed_at" để verify OTP có kiểm tra hash,
 *    hạn mức thử, và trạng thái đã dùng — thay vì không lưu gì cả.
 *  - reset_tokens: token ngắn hạn, dùng một lần, chỉ được cấp SAU KHI verify
 *    OTP thành công; set-new-password bắt buộc token này, không còn chỉ dựa
 *    vào email.
 */
export class SecureOtpAndPasswordReset1787400000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "otps" DROP CONSTRAINT IF EXISTS "UQ_20c5c6d5587eee065b40941a785"`,
    );
    await queryRunner.query(
      `ALTER TABLE "otps" DROP COLUMN IF EXISTS "otpCode"`,
    );
    await queryRunner.query(
      `ALTER TABLE "otps" DROP COLUMN IF EXISTS "verified"`,
    );
    await queryRunner.query(
      `ALTER TABLE "otps" ADD COLUMN IF NOT EXISTS "otp_hash" text NOT NULL DEFAULT ''`,
    );
    await queryRunner.query(
      `ALTER TABLE "otps" ALTER COLUMN "otp_hash" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "otps" ADD COLUMN IF NOT EXISTS "purpose" text NOT NULL DEFAULT 'PASSWORD_RESET'`,
    );
    await queryRunner.query(
      `ALTER TABLE "otps" ADD COLUMN IF NOT EXISTS "attempts" integer NOT NULL DEFAULT 0`,
    );
    await queryRunner.query(
      `ALTER TABLE "otps" ADD COLUMN IF NOT EXISTS "consumed_at" TIMESTAMP`,
    );

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "reset_tokens" (
        "id" SERIAL NOT NULL,
        "token_hash" text NOT NULL,
        "purpose" text NOT NULL DEFAULT 'PASSWORD_RESET',
        "expiresAt" TIMESTAMP NOT NULL,
        "consumed_at" TIMESTAMP,
        "user_id" integer NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_reset_tokens_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `ALTER TABLE "reset_tokens" ADD CONSTRAINT "FK_reset_tokens_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_reset_tokens_user_id" ON "reset_tokens" ("user_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "reset_tokens"`);

    await queryRunner.query(
      `ALTER TABLE "otps" DROP COLUMN IF EXISTS "consumed_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "otps" DROP COLUMN IF EXISTS "attempts"`,
    );
    await queryRunner.query(
      `ALTER TABLE "otps" DROP COLUMN IF EXISTS "purpose"`,
    );
    await queryRunner.query(
      `ALTER TABLE "otps" DROP COLUMN IF EXISTS "otp_hash"`,
    );
    await queryRunner.query(
      `ALTER TABLE "otps" ADD COLUMN IF NOT EXISTS "verified" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "otps" ADD COLUMN IF NOT EXISTS "otpCode" text NOT NULL DEFAULT ''`,
    );
    await queryRunner.query(
      `ALTER TABLE "otps" ALTER COLUMN "otpCode" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "otps" ADD CONSTRAINT "UQ_20c5c6d5587eee065b40941a785" UNIQUE ("otpCode")`,
    );
  }
}
