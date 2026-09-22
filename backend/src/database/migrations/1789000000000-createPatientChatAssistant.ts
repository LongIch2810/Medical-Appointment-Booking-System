import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePatientChatAssistant1789000000000 implements MigrationInterface {
  name = 'CreatePatientChatAssistant1789000000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "patient_chat_conversations" (
        "id" SERIAL NOT NULL,
        "user_id" integer NOT NULL,
        "title" character varying(160) NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP,
        CONSTRAINT "PK_patient_chat_conversations" PRIMARY KEY ("id"),
        CONSTRAINT "FK_patient_chat_conversations_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_patient_chat_conversations_owner_updated"
      ON "patient_chat_conversations" ("user_id", "updated_at" DESC)
    `);
    await queryRunner.query(`
      CREATE TABLE "patient_chat_messages" (
        "id" SERIAL NOT NULL,
        "conversation_id" integer NOT NULL,
        "role" character varying(16) NOT NULL,
        "action" character varying(32),
        "content" text NOT NULL,
        "payload" jsonb,
        "appointment_id" integer,
        "turn_id" uuid,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_patient_chat_messages" PRIMARY KEY ("id"),
        CONSTRAINT "FK_patient_chat_messages_conversation" FOREIGN KEY ("conversation_id") REFERENCES "patient_chat_conversations"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_patient_chat_messages_appointment" FOREIGN KEY ("appointment_id") REFERENCES "appointments"("id") ON DELETE SET NULL,
        CONSTRAINT "CHK_patient_chat_messages_role" CHECK ("role" IN ('USER', 'ASSISTANT')),
        CONSTRAINT "CHK_patient_chat_messages_action" CHECK ("action" IS NULL OR "action" IN ('ANSWER', 'CLARIFY', 'BOOKING_APPROVAL', 'BOOKING_CONFIRMED', 'BOOKING_CANCELLED', 'MEMORY_RESULT', 'REFUSE'))
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_patient_chat_messages_conversation_id"
      ON "patient_chat_messages" ("conversation_id", "id" DESC)
    `);
    await queryRunner.query(`
      ALTER TABLE "appointments"
        ADD COLUMN "ai_booking_operation_id" uuid,
        ADD COLUMN "patient_chat_conversation_id" integer,
        ADD CONSTRAINT "FK_appointments_patient_chat_conversation"
          FOREIGN KEY ("patient_chat_conversation_id") REFERENCES "patient_chat_conversations"("id") ON DELETE SET NULL
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_appointments_ai_booking_operation_id"
      ON "appointments" ("ai_booking_operation_id")
      WHERE "ai_booking_operation_id" IS NOT NULL
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "UQ_appointments_ai_booking_operation_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "appointments" DROP CONSTRAINT "FK_appointments_patient_chat_conversation"`,
    );
    await queryRunner.query(
      `ALTER TABLE "appointments" DROP COLUMN "patient_chat_conversation_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "appointments" DROP COLUMN "ai_booking_operation_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "IDX_patient_chat_messages_conversation_id"`,
    );
    await queryRunner.query(`DROP TABLE "patient_chat_messages"`);
    await queryRunner.query(
      `DROP INDEX "IDX_patient_chat_conversations_owner_updated"`,
    );
    await queryRunner.query(`DROP TABLE "patient_chat_conversations"`);
  }
}
