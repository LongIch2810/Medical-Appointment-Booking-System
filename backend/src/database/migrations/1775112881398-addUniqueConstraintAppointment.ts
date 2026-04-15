import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUniqueConstraintAppointment1775112881398
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE appointments 
            ADD CONSTRAINT unique_doctor_schedule_date 
            UNIQUE (doctor_schedule_id, appointment_date);`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER APPOINTMENTS DROP CONSTRAINT unique_doctor_schedule_date;`,
    );
  }
}
