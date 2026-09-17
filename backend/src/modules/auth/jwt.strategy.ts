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
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    configService: ConfigService,
    private readonly sessionAuthService: SessionAuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => getRequestAuthCookie(req, 'access'),
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      passReqToCallback: true,
      ignoreExpiration: false,
      // Không có fallback string — thiếu ACCESS_TOKEN_SECRET phải fail-fast
      // ở startup (xem AppModule ConfigModule.forRoot validate), không được
      // âm thầm dùng một secret đoán được.
      secretOrKey: configService.getOrThrow<string>('ACCESS_TOKEN_SECRET'),
    });
  }

  async validate(req: Request, payload: any) {
    const { sub: userId, roles, tokenId, sessionVersion } = payload;
    const appContext = assertRequestTokenAppContext(req, payload.appContext);

    await this.sessionAuthService.assertSessionValid({
      sub: userId,
      tokenId,
      sessionVersion,
    });

    return { userId, roles, appContext };
  }
}
