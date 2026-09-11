import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { RedisCacheModule } from 'src/redis-cache/redis-cache.module';
import { SessionAuthService } from './session-auth.service';

/**
 * Module riêng, phụ thuộc tối thiểu (không kéo theo UsersModule/BullmqModule
 * như AuthModule) để cả AuthModule (HTTP) và WebsocketModule đều import
 * được SessionAuthService mà không tạo circular dependency
 * (AuthModule -> BullmqModule -> WebsocketModule -> AuthModule).
 */
@Module({
  imports: [
    RedisCacheModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('ACCESS_TOKEN_SECRET'),
      }),
    }),
  ],
  providers: [SessionAuthService],
  exports: [SessionAuthService],
})
export class SessionAuthModule {}
