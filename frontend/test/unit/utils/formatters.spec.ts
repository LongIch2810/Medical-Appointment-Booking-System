import {
  checkSameDay,
  formatDate,
  formatDateYYYYMMDD,
  getWeekday,
  toDate,
} from '@/utils/formatDate';
import {
  checkExpireTime,
  checkTimeBooked,
  formatTime,
  toHHMM,
  toMinutes,
} from '@/utils/formatTime';

describe('date and time utilities', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 8, 3, 10, 0));
  });

  afterEach(() => vi.useRealTimers());

  it('formats nullable dates with and without a weekday', () => {
    const date = new Date(2026, 8, 3);
    expect(formatDate(null)).toBe('');
    expect(formatDate(date, 'en-US', false)).toBe('03-09-2026');
    expect(formatDate(date, 'en-US', true)).toMatch(/Thursday,\s*03-09-2026/);
    expect(getWeekday(date, 'en-US')).toBe('Thursday');
  });

  it('compares calendar days independently of time', () => {
    expect(checkSameDay(new Date(2026, 0, 1, 1), new Date(2026, 0, 1, 23))).toBe(true);
    expect(checkSameDay(new Date(2026, 0, 1), new Date(2026, 0, 2))).toBe(false);
  });

  it('converts date representations used by the booking API', () => {
    expect(toDate('03-09-2026')).toEqual(new Date(2026, 8, 3));
    expect(formatDateYYYYMMDD(new Date('2026-09-03T12:00:00+07:00'))).toBe('2026-09-03');
  });

  it('normalizes time values', () => {
    expect(formatTime(new Date(2026, 0, 1, 8, 5))).toBe('08:05');
    expect(toHHMM('08:05:59')).toBe('08:05');
    expect(toMinutes('08:30')).toBe(510);
  });

  it('marks past dates and elapsed slots as expired', () => {
    expect(checkExpireTime(new Date(2026, 8, 2), '08:00', '09:00', '08:30')).toBe(true);
    expect(checkExpireTime(new Date(2026, 8, 4), '08:00', '09:00', '08:30')).toBe(false);
    expect(checkExpireTime(new Date(2026, 8, 3), '08:00', '09:00', '08:30')).toBe(true);
    expect(checkExpireTime(new Date(2026, 8, 3), '11:00', '12:00', '10:00')).toBe(false);
  });

  it('detects whether any appointment occupies the selected day', () => {
    const selected = new Date(2026, 8, 3);
    expect(checkTimeBooked(selected, [{ appointment_date: '03-09-2026' }] as never)).toBe(true);
    expect(checkTimeBooked(selected, null as never)).toBe(false);
  });
});

