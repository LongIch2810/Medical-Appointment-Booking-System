import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { SessionAuthService } from './session-auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    configService: ConfigService,
    private readonly sessionAuthService: SessionAuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => req?.cookies?.accessToken,
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      // Không có fallback string — thiếu ACCESS_TOKEN_SECRET phải fail-fast
      // ở startup (xem AppModule ConfigModule.forRoot validate), không được
      // âm thầm dùng một secret đoán được.
      secretOrKey: configService.getOrThrow<string>('ACCESS_TOKEN_SECRET'),
    });
  }

  async validate(payload: any) {
    const { sub: userId, roles, tokenId, sessionVersion } = payload;

    await this.sessionAuthService.assertSessionValid({
      sub: userId,
      tokenId,
      sessionVersion,
    });

    return { userId, roles };
  }
}
