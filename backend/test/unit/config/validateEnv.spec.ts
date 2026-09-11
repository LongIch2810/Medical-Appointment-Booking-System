import { validateRequiredEnv } from 'src/config/validateEnv';

describe('validateRequiredEnv', () => {
  it('throws when ACCESS_TOKEN_SECRET is missing', () => {
    expect(() =>
      validateRequiredEnv({ REFRESH_TOKEN_SECRET: 'x' }),
    ).toThrow(/ACCESS_TOKEN_SECRET/);
  });

  it('throws when REFRESH_TOKEN_SECRET is empty', () => {
    expect(() =>
      validateRequiredEnv({
        ACCESS_TOKEN_SECRET: 'x',
        REFRESH_TOKEN_SECRET: '   ',
      }),
    ).toThrow(/REFRESH_TOKEN_SECRET/);
  });

  it('lists every missing key in one error', () => {
    expect(() => validateRequiredEnv({})).toThrow(
      /ACCESS_TOKEN_SECRET, REFRESH_TOKEN_SECRET/,
    );
  });

  it('returns the config unchanged when all required keys are present', () => {
    const config = {
      ACCESS_TOKEN_SECRET: 'a',
      REFRESH_TOKEN_SECRET: 'b',
      OTHER: 'c',
    };
    expect(validateRequiredEnv(config)).toBe(config);
  });
});
