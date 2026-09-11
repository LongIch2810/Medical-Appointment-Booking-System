import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { BodyCreateAppointmentDto } from 'src/modules/appointments/dto/request/bodyCreateAppointment.dto';
import { BookingMode } from 'src/shared/enums/bookingMode';

async function validateBody(payload: Record<string, unknown>) {
  const dto = plainToInstance(BodyCreateAppointmentDto, payload);
  return validate(dto);
}

describe('BodyCreateAppointmentDto', () => {
  const base = {
    appointment_date: '2099-01-05',
    relative_id: 5,
    booking_mode: BookingMode.USER_SELECT,
  };

  it('accepts a specific-schedule request (doctor_schedule_id only)', async () => {
    const errors = await validateBody({ ...base, doctor_schedule_id: 42 });
    expect(errors).toHaveLength(0);
  });

  it('accepts an auto-select request with specialty_id + start_time, no end_time', async () => {
    const errors = await validateBody({
      ...base,
      specialty_id: 2,
      start_time: '08:00',
    });
    expect(errors).toHaveLength(0);
  });

  it('accepts an auto-select request with specialty_id + start_time + end_time', async () => {
    const errors = await validateBody({
      ...base,
      specialty_id: 2,
      start_time: '08:00',
      end_time: '09:00',
    });
    expect(errors).toHaveLength(0);
  });

  it('rejects a request combining doctor_schedule_id with specialty_id/start_time', async () => {
    const errors = await validateBody({
      ...base,
      doctor_schedule_id: 42,
      specialty_id: 2,
      start_time: '08:00',
    });
    expect(errors.some((e) => e.property === 'crossFieldValidation')).toBe(
      true,
    );
  });

  it('rejects a request with neither doctor_schedule_id nor specialty_id/start_time', async () => {
    const errors = await validateBody({ ...base });
    expect(errors.some((e) => e.property === 'crossFieldValidation')).toBe(
      true,
    );
  });

  it('rejects an auto-select request missing start_time', async () => {
    const errors = await validateBody({ ...base, specialty_id: 2 });
    expect(errors.some((e) => e.property === 'crossFieldValidation')).toBe(
      true,
    );
  });

  it('rejects an auto-select request missing specialty_id', async () => {
    const errors = await validateBody({ ...base, start_time: '08:00' });
    expect(errors.some((e) => e.property === 'crossFieldValidation')).toBe(
      true,
    );
  });

  it('rejects a malformed start_time', async () => {
    const errors = await validateBody({
      ...base,
      specialty_id: 2,
      start_time: 'not-a-time',
    });
    expect(errors.some((e) => e.property === 'start_time')).toBe(true);
  });

  it('rejects a malformed end_time', async () => {
    const errors = await validateBody({
      ...base,
      specialty_id: 2,
      start_time: '08:00',
      end_time: 'not-a-time',
    });
    expect(errors.some((e) => e.property === 'end_time')).toBe(true);
  });

  describe('patient selection (relative_id vs new_relative_profile)', () => {
    const scheduleFields = { doctor_schedule_id: 42 };
    const validNewRelativeProfile = {
      fullname: 'Nguyen Van A',
      relationship_code: 'con_gai',
      dob: '2015-05-01',
      gender: false,
    };

    it('rejects a request with neither relative_id nor new_relative_profile', async () => {
      const errors = await validateBody({
        appointment_date: '2099-01-05',
        booking_mode: BookingMode.USER_SELECT,
        ...scheduleFields,
      });
      expect(errors.some((e) => e.property === 'crossFieldValidation')).toBe(
        true,
      );
    });

    it('rejects a request combining relative_id and new_relative_profile', async () => {
      const errors = await validateBody({
        appointment_date: '2099-01-05',
        booking_mode: BookingMode.USER_SELECT,
        relative_id: 5,
        new_relative_profile: validNewRelativeProfile,
        ...scheduleFields,
      });
      expect(errors.some((e) => e.property === 'crossFieldValidation')).toBe(
        true,
      );
    });

    it('accepts a request with only new_relative_profile (fully filled)', async () => {
      const errors = await validateBody({
        appointment_date: '2099-01-05',
        booking_mode: BookingMode.USER_SELECT,
        new_relative_profile: validNewRelativeProfile,
        ...scheduleFields,
      });
      expect(errors).toHaveLength(0);
    });

    it('rejects new_relative_profile missing required fields (fullname, gender)', async () => {
      const errors = await validateBody({
        appointment_date: '2099-01-05',
        booking_mode: BookingMode.USER_SELECT,
        new_relative_profile: { relationship_code: 'con_gai' },
        ...scheduleFields,
      });
      const nestedError = errors.find(
        (e) => e.property === 'new_relative_profile',
      );
      const nestedProperties = Object.keys(
        nestedError?.children?.reduce(
          (acc, child) => ({ ...acc, [child.property]: true }),
          {},
        ) ?? {},
      );
      expect(nestedProperties).toEqual(
        expect.arrayContaining(['fullname', 'gender']),
      );
    });

    it('accepts new_relative_profile without dob (dob is optional)', async () => {
      const profileWithoutDob = {
        fullname: validNewRelativeProfile.fullname,
        relationship_code: validNewRelativeProfile.relationship_code,
        gender: validNewRelativeProfile.gender,
      };
      const errors = await validateBody({
        appointment_date: '2099-01-05',
        booking_mode: BookingMode.USER_SELECT,
        new_relative_profile: profileWithoutDob,
        ...scheduleFields,
      });
      expect(errors).toHaveLength(0);
    });
  });
});
