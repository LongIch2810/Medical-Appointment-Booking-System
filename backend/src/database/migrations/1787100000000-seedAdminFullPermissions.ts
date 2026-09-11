import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedAdminFullPermissions1787100000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "role_permissions" rp
      SET "deleted_at" = NULL, "updated_at" = NOW()
      FROM "roles" r, "permissions" p
      WHERE rp.role_id = r.id
        AND rp.permission_id = p.id
        AND r.role_name = 'ADMIN'
        AND r.deleted_at IS NULL
        AND p.deleted_at IS NULL
        AND rp.deleted_at IS NOT NULL;
    `);

    await queryRunner.query(`
      INSERT INTO "role_permissions" ("role_id", "permission_id")
      SELECT r.id, p.id
      FROM "roles" r
      CROSS JOIN "permissions" p
      WHERE r.role_name = 'ADMIN'
        AND r.deleted_at IS NULL
        AND p.deleted_at IS NULL
        AND NOT EXISTS (
          SELECT 1
          FROM "role_permissions" rp
          WHERE rp.role_id = r.id
            AND rp.permission_id = p.id
        );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Không thu hồi quyền: không thể phân biệt an toàn liên kết đã tồn tại
    // với liên kết được bổ sung bởi migration này.
    await queryRunner.query('SELECT 1');
  }
}
