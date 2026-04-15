import { plainToInstance } from 'class-transformer';
import User from 'src/entities/user.entity';
import { UserResponseDto } from './dto/response/userResponse.dto';
import RolePermission from 'src/entities/rolePermission.entity';
import UserRole from 'src/entities/userRole.entity';

export class UsersMapper {
  static toUserProfileResponse(user: User) {
    return plainToInstance(
      UserResponseDto,
      {
        ...user,
        roles: (user.roles ?? []).map((userRole: UserRole) => ({
          role_name: userRole.role.role_name,
          permissions: (userRole.role.permissions ?? []).map(
            (rolePermission: RolePermission) => rolePermission.permission,
          ),
        })),
      },
      {
        excludeExtraneousValues: true,
      },
    );
  }

  static toUserListResponse(users: User[]): UserResponseDto[] {
    return plainToInstance(UserResponseDto, users, {
      excludeExtraneousValues: true,
    });
  }
}
