import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';

export function IsBeforeOrEqual(
  property: string,
  validationOptions?: ValidationOptions,
) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isBeforeOrEqual',
      target: object.constructor,
      propertyName,
      constraints: [property],
      options: validationOptions,
      validator: {
        validate(value, args: ValidationArguments) {
          const relatedPropertyName = args.constraints[0];
          const relatedValue = (args.object as any)[relatedPropertyName];

          if (!value || !relatedValue) return true;

          const valueDate = new Date(value);
          const relatedValueDate = new Date(relatedValue);

          return valueDate.getTime() <= relatedValueDate.getTime();
        },

        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be before or equal to ${args.constraints[0]}`;
        },
      },
    });
  };
}
