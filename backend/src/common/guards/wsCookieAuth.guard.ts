import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { SessionAuthService } from 'src/modules/auth/session-auth.service';
import {
  getSocketAuthAppContext,
  getSocketAuthCookie,
} from 'src/utils/authContext';

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
    const appContext = getSocketAuthAppContext(client);
    const token = getSocketAuthCookie(client, 'access');
    if (!token || !appContext) {
      client.emit('ws-error', { code: 401, message: 'Invalid token' });
      return false;
    }

    try {
      const validated = await this.sessionAuthService.validateAccessToken(
        token,
        appContext,
      );

      client.data.user = {
        sub: validated.userId,
        roles: validated.roles,
        tokenId: validated.tokenId,
        sessionVersion: validated.sessionVersion,
        appContext: validated.appContext,
      };
      client.data.token = token;

      return true;
    } catch {
      client.emit('ws-error', { code: 401, message: 'Invalid token' });
      return false;
    }
  }
}
