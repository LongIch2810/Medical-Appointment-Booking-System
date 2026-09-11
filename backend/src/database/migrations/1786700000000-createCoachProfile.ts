import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCoachProfile1786700000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "coach_profile" (
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
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "coach_profile";`);
  }
}
