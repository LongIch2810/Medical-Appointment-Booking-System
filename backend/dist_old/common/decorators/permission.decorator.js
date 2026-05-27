"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "Permissions", {
    enumerable: true,
    get: function() {
        return Permissions;
    }
});
const _common = require("@nestjs/common");
const _constants = require("../../utils/constants");
const Permissions = (...permissions)=>(0, _common.SetMetadata)(_constants.PERMISSIONS_KEY, permissions);

//# sourceMappingURL=permission.decorator.js.map