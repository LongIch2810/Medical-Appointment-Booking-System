"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "IsBeforeOrEqual", {
    enumerable: true,
    get: function() {
        return IsBeforeOrEqual;
    }
});
const _classvalidator = require("class-validator");
function IsBeforeOrEqual(property, validationOptions) {
    return function(object, propertyName) {
        (0, _classvalidator.registerDecorator)({
            name: 'isBeforeOrEqual',
            target: object.constructor,
            propertyName,
            constraints: [
                property
            ],
            options: validationOptions,
            validator: {
                validate (value, args) {
                    const relatedPropertyName = args.constraints[0];
                    const relatedValue = args.object[relatedPropertyName];
                    if (!value || !relatedValue) return true;
                    const valueDate = new Date(value);
                    const relatedValueDate = new Date(relatedValue);
                    return valueDate.getTime() <= relatedValueDate.getTime();
                },
                defaultMessage (args) {
                    return `${args.property} must be before or equal to ${args.constraints[0]}`;
                }
            }
        });
    };
}

//# sourceMappingURL=isBeforeOrEqual.decorator.js.map