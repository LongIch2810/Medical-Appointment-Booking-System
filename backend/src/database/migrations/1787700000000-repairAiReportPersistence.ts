import { MigrationInterface, QueryRunner } from 'typeorm';

export class RepairAiReportPersistence1787700000000 implements MigrationInterface {
  name = 'RepairAiReportPersistence1787700000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "ai_admin_reports" (
        "id" SERIAL PRIMARY KEY,
        "created_by_user_id" integer NOT NULL,
        "report_type" character varying(80) NOT NULL,
        "range_preset" character varying(40) NOT NULL,
        "from_date" date NOT NULL,
        "to_date" date NOT NULL,
        "range_label" text NOT NULL,
        "report" jsonb,
        "chart_config" jsonb,
        "table_columns" jsonb NOT NULL DEFAULT '[]'::jsonb,
        "table_rows" jsonb NOT NULL DEFAULT '[]'::jsonb,
        "output_asset" jsonb NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP
      )
    `);
    await queryRunner.query(`
      ALTER TABLE "ai_admin_reports"
        ADD COLUMN IF NOT EXISTS "id" SERIAL,
        ADD COLUMN IF NOT EXISTS "created_by_user_id" integer,
        ADD COLUMN IF NOT EXISTS "report_type" character varying(80),
        ADD COLUMN IF NOT EXISTS "range_preset" character varying(40),
        ADD COLUMN IF NOT EXISTS "from_date" date,
        ADD COLUMN IF NOT EXISTS "to_date" date,
        ADD COLUMN IF NOT EXISTS "range_label" text,
        ADD COLUMN IF NOT EXISTS "report" jsonb,
        ADD COLUMN IF NOT EXISTS "chart_config" jsonb,
        ADD COLUMN IF NOT EXISTS "table_columns" jsonb DEFAULT '[]'::jsonb,
        ADD COLUMN IF NOT EXISTS "table_rows" jsonb DEFAULT '[]'::jsonb,
        ADD COLUMN IF NOT EXISTS "output_asset" jsonb,
        ADD COLUMN IF NOT EXISTS "created_at" TIMESTAMP DEFAULT now(),
        ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMP DEFAULT now(),
        ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMP
    `);
    await queryRunner.query(`
      ALTER TABLE "ai_admin_reports"
        ALTER COLUMN "report_type" TYPE character varying(80) USING "report_type"::character varying(80),
        ALTER COLUMN "range_preset" TYPE character varying(40) USING "range_preset"::character varying(40),
        ALTER COLUMN "from_date" TYPE date USING "from_date"::date,
        ALTER COLUMN "to_date" TYPE date USING "to_date"::date,
        ALTER COLUMN "range_label" TYPE text USING "range_label"::text,
        ALTER COLUMN "report" TYPE jsonb USING "report"::jsonb,
        ALTER COLUMN "chart_config" TYPE jsonb USING "chart_config"::jsonb,
        ALTER COLUMN "table_columns" TYPE jsonb USING "table_columns"::jsonb,
        ALTER COLUMN "table_rows" TYPE jsonb USING "table_rows"::jsonb,
        ALTER COLUMN "output_asset" TYPE jsonb USING "output_asset"::jsonb
    `);
    await queryRunner.query(`
      UPDATE "ai_admin_reports"
      SET "table_columns" = COALESCE("table_columns", '[]'::jsonb),
          "table_rows" = COALESCE("table_rows", '[]'::jsonb),
          "created_at" = COALESCE("created_at", now()),
          "updated_at" = COALESCE("updated_at", now())
    `);
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_constraint
          WHERE conrelid = 'public.ai_admin_reports'::regclass
            AND contype = 'p'
        ) THEN
          ALTER TABLE "ai_admin_reports"
            ADD CONSTRAINT "PK_ai_admin_reports_id" PRIMARY KEY ("id");
        END IF;
      END $$
    `);
    await queryRunner.query(`
      ALTER TABLE "ai_admin_reports"
        ALTER COLUMN "created_by_user_id" SET NOT NULL,
        ALTER COLUMN "report_type" SET NOT NULL,
        ALTER COLUMN "range_preset" SET NOT NULL,
        ALTER COLUMN "from_date" SET NOT NULL,
        ALTER COLUMN "to_date" SET NOT NULL,
        ALTER COLUMN "range_label" SET NOT NULL,
        ALTER COLUMN "table_columns" SET DEFAULT '[]'::jsonb,
        ALTER COLUMN "table_columns" SET NOT NULL,
        ALTER COLUMN "table_rows" SET DEFAULT '[]'::jsonb,
        ALTER COLUMN "table_rows" SET NOT NULL,
        ALTER COLUMN "output_asset" SET NOT NULL,
        ALTER COLUMN "created_at" SET DEFAULT now(),
        ALTER COLUMN "created_at" SET NOT NULL,
        ALTER COLUMN "updated_at" SET DEFAULT now(),
        ALTER COLUMN "updated_at" SET NOT NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "ai_admin_reports"
        DROP CONSTRAINT IF EXISTS "FK_ai_admin_reports_created_by",
        ADD CONSTRAINT "FK_ai_admin_reports_created_by"
          FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id")
          ON DELETE CASCADE
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_ai_admin_reports_created_by_created_at"
      ON "ai_admin_reports" ("created_by_user_id", "created_at")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_ai_admin_reports_report_type_created_at"
      ON "ai_admin_reports" ("report_type", "created_at")
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "ai_health_roadmaps" (
        "id" SERIAL PRIMARY KEY,
        "user_id" integer NOT NULL,
        "relative_id" integer NOT NULL,
        "title" text NOT NULL,
        "output_asset" jsonb NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP
      )
    `);
    await queryRunner.query(`
      ALTER TABLE "ai_health_roadmaps"
        ADD COLUMN IF NOT EXISTS "id" SERIAL,
        ADD COLUMN IF NOT EXISTS "user_id" integer,
        ADD COLUMN IF NOT EXISTS "relative_id" integer,
        ADD COLUMN IF NOT EXISTS "title" text,
        ADD COLUMN IF NOT EXISTS "output_asset" jsonb,
        ADD COLUMN IF NOT EXISTS "created_at" TIMESTAMP DEFAULT now(),
        ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMP DEFAULT now(),
        ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMP
    `);
    await queryRunner.query(`
      ALTER TABLE "ai_health_roadmaps"
        ALTER COLUMN "title" TYPE text USING "title"::text,
        ALTER COLUMN "output_asset" TYPE jsonb USING "output_asset"::jsonb
    `);
    await queryRunner.query(`
      UPDATE "ai_health_roadmaps"
      SET "created_at" = COALESCE("created_at", now()),
          "updated_at" = COALESCE("updated_at", now())
    `);
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_constraint
          WHERE conrelid = 'public.ai_health_roadmaps'::regclass
            AND contype = 'p'
        ) THEN
          ALTER TABLE "ai_health_roadmaps"
            ADD CONSTRAINT "PK_ai_health_roadmaps_id" PRIMARY KEY ("id");
        END IF;
      END $$
    `);
    await queryRunner.query(`
      ALTER TABLE "ai_health_roadmaps"
        ALTER COLUMN "user_id" SET NOT NULL,
        ALTER COLUMN "relative_id" SET NOT NULL,
        ALTER COLUMN "title" SET NOT NULL,
        ALTER COLUMN "output_asset" SET NOT NULL,
        ALTER COLUMN "created_at" SET DEFAULT now(),
        ALTER COLUMN "created_at" SET NOT NULL,
        ALTER COLUMN "updated_at" SET DEFAULT now(),
        ALTER COLUMN "updated_at" SET NOT NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "ai_health_roadmaps"
        DROP CONSTRAINT IF EXISTS "FK_ai_health_roadmaps_user",
        DROP CONSTRAINT IF EXISTS "FK_ai_health_roadmaps_relative",
        ADD CONSTRAINT "FK_ai_health_roadmaps_user"
          FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
        ADD CONSTRAINT "FK_ai_health_roadmaps_relative"
          FOREIGN KEY ("relative_id") REFERENCES "relatives"("id") ON DELETE CASCADE
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_ai_health_roadmaps_user_created_at"
      ON "ai_health_roadmaps" ("user_id", "created_at")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_ai_health_roadmaps_relative_created_at"
      ON "ai_health_roadmaps" ("relative_id", "created_at")
    `);
  }

  async down(): Promise<void> {
    // Repair migration: existing tables/data must remain intact on rollback.
  }
}
