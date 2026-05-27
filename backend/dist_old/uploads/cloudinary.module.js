"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "CloudinaryModule", {
    enumerable: true,
    get: function() {
        return CloudinaryModule;
    }
});
const _common = require("@nestjs/common");
const _cloudinaryservice = require("./cloudinary.service");
const _cloudinaryconfig = require("../config/cloudinary/cloudinary.config");
const _uploadscontroller = require("./uploads.controller");
const _bullmqmodule = require("../bullmq/bullmq.module");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
let CloudinaryModule = class CloudinaryModule {
};
CloudinaryModule = _ts_decorate([
    (0, _common.Module)({
        imports: [
            (0, _common.forwardRef)(()=>_bullmqmodule.BullmqModule)
        ],
        providers: [
            _cloudinaryservice.CloudinaryService,
            _cloudinaryconfig.CloudinaryConfig
        ],
        exports: [
            _cloudinaryservice.CloudinaryService
        ],
        controllers: [
            _uploadscontroller.UploadsController
        ]
    })
], CloudinaryModule);

//# sourceMappingURL=cloudinary.module.js.map