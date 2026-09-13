import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAiDocumentTables1787600000000 implements MigrationInterface {
  name = 'CreateAiDocumentTables1787600000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "ai_admin_reports" (
        "id" SERIAL NOT NULL,
        "created_by_user_id" integer NOT NULL,
        "report_type" character varying(80) NOT NULL,
        "range_preset" character varying(40) NOT NULL,
        "from_date" date NOT NULL,
        "to_date" date NOT NULL,
        "range_label" text NOT NULL,
        "report" jsonb,
        "chart_config" jsonb,
        "table_columns" jsonb NOT NULL DEFAULT '[]',
        "table_rows" jsonb NOT NULL DEFAULT '[]',
        "output_asset" jsonb NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP,
        CONSTRAINT "PK_ai_admin_reports_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_ai_admin_reports_created_by" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_ai_admin_reports_created_by_created_at" ON "ai_admin_reports" ("created_by_user_id", "created_at")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ai_admin_reports_report_type_created_at" ON "ai_admin_reports" ("report_type", "created_at")`,
    );

    await queryRunner.query(`
      CREATE TABLE "ai_health_roadmaps" (
        "id" SERIAL NOT NULL,
        "user_id" integer NOT NULL,
        "relative_id" integer NOT NULL,
        "title" text NOT NULL,
        "output_asset" jsonb NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP,
        CONSTRAINT "PK_ai_health_roadmaps_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_ai_health_roadmaps_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_ai_health_roadmaps_relative" FOREIGN KEY ("relative_id") REFERENCES "relatives"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_ai_health_roadmaps_user_created_at" ON "ai_health_roadmaps" ("user_id", "created_at")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ai_health_roadmaps_relative_created_at" ON "ai_health_roadmaps" ("relative_id", "created_at")`,
    );

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

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "ai_medical_record_summaries"`);
    await queryRunner.query(`DROP TABLE "ai_health_roadmaps"`);
    await queryRunner.query(`DROP TABLE "ai_admin_reports"`);
  }
}
