/* eslint-disable */
import {
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { BodyRegisterDto } from './dto/request/bodyRegister.dto';
import { RedisCacheService } from 'src/redis-cache/redis-cache.service';
import { v4 as uuidv4 } from 'uuid';
import { Request } from 'express';
import { EmailProducer } from 'src/bullmq/queues/email/email.producer';
import { DataSource } from 'typeorm';
import { UsersMapper } from '../users/users.mapper';
import { RequestPaylaod } from '../../shared/types/global.type';
import { RoleName } from '../../shared/enums/roleName';
import User from 'src/entities/user.entity';
import ResetToken from 'src/entities/resetToken.entity';
import { OtpPurpose } from 'src/shared/enums/otpPurpose';
import { hashSecret } from 'src/utils/hashSecret';
import {
  getRequestAuthCookie,
  requireRequestAuthAppContext,
  requireTokenAppContext,
  type AuthAppContext,
} from 'src/utils/authContext';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private redisService: RedisCacheService,
    private emailProducer: EmailProducer,
    private readonly configService: ConfigService,
    private dataSource: DataSource,
  ) {}

  async validateUser(usernameOrEmail: string, password: string): Promise<any> {
    const user = await this.usersService.findByUsernameOrEmail(usernameOrEmail);

    if (!user) {
      return null;
    }

    if (!user.password) {
      throw new UnauthorizedException(
        'Tài khoản này được tạo bằng Google. Vui lòng đăng nhập bằng Google hoặc dùng "Quên mật khẩu" để tạo mật khẩu.',
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return null;
    }

    if (user.is_locking) {
      throw new ForbiddenException(
        'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.',
      );
    }
    if (!user.is_active) {
      throw new ForbiddenException(
        'Tài khoản của bạn đã bị vô hiệu hóa. Vui lòng liên hệ quản trị viên.',
      );
    }

    const roles = user.roles.map((r) => r.role.role_name);
    return { userId: user.id, roles };
  }

  async login(req: Request, appContext: AuthAppContext = 'patient') {
    const { userId, roles } = req.user as RequestPaylaod;
    if (!roles.includes(RoleName.PATIENT)) {
      throw new ForbiddenException('Bạn không có quyền truy cập!');
    }
    const sessionVersion =
      (await this.redisService.getData(`session_version:${userId}`)) || 1;
    await this.redisService.setData(
      `session_version:${userId}`,
      sessionVersion,
    );

    const tokenId = uuidv4();

    const payload = {
      sub: userId,
      roles,
      tokenId,
      sessionVersion,
      appContext,
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('ACCESS_TOKEN_SECRET'),
      expiresIn: this.configService.get<string>('ACCESS_TOKEN_EXPIRE') as any,
    });
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('REFRESH_TOKEN_SECRET'),
      expiresIn: this.configService.get<string>('REFRESH_TOKEN_EXPIRE') as any,
    });

    const refreshTokenDecoded = this.jwtService.decode(refreshToken);

    const sessions = await this.redisService.lRange(
      `refresh_tokens:${userId}`,
      0,
      -1,
    );

    if (sessions.length > 3) {
      const oldest = JSON.parse(sessions[0]);
      await this.redisService.lPop(`refresh_tokens:${userId}`);
      const now = Math.floor(Date.now() / 1000);
      const ttl = oldest.exp ? oldest.exp - now : 7 * 24 * 60 * 60;
      await this.redisService.setData(`blacklist:${oldest.tokenId}`, true, ttl);
    }

    await this.redisService.rPush(
      `refresh_tokens:${userId}`,
      JSON.stringify({
        tokenId,
        userAgent: req.headers['user-agent'],
        ip: req.ip,
        issuedAt: new Date().toISOString(),
        exp: refreshTokenDecoded.exp,
      }),
    );

    return {
      accessToken,
      refreshToken,
    };
  }

  async loginAdministrator(req: Request, appContext: AuthAppContext = 'admin') {
    const { userId, roles } = req.user as RequestPaylaod;
    if (roles.length === 1 && roles.includes(RoleName.PATIENT)) {
      throw new ForbiddenException('Bạn không có quyền truy cập!');
    }

    const sessionVersion =
      (await this.redisService.getData(`session_version:${userId}`)) || 1;
    await this.redisService.setData(
      `session_version:${userId}`,
      sessionVersion,
    );

    const tokenId = uuidv4();

    const payload = {
      sub: userId,
      roles,
      tokenId,
      sessionVersion,
      appContext,
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('ACCESS_TOKEN_SECRET'),
      expiresIn: this.configService.get<string>('ACCESS_TOKEN_EXPIRE') as any,
    });
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('REFRESH_TOKEN_SECRET'),
      expiresIn: this.configService.get<string>('REFRESH_TOKEN_EXPIRE') as any,
    });

    const refreshTokenDecoded = this.jwtService.decode(refreshToken);

    const sessions = await this.redisService.lRange(
      `refresh_tokens:${userId}`,
      0,
      -1,
    );

    if (sessions.length > 3) {
      const oldest = JSON.parse(sessions[0]);
      await this.redisService.lPop(`refresh_tokens:${userId}`);
      const now = Math.floor(Date.now() / 1000);
      const ttl = oldest.exp ? oldest.exp - now : 7 * 24 * 60 * 60;
      await this.redisService.setData(`blacklist:${oldest.tokenId}`, true, ttl);
    }

    await this.redisService.rPush(
      `refresh_tokens:${userId}`,
      JSON.stringify({
        tokenId,
        userAgent: req.headers['user-agent'],
        ip: req.ip,
        issuedAt: new Date().toISOString(),
        exp: refreshTokenDecoded.exp,
      }),
    );

    return {
      accessToken,
      refreshToken,
    };
  }

  async register(dataRegister: BodyRegisterDto) {
    try {
      return await this.dataSource.transaction(async (manager) => {
        const { username, email, password, fullname } = dataRegister;

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await this.usersService.createUserWithDefaultProfile(
          manager,
          username,
          email,
          fullname,
          hashedPassword,
        );

        await this.emailProducer.sendWelcome(email, username);

        return UsersMapper.toUserProfileResponse(newUser);
      });
    } catch (error) {
      throw error;
    }
  }

  async logout(req: Request) {
    const appContext = requireRequestAuthAppContext(req);
    const refreshToken = getRequestAuthCookie(req, 'refresh', appContext);
    const decoded = this.jwtService.decode(refreshToken ?? '');
    if (!decoded || typeof decoded !== 'object' || !decoded.tokenId) {
      throw new UnauthorizedException('Token không hợp lệ!');
    }
    requireTokenAppContext(decoded.appContext, appContext);
    const now = Math.floor(Date.now() / 1000);
    const ttl = decoded.exp ? decoded.exp - now : 7 * 24 * 60 * 60;
    await this.redisService.setData(`blacklist:${decoded.tokenId}`, true, ttl);
    const list = await this.redisService.lRange(
      `refresh_tokens:${decoded.sub}`,
      0,
      -1,
    );
    const match = list.find((t) => JSON.parse(t).tokenId === decoded.tokenId);
    if (!match) throw new UnauthorizedException('Token không hợp lệ!');
    await this.redisService.lRem(`refresh_tokens:${decoded.sub}`, 0, match);
    return { message: 'Đăng xuất thành công!' };
  }

  async logoutAll(req: Request) {
    const appContext = requireRequestAuthAppContext(req);
    const refreshToken = getRequestAuthCookie(req, 'refresh', appContext);
    const decoded = this.jwtService.decode(refreshToken ?? '');
    if (!decoded || typeof decoded !== 'object' || !decoded.tokenId) {
      throw new UnauthorizedException('Token không hợp lệ!');
    }
    requireTokenAppContext(decoded.appContext, appContext);

    await this.redisService.incr(`session_version:${decoded.sub}`);
    await this.redisService.delData(`refresh_tokens:${decoded.sub}`);
    return { message: 'Đăng xuất tất cả các thiết bị thành công!' };
  }

  async refresh(req: Request, payload: any) {
    const { userId, tokenId, sessionVersion, roles } = payload;
    const appContext = requireTokenAppContext(payload.appContext);

    const isBlacklisted = await this.redisService.getData(
      `blacklist:${tokenId}`,
    );
    if (isBlacklisted) {
      throw new UnauthorizedException('Token đã bị thu hồi!');
    }

    const list = await this.redisService.lRange(
      `refresh_tokens:${userId}`,
      0,
      -1,
    );
    const match = list.find((t) => JSON.parse(t).tokenId === tokenId);
    if (!match) throw new UnauthorizedException('Token không hợp lệ!');
    const newTokenId = uuidv4();
    const newPayload = {
      sub: userId,
      tokenId: newTokenId,
      sessionVersion: sessionVersion,
      roles,
      appContext,
    };
    await this.redisService.lRem(`refresh_tokens:${userId}`, 0, match);
    const now = Math.floor(Date.now() / 1000);
    const parsed = JSON.parse(match);
    const ttl = parsed.exp ? parsed.exp - now : 7 * 24 * 60 * 60;
    await this.redisService.setData(`blacklist:${tokenId}`, true, ttl);

    const newAccessToken = this.jwtService.sign(newPayload, {
      secret: this.configService.get<string>('ACCESS_TOKEN_SECRET'),
      expiresIn: this.configService.get<string>('ACCESS_TOKEN_EXPIRE') as any,
    });
    const newRefreshToken = this.jwtService.sign(newPayload, {
      secret: this.configService.get<string>('REFRESH_TOKEN_SECRET'),
      expiresIn: this.configService.get<string>('REFRESH_TOKEN_EXPIRE') as any,
    });
    const newDecoded = this.jwtService.decode(newRefreshToken);

    await this.redisService.rPush(
      `refresh_tokens:${userId}`,
      JSON.stringify({
        tokenId: newTokenId,
        userAgent: req.headers['user-agent'],
        ip: req.ip,
        issuedAt: new Date().toISOString(),
        exp: newDecoded.exp,
      }),
    );

    return { newAccessToken, newRefreshToken };
  }

  /**
   * Bắt buộc reset token hợp lệ (phát hành bởi OtpsService.verifyOtp) —
   * không được chỉ dựa trên email. Token được consume một cách atomic
   * (UPDATE ... WHERE id = ? AND consumed_at IS NULL, kiểm tra affected)
   * để hai request cùng dùng một token không thể cùng thành công (chống
   * replay). Sau khi đổi mật khẩu, thu hồi mọi session/refresh token hiện
   * tại của user (giống hệt logoutAll).
   */
  async setNewPassword(resetToken: string, newPassword: string) {
    const genericError = () =>
      new UnauthorizedException(
        'Token đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.',
      );

    if (!resetToken) {
      throw genericError();
    }

    const tokenHash = hashSecret(resetToken);
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const userId = await this.dataSource.transaction(async (manager) => {
      const resetTokenRepo = manager.getRepository(ResetToken);
      const tokenRow = await resetTokenRepo.findOne({
        where: { tokenHash },
        relations: ['user'],
      });

      if (
        !tokenRow ||
        tokenRow.purpose !== OtpPurpose.PASSWORD_RESET ||
        tokenRow.expiresAt.getTime() < Date.now()
      ) {
        throw genericError();
      }

      const updateResult = await resetTokenRepo
        .createQueryBuilder()
        .update(ResetToken)
        .set({ consumedAt: new Date() })
        .where('id = :id AND consumed_at IS NULL', { id: tokenRow.id })
        .execute();

      if (!updateResult.affected) {
        // Token đã bị dùng bởi một request khác (race) — không reset lần 2.
        throw genericError();
      }

      await manager
        .getRepository(User)
        .update(tokenRow.user.id, { password: hashedPassword });

      return tokenRow.user.id;
    });

    await this.redisService.incr(`session_version:${userId}`);
    await this.redisService.delData(`refresh_tokens:${userId}`);

    return { message: 'Đặt lại mật khẩu thành công.' };
  }
}
