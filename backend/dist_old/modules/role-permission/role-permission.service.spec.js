"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
const _testing = require("@nestjs/testing");
const _rolepermissionservice = require("./role-permission.service");
describe('RolePermissionService', ()=>{
    let service;
    beforeEach(async ()=>{
        const module = await _testing.Test.createTestingModule({
            providers: [
                _rolepermissionservice.RolePermissionService
            ]
        }).compile();
        service = module.get(_rolepermissionservice.RolePermissionService);
    });
    it('should be defined', ()=>{
        expect(service).toBeDefined();
    });
});

//# sourceMappingURL=role-permission.service.spec.js.map