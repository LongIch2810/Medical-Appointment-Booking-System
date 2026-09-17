import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { SessionAuthService } from './session-auth.service';
import {
  assertRequestTokenAppContext,
  getRequestAuthCookie,
} from 'src/utils/authContext';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(
    configService: ConfigService,
    private readonly sessionAuthService: SessionAuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => getRequestAuthCookie(req, 'refresh'),
      ]),
      passReqToCallback: true,
      ignoreExpiration: false,
      // Không có fallback string — thiếu REFRESH_TOKEN_SECRET phải fail-fast
      // ở startup (xem AppModule ConfigModule.forRoot validate).
      secretOrKey: configService.getOrThrow<string>('REFRESH_TOKEN_SECRET'),
    });
  }

  async validate(req: Request, payload: any) {
    const { sub: userId, tokenId, sessionVersion, roles } = payload;
    const appContext = assertRequestTokenAppContext(req, payload.appContext);

    await this.sessionAuthService.assertSessionValid({
      sub: userId,
      tokenId,
      sessionVersion,
    });

    return { userId, tokenId, sessionVersion, roles, appContext };
  }
}
