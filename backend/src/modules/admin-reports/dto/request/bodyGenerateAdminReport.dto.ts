import { IsDateString, IsIn, ValidateIf } from 'class-validator';
import { IsBeforeOrEqual } from 'src/common/decorators/isBeforeOrEqual.decorator';

export enum ReportType {
  NEW_USER_REGISTRATIONS = 'NEW_USER_REGISTRATIONS',
  AI_COACH_ACTIVITY = 'AI_COACH_ACTIVITY',
  HEALTH_TRENDS = 'HEALTH_TRENDS',
  BOOKING_CANCELLATION_NOSHOW = 'BOOKING_CANCELLATION_NOSHOW',
  PATIENT_FLOW_BY_TIMESLOT = 'PATIENT_FLOW_BY_TIMESLOT',
  APPOINTMENTS_BY_SPECIALTY = 'APPOINTMENTS_BY_SPECIALTY',
  DOCTOR_FILL_RATE = 'DOCTOR_FILL_RATE',
  USER_DEMOGRAPHICS = 'USER_DEMOGRAPHICS',
}

export enum DateRangePreset {
  TODAY = 'TODAY',
  THIS_WEEK = 'THIS_WEEK',
  THIS_MONTH = 'THIS_MONTH',
  THIS_YEAR = 'THIS_YEAR',
  CUSTOM = 'CUSTOM',
}

export class BodyGenerateAdminReportDto {
  @IsIn(Object.values(ReportType), { message: 'reportType không hợp lệ' })
  reportType!: ReportType;

  @IsIn(Object.values(DateRangePreset), { message: 'rangePreset không hợp lệ' })
  rangePreset!: DateRangePreset;

  @ValidateIf((o) => o.rangePreset === DateRangePreset.CUSTOM)
  @IsDateString({}, { message: 'fromDate phải là ngày hợp lệ' })
  @IsBeforeOrEqual('toDate', {
    message: 'fromDate phải trước hoặc bằng toDate',
  })
  fromDate?: string;

  @ValidateIf((o) => o.rangePreset === DateRangePreset.CUSTOM)
  @IsDateString({}, { message: 'toDate phải là ngày hợp lệ' })
  toDate?: string;
}
