import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import Doctor from 'src/entities/doctor.entity';
import HealthProfile from 'src/entities/healthProfile.entity';
import Relationship from 'src/entities/relationship.entity';
import Relative from 'src/entities/relative.entity';
import Role from 'src/entities/role.entity';
import Specialty from 'src/entities/specialty.entity';
import User from 'src/entities/user.entity';
import UserRole from 'src/entities/userRole.entity';
import { RedisCacheModule } from 'src/redis-cache/redis-cache.module';
import { CloudinaryModule } from 'src/uploads/cloudinary.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      UserRole,
      Role,
      Doctor,
      Specialty,
      Relative,
      Relationship,
      HealthProfile,
    ]),
    RedisCacheModule,
    CloudinaryModule,
  ],
  providers: [UsersService],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule {}
