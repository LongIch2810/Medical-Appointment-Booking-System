import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUniqueConstraintAppointment1775112881398
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE UNIQUE INDEX unique_doctor_schedule_date
      ON appointments (doctor_schedule_id, appointment_date)
      WHERE status IN ('PENDING', 'CONFIRMED')
        AND deleted_at IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX unique_doctor_schedule_date
    `);
  }
}
