import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';

/** Validate a numeric lower-bound field against its optional upper-bound field. */
export function IsLessThanOrEqual(
  property: string,
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isLessThanOrEqual',
      target: object.constructor,
      propertyName,
      constraints: [property],
      options: validationOptions,
      validator: {
        validate(value: unknown, args: ValidationArguments) {
          const relatedValue = (args.object as Record<string, unknown>)[
            args.constraints[0]
          ];

          if (
            value === undefined ||
            value === null ||
            value === '' ||
            relatedValue === undefined ||
            relatedValue === null ||
            relatedValue === ''
          ) {
            return true;
          }

          const lower = Number(value);
          const upper = Number(relatedValue);
          return Number.isFinite(lower) && Number.isFinite(upper)
            ? lower <= upper
            : false;
        },

        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be less than or equal to ${args.constraints[0]}`;
        },
      },
    });
  };
}
