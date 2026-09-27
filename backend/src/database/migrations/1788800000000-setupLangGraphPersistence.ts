import { MigrationInterface, QueryRunner } from 'typeorm';

const LANGGRAPH_SCHEMA = 'langgraph';

export class SetupLangGraphPersistence1788800000000 implements MigrationInterface {
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
    // Avoid ALTER ROLE: managed PostgreSQL may permit role creation while
    // denying changes to a role created by another owner. Existing credentials
    // must already match LANGGRAPH_DB_PASSWORD.
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
    // PostgresSaver.setup() always executes CREATE SCHEMA IF NOT EXISTS.
    // PostgreSQL checks database-level CREATE even when the schema already
    // exists, so the runtime role needs this privilege to apply LangGraph's
    // versioned persistence migrations.
    await queryRunner.query(
      `GRANT CREATE ON DATABASE ${database.value} TO ${quotedRole.value}`,
    );

    // Keep schema ownership with the migration/database owner. The chatbot
    // role receives only the privileges it needs to run LangGraph's setup.
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

  public async down(queryRunner: QueryRunner): Promise<void> {
    const user = process.env.LANGGRAPH_DB_USER;
    if (!user || user.trim() !== user || Buffer.byteLength(user, 'utf8') > 63) {
      throw new Error(
        'LANGGRAPH_DB_USER must be a valid PostgreSQL role name (1–63 bytes).',
      );
    }
    const [quotedRole] = await queryRunner.query(
      'SELECT quote_ident($1) AS value',
      [user],
    );
    const [database] = await queryRunner.query(
      'SELECT quote_ident(current_database()) AS value',
    );
    await queryRunner.query(
      `DROP SCHEMA IF EXISTS ${LANGGRAPH_SCHEMA} CASCADE`,
    );
    await queryRunner.query(
      `REVOKE ALL PRIVILEGES ON DATABASE ${database.value} FROM ${quotedRole.value}`,
    );
  }
}
