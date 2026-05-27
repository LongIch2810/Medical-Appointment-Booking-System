"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "AddIsReadToMessages1775112890000", {
    enumerable: true,
    get: function() {
        return AddIsReadToMessages1775112890000;
    }
});
let AddIsReadToMessages1775112890000 = class AddIsReadToMessages1775112890000 {
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "messages" ADD COLUMN IF NOT EXISTS "is_read" boolean NOT NULL DEFAULT false`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "messages" DROP COLUMN IF EXISTS "is_read"`);
    }
};

//# sourceMappingURL=1775112890000-addIsReadToMessages.js.map