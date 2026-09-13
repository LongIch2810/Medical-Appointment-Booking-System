import assert from 'node:assert/strict';
import test from 'node:test';
import { sanitizeAiDocumentFileName } from '../../../src/utils/aiDocumentFileName.js';

test('sanitizes a requested filename before PDF generation/upload', () => {
  assert.equal(
    sanitizeAiDocumentFileName(
      'C:/fake/path/Báo cáo \u0111ăng ký.pdf.pdf',
      'fallback',
    ),
    'c-fake-path-bao-cao-dang-ky.pdf',
  );
});

test('uses a safe fallback when no filename is supplied', () => {
  assert.equal(
    sanitizeAiDocumentFileName(undefined, 'tom-tat-benh-an-20260913-143025123'),
    'tom-tat-benh-an-20260913-143025123.pdf',
  );
});
