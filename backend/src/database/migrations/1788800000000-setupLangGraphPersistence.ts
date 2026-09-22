import { MigrationInterface, QueryRunner } from 'typeorm';

// This migration may already have run in an environment. Keep its original
// role name stable; the following additive migration renames it safely.
const LANGGRAPH_ROLE = 'chatbot_langgraph';
const CONFIGURED_LANGGRAPH_USER = 'chatbot_report_assistant';
const LANGGRAPH_SCHEMA = 'langgraph';

export class SetupLangGraphPersistence1788800000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const user = process.env.LANGGRAPH_DB_USER;
    const password = process.env.LANGGRAPH_DB_PASSWORD;
    if (user !== CONFIGURED_LANGGRAPH_USER) {
      throw new Error(`LANGGRAPH_DB_USER must be ${CONFIGURED_LANGGRAPH_USER}`);
    }
    if (!password || password.length < 16) {
      throw new Error(
        'LANGGRAPH_DB_PASSWORD must be configured with at least 16 characters',
      );
    }

    const [escapedPassword] = await queryRunner.query(
      'SELECT quote_literal($1) AS value',
      [password],
    );
    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = '${LANGGRAPH_ROLE}') THEN
          CREATE ROLE ${LANGGRAPH_ROLE} LOGIN;
        END IF;
      END $$
    `);
    await queryRunner.query(
      `ALTER ROLE ${LANGGRAPH_ROLE} WITH LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT PASSWORD ${escapedPassword.value}`,
    );
    await queryRunner.query(
      `ALTER ROLE ${LANGGRAPH_ROLE} SET search_path TO ${LANGGRAPH_SCHEMA}`,
    );

    const [database] = await queryRunner.query(
      'SELECT quote_ident(current_database()) AS value',
    );
    await queryRunner.query(
      `REVOKE ALL PRIVILEGES ON DATABASE ${database.value} FROM ${LANGGRAPH_ROLE}`,
    );
    await queryRunner.query(
      `GRANT CONNECT ON DATABASE ${database.value} TO ${LANGGRAPH_ROLE}`,
    );
    // PostgresSaver.setup() always executes CREATE SCHEMA IF NOT EXISTS.
    // PostgreSQL checks database-level CREATE even when the schema already
    // exists, so the runtime role needs this privilege to apply LangGraph's
    // versioned persistence migrations.
    await queryRunner.query(
      `GRANT CREATE ON DATABASE ${database.value} TO ${LANGGRAPH_ROLE}`,
    );

    await queryRunner.query(
      `CREATE SCHEMA IF NOT EXISTS ${LANGGRAPH_SCHEMA} AUTHORIZATION ${LANGGRAPH_ROLE}`,
    );
    await queryRunner.query(
      `ALTER SCHEMA ${LANGGRAPH_SCHEMA} OWNER TO ${LANGGRAPH_ROLE}`,
    );
    await queryRunner.query(
      `REVOKE ALL ON SCHEMA public FROM ${LANGGRAPH_ROLE}`,
    );
    await queryRunner.query(
      `REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM ${LANGGRAPH_ROLE}`,
    );
    await queryRunner.query(
      `REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public FROM ${LANGGRAPH_ROLE}`,
    );
    await queryRunner.query(
      `REVOKE ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public FROM ${LANGGRAPH_ROLE}`,
    );
    await queryRunner.query(
      `GRANT USAGE, CREATE ON SCHEMA ${LANGGRAPH_SCHEMA} TO ${LANGGRAPH_ROLE}`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const [database] = await queryRunner.query(
      'SELECT quote_ident(current_database()) AS value',
    );
    await queryRunner.query(
      `DROP SCHEMA IF EXISTS ${LANGGRAPH_SCHEMA} CASCADE`,
    );
    await queryRunner.query(
      `REVOKE ALL PRIVILEGES ON DATABASE ${database.value} FROM ${LANGGRAPH_ROLE}`,
    );
    await queryRunner.query(`DROP ROLE IF EXISTS ${LANGGRAPH_ROLE}`);
  }
}
