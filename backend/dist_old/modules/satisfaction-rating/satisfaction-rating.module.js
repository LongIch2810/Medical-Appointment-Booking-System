"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "SatisfactionRatingModule", {
    enumerable: true,
    get: function() {
        return SatisfactionRatingModule;
    }
});
const _common = require("@nestjs/common");
const _satisfactionratingcontroller = require("./satisfaction-rating.controller");
const _satisfactionratingservice = require("./satisfaction-rating.service");
const _typeorm = require("@nestjs/typeorm");
const _satisfactionRatingentity = /*#__PURE__*/ _interop_require_default(require("../../entities/satisfactionRating.entity"));
const _appointmentsmodule = require("../appointments/appointments.module");
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
let SatisfactionRatingModule = class SatisfactionRatingModule {
};
SatisfactionRatingModule = _ts_decorate([
    (0, _common.Module)({
        imports: [
            _typeorm.TypeOrmModule.forFeature([
                _satisfactionRatingentity.default
            ]),
            _appointmentsmodule.AppointmentsModule
        ],
        controllers: [
            _satisfactionratingcontroller.SatisfactionRatingController
        ],
        providers: [
            _satisfactionratingservice.SatisfactionRatingService
        ],
        exports: [
            _satisfactionratingservice.SatisfactionRatingService
        ]
    })
], SatisfactionRatingModule);

//# sourceMappingURL=satisfaction-rating.module.js.map