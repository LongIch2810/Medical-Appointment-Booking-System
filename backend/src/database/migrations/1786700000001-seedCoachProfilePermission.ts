import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedCoachProfilePermission1786700000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO "permissions" ("name")
      SELECT 'coach-profile:manage'
      WHERE NOT EXISTS (
        SELECT 1 FROM "permissions" WHERE "name" = 'coach-profile:manage'
      );
    `);

    await queryRunner.query(`
      INSERT INTO "role_permissions" ("role_id", "permission_id")
      SELECT r.id, p.id
      FROM "roles" r, "permissions" p
      WHERE r.role_name IN ('PATIENT', 'ADMIN')
        AND p.name = 'coach-profile:manage'
        AND NOT EXISTS (
          SELECT 1 FROM "role_permissions" rp
          WHERE rp.role_id = r.id AND rp.permission_id = p.id
        );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM "role_permissions" rp
      USING "permissions" p
      WHERE rp.permission_id = p.id
        AND p.name = 'coach-profile:manage';
    `);

    await queryRunner.query(`
      DELETE FROM "permissions" WHERE "name" = 'coach-profile:manage';
    `);
  }
}
