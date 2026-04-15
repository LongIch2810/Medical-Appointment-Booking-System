import { Module } from '@nestjs/common';
import { RolePermissionService } from './role-permission.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import Permission from 'src/entities/permission.entity';
import Role from 'src/entities/role.entity';
import RolePermission from 'src/entities/rolePermission.entity';
import { RedisCacheModule } from 'src/redis-cache/redis-cache.module';
import { RolePermissionController } from './role-permission.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([RolePermission, Role, Permission]),
    RedisCacheModule,
  ],
  controllers: [RolePermissionController],
  providers: [RolePermissionService],
  exports: [RolePermissionService],
})
export class RolePermissionModule {}
