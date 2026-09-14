import { QueryRunner } from 'typeorm';
import { RemoveCoachProfile1787800000000 } from 'src/database/migrations/1787800000000-removeCoachProfile';

describe('RemoveCoachProfile1787800000000', () => {
  function createQueryRunner(hasChatbotRole = true) {
    const query = jest.fn(async (sql: string) => {
      if (sql.includes('SELECT EXISTS')) return [{ exists: hasChatbotRole }];
      return [];
    });

    return {
      query,
      runner: { query } as unknown as QueryRunner,
    };
  }

  it('removes the coach profile table and exposes roadmap reporting views', async () => {
    const { query, runner } = createQueryRunner();

    await new RemoveCoachProfile1787800000000().up(runner);

    const sql = query.mock.calls.map(([statement]) => statement).join('\n');
    expect(sql).toContain(
      'DROP VIEW IF EXISTS "chatbot_report_coach_profiles_view"',
    );
    expect(sql).toContain(
      'CREATE OR REPLACE VIEW "chatbot_report_health_profiles_view"',
    );
    expect(sql).toContain(
      'CREATE OR REPLACE VIEW "chatbot_report_health_roadmaps_view"',
    );
    expect(sql).toContain(
      'DELETE FROM "permissions" WHERE "name" = \'coach-profile:manage\'',
    );
    expect(sql).toContain('DROP TABLE IF EXISTS "coach_profile" CASCADE');
    expect(sql).toContain(
      'GRANT SELECT ON "chatbot_report_health_roadmaps_view"',
    );
  });

  it('does not issue grants when the chatbot database role is absent', async () => {
    const { query, runner } = createQueryRunner(false);

    await new RemoveCoachProfile1787800000000().up(runner);

    const sql = query.mock.calls.map(([statement]) => statement).join('\n');
    expect(sql).not.toContain('GRANT SELECT');
  });
});
