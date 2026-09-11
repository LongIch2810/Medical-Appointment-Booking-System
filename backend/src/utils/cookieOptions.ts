import { ConfigService } from '@nestjs/config';

export interface AuthCookieOptions {
  httpOnly: true;
  secure: boolean;
  sameSite: 'strict';
  maxAge?: number;
}

function isProduction(configService: ConfigService): boolean {
  return configService.get<string>('NODE_ENV') === 'production';
}

/** Options dùng chung cho mọi res.cookie(...) set accessToken/refreshToken. */
export function getAuthCookieOptions(
  configService: ConfigService,
  maxAge: number,
): AuthCookieOptions {
  return {
    httpOnly: true,
    secure: isProduction(configService),
    sameSite: 'strict',
    maxAge,
  };
}

/**
 * Options dùng cho res.clearCookie(...) — phải khớp secure/sameSite với lúc
 * set thì trình duyệt mới thực sự xoá được cookie ở production (HTTPS).
 */
export function getClearAuthCookieOptions(
  configService: ConfigService,
): Omit<AuthCookieOptions, 'maxAge'> {
  return {
    httpOnly: true,
    secure: isProduction(configService),
    sameSite: 'strict',
  };
}
