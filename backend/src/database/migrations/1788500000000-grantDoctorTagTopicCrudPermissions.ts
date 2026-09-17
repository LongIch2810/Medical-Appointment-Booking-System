import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Seed gốc (1779638786395-seedData.ts) cấp cho DOCTOR đủ quyền CRUD với
 * article (create/read/update/delete/approve/manage) nhưng chỉ cấp
 * tag:read/tag:manage và topic:read/topic:manage — thiếu tag:create,
 * tag:update, tag:delete, topic:create, topic:update, topic:delete.
 * TagsController/TopicsController lại gate theo permission cụ thể (vd
 * TAG_CREATE), không coi tag:manage là đủ, nên trang "Quản lý Tag"/"Quản lý
 * topic" của bác sĩ hiện đủ nút Thêm/Sửa/Xóa nhưng mọi thao tác đều 403
 * "Bạn không có quyền truy cập!".
 */
export class GrantDoctorTagTopicCrudPermissions1788500000000 implements MigrationInterface {
  name = 'GrantDoctorTagTopicCrudPermissions1788500000000';

  private readonly permissionNames = [
    'tag:create',
    'tag:update',
    'tag:delete',
    'topic:create',
    'topic:update',
    'topic:delete',
  ];

  public async up(queryRunner: QueryRunner): Promise<void> {
    const doctorRole: { id: number }[] = await queryRunner.query(
      `SELECT id FROM "roles" WHERE role_name = 'DOCTOR'`,
    );
    if (doctorRole.length === 0) return;
    const doctorRoleId = doctorRole[0].id;

    const permissions: { id: number; name: string }[] = await queryRunner.query(
      `SELECT id, name FROM "permissions" WHERE name = ANY($1)`,
      [this.permissionNames],
    );

    for (const permission of permissions) {
      await queryRunner.query(
        `
          INSERT INTO "role_permissions" ("role_id", "permission_id")
          SELECT $1, $2
          WHERE NOT EXISTS (
            SELECT 1 FROM "role_permissions"
            WHERE role_id = $1 AND permission_id = $2
          )
        `,
        [doctorRoleId, permission.id],
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const doctorRole: { id: number }[] = await queryRunner.query(
      `SELECT id FROM "roles" WHERE role_name = 'DOCTOR'`,
    );
    if (doctorRole.length === 0) return;
    const doctorRoleId = doctorRole[0].id;

    await queryRunner.query(
      `
        DELETE FROM "role_permissions"
        WHERE role_id = $1
          AND permission_id IN (
            SELECT id FROM "permissions" WHERE name = ANY($2)
          )
      `,
      [doctorRoleId, this.permissionNames],
    );
  }
}
