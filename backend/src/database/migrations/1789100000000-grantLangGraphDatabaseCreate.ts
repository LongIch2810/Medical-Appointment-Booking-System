import { MigrationInterface, QueryRunner } from 'typeorm';

const LANGGRAPH_ROLE = 'chatbot_report_assistant';

export class GrantLangGraphDatabaseCreate1789100000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    const [database] = await queryRunner.query(
      'SELECT quote_ident(current_database()) AS value',
    );
    await queryRunner.query(
      `GRANT CREATE ON DATABASE ${database.value} TO ${LANGGRAPH_ROLE}`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const [database] = await queryRunner.query(
      'SELECT quote_ident(current_database()) AS value',
    );
    await queryRunner.query(
      `REVOKE CREATE ON DATABASE ${database.value} FROM ${LANGGRAPH_ROLE}`,
    );
  }
}
