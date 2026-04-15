import {
  ConflictException,
  Injectable,
  NotFoundException,
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
import Relative from 'src/entities/relative.entity';
import { DataSource } from 'typeorm';
import HealthProfile from 'src/entities/healthProfile.entity';
import Relationship from 'src/entities/relationship.entity';

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
    if (user && (await bcrypt.compare(password, user.password))) {
      const roles = user.roles.map((r) => r.role.role_name);
      return { userId: user.id, roles };
    }
    return null;
  }

  async login(req: Request) {
    const { userId, roles }: any = req.user;
    try {
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
      };

      const accessToken = this.jwtService.sign(payload, {
        secret: this.configService.get<string>('ACCESS_TOKEN_SECRET'),
        expiresIn: this.configService.get<string>('ACCESS_TOKEN_EXPIRE'),
      });
      const refreshToken = this.jwtService.sign(payload, {
        secret: this.configService.get<string>('REFRESH_TOKEN_SECRET'),
        expiresIn: this.configService.get<string>('REFRESH_TOKEN_EXPIRE'),
      });

      const refreshTokenDecoded = this.jwtService.decode(refreshToken) as any;

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
        await this.redisService.setData(
          `blacklist:${oldest.tokenId}`,
          true,
          ttl,
        );
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
    } catch (error) {
      console.error('Lỗi khi đăng nhập:', error);
      throw error;
    }
  }

  async register(dataRegister: BodyRegisterDto) {
    try {
      return await this.dataSource.transaction(async (manager) => {
        const { username, email, password, fullname } = dataRegister;

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await this.usersService.createUser(
          manager,
          username,
          email,
          fullname,
          hashedPassword,
        );

        const relationship = await manager.findOne(Relationship, {
          where: { relationship_code: 'ban_than' },
        });

        if (!relationship) {
          throw new NotFoundException('Mối quan hệ mặc định không tồn tại.');
        }

        const newRelative = manager.create(Relative, {
          user: newUser,
          fullname,
          relationship,
        });
        await manager.save(Relative, newRelative);

        const newHealth = manager.create(HealthProfile, {
          patient: newRelative,
        });
        await manager.save(HealthProfile, newHealth);

        await this.emailProducer.sendWelcome(email, username);

        return { message: 'Đăng ký thành công.' };
      });
    } catch (error) {
      throw error;
    }
  }

  async logout(req: Request) {
    const refreshToken = req.cookies.refreshToken;
    const decoded = this.jwtService.decode(refreshToken) as any;
    if (!decoded || typeof decoded !== 'object' || !decoded.tokenId) {
      throw new UnauthorizedException('Token không hợp lệ!');
    }
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
    const refreshToken = req.cookies.refreshToken;
    const decoded = this.jwtService.decode(refreshToken) as any;
    if (!decoded || typeof decoded !== 'object' || !decoded.tokenId) {
      throw new UnauthorizedException('Token không hợp lệ!');
    }

    await this.redisService.incr(`session_version:${decoded.sub}`);
    await this.redisService.delData(`refresh_tokens:${decoded.sub}`);
    return { message: 'Đăng xuất tất cả các thiết bị thành công!' };
  }

  async refresh(req: Request, payload: any) {
    const { userId, tokenId, sessionVersion } = payload;

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
    };
    await this.redisService.lRem(`refresh_tokens:${userId}`, 0, match);
    const now = Math.floor(Date.now() / 1000);
    const parsed = JSON.parse(match);
    const ttl = parsed.exp ? parsed.exp - now : 7 * 24 * 60 * 60;
    await this.redisService.setData(`blacklist:${tokenId}`, true, ttl);

    const newAccessToken = this.jwtService.sign(newPayload, {
      secret: this.configService.get<string>('ACCESS_TOKEN_SECRET'),
      expiresIn: this.configService.get<string>('ACCESS_TOKEN_EXPIRE'),
    });
    const newRefreshToken = this.jwtService.sign(newPayload, {
      secret: this.configService.get<string>('REFRESH_TOKEN_SECRET'),
      expiresIn: this.configService.get<string>('REFRESH_TOKEN_EXPIRE'),
    });
    const newDecoded = this.jwtService.decode(newRefreshToken) as any;

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

  async setNewPassword(email: string, newPassword: string) {
    const user = await this.usersService.findByUsernameOrEmail(email);
    if (!user) {
      throw new NotFoundException('Người dùng không tồn tại!');
    }
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.usersService.updateUserField(
      user.id,
      'password',
      hashedPassword,
    );
    await this.redisService.incr(`session_version:${user.id}`);
    await this.redisService.delData(`refresh_tokens:${user.id}`);

    return { message: 'Đặt lại mật khẩu thành công.' };
  }
}
