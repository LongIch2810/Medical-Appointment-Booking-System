import { MigrationInterface, QueryRunner } from 'typeorm';

export class GrantChatbotReadOnly1775112830936 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Tạo user nếu chưa tồn tại
    await queryRunner.query(`
              DO $$
              BEGIN
                  IF NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname = 'chatbot_readonly') THEN
                      CREATE USER chatbot_readonly WITH PASSWORD '123456';
                  END IF;
              END
              $$;
            `);

    // 2. Cấp quyền đọc metadata của schema
    await queryRunner.query(`
              GRANT USAGE ON SCHEMA public TO chatbot_readonly;
            `);

    // 3. Cấp quyền SELECT trên các view
    await queryRunner.query(`
              GRANT SELECT ON doctors_view TO chatbot_readonly;
            `);
    await queryRunner.query(`
              GRANT SELECT ON articles_view TO chatbot_readonly;
            `);
    await queryRunner.query(`
              GRANT SELECT ON specialties_view TO chatbot_readonly;
            `);

    // 4. Thu hồi quyền ghi trên các bảng thực (bảo mật)
    await queryRunner.query(`
              REVOKE INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public FROM chatbot_readonly;
            `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
              REVOKE SELECT ON specialties_view FROM chatbot_readonly;
            `);
    await queryRunner.query(`
              REVOKE SELECT ON articles_view FROM chatbot_readonly;
            `);
    await queryRunner.query(`
              REVOKE SELECT ON doctors_view FROM chatbot_readonly;
            `);
    await queryRunner.query(`
              REVOKE USAGE ON SCHEMA public FROM chatbot_readonly;
            `);
    await queryRunner.query(`
              DROP USER IF EXISTS chatbot_readonly;
            `);
  }
}
