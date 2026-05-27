"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "UpdateSequenceId1775112849937", {
    enumerable: true,
    get: function() {
        return UpdateSequenceId1775112849937;
    }
});
let UpdateSequenceId1775112849937 = class UpdateSequenceId1775112849937 {
    async up(queryRunner) {
        await queryRunner.query(`
              SELECT setval('article_tags_id_seq', (SELECT COALESCE(MAX(id), 0) FROM article_tags));
              SELECT setval('doctor_schedules_id_seq', (SELECT COALESCE(MAX(id), 0) FROM doctor_schedules));
              SELECT setval('user_roles_id_seq', (SELECT COALESCE(MAX(id), 0) FROM user_roles));
              SELECT setval('doctors_id_seq', (SELECT COALESCE(MAX(id), 0) FROM doctors));
              SELECT setval('articles_id_seq', (SELECT COALESCE(MAX(id), 0) FROM articles));
              SELECT setval('tags_id_seq', (SELECT COALESCE(MAX(id), 0) FROM tags));
              SELECT setval('topics_id_seq', (SELECT COALESCE(MAX(id), 0) FROM topics));
              SELECT setval('users_id_seq', (SELECT COALESCE(MAX(id), 0) FROM users));
              SELECT setval('roles_id_seq', (SELECT COALESCE(MAX(id), 0) FROM roles));
              SELECT setval('permissions_id_seq', (SELECT COALESCE(MAX(id), 0) FROM permissions));
              SELECT setval('role_permissions_id_seq', (SELECT COALESCE(MAX(id), 0) FROM role_permissions));
              SELECT setval('relationships_id_seq', (SELECT COALESCE(MAX(id), 0) FROM relationships));
            `);
    }
    async down(queryRunner) {}
};

//# sourceMappingURL=1775112849937-updateSequenceId.js.map