"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "BodyCreateSatisfactionRating", {
    enumerable: true,
    get: function() {
        return BodyCreateSatisfactionRating;
    }
});
const _classtransformer = require("class-transformer");
const _classvalidator = require("class-validator");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
let BodyCreateSatisfactionRating = class BodyCreateSatisfactionRating {
};
_ts_decorate([
    (0, _classtransformer.Type)(()=>Number),
    (0, _classvalidator.IsNumber)(),
    (0, _classvalidator.IsNotEmpty)(),
    (0, _classvalidator.Min)(1),
    (0, _classvalidator.Max)(5),
    _ts_metadata("design:type", Number)
], BodyCreateSatisfactionRating.prototype, "rating_score", void 0);
_ts_decorate([
    (0, _classtransformer.Transform)(({ value })=>typeof value === 'string' ? value.trim() : value),
    (0, _classvalidator.IsNotEmpty)(),
    (0, _classvalidator.MinLength)(1),
    (0, _classvalidator.MaxLength)(500),
    (0, _classvalidator.IsString)(),
    _ts_metadata("design:type", String)
], BodyCreateSatisfactionRating.prototype, "feedback", void 0);
_ts_decorate([
    (0, _classtransformer.Type)(()=>Number),
    (0, _classvalidator.IsNumber)(),
    (0, _classvalidator.IsNotEmpty)(),
    _ts_metadata("design:type", Number)
], BodyCreateSatisfactionRating.prototype, "appointment_id", void 0);

//# sourceMappingURL=bodyCreateSatisfactionRating.dto.js.map