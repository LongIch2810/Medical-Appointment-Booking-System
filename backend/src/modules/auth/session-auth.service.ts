import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { RedisCacheService } from 'src/redis-cache/redis-cache.service';

export interface ValidatedAccessToken {
  userId: number;
  roles: string[];
  tokenId: string;
  sessionVersion: number;
}

/**
 * Logic xác thực session dùng chung cho mọi kênh (HTTP qua JwtStrategy/
 * JwtRefreshStrategy, WebSocket qua WebsocketGateway/WsCookieAuthGuard) —
 * tránh tình trạng WebSocket verify JWT riêng và bỏ sót session_version/
 * blacklist check mà HTTP đã có.
 */
@Injectable()
export class SessionAuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly redisService: RedisCacheService,
  ) {}

  /** Không có fallback string nào — app phải fail-fast nếu thiếu secret (xem AppModule ConfigModule.forRoot validate). */
  getAccessTokenSecret(): string {
    const secret = this.configService.get<string>('ACCESS_TOKEN_SECRET');
    if (!secret) {
      throw new UnauthorizedException('Phiên đăng nhập không hợp lệ !');
    }
    return secret;
  }

  /**
   * Kiểm tra session_version và blacklist cho một payload JWT ĐÃ được verify
   * chữ ký (dùng bởi JwtStrategy/JwtRefreshStrategy — passport-jwt tự verify
   * signature trước khi gọi validate()).
   */
  async assertSessionValid(payload: {
    sub: number;
    tokenId: string;
    sessionVersion: number;
  }): Promise<void> {
    const { sub: userId, tokenId, sessionVersion } = payload;
    const currentVersion = await this.redisService.getData(
      `session_version:${userId}`,
    );
    if (sessionVersion !== currentVersion) {
      throw new UnauthorizedException('Phiên đăng nhập không hợp lệ !');
    }

    const isBlacklisted = await this.redisService.getData(
      `blacklist:${tokenId}`,
    );
    if (isBlacklisted) {
      throw new UnauthorizedException('Token đã bị thu hồi !');
    }
  }

  /**
   * Dùng cho WebSocket, nơi không có passport-jwt tự verify signature —
   * verify chữ ký + kiểm tra session revocation trong một bước.
   */
  async validateAccessToken(token: string): Promise<ValidatedAccessToken> {
    let payload: Record<string, unknown>;
    try {
      payload = this.jwtService.verify(token, {
        secret: this.getAccessTokenSecret(),
      });
    } catch {
      throw new UnauthorizedException('Token không hợp lệ !');
    }

    const userId = Number(payload?.sub);
    const tokenId = payload?.tokenId as string | undefined;
    const sessionVersion = payload?.sessionVersion as number | undefined;
    const roles = (payload?.roles as string[] | undefined) ?? [];

    if (!Number.isInteger(userId) || userId <= 0 || !tokenId) {
      throw new UnauthorizedException('Token không hợp lệ !');
    }

    await this.assertSessionValid({
      sub: userId,
      tokenId,
      sessionVersion: sessionVersion as number,
    });

    return { userId, roles, tokenId, sessionVersion: sessionVersion as number };
  }
}
