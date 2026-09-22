import { QueryRunner } from 'typeorm';
import { CreatePatientChatAssistant1789000000000 } from 'src/database/migrations/1789000000000-createPatientChatAssistant';

describe('CreatePatientChatAssistant1789000000000', () => {
  function createQueryRunner() {
    const query = jest.fn(async (_statement: string) => []);
    return { query, runner: { query } as unknown as QueryRunner };
  }

  it('creates patient-owned conversation/message tables and booking idempotency columns', async () => {
    const { query, runner } = createQueryRunner();
    await new CreatePatientChatAssistant1789000000000().up(runner);
    const sql = query.mock.calls.map(([statement]) => statement).join('\n');
    expect(sql).toContain('CREATE TABLE "patient_chat_conversations"');
    expect(sql).toContain('REFERENCES "users"("id") ON DELETE CASCADE');
    expect(sql).toContain('("user_id", "updated_at" DESC)');
    expect(sql).toContain('CREATE TABLE "patient_chat_messages"');
    expect(sql).toContain('"payload" jsonb');
    expect(sql).toContain('"appointment_id" integer');
    expect(sql).toContain('"turn_id" uuid');
    expect(sql).toContain('("conversation_id", "id" DESC)');
    expect(sql).toContain('"ai_booking_operation_id" uuid');
    expect(sql).toContain('"patient_chat_conversation_id" integer');
    expect(sql).toContain(
      'CREATE UNIQUE INDEX "UQ_appointments_ai_booking_operation_id"',
    );
  });

  it('rolls back only tables and additive appointment columns from this migration', async () => {
    const { query, runner } = createQueryRunner();
    await new CreatePatientChatAssistant1789000000000().down(runner);
    const sql = query.mock.calls.map(([statement]) => statement).join('\n');
    expect(sql).toContain('DROP COLUMN "patient_chat_conversation_id"');
    expect(sql).toContain('DROP COLUMN "ai_booking_operation_id"');
    expect(sql).toContain('DROP TABLE "patient_chat_messages"');
    expect(sql).toContain('DROP TABLE "patient_chat_conversations"');
    expect(sql).not.toContain('DROP TABLE "appointments"');
  });
});
