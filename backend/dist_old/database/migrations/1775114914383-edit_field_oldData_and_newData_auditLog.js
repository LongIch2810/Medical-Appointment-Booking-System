"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "EditFieldOldDataAndNewDataAuditLog1775114914383", {
    enumerable: true,
    get: function() {
        return EditFieldOldDataAndNewDataAuditLog1775114914383;
    }
});
let EditFieldOldDataAndNewDataAuditLog1775114914383 = class EditFieldOldDataAndNewDataAuditLog1775114914383 {
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "audit_log" ALTER COLUMN "old_data" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "audit_log" ALTER COLUMN "new_data" DROP NOT NULL`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "audit_log" ALTER COLUMN "new_data" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "audit_log" ALTER COLUMN "old_data" SET NOT NULL`);
    }
    constructor(){
        this.name = 'EditFieldOldDataAndNewDataAuditLog1775114914383';
    }
};

//# sourceMappingURL=1775114914383-edit_field_oldData_and_newData_auditLog.js.map