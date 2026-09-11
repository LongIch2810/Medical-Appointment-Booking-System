import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { BodyCreateAppointmentDto } from 'src/modules/appointments/dto/request/bodyCreateAppointment.dto';
import { BodyCreateScheduleDto } from 'src/modules/doctor-schedules/dto/request/bodyCreateSchedule.dto';
import { BodyFilterSatisfactionRatingsDto } from 'src/modules/satisfaction-rating/dto/request/bodyFilterSatisfactionRatings.dto';
import { BodyGenerateAdminReportDto } from 'src/modules/admin-reports/dto/request/bodyGenerateAdminReport.dto';
import { DateRangePreset, ReportType } from 'src/modules/admin-reports/dto/request/bodyGenerateAdminReport.dto';
import { BookingMode } from 'src/shared/enums/bookingMode';
import { DayOfWeek } from 'src/shared/enums/dayOfWeek';

describe('cross-field validation', () => {
  const bookingMode = Object.values(BookingMode)[0];

  async function appointmentErrors(value: Record<string, unknown>) {
    return validate(
      plainToInstance(BodyCreateAppointmentDto, {
        appointment_date: '2026-09-10',
        booking_mode: bookingMode,
        relative_id: 1,
        ...value,
      }),
    );
  }

  it('accepts either a concrete schedule or automatic specialty selection', async () => {
    await expect(
      appointmentErrors({ doctor_schedule_id: 4 }),
    ).resolves.toHaveLength(0);
    await expect(
      appointmentErrors({ specialty_id: 2, start_time: '08:00' }),
    ).resolves.toHaveLength(0);
  });

  it('rejects mixed and incomplete schedule selection modes', async () => {
    expect(
      await appointmentErrors({
        doctor_schedule_id: 4,
        specialty_id: 2,
        start_time: '08:00',
      }),
    ).not.toHaveLength(0);
    expect(await appointmentErrors({})).not.toHaveLength(0);
    expect(await appointmentErrors({ specialty_id: 2 })).not.toHaveLength(0);
  });

  it('requires exactly one existing/new patient selection', async () => {
    const missing = plainToInstance(BodyCreateAppointmentDto, {
      appointment_date: '2026-09-10',
      booking_mode: bookingMode,
      doctor_schedule_id: 4,
    });
    const both = plainToInstance(BodyCreateAppointmentDto, {
      appointment_date: '2026-09-10',
      booking_mode: bookingMode,
      doctor_schedule_id: 4,
      relative_id: 1,
      new_relative_profile: {},
    });
    expect(await validate(missing)).not.toHaveLength(0);
    expect(await validate(both)).not.toHaveLength(0);
  });

  it('requires a schedule start time strictly before its end time', async () => {
    const valid = plainToInstance(BodyCreateScheduleDto, {
      day_of_week: DayOfWeek.MONDAY,
      start_time: '08:00',
      end_time: '09:00',
    });
    const equal = plainToInstance(BodyCreateScheduleDto, {
      day_of_week: DayOfWeek.MONDAY,
      start_time: '09:00',
      end_time: '09:00',
    });
    expect(await validate(valid)).toHaveLength(0);
    expect(await validate(equal)).not.toHaveLength(0);
  });

  it('requires fromDate to be before or equal to toDate', async () => {
    const valid = plainToInstance(BodyFilterSatisfactionRatingsDto, {
      page: 1,
      limit: 10,
      fromDate: '2026-09-01',
      toDate: '2026-09-01',
    });
    const invalid = plainToInstance(BodyFilterSatisfactionRatingsDto, {
      page: 1,
      limit: 10,
      fromDate: '2026-09-02',
      toDate: '2026-09-01',
    });
    expect(await validate(valid)).toHaveLength(0);
    expect(await validate(invalid)).not.toHaveLength(0);
  });

  it('rejects a reversed custom admin report range', async () => {
    const valid = plainToInstance(BodyGenerateAdminReportDto, {
      reportType: ReportType.NEW_USER_REGISTRATIONS,
      rangePreset: DateRangePreset.CUSTOM,
      fromDate: '2026-05-01',
      toDate: '2026-10-31',
    });
    const invalid = plainToInstance(BodyGenerateAdminReportDto, {
      reportType: ReportType.NEW_USER_REGISTRATIONS,
      rangePreset: DateRangePreset.CUSTOM,
      fromDate: '2026-10-31',
      toDate: '2026-05-01',
    });

    expect(await validate(valid)).toHaveLength(0);
    expect(await validate(invalid)).not.toHaveLength(0);
  });
});
