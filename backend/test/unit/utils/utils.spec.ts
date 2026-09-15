import { DayOfWeek } from 'src/shared/enums/dayOfWeek';
import { FileType } from 'src/shared/enums/FileType';
import { decrypt, encrypt } from 'src/utils/encryption';
import { extractTokenFromCookie } from 'src/utils/extractTokenFromCookie';
import {
  formatDate,
  formatDateDDMMYYYY,
  formatDateTimeDDMMYYYYHHmm,
} from 'src/utils/formatDate';
import { formatHHMM } from 'src/utils/formatHHMM';
import { generateOtpCode } from 'src/utils/generateOtpCode';
import { generateSlug } from 'src/utils/generateSlug';
import { groupSchedulesByDay } from 'src/utils/groupSchedulesByDay';
import { isPgDriverError } from 'src/utils/isPgDriverError';
import { mapFileType } from 'src/utils/mapFileType';
import { removePasswordDeep } from 'src/utils/removePasswordDeep';
import {
  calculateFinalScore,
  setIsOutstanding,
  setIsOutstandingDoctor,
  setIsOutstandingDoctors,
} from 'src/utils/setIsOutstanding';
import { toHHMM, toMinutes } from 'src/utils/toMinutes';

describe('backend utilities', () => {
  it('encrypts with a random IV and decrypts valid values safely', () => {
    const first = encrypt('medical-secret');
    const second = encrypt('medical-secret');

    expect(first).not.toBe(second);
    expect(decrypt(first)).toBe('medical-secret');
    expect(decrypt(null)).toBe('');
    expect(decrypt('invalid')).toBe('');
    expect(decrypt('00:not-hex')).toBe('');
  });

  it('extracts and decodes the access token cookie', () => {
    expect(
      extractTokenFromCookie({
        handshake: { headers: { cookie: 'foo=bar; accessToken=a%2Eb%2Ec' } },
      }),
    ).toBe('a.b.c');
    expect(extractTokenFromCookie({ handshake: { headers: {} } })).toBeNull();
    expect(
      extractTokenFromCookie({
        handshake: { headers: { cookie: 'accessToken=%E0%A4%A' } },
      }),
    ).toBeNull();
  });

  it('formats dates recursively and rejects invalid inputs', () => {
    const date = new Date(2026, 8, 3, 14, 5);
    expect(formatDateDDMMYYYY(date)).toBe('03/09/2026');
    expect(formatDateTimeDDMMYYYYHHmm(date)).toBe('14:05 03/09/2026');
    expect(formatDateDDMMYYYY('not-a-date')).toBeNull();
    expect(formatDateTimeDDMMYYYYHHmm(undefined)).toBeNull();
    expect(formatDate({ date, nested: [date, 'same'] })).toEqual({
      date: '03/09/2026',
      nested: ['03/09/2026', 'same'],
    });
  });

  it('normalizes time representations', () => {
    expect(formatHHMM('08:30:00')).toBe('08:30');
    expect(toMinutes('08:30')).toBe(510);
    expect(toHHMM('08:30:59')).toBe('08:30');
    expect(toHHMM(new Date(2026, 0, 1, 8, 5))).toBe('08:05');
  });

  it('creates six-digit OTPs and Vietnamese slugs', () => {
    for (let index = 0; index < 20; index += 1) {
      expect(generateOtpCode()).toMatch(/^\d{6}$/);
    }
    expect(generateSlug('Bac si Tim Mach!')).toBe('bac-si-tim-mach');
  });

  it('groups valid schedules and ignores incomplete schedules', () => {
    const schedules = [
      {
        id: 1,
        day_of_week: DayOfWeek.MONDAY,
        start_time: '08:00:00',
        end_time: '09:30:00',
        is_active: true,
      },
      {
        id: 2,
        day_of_week: DayOfWeek.MONDAY,
        start_time: '',
        end_time: '10:00:00',
        is_active: false,
      },
    ];

    expect(groupSchedulesByDay(schedules as never)).toEqual({
      [DayOfWeek.MONDAY]: [
        {
          id: 1,
          start_time: '08:00',
          end_time: '09:30',
          is_active: true,
          appointments: [],
        },
      ],
    });
    expect(groupSchedulesByDay()).toEqual({});
  });

  it('recognizes PostgreSQL driver error shapes', () => {
    expect(isPgDriverError({ code: '23505', constraint: 'uq_email' })).toBe(
      true,
    );
    expect(isPgDriverError({})).toBe(true);
    expect(isPgDriverError({ code: 23505 })).toBe(false);
    expect(isPgDriverError(null)).toBe(false);
  });

  it.each([
    ['image', FileType.IMAGE],
    ['video', FileType.VIDEO],
    ['raw', FileType.DOCUMENT],
    ['binary', FileType.OTHER],
  ])('maps %s resources to %s', (input, expected) => {
    expect(mapFileType(input)).toBe(expected);
  });

  it('removes passwords at every depth and formats dates', () => {
    const value = {
      password: 'root-secret',
      profile: { password: 'nested-secret', name: 'Patient' },
      entries: [{ password: 'array-secret', date: new Date(2026, 8, 3) }],
    };

    expect(removePasswordDeep(value)).toEqual({
      profile: { name: 'Patient' },
      entries: [{ date: '03/09/2026' }],
    });
  });

  it('calculates and attaches the outstanding doctor flag consistently', () => {
    const doctor = { avg_rating: 5, appointments_completed: 100 };
    expect(calculateFinalScore(5, 100)).toBeCloseTo(4.8845, 3);
    expect(setIsOutstanding(doctor as never)).toBe(true);
    expect(setIsOutstandingDoctor(doctor as never)).toEqual({
      ...doctor,
      isOutstanding: true,
    });
    expect(setIsOutstandingDoctors([doctor as never])).toEqual([
      { ...doctor, isOutstanding: true },
    ]);
  });
});
