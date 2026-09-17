import { UnauthorizedException } from '@nestjs/common';

export type AuthAppContext = 'patient' | 'admin';
export type AuthTokenKind = 'access' | 'refresh';

export const AUTH_APP_CONTEXT_HEADER = 'x-app-context';

export const AUTH_COOKIE_NAMES = {
  patient: {
    access: 'patientAccessToken',
    refresh: 'patientRefreshToken',
  },
  admin: {
    access: 'adminAccessToken',
    refresh: 'adminRefreshToken',
  },
} as const satisfies Record<AuthAppContext, Record<AuthTokenKind, string>>;

export const LEGACY_AUTH_COOKIE_NAMES = [
  'accessToken',
  'refreshToken',
] as const;

export function isAuthAppContext(value: unknown): value is AuthAppContext {
  return value === 'patient' || value === 'admin';
}

function getContextHeaderValue(req: any): unknown {
  return (
    req?.headers?.[AUTH_APP_CONTEXT_HEADER] ?? req?.headers?.['X-App-Context']
  );
}

export function getRequestAuthAppContext(req: any): AuthAppContext | null {
  const value = getContextHeaderValue(req);
  return isAuthAppContext(value) ? value : null;
}

export function requireRequestAuthAppContext(req: any): AuthAppContext {
  const context = getRequestAuthAppContext(req);
  if (!context) {
    throw new UnauthorizedException(
      'Thiếu hoặc không hợp lệ ngữ cảnh ứng dụng xác thực.',
    );
  }
  return context;
}

export function getAuthCookieName(
  context: AuthAppContext,
  kind: AuthTokenKind,
): string {
  return AUTH_COOKIE_NAMES[context][kind];
}

export function getRequestAuthCookie(
  req: any,
  kind: AuthTokenKind,
  context = getRequestAuthAppContext(req),
): string | null {
  if (!context) return null;
  const value = req?.cookies?.[getAuthCookieName(context, kind)];
  return typeof value === 'string' && value.length > 0 ? value : null;
}

export function getRequestAccessToken(req: any): string | null {
  const cookieToken = getRequestAuthCookie(req, 'access');
  if (cookieToken) return cookieToken;

  const authorization = req?.headers?.authorization;
  if (typeof authorization !== 'string') return null;
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  return match?.[1] ?? null;
}

export function getSocketAuthAppContext(client: any): AuthAppContext | null {
  const context = client?.handshake?.auth?.appContext;
  return isAuthAppContext(context) ? context : null;
}

export function parseCookieHeader(header: unknown): Record<string, string> {
  if (typeof header !== 'string') return {};

  return header.split(';').reduce<Record<string, string>>((cookies, item) => {
    const separatorIndex = item.indexOf('=');
    if (separatorIndex === -1) return cookies;

    const key = item.slice(0, separatorIndex).trim();
    const rawValue = item.slice(separatorIndex + 1).trim();
    if (!key || !rawValue) return cookies;

    try {
      cookies[key] = decodeURIComponent(rawValue);
    } catch {
      // Ignore malformed cookie values and let authentication reject the request.
    }
    return cookies;
  }, {});
}

export function getSocketAuthCookie(
  client: any,
  kind: AuthTokenKind,
): string | null {
  const context = getSocketAuthAppContext(client);
  if (!context) return null;

  const cookies = parseCookieHeader(client?.handshake?.headers?.cookie);
  return cookies[getAuthCookieName(context, kind)] ?? null;
}

export function requireTokenAppContext(
  value: unknown,
  expectedContext?: AuthAppContext,
): AuthAppContext {
  if (!isAuthAppContext(value)) {
    throw new UnauthorizedException('Token thiếu ngữ cảnh ứng dụng hợp lệ.');
  }
  if (expectedContext && value !== expectedContext) {
    throw new UnauthorizedException('Token không thuộc ngữ cảnh ứng dụng.');
  }
  return value;
}

export function assertRequestTokenAppContext(
  req: any,
  tokenContext: unknown,
): AuthAppContext {
  const rawHeader = getContextHeaderValue(req);
  const requestContext =
    rawHeader === undefined ? undefined : requireRequestAuthAppContext(req);
  return requireTokenAppContext(tokenContext, requestContext);
}
