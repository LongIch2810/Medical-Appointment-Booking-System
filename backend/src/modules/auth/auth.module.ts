import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { LocalStrategy } from './local.strategy';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtStrategy } from './jwt.strategy';
import { JwtRefreshStrategy } from './refresh.strategy';
import { RedisCacheService } from 'src/redis-cache/redis-cache.service';
import { GoogleStrategy } from './google.strategy';
import { BullmqModule } from 'src/bullmq/bullmq.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import Relative from 'src/entities/relative.entity';
import HealthProfile from 'src/entities/healthProfile.entity';
import Relationship from 'src/entities/relationship.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Relative, HealthProfile, Relationship]),
    BullmqModule,
    UsersModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('ACCESS_TOKEN_SECRET'),
        signOptions: { expiresIn: configService.get<string>('JWT_EXPIRES') },
      }),
    }),
  ],
  providers: [
    AuthService,
    LocalStrategy,
    JwtStrategy,
    JwtRefreshStrategy,
    RedisCacheService,
    GoogleStrategy,
  ],
  controllers: [AuthController],
})
export class AuthModule {}
