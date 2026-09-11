import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { SessionAuthService } from 'src/modules/auth/session-auth.service';

/**
 * Guard dùng lại được cho mọi @SubscribeMessage — re-verify token + session
 * revocation (session_version/blacklist) trên MỖI event, không chỉ lúc
 * connect. Đây là cơ chế "reject event tiếp theo nếu session bị thu hồi khi
 * socket đang mở" (logout/logout-all/reset password khi socket vẫn mở).
 */
@Injectable()
export class WsCookieAuthGuard implements CanActivate {
  constructor(private readonly sessionAuthService: SessionAuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client = context.switchToWs().getClient();
    const token = this._extractTokenFromCookie(client);
    if (!token) {
      client.emit('ws-error', { code: 401, message: 'Invalid token' });
      return false;
    }

    try {
      const validated =
        await this.sessionAuthService.validateAccessToken(token);

      client.data.user = {
        sub: validated.userId,
        roles: validated.roles,
        tokenId: validated.tokenId,
        sessionVersion: validated.sessionVersion,
      };
      client.data.token = token;

      return true;
    } catch {
      client.emit('ws-error', { code: 401, message: 'Invalid token' });
      return false;
    }
  }

  private _extractTokenFromCookie = (client: any): string | null => {
    try {
      const cookies = client?.handshake?.headers?.cookie;
      if (!cookies) return null;
      const cookieArray = cookies.split('; ');
      const cookieMap = cookieArray.reduce((acc: any, cookie: string) => {
        const [key, value] = cookie.split('=');
        if (key && value) acc[key.trim()] = decodeURIComponent(value);
        return acc;
      }, {});
      return cookieMap['accessToken'] || null;
    } catch {
      return null;
    }
  };
}
