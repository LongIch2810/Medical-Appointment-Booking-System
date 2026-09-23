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
