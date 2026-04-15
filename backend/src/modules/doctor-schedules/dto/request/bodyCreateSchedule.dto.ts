import {
  IsMilitaryTime,
  IsNotEmpty,
  IsString,
  Validate,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { DayOfWeek } from 'src/shared/enums/dayOfWeek';
import { toMinutes } from 'src/utils/toMinutes';

@ValidatorConstraint({ name: 'isStartTimeBeforeEndTime', async: false })
export class IsStartTimeBeforeEndTimeConstraint
  implements ValidatorConstraintInterface
{
  validate(start_time: string, args: ValidationArguments) {
    const end_time = (args.object as any).end_time;
    if (!start_time || !end_time) return true;
    return toMinutes(start_time) < toMinutes(end_time);
  }

  defaultMessage(args: ValidationArguments) {
    return 'start_time must be earlier than end_time';
  }
}

export class BodyCreateScheduleDto {
  @IsString()
  @IsNotEmpty()
  day_of_week!: DayOfWeek;

  @IsMilitaryTime()
  @Validate(IsStartTimeBeforeEndTimeConstraint)
  start_time!: string;

  @IsMilitaryTime()
  end_time!: string;
}
