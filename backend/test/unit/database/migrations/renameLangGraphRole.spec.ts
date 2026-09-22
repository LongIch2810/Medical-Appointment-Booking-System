import { QueryRunner } from 'typeorm';
import { RenameLangGraphRole1788900000000 } from 'src/database/migrations/1788900000000-renameLangGraphRole';

describe('RenameLangGraphRole1788900000000', () => {
  function createQueryRunner(roles: {
    legacy_exists: boolean;
    target_exists: boolean;
  }) {
    const query = jest.fn(async (_statement: string) => [roles]);
    return { query, runner: { query } as unknown as QueryRunner };
  }

  it('renames an existing legacy role without recreating its grants or password', async () => {
    const { query, runner } = createQueryRunner({
      legacy_exists: true,
      target_exists: false,
    });

    await new RenameLangGraphRole1788900000000().up(runner);

    expect(query).toHaveBeenCalledTimes(2);
    expect(query.mock.calls[1][0]).toBe(
      'ALTER ROLE chatbot_langgraph RENAME TO chatbot_report_assistant',
    );
  });

  it('is idempotent when the target role already exists', async () => {
    const { query, runner } = createQueryRunner({
      legacy_exists: false,
      target_exists: true,
    });

    await new RenameLangGraphRole1788900000000().up(runner);

    expect(query).toHaveBeenCalledTimes(1);
  });

  it('reverses only the role rename', async () => {
    const { query, runner } = createQueryRunner({
      legacy_exists: false,
      target_exists: true,
    });

    await new RenameLangGraphRole1788900000000().down(runner);

    expect(query).toHaveBeenCalledTimes(2);
    expect(query.mock.calls[1][0]).toBe(
      'ALTER ROLE chatbot_report_assistant RENAME TO chatbot_langgraph',
    );
  });

  it('fails closed if both role names exist', async () => {
    const { query, runner } = createQueryRunner({
      legacy_exists: true,
      target_exists: true,
    });

    await expect(
      new RenameLangGraphRole1788900000000().up(runner),
    ).rejects.toThrow(
      'Both chatbot_langgraph and chatbot_report_assistant exist',
    );
    expect(query).toHaveBeenCalledTimes(1);
  });
});
