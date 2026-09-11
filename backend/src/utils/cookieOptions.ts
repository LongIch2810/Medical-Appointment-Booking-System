import { ConfigService } from '@nestjs/config';

export interface AuthCookieOptions {
  httpOnly: true;
  secure: boolean;
  sameSite: 'strict' | 'none';
  maxAge?: number;
}

function isProduction(configService: ConfigService): boolean {
  return configService.get<string>('NODE_ENV') === 'production';
}

/**
 * Frontend/admin (Vercel) và backend (Render) nằm trên domain khác nhau ở
 * production, nên cookie phải là `SameSite=None` (bắt buộc đi kèm `Secure`)
 * mới được browser gửi kèm trong request cross-site. Ở dev, mọi thứ chạy
 * trên localhost (cùng site, chỉ khác port) nên `Strict` vẫn hoạt động và
 * an toàn hơn.
 */
function getSameSite(configService: ConfigService): 'strict' | 'none' {
  return isProduction(configService) ? 'none' : 'strict';
}

/** Options dùng chung cho mọi res.cookie(...) set accessToken/refreshToken. */
export function getAuthCookieOptions(
  configService: ConfigService,
  maxAge: number,
): AuthCookieOptions {
  return {
    httpOnly: true,
    secure: isProduction(configService),
    sameSite: getSameSite(configService),
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
    sameSite: getSameSite(configService),
  };
}
