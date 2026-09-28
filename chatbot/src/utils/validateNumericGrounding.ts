function numericValue(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && /^-?\d+(?:\.\d+)?$/.test(value.trim())) {
    return Number(value);
  }
  return undefined;
}

function collectSqlNumbers(value: unknown, values = new Set<string>()): Set<string> {
  if (typeof value === 'number' && Number.isFinite(value)) {
    values.add(String(value));
  } else if (typeof value === 'string' && /^-?\d+(?:\.\d+)?$/.test(value.trim())) {
    values.add(String(Number(value)));
  } else if (Array.isArray(value)) {
    value.forEach((item) => collectSqlNumbers(item, values));
  } else if (value && typeof value === 'object') {
    Object.values(value).forEach((item) => collectSqlNumbers(item, values));
  }
  return values;
}

function collectDerivedPercentages(rows: unknown): number[] {
  if (!Array.isArray(rows) || rows.length < 2) return [];

  const columns = new Map<string, number[]>();
  for (const row of rows) {
    if (!row || typeof row !== 'object' || Array.isArray(row)) continue;
    for (const [key, rawValue] of Object.entries(row)) {
      const value = numericValue(rawValue);
      if (value === undefined || value < 0) continue;
      const values = columns.get(key) ?? [];
      values.push(value);
      columns.set(key, values);
    }
  }

  const percentages: number[] = [];
  for (const values of columns.values()) {
    if (values.length < 2) continue;
    const total = values.reduce((sum, value) => sum + value, 0);
    if (total <= 0) continue;
    values.forEach((value) => percentages.push((value / total) * 100));
  }
  return percentages;
}

function normalizeNumberToken(token: string): string[] {
  const value = token.replace(/\s/g, '');
  const isPercent = value.endsWith('%');
  const possibilities = new Set<string>();
  const plain = value.replace(/%$/, '');
  if (/^-?\d+(?:\.\d+)?$/.test(plain)) possibilities.add(String(Number(plain)));
  if (/^-?\d{1,3}(?:,\d{3})+(?:\.\d+)?$/.test(plain)) {
    possibilities.add(String(Number(plain.replace(/,/g, ''))));
  }
  if (/^-?\d{1,3}(?:\.\d{3})+(?:,\d+)?$/.test(plain)) {
    possibilities.add(String(Number(plain.replace(/\./g, '').replace(',', '.'))));
  }
  if (/^-?\d{1,3}(?:,\d{3})+\.\d+$/.test(plain)) {
    possibilities.add(String(Number(plain.replace(/,/g, ''))));
  }
  if (/^-?\d+,\d+$/.test(plain)) {
    possibilities.add(String(Number(plain.replace(',', '.'))));
  }
  if (/^-?\d+(?:[.,]\d+)+$/.test(plain)) {
    possibilities.add(String(Number(plain.replace(',', '.'))));
  }
  if (isPercent) {
    for (const possibility of [...possibilities]) {
      possibilities.add(String(Number(possibility) / 100));
    }
  }
  return [...possibilities];
}

function decimalPlaces(token: string): number {
  const plain = token.replace(/\s|%/g, '');
  const separatorIndex = Math.max(plain.lastIndexOf('.'), plain.lastIndexOf(','));
  return separatorIndex < 0 ? 0 : plain.length - separatorIndex - 1;
}

function matchesRoundedValue(token: string, values: number[]): boolean {
  const precision = decimalPlaces(token);
  const tolerance = 0.5 * 10 ** -precision + Number.EPSILON;
  return normalizeNumberToken(token).some((candidate) => {
    const numericCandidate = Number(candidate);
    return values.some((value) => Math.abs(numericCandidate - value) <= tolerance);
  });
}

const REPORT_TEXT_FIELDS = [
  'title',
  'analysis',
  'section_title',
  'content',
  'insights',
  'strategic_recommendations',
  'economic_context',
  'footer',
] as const;

function collectText(value: unknown, output: string[]): void {
  if (typeof value === 'string') output.push(value);
  else if (Array.isArray(value)) value.forEach((item) => collectText(item, output));
  else if (value && typeof value === 'object') {
    Object.entries(value).forEach(([key, item]) => {
      if (REPORT_TEXT_FIELDS.includes(key as (typeof REPORT_TEXT_FIELDS)[number])) {
        collectText(item, output);
      }
    });
  }
}

export function findUngroundedNumbers(
  report: unknown,
  sqlResult: string | unknown[],
): string[] {
  let rows: unknown = sqlResult;
  if (typeof sqlResult === 'string') {
    try {
      rows = JSON.parse(sqlResult);
    } catch {
      rows = [];
    }
  }
  const known = collectSqlNumbers(rows);
  const derivedPercentages = collectDerivedPercentages(rows);
  const text: string[] = [];
  collectText(report, text);
  const reportText = text
    .join(' ')
    // Dates are temporal references, not numeric claims; compare only the
    // remaining numeric values against SQL provenance.
    // Remove compact ranges before individual dates so the first day in
    // formats such as "18–24/09/2026" is not mistaken for a metric.
    .replace(
      /\b\d{1,2}\s*(?:[-–]|đến|to)\s*\d{1,2}[/.]\d{1,2}(?:[/.]\d{2,4})?\b/gi,
      ' ',
    )
    .replace(
      /\b\d{1,2}[/.]\d{1,2}(?:[/.]\d{2,4})?\s*(?:[-–]|đến|to)\s*\d{1,2}[/.]\d{1,2}(?:[/.]\d{2,4})?\b/gi,
      ' ',
    )
    .replace(/\b\d{4}-\d{2}-\d{2}\b/g, ' ')
    .replace(/\b\d{1,2}[/.]\d{1,2}[/.]\d{2,4}\b/g, ' ')
    .replace(/\b(?:tháng|month)\s+\d{1,2}(?:\s*(?:[/.|-]\s*|\b(?:năm|year)\s*)\d{4})?/gi, ' ')
    // Week/quarter ordinals label time buckets. They are not measured values,
    // and SQL commonly represents the same buckets with start dates instead.
    .replace(/\b(?:tuần|week|quý|quarter)\s*(?:thứ\s*)?\d{1,2}\b/gi, ' ')
    .replace(/\bq[1-4]\b/gi, ' ')
    // Durations describe the requested reporting window, not a derived KPI.
    .replace(
      /\b\d+(?:[.,]\d+)?\s*(?:[-–]\s*)?(?:ngày|days?|tuần|weeks?|tháng|months?|năm|years?|giờ|hours?|phút|minutes?|giây|seconds?)(?![A-Za-z0-9_])/gi,
      ' ',
    )
    .replace(/\b(?:năm|year)\s+\d{4}\b/gi, ' ');
  const tokens = reportText.match(/-?\d+(?:[.,]\d+)*(?:\s*%)?/g) ?? [];
  return tokens.filter((token) => {
    const normalized = normalizeNumberToken(token);
    return normalized.length > 0
      && !normalized.some((number) => known.has(number))
      && !matchesRoundedValue(token, derivedPercentages);
  });
}

export function assertNumericGrounding(report: unknown, sqlResult: string | unknown[]) {
  const unsupported = findUngroundedNumbers(report, sqlResult);
  if (unsupported.length) {
    const error = new Error('Report contains numeric claims unsupported by query results.');
    (error as Error & { code?: string }).code = 'REPORT_NUMERIC_GROUNDING_FAILED';
    throw error;
  }
}
