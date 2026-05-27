import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Request,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from 'src/common/guards/jwt.guard';
import { RedisCacheService } from 'src/redis-cache/redis-cache.service';
import { BodyChangePasswordDto } from './dto/request/bodyChangePassword.dto';
import * as bcrypt from 'bcryptjs';
import { PartialUpdateUserDto } from './dto/request/partialUpdateUser.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { CloudinaryService } from 'src/uploads/cloudinary.service';
import { UploadApiResponse } from 'cloudinary';
import { BodyFilterUsersDto } from './dto/request/bodyFilterUsers.dto';
import { RequestPaylaod } from '../../shared/types/global.type';
import { AuditLogAction } from 'src/common/decorators/auditLogAction.decorator';
import { BodyUpdateUserRolesDto } from './dto/request/bodyUpdateUserRoles.dto';
import { Permissions } from 'src/common/decorators/permission.decorator';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';
import { PERMISSIONS } from 'src/utils/constants';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('users')
export class UsersController {
  constructor(
    private readonly userService: UsersService,
    private readonly cloudinaryService: CloudinaryService,
    private readonly redisService: RedisCacheService,
  ) {}
  @Get()
  @HttpCode(HttpStatus.OK)
  @Permissions(PERMISSIONS.USER_READ)
  getUsers() {
    return this.userService.findAll();
  }

  @Get('info')
  @HttpCode(HttpStatus.OK)
  @Permissions(PERMISSIONS.USER_READ)
  async getUserInfo(@Request() req: any) {
    const { userId } = req.user as RequestPaylaod;
    // const cachedUserInfo = await this.redisService.getData(`user:${userId}`);
    // if (cachedUserInfo) {
    //   return cachedUserInfo;
    // }
    const userInfo = await this.userService.getUserProfile(userId);
    if (!userInfo) {
      throw new NotFoundException('Người dùng không tồn tại!');
    }

    // await this.redisService.setData(`user:${userId}`, userInfo, 60 * 60);
    return userInfo;
  }

  @Patch('update-info')
  @HttpCode(HttpStatus.OK)
  @Permissions(PERMISSIONS.USER_UPDATE)
  @AuditLogAction({ action: 'UPDATE', entityName: 'users.profile' })
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 5 * 1024 * 1024,
      },
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
          return cb(
            new BadRequestException('Chỉ chấp nhận ảnh JPG/PNG/GIF/WEBP'),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  async updateUserInfo(
    @Request() req,
    @Body() bodyUpdateUser: PartialUpdateUserDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const { userId } = req.user as RequestPaylaod;

    const user = await this.userService.findByUserId(userId);
    if (!user) {
      throw new NotFoundException('Người dùng không tồn tại!');
    }

    let uploadedResult: UploadApiResponse | null = null;
    if (file) {
      uploadedResult = await this.cloudinaryService.uploadFile(file);
    }

    const fields = uploadedResult
      ? { ...bodyUpdateUser, picture: uploadedResult.secure_url }
      : bodyUpdateUser;

    await this.userService.updateUserFields(userId, fields);

    const updatedUser = await this.userService.findByUserId(userId);
    await this.redisService.delData(`user:${userId}`);

    return updatedUser;
  }

  @Put('change-password')
  @HttpCode(HttpStatus.OK)
  @Permissions(PERMISSIONS.USER_UPDATE)
  @AuditLogAction({ action: 'UPDATE', entityName: 'users.password' })
  async changePassword(
    @Request() req,
    @Body() bodyChangePassword: BodyChangePasswordDto,
  ) {
    const { userId } = req.user as RequestPaylaod;
    const user = await this.userService.findByUserId(userId);
    if (!user) {
      throw new NotFoundException('Người dùng không tồn tại!');
    }
    const { old_password, new_password } = bodyChangePassword;

    const isMatchPassword = await bcrypt.compare(old_password, user.password!);
    if (!isMatchPassword) {
      throw new BadRequestException('Mật khẩu cũ không trùng khớp.');
    }

    const hashedNewPassword = await bcrypt.hash(new_password, 10);
    await this.userService.updateUserField(
      userId,
      'password',
      hashedNewPassword,
    );

    return { message: 'Thay đổi mật khẩu thành công.' };
  }

  @Post('users')
  @HttpCode(HttpStatus.OK)
  @Permissions(PERMISSIONS.USER_READ)
  getUsersFilterAndPagination(@Body() objectFilters: BodyFilterUsersDto) {
    return this.userService.filterAndPagination(objectFilters);
  }

  @Post('patients')
  @HttpCode(HttpStatus.OK)
  @Permissions(PERMISSIONS.PATIENT_READ)
  getPatientsFilterAndPagination(@Body() objectFilters: BodyFilterUsersDto) {
    return this.userService.filterAndPaginationPatients(objectFilters);
  }

  @Get(':userId')
  @HttpCode(HttpStatus.OK)
  @Permissions(PERMISSIONS.USER_READ)
  getAdminUserDetail(@Param('userId', ParseIntPipe) userId: number) {
    return this.userService.getAdminUserDetail(userId);
  }

  @Patch(':userId/lock')
  @HttpCode(HttpStatus.OK)
  @Permissions(PERMISSIONS.USER_LOCK)
  @AuditLogAction({ action: 'UPDATE', entityName: 'users.lock' })
  lockUser(@Param('userId', ParseIntPipe) userId: number) {
    return this.userService.setLocking(userId, true);
  }

  @Patch(':userId/unlock')
  @HttpCode(HttpStatus.OK)
  @Permissions(PERMISSIONS.USER_UNLOCK)
  @AuditLogAction({ action: 'UPDATE', entityName: 'users.unlock' })
  unlockUser(@Param('userId', ParseIntPipe) userId: number) {
    return this.userService.setLocking(userId, false);
  }

  @Patch(':userId/activate')
  @HttpCode(HttpStatus.OK)
  @Permissions(PERMISSIONS.USER_ACTIVATE)
  @AuditLogAction({ action: 'UPDATE', entityName: 'users.activate' })
  activateUser(@Param('userId', ParseIntPipe) userId: number) {
    return this.userService.setActive(userId, true);
  }

  @Patch(':userId/deactivate')
  @HttpCode(HttpStatus.OK)
  @Permissions(PERMISSIONS.USER_DEACTIVATE)
  @AuditLogAction({ action: 'UPDATE', entityName: 'users.deactivate' })
  deactivateUser(@Param('userId', ParseIntPipe) userId: number) {
    return this.userService.setActive(userId, false);
  }

  @Patch(':userId/roles')
  @HttpCode(HttpStatus.OK)
  @Permissions(PERMISSIONS.USER_UPDATE_ROLE)
  @AuditLogAction({ action: 'UPDATE', entityName: 'users.roles' })
  updateUserRoles(
    @Param('userId', ParseIntPipe) userId: number,
    @Body() body: BodyUpdateUserRolesDto,
  ) {
    return this.userService.updateRoles(userId, body.role_ids);
  }
}
