import { MigrationInterface, QueryRunner } from 'typeorm';

const LANGGRAPH_SCHEMA = 'langgraph';

export class EnsureLangGraphPersistenceRole1789400000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    const user = process.env.LANGGRAPH_DB_USER;
    const password = process.env.LANGGRAPH_DB_PASSWORD;
    if (!user || user.trim() !== user || Buffer.byteLength(user, 'utf8') > 63) {
      throw new Error(
        'LANGGRAPH_DB_USER must be a valid PostgreSQL role name (1–63 bytes).',
      );
    }
    if (!password || password.length < 16) {
      throw new Error(
        'LANGGRAPH_DB_PASSWORD must be configured with at least 16 characters.',
      );
    }

    const [quotedRole] = await queryRunner.query(
      'SELECT quote_ident($1) AS value',
      [user],
    );
    const [role] = await queryRunner.query(
      'SELECT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = $1) AS role_exists',
      [user],
    );
    // Existing credentials remain untouched. A missing role is created with
    // the same restricted settings as the original LangGraph migration.
    if (!role.role_exists) {
      const [escapedPassword] = await queryRunner.query(
        'SELECT quote_literal($1) AS value',
        [password],
      );
      await queryRunner.query(
        `CREATE ROLE ${quotedRole.value} WITH LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT PASSWORD ${escapedPassword.value}`,
      );
    }

    const [database] = await queryRunner.query(
      'SELECT quote_ident(current_database()) AS value',
    );
    await queryRunner.query(
      `REVOKE ALL PRIVILEGES ON DATABASE ${database.value} FROM ${quotedRole.value}`,
    );
    await queryRunner.query(
      `GRANT CONNECT ON DATABASE ${database.value} TO ${quotedRole.value}`,
    );
    await queryRunner.query(
      `GRANT CREATE ON DATABASE ${database.value} TO ${quotedRole.value}`,
    );

    await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS ${LANGGRAPH_SCHEMA}`);
    await queryRunner.query(
      `REVOKE ALL ON SCHEMA public FROM ${quotedRole.value}`,
    );
    await queryRunner.query(
      `REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM ${quotedRole.value}`,
    );
    await queryRunner.query(
      `REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public FROM ${quotedRole.value}`,
    );
    await queryRunner.query(
      `REVOKE ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public FROM ${quotedRole.value}`,
    );
    await queryRunner.query(
      `GRANT USAGE, CREATE ON SCHEMA ${LANGGRAPH_SCHEMA} TO ${quotedRole.value}`,
    );
  }

  public async down(): Promise<void> {
    // Keep the role and persisted LangGraph data in place during rollback.
  }
}
