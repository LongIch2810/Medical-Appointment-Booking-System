import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddChatTurnIdempotency1789300000000
  implements MigrationInterface
{
  name = 'AddChatTurnIdempotency1789300000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "ai_report_conversations" ADD COLUMN IF NOT EXISTS "client_request_id" uuid',
    );
    await queryRunner.query(
      'ALTER TABLE "ai_report_messages" ADD COLUMN IF NOT EXISTS "turn_id" uuid',
    );
    await queryRunner.query(
      'CREATE UNIQUE INDEX IF NOT EXISTS "UQ_ai_report_conversations_owner_request" ON "ai_report_conversations" ("created_by_user_id", "client_request_id") WHERE "client_request_id" IS NOT NULL',
    );
    await queryRunner.query(
      'CREATE UNIQUE INDEX IF NOT EXISTS "UQ_ai_report_messages_conversation_turn_role" ON "ai_report_messages" ("conversation_id", "turn_id", "role") WHERE "turn_id" IS NOT NULL',
    );
    await queryRunner.query(
      'CREATE UNIQUE INDEX IF NOT EXISTS "UQ_patient_chat_messages_conversation_turn_role" ON "patient_chat_messages" ("conversation_id", "turn_id", "role") WHERE "turn_id" IS NOT NULL',
    );
    await queryRunner.query(
      'UPDATE "patient_chat_conversations" AS conversation\n' +
        "SET \"title\" = 'Cuộc trò chuyện mới'\n" +
        "WHERE conversation.\"title\" <> 'Cuộc trò chuyện mới'\n" +
        'AND NOT EXISTS (SELECT 1 FROM "patient_chat_messages" AS message ' +
        'WHERE message."conversation_id" = conversation."id")',
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'DROP INDEX IF EXISTS "UQ_patient_chat_messages_conversation_turn_role"',
    );
    await queryRunner.query(
      'DROP INDEX IF EXISTS "UQ_ai_report_messages_conversation_turn_role"',
    );
    await queryRunner.query(
      'DROP INDEX IF EXISTS "UQ_ai_report_conversations_owner_request"',
    );
    await queryRunner.query(
      'ALTER TABLE "ai_report_messages" DROP COLUMN IF EXISTS "turn_id"',
    );
    await queryRunner.query(
      'ALTER TABLE "ai_report_conversations" DROP COLUMN IF EXISTS "client_request_id"',
    );
  }
}
