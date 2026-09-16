import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { UsersService } from '../users/users.service';
import { DataSource } from 'typeorm';
import User from 'src/entities/user.entity';
import Role from 'src/entities/role.entity';
import UserRole from 'src/entities/userRole.entity';
import { ROLE_NAME } from 'src/utils/constants';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    configService: ConfigService,
    private usersService: UsersService,
    private dataSource: DataSource,
  ) {
    super({
      clientID: configService.get<string>('GOOGLE_CLIENT_ID'),
      clientSecret: configService.get<string>('GOOGLE_CLIENT_SECRET'),
      callbackURL: configService.get<string>('GOOGLE_CALL_BACK'),
      scope: ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    const { emails, photos } = profile;
    const email = emails?.[0]?.value;
    const picture = photos?.[0]?.value;

    if (!email) {
      return done(
        new NotFoundException(
          'Không thể lấy địa chỉ email từ tài khoản Google.',
        ),
        null,
      );
    }

    const user = await this.usersService.findByUsernameOrEmail(email);

    if (user) {
      // Đăng nhập Google đi vòng qua AuthService.validateUser() (chỉ dùng cho
      // đăng nhập bằng mật khẩu) nên phải tự kiểm tra is_locking/is_active ở
      // đây — nếu không, tài khoản bị khóa/vô hiệu hóa vẫn đăng nhập được
      // bình thường miễn là dùng nút "Đăng nhập bằng Google".
      if (user.is_locking) {
        return done(
          new ForbiddenException(
            'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.',
          ),
          null,
        );
      }
      if (!user.is_active) {
        return done(
          new ForbiddenException(
            'Tài khoản của bạn đã bị vô hiệu hóa. Vui lòng liên hệ quản trị viên.',
          ),
          null,
        );
      }

      if (!user.picture && picture) {
        await this.usersService.updateUserField(user.id, 'picture', picture);
      }

      let roles = (user.roles ?? [])
        .map((r) => r.role?.role_name || (r as any).role_name)
        .filter(Boolean);

      if (roles.length === 0) {
        const patientRole = await this.assignDefaultPatientRole(user.id);
        // Nếu role PATIENT mặc định không tồn tại (dữ liệu seed bị thiếu/đổi
        // tên), báo lỗi tường minh ngay tại đây thay vì cho done() thành công
        // với roles rỗng — nếu không, AuthService.login() sẽ throw
        // ForbiddenException ngay sau khi Passport báo xác thực đã thành công,
        // gây khó hiểu cho người dùng (tưởng đăng nhập được rồi lại bị chặn).
        if (!patientRole) {
          return done(
            new NotFoundException('Vai trò mặc định (PATIENT) không tồn tại.'),
            null,
          );
        }
        roles = [ROLE_NAME.PATIENT];
      }

      return done(null, { userId: user.id, roles });
    }

    let username = email.split('@')[0];
    const fullname = profile.displayName || username;

    try {
      const newUser = await this.dataSource.transaction(async (manager) => {
        // Đảm bảo tính duy nhất của username nếu tiền tố email bị trùng
        const existingWithUsername = await manager.findOne(User, {
          where: { username },
        });
        if (existingWithUsername) {
          username = `${username}_${Date.now().toString().slice(-4)}`;
        }

        // Tái sử dụng UsersService.createUserWithDefaultProfile() — cùng luồng
        // tạo User + role PATIENT + Relative "bản thân" + HealthProfile rỗng
        // mà đăng ký local (AuthService.register) dùng, tránh hai bản triển
        // khai lệch nhau theo thời gian.
        return this.usersService.createUserWithDefaultProfile(
          manager,
          username,
          email,
          fullname,
          null,
        );
      });

      if (picture) {
        await this.usersService.updateUserField(newUser.id, 'picture', picture);
      }

      return done(null, { userId: newUser.id, roles: [ROLE_NAME.PATIENT] });
    } catch (error) {
      console.error('Lỗi khi đăng ký tài khoản Google:', error);
      throw error;
    }
  }

  private async assignDefaultPatientRole(userId: number): Promise<Role | null> {
    const patientRole = await this.dataSource.getRepository(Role).findOne({
      where: { role_name: ROLE_NAME.PATIENT },
    });
    if (!patientRole) return null;
    await this.dataSource.getRepository(UserRole).save({
      user: { id: userId } as User,
      role: patientRole,
    });
    return patientRole;
  }
}
