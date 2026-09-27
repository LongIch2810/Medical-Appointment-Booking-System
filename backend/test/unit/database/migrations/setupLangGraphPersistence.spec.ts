import { QueryRunner } from 'typeorm';
import { SetupLangGraphPersistence1788800000000 } from 'src/database/migrations/1788800000000-setupLangGraphPersistence';

describe('SetupLangGraphPersistence1788800000000', () => {
  const originalUser = process.env.LANGGRAPH_DB_USER;
  const originalPassword = process.env.LANGGRAPH_DB_PASSWORD;

  afterEach(() => {
    if (originalUser === undefined) delete process.env.LANGGRAPH_DB_USER;
    else process.env.LANGGRAPH_DB_USER = originalUser;
    if (originalPassword === undefined)
      delete process.env.LANGGRAPH_DB_PASSWORD;
    else process.env.LANGGRAPH_DB_PASSWORD = originalPassword;
  });

  function createQueryRunner(roleExists = false) {
    const query = jest.fn(async (statement: string) => {
      if (statement.includes('quote_ident($1)'))
        return [{ value: '"memory-role"' }];
      if (statement.includes('quote_literal($1)'))
        return [{ value: "'a-long-test-password'" }];
      if (statement.includes('FROM pg_roles'))
        return [{ role_exists: roleExists }];
      if (statement.includes('quote_ident(current_database())'))
        return [{ value: '"lifehealth"' }];
      return [];
    });
    return { query, runner: { query } as unknown as QueryRunner };
  }

  it('creates the configured role when missing and limits access to its schema', async () => {
    process.env.LANGGRAPH_DB_USER = 'memory-role';
    process.env.LANGGRAPH_DB_PASSWORD = 'a-long-test-password';
    const { query, runner } = createQueryRunner();

    await new SetupLangGraphPersistence1788800000000().up(runner);

    const sql = query.mock.calls.map(([statement]) => statement).join('\n');
    expect(sql).toContain(
      'CREATE ROLE "memory-role" WITH LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT PASSWORD',
    );
    expect(sql).toContain(
      'REVOKE ALL PRIVILEGES ON DATABASE "lifehealth" FROM "memory-role"',
    );
    expect(sql).toContain(
      'GRANT CONNECT ON DATABASE "lifehealth" TO "memory-role"',
    );
    expect(sql).toContain(
      'CREATE SCHEMA IF NOT EXISTS langgraph',
    );
    expect(sql).toContain(
      'GRANT USAGE, CREATE ON SCHEMA langgraph TO "memory-role"',
    );
    expect(sql).toContain(
      'REVOKE ALL ON SCHEMA public FROM "memory-role"',
    );
    expect(sql).toContain(
      'REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM "memory-role"',
    );
    expect(sql).toContain(
      'REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public FROM "memory-role"',
    );
    expect(sql).toContain(
      'REVOKE ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public FROM "memory-role"',
    );
    expect(sql).not.toContain('ALTER ROLE');
    expect(sql).not.toContain('ALTER SCHEMA');
    expect(sql).not.toContain('GRANT SELECT ON');
    expect(sql).not.toContain('GRANT ALL ON SCHEMA public');
  });

  it('validates the password and rolls back schema grants without dropping the role', async () => {
    process.env.LANGGRAPH_DB_USER = 'memory-role';
    process.env.LANGGRAPH_DB_PASSWORD = 'short';
    const invalid = createQueryRunner();
    await expect(
      new SetupLangGraphPersistence1788800000000().up(invalid.runner),
    ).rejects.toThrow('LANGGRAPH_DB_PASSWORD');
    expect(invalid.query).not.toHaveBeenCalled();

    const { query, runner } = createQueryRunner();
    await new SetupLangGraphPersistence1788800000000().down(runner);
    const sql = query.mock.calls.map(([statement]) => statement).join('\n');
    expect(sql).toContain('DROP SCHEMA IF EXISTS langgraph CASCADE');
    expect(sql).toContain(
      'REVOKE ALL PRIVILEGES ON DATABASE "lifehealth" FROM "memory-role"',
    );
    expect(sql).not.toContain('DROP ROLE');
    expect(sql).not.toContain('DROP SCHEMA public');
    expect(sql).not.toContain('DROP TABLE');
  });
});
