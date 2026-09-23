import assert from 'node:assert/strict';
import test from 'node:test';
import { isLifeHealthSupportRequest } from '../../../src/utils/isLifeHealthSupportRequest.js';

test('recognizes explicit requests for LifeHealth support contacts', () => {
  assert.equal(isLifeHealthSupportRequest('Số hotline chính thức của LifeHealth là gì?'), true);
  assert.equal(isLifeHealthSupportRequest('Email hỗ trợ là gì?', 'Tôi muốn liên hệ LifeHealth.'), true);
});

test('does not route general email definitions or non-contact product questions to the support fallback', () => {
  assert.equal(isLifeHealthSupportRequest('Email là gì?'), false);
  assert.equal(isLifeHealthSupportRequest('LifeHealth có những chuyên khoa nào?'), false);
});
