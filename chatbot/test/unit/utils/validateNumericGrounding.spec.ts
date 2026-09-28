import assert from 'node:assert/strict';
import test from 'node:test';
import {
  assertNumericGrounding,
  findUngroundedNumbers,
} from '../../../src/utils/validateNumericGrounding.js';

test('accepts SQL numbers rendered with grouping, decimal, and percentage formatting', () => {
  const report = {
    title: 'Appointments: 1,234',
    analysis: [{ content: 'The rate was 12.5% on 2026-08-31.' }],
    insights: ['Equivalent localized value: 1.234,5'],
  };

  assert.deepEqual(
    findUngroundedNumbers(report, [{ total: 1234, rate: 0.125, localized: 1234.5 }]),
    [],
  );
  assert.doesNotThrow(() => assertNumericGrounding(report, [
    { total: 1234, rate: 0.125, localized: 1234.5 },
  ]));
});

test('rejects a numeric claim absent from SQL results', () => {
  const unsupported = findUngroundedNumbers(
    { analysis: [{ content: 'The rate increased by 27%.' }] },
    [{ rate: 0.125 }],
  );

  assert.deepEqual(unsupported, ['27%']);
  assert.throws(
    () => assertNumericGrounding({ title: '27%' }, [{ rate: 0.125 }]),
    /unsupported by query results/,
  );
});

test('checks numeric claims in analysis section headings', () => {
  assert.deepEqual(
    findUngroundedNumbers(
      { analysis: [{ section_title: 'Top 5 specialties', content: '12 appointments.' }] },
      [{ appointment_count: 12 }],
    ),
    ['5'],
  );
});

test('does not treat Vietnamese month and year labels as ungrounded metrics', () => {
  const report = {
    title: 'Lịch hẹn tháng 8/2026',
    analysis: [{ section_title: 'Tháng 8 năm 2026', content: 'Có 12 lịch hẹn.' }],
  };

  assert.deepEqual(findUngroundedNumbers(report, '[{"appointment_count":12}]'), []);
});

test('does not treat a reporting duration as an unsupported metric', () => {
  const report = {
    title: 'Lịch hẹn trong 7 ngày gần nhất',
    analysis: [
      {
        section_title: '7-day reporting window',
        content: 'Từ 17/09/2026 đến 23/09/2026 ghi nhận 12 lịch hẹn.',
      },
    ],
  };

  assert.deepEqual(
    findUngroundedNumbers(report, '[{"appointment_count":12}]'),
    [],
  );
  assert.deepEqual(
    findUngroundedNumbers(
      { title: 'Lịch hẹn trong 7 ngày gần nhất' },
      [{ appointment_count: 12 }],
    ),
    [],
  );
});

test('does not treat compact date ranges as report metrics', () => {
  const report = {
    title: 'Tổng hợp lịch hẹn 18–24/09/2026',
    analysis: [
      { content: 'Trong giai đoạn 18-24/09/2026 có 12 lịch hẹn.' },
      { content: 'Từ 18/09/2026 đến 24/09/2026 ghi nhận 12 lịch hẹn.' },
    ],
  };

  assert.deepEqual(
    findUngroundedNumbers(report, '[{"appointment_count":12}]'),
    [],
  );
});

test('does not treat week and quarter ordinals as report metrics', () => {
  const report = {
    title: 'Báo cáo tỷ lệ hủy theo tuần tháng 9/2026',
    analysis: [
      { section_title: 'Tuần 1', content: 'Tỷ lệ hủy là 12.5%.' },
      { section_title: 'Tuần thứ 2', content: 'Có 8 lịch hẹn.' },
      { section_title: 'Quarter 3 / Q3', content: 'Có 4 lịch đã hủy.' },
    ],
  };

  assert.deepEqual(
    findUngroundedNumbers(report, [{ cancellation_rate: 12.5, appointment_count: 8, cancelled_count: 4 }]),
    [],
  );
});

test('accepts percentages derived from the sum of a grouped SQL metric', () => {
  const report = {
    analysis: [
      {
        content: 'Nội tổng quát chiếm 14,95%, Tim mạch chiếm 12.149532710280374% và Da liễu chiếm khoảng 10%.',
      },
    ],
  };
  const rows = [
    { specialty: 'Nội tổng quát', appointment_count: 16 },
    { specialty: 'Tim mạch', appointment_count: 13 },
    { specialty: 'Da liễu', appointment_count: 11 },
    { specialty: 'Khác', appointment_count: 67 },
  ];

  assert.deepEqual(findUngroundedNumbers(report, rows), []);
});

test('still rejects a percentage that cannot be derived from grouped SQL metrics', () => {
  const rows = [
    { specialty: 'Nội tổng quát', appointment_count: 16 },
    { specialty: 'Tim mạch', appointment_count: 13 },
    { specialty: 'Khác', appointment_count: 78 },
  ];

  assert.deepEqual(
    findUngroundedNumbers({ analysis: [{ content: 'Tỷ trọng là 17%.' }] }, rows),
    ['17%'],
  );
});
