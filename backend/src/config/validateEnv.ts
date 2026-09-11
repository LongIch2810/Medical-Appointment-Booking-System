/**
 * Fail-fast khi thiếu biến env bắt buộc cho JWT — chạy trong
 * ConfigModule.forRoot({ validate }) nên throw TRƯỚC KHI bất kỳ module nào
 * khác (AuthModule, WebsocketModule, ...) được khởi tạo, ngăn app chạy với
 * secret rỗng/undefined (trước đây các strategy âm thầm fallback về chuỗi
 * đoán được như "secret"/"your_secret").
 */
const REQUIRED_ENV_KEYS = [
  'ACCESS_TOKEN_SECRET',
  'REFRESH_TOKEN_SECRET',
] as const;

export function validateRequiredEnv(
  config: Record<string, unknown>,
): Record<string, unknown> {
  const missing = REQUIRED_ENV_KEYS.filter((key) => {
    const value = config[key];
    return typeof value !== 'string' || value.trim() === '';
  });

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variable(s): ${missing.join(', ')}. ` +
        'Set them in your .env file before starting the server.',
    );
  }

  return config;
}
