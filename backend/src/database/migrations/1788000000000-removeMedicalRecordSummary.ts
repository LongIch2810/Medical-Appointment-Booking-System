import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveMedicalRecordSummary1788000000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP TABLE IF EXISTS "ai_medical_record_summaries" CASCADE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "ai_medical_record_summaries" (
        "id" SERIAL NOT NULL,
        "user_id" integer NOT NULL,
        "summary" text NOT NULL,
        "input_mode" character varying(20) NOT NULL,
        "source_assets" jsonb NOT NULL DEFAULT '[]',
        "output_asset" jsonb NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP,
        CONSTRAINT "PK_ai_medical_record_summaries_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_ai_medical_record_summaries_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_ai_medical_record_summaries_user_created_at" ON "ai_medical_record_summaries" ("user_id", "created_at")`,
    );
  }
}
