import { QueryRunner } from 'typeorm';
import { SetupLangGraphPersistence1788800000000 } from 'src/database/migrations/1788800000000-setupLangGraphPersistence';

describe('SetupLangGraphPersistence1788800000000', () => {
  const originalPassword = process.env.LANGGRAPH_DB_PASSWORD;
  const originalUser = process.env.LANGGRAPH_DB_USER;

  afterEach(() => {
    if (originalPassword === undefined)
      delete process.env.LANGGRAPH_DB_PASSWORD;
    else process.env.LANGGRAPH_DB_PASSWORD = originalPassword;
    if (originalUser === undefined) delete process.env.LANGGRAPH_DB_USER;
    else process.env.LANGGRAPH_DB_USER = originalUser;
  });

  function createQueryRunner() {
    const query = jest.fn(async (statement: string) => {
      if (statement.includes('quote_literal($1)'))
        return [{ value: "'test-password'" }];
      if (statement.includes('quote_ident(current_database())'))
        return [{ value: '"lifehealth"' }];
      return [];
    });
    return { query, runner: { query } as unknown as QueryRunner };
  }

  it('creates an isolated LangGraph role and grants write access only in its schema', async () => {
    process.env.LANGGRAPH_DB_PASSWORD = 'a-long-test-password';
    process.env.LANGGRAPH_DB_USER = 'chatbot_report_assistant';
    const { query, runner } = createQueryRunner();

    await new SetupLangGraphPersistence1788800000000().up(runner);

    const sql = query.mock.calls.map(([statement]) => statement).join('\n');
    expect(sql).toContain('CREATE ROLE chatbot_langgraph LOGIN');
    expect(sql).toContain('NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT');
    expect(sql).toContain(
      'REVOKE ALL PRIVILEGES ON DATABASE "lifehealth" FROM chatbot_langgraph',
    );
    expect(sql).toContain(
      'GRANT CONNECT ON DATABASE "lifehealth" TO chatbot_langgraph',
    );
    expect(sql).toContain(
      'CREATE SCHEMA IF NOT EXISTS langgraph AUTHORIZATION chatbot_langgraph',
    );
    expect(sql).toContain(
      'GRANT USAGE, CREATE ON SCHEMA langgraph TO chatbot_langgraph',
    );
    expect(sql).toContain('REVOKE ALL ON SCHEMA public FROM chatbot_langgraph');
    expect(sql).toContain(
      'REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM chatbot_langgraph',
    );
    expect(sql).toContain(
      'REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public FROM chatbot_langgraph',
    );
    expect(sql).toContain(
      'REVOKE ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public FROM chatbot_langgraph',
    );
    expect(sql).not.toContain('GRANT SELECT ON');
    expect(sql).not.toContain('GRANT ALL ON SCHEMA public');
  });

  it('requires a strong credential and rolls back only its own schema and role', async () => {
    process.env.LANGGRAPH_DB_PASSWORD = 'short';
    process.env.LANGGRAPH_DB_USER = 'chatbot_report_assistant';
    const invalid = createQueryRunner();
    await expect(
      new SetupLangGraphPersistence1788800000000().up(invalid.runner),
    ).rejects.toThrow('LANGGRAPH_DB_PASSWORD');
    expect(invalid.query).not.toHaveBeenCalled();

    const { query, runner } = createQueryRunner();
    await new SetupLangGraphPersistence1788800000000().down(runner);
    const sql = query.mock.calls.map(([statement]) => statement).join('\n');
    expect(sql).toContain('DROP SCHEMA IF EXISTS langgraph CASCADE');
    expect(sql).toContain('DROP ROLE IF EXISTS chatbot_langgraph');
    expect(sql).not.toContain('DROP SCHEMA public');
    expect(sql).not.toContain('DROP TABLE');
  });
});
