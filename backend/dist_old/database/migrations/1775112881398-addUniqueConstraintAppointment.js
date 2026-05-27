"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "AddUniqueConstraintAppointment1775112881398", {
    enumerable: true,
    get: function() {
        return AddUniqueConstraintAppointment1775112881398;
    }
});
let AddUniqueConstraintAppointment1775112881398 = class AddUniqueConstraintAppointment1775112881398 {
    async up(queryRunner) {
        await queryRunner.query(`
      CREATE UNIQUE INDEX unique_doctor_schedule_date
      ON appointments (doctor_schedule_id, appointment_date)
      WHERE status IN ('PENDING', 'CONFIRMED')
        AND deleted_at IS NULL
    `);
    }
    async down(queryRunner) {
        await queryRunner.query(`
      DROP INDEX unique_doctor_schedule_date
    `);
    }
};

//# sourceMappingURL=1775112881398-addUniqueConstraintAppointment.js.map