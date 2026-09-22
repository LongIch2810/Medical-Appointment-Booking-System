import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAiReportAssistant1788700000000 implements MigrationInterface {
  name = 'CreateAiReportAssistant1788700000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "ai_report_conversations" (
        "id" SERIAL NOT NULL,
        "created_by_user_id" integer NOT NULL,
        "title" character varying(160) NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP,
        CONSTRAINT "PK_ai_report_conversations_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_ai_report_conversations_owner" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_ai_report_conversations_owner_updated"
      ON "ai_report_conversations" ("created_by_user_id", "updated_at" DESC)
    `);
    await queryRunner.query(`
      CREATE TABLE "ai_report_messages" (
        "id" SERIAL NOT NULL,
        "conversation_id" integer NOT NULL,
        "role" character varying(16) NOT NULL,
        "action" character varying(32),
        "content" text NOT NULL,
        "plan" jsonb,
        "report_id" integer,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_ai_report_messages_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_ai_report_messages_conversation" FOREIGN KEY ("conversation_id") REFERENCES "ai_report_conversations"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_ai_report_messages_report" FOREIGN KEY ("report_id") REFERENCES "ai_admin_reports"("id") ON DELETE SET NULL,
        CONSTRAINT "CHK_ai_report_messages_role" CHECK ("role" IN ('USER', 'ASSISTANT'))
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_ai_report_messages_conversation_id"
      ON "ai_report_messages" ("conversation_id", "id" DESC)
    `);
    await queryRunner.query(`
      ALTER TABLE "ai_admin_reports"
        ADD COLUMN "conversation_id" integer,
        ADD COLUMN "source_request" text,
        ADD CONSTRAINT "FK_ai_admin_reports_conversation"
          FOREIGN KEY ("conversation_id") REFERENCES "ai_report_conversations"("id") ON DELETE SET NULL
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "ai_admin_reports" DROP CONSTRAINT "FK_ai_admin_reports_conversation", DROP COLUMN "source_request", DROP COLUMN "conversation_id"`,
    );
    await queryRunner.query(`DROP TABLE "ai_report_messages"`);
    await queryRunner.query(`DROP TABLE "ai_report_conversations"`);
  }
}
