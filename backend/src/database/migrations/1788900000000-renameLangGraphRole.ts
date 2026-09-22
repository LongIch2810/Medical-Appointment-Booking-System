import { MigrationInterface, QueryRunner } from 'typeorm';

const LEGACY_ROLE = 'chatbot_langgraph';
const TARGET_ROLE = 'chatbot_report_assistant';

export class RenameLangGraphRole1788900000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const [roles] = await queryRunner.query(
      `
        SELECT
          EXISTS (SELECT 1 FROM pg_roles WHERE rolname = '${LEGACY_ROLE}') AS legacy_exists,
          EXISTS (SELECT 1 FROM pg_roles WHERE rolname = '${TARGET_ROLE}') AS target_exists
      `,
    );

    if (roles.legacy_exists && roles.target_exists) {
      throw new Error(
        `Both ${LEGACY_ROLE} and ${TARGET_ROLE} exist; resolve the role-name conflict before migrating.`,
      );
    }
    if (!roles.legacy_exists && !roles.target_exists) {
      throw new Error(
        `Neither ${LEGACY_ROLE} nor ${TARGET_ROLE} exists; setup LangGraph persistence first.`,
      );
    }
    if (roles.legacy_exists) {
      await queryRunner.query(
        `ALTER ROLE ${LEGACY_ROLE} RENAME TO ${TARGET_ROLE}`,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const [roles] = await queryRunner.query(
      `
        SELECT
          EXISTS (SELECT 1 FROM pg_roles WHERE rolname = '${LEGACY_ROLE}') AS legacy_exists,
          EXISTS (SELECT 1 FROM pg_roles WHERE rolname = '${TARGET_ROLE}') AS target_exists
      `,
    );

    if (roles.legacy_exists && roles.target_exists) {
      throw new Error(
        `Both ${LEGACY_ROLE} and ${TARGET_ROLE} exist; resolve the role-name conflict before reverting.`,
      );
    }
    if (roles.target_exists) {
      await queryRunner.query(
        `ALTER ROLE ${TARGET_ROLE} RENAME TO ${LEGACY_ROLE}`,
      );
    }
  }
}
