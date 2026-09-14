import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveCoachProfile1787800000000 implements MigrationInterface {
  private async hasChatbotRole(queryRunner: QueryRunner): Promise<boolean> {
    const [result] = await queryRunner.query(
      `SELECT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'chatbot_readonly') AS "exists"`,
    );
    return result?.exists === true;
  }

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP VIEW IF EXISTS "chatbot_report_coach_profiles_view"`,
    );

    await queryRunner.query(`
      CREATE OR REPLACE VIEW "chatbot_report_health_profiles_view"
      WITH (security_barrier = true) AS
      SELECT
        "created_at"::date AS profile_date,
        COUNT(*)::int AS profile_count,
        CASE WHEN COUNT("height") >= 5 THEN ROUND(AVG("height")::numeric, 2) END AS average_height,
        CASE WHEN COUNT("weight") >= 5 THEN ROUND(AVG("weight")::numeric, 2) END AS average_weight,
        CASE WHEN COUNT("heart_rate") >= 5 THEN ROUND(AVG("heart_rate")::numeric, 2) END AS average_heart_rate,
        CASE WHEN COUNT("glucose_level") >= 5 THEN ROUND(AVG("glucose_level")::numeric, 2) END AS average_glucose_level,
        CASE WHEN COUNT("cholesterol_level") >= 5 THEN ROUND(AVG("cholesterol_level")::numeric, 2) END AS average_cholesterol_level
      FROM "health_profile"
      WHERE "deleted_at" IS NULL
      GROUP BY "created_at"::date
    `);

    await queryRunner.query(`
      CREATE OR REPLACE VIEW "chatbot_report_health_roadmaps_view"
      WITH (security_barrier = true) AS
      SELECT
        "created_at"::date AS roadmap_date,
        COUNT(*)::int AS roadmap_count,
        COUNT(DISTINCT "user_id")::int AS user_count,
        COUNT(DISTINCT "relative_id")::int AS profile_count
      FROM "ai_health_roadmaps"
      WHERE "deleted_at" IS NULL
      GROUP BY "created_at"::date
    `);

    if (await this.hasChatbotRole(queryRunner)) {
      await queryRunner.query(
        `GRANT SELECT ON "chatbot_report_health_profiles_view" TO chatbot_readonly`,
      );
      await queryRunner.query(
        `GRANT SELECT ON "chatbot_report_health_roadmaps_view" TO chatbot_readonly`,
      );
    }

    await queryRunner.query(`
      DELETE FROM "role_permissions"
      WHERE "permission_id" IN (
        SELECT "id" FROM "permissions" WHERE "name" = 'coach-profile:manage'
      )
    `);
    await queryRunner.query(
      `DELETE FROM "permissions" WHERE "name" = 'coach-profile:manage'`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "coach_profile" CASCADE`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP VIEW IF EXISTS "chatbot_report_health_roadmaps_view"`,
    );
    await queryRunner.query(
      `DROP VIEW IF EXISTS "chatbot_report_health_profiles_view"`,
    );

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "coach_profile" (
        "id" SERIAL PRIMARY KEY,
        "display_name" text NOT NULL,
        "health_goal" text NOT NULL,
        "preferences" text,
        "age" integer,
        "height" integer,
        "weight" integer,
        "user_id" integer NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP,
        CONSTRAINT "UQ_coach_profile_user_id" UNIQUE ("user_id"),
        CONSTRAINT "FK_coach_profile_user_id" FOREIGN KEY ("user_id")
          REFERENCES "users" ("id") ON DELETE CASCADE,
        CONSTRAINT "CHK_coach_profile_age" CHECK ("age" IS NULL OR "age" > 0),
        CONSTRAINT "CHK_coach_profile_height" CHECK ("height" IS NULL OR "height" > 0),
        CONSTRAINT "CHK_coach_profile_weight" CHECK ("weight" IS NULL OR "weight" > 0)
      )
    `);

    await queryRunner.query(`
      INSERT INTO "permissions" ("name")
      SELECT 'coach-profile:manage'
      WHERE NOT EXISTS (
        SELECT 1 FROM "permissions" WHERE "name" = 'coach-profile:manage'
      )
    `);
    await queryRunner.query(`
      INSERT INTO "role_permissions" ("role_id", "permission_id")
      SELECT r."id", p."id"
      FROM "roles" r, "permissions" p
      WHERE r."role_name" IN ('PATIENT', 'ADMIN')
        AND p."name" = 'coach-profile:manage'
        AND NOT EXISTS (
          SELECT 1 FROM "role_permissions" rp
          WHERE rp."role_id" = r."id" AND rp."permission_id" = p."id"
        )
    `);

    await queryRunner.query(`
      CREATE OR REPLACE VIEW "chatbot_report_coach_profiles_view"
      WITH (security_barrier = true) AS
      SELECT
        "created_at"::date AS profile_date,
        "health_goal",
        COUNT(*)::int AS profile_count,
        CASE WHEN COUNT("age") >= 5 THEN ROUND(AVG("age")::numeric, 2) END AS average_age,
        CASE WHEN COUNT("height") >= 5 THEN ROUND(AVG("height")::numeric, 2) END AS average_height,
        CASE WHEN COUNT("weight") >= 5 THEN ROUND(AVG("weight")::numeric, 2) END AS average_weight
      FROM "coach_profile"
      WHERE "deleted_at" IS NULL
      GROUP BY "created_at"::date, "health_goal"
    `);

    if (await this.hasChatbotRole(queryRunner)) {
      await queryRunner.query(
        `GRANT SELECT ON "chatbot_report_coach_profiles_view" TO chatbot_readonly`,
      );
    }
  }
}
