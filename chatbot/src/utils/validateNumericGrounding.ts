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
  if (isPercent) {
    for (const possibility of [...possibilities]) {
      possibilities.add(String(Number(possibility) / 100));
    }
  }
  return [...possibilities];
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
    // Durations describe the requested reporting window, not a derived KPI.
    .replace(
      /\b\d+(?:[.,]\d+)?\s*(?:[-–]\s*)?(?:ngày|days?|tuần|weeks?|tháng|months?|năm|years?|giờ|hours?|phút|minutes?|giây|seconds?)(?![A-Za-z0-9_])/gi,
      ' ',
    )
    .replace(/\b(?:năm|year)\s+\d{4}\b/gi, ' ');
  const tokens = reportText.match(
    /-?(?:\d{1,3}(?:[.,]\d{3})+(?:[.,]\d+)?|\d+(?:[.,]\d+)?)(?:\s*%)?/g,
  ) ?? [];
  return tokens.filter((token) => {
    const normalized = normalizeNumberToken(token);
    return normalized.length > 0 && !normalized.some((number) => known.has(number));
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
