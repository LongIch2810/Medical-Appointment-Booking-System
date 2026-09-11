import { parseTrustProxyHops } from 'src/common/rate-limit/trust-proxy';

describe('parseTrustProxyHops', () => {
  it.each([
    [undefined, 0],
    [null, 0],
    ['', 0],
    ['0', 0],
    ['1', 1],
    [2, 2],
    ['-1', 0],
    ['1.5', 0],
    ['invalid', 0],
  ])('parses %p as %p trusted proxy hops', (value, expected) => {
    expect(parseTrustProxyHops(value)).toBe(expected);
  });
});
