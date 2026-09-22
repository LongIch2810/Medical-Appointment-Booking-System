import { QueryRunner } from 'typeorm';
import { CreateAiReportAssistant1788700000000 } from 'src/database/migrations/1788700000000-createAiReportAssistant';

describe('CreateAiReportAssistant1788700000000', () => {
  function createQueryRunner() {
    const query = jest.fn(async (_statement: string) => []);
    return { query, runner: { query } as unknown as QueryRunner };
  }

  it('creates owner-scoped conversations, immutable messages, and report links', async () => {
    const { query, runner } = createQueryRunner();

    await new CreateAiReportAssistant1788700000000().up(runner);

    const sql = query.mock.calls.map(([statement]) => statement).join('\n');
    expect(sql).toContain('CREATE TABLE "ai_report_conversations"');
    expect(sql).toContain('"created_by_user_id" integer NOT NULL');
    expect(sql).toContain('REFERENCES "users"("id") ON DELETE CASCADE');
    expect(sql).toContain('("created_by_user_id", "updated_at" DESC)');
    expect(sql).toContain('CREATE TABLE "ai_report_messages"');
    expect(sql).toContain('"plan" jsonb');
    expect(sql).toContain('"report_id" integer');
    expect(sql).toContain(
      'REFERENCES "ai_admin_reports"("id") ON DELETE SET NULL',
    );
    expect(sql).toContain('"conversation_id" integer');
    expect(sql).toContain('"source_request" text');
  });

  it('rolls back only its additive columns and tables', async () => {
    const { query, runner } = createQueryRunner();

    await new CreateAiReportAssistant1788700000000().down(runner);

    expect(query).toHaveBeenCalledTimes(3);
    const sql = query.mock.calls.map(([statement]) => statement).join('\n');
    expect(sql).toContain('DROP COLUMN "source_request"');
    expect(sql).toContain('DROP TABLE "ai_report_messages"');
    expect(sql).toContain('DROP TABLE "ai_report_conversations"');
    expect(sql).not.toContain('DROP TABLE "ai_admin_reports"');
  });
});
