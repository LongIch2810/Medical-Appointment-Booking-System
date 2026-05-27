import { MigrationInterface, QueryRunner } from 'typeorm';

export class GrantAdminAppointmentCreate1779800000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO "role_permissions" ("role_id", "permission_id")
      SELECT r.id, p.id
      FROM "roles" r, "permissions" p
      WHERE r.role_name = 'ADMIN'
        AND p.name = 'appointment:create'
        AND NOT EXISTS (
          SELECT 1 FROM "role_permissions" rp
          WHERE rp.role_id = r.id AND rp.permission_id = p.id
        );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM "role_permissions" rp
      USING "roles" r, "permissions" p
      WHERE rp.role_id = r.id
        AND rp.permission_id = p.id
        AND r.role_name = 'ADMIN'
        AND p.name = 'appointment:create';
    `);
  }
}
