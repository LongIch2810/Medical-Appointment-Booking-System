import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Request,
  Response,
  UseGuards,
} from '@nestjs/common';
import { LocalAuthGuard } from 'src/common/guards/localAuth.guard';
import { AuthService } from './auth.service';
import { BodyRegisterDto } from './dto/request/bodyRegister.dto';
import { JwtRefreshAuthGuard } from 'src/common/guards/jwtRefresh.guard';
import { GoogleAuthGuard } from 'src/common/guards/google.guard';
import { ConfigService } from '@nestjs/config';
import { JwtAuthGuard } from 'src/common/guards/jwt.guard';
import { Permissions } from 'src/common/decorators/permission.decorator';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';
import {
  ACCESS_TOKEN_EXPIRE_TIME,
  PERMISSIONS,
  REFRESH_TOKEN_EXPIRE_TIME,
} from 'src/utils/constants';
import { AuditLogAction } from 'src/common/decorators/auditLogAction.decorator';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @ApiOperation({ summary: 'Đăng ký tài khoản' })
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @AuditLogAction({ action: 'CREATE', entityName: 'auth.register' })
  async register(@Body() registerData: BodyRegisterDto) {
    const newUser = await this.authService.register(registerData);
    return newUser;
  }

  @ApiOperation({ summary: 'Đăng nhập' })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @UseGuards(LocalAuthGuard)
  @AuditLogAction({ action: 'LOGIN', entityName: 'auth.login' })
  async login(@Request() req, @Response() res) {
    const { accessToken, refreshToken } = await this.authService.login(req);

    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: false,
      sameSite: 'strict',
      maxAge: ACCESS_TOKEN_EXPIRE_TIME,
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: 'strict',
      maxAge: REFRESH_TOKEN_EXPIRE_TIME,
    });

    return res.status(HttpStatus.OK).json({
      statusCode: 200,
      success: true,
      data: { accessToken, refreshToken },
      error: null,
    });
  }

  @ApiOperation({ summary: 'Đăng nhập cho admin/bác sĩ' })
  @Post('/admin/login')
  @HttpCode(HttpStatus.OK)
  @UseGuards(LocalAuthGuard)
  @AuditLogAction({ action: 'LOGIN', entityName: 'auth.login-administrator' })
  async loginAdministrator(@Request() req, @Response() res) {
    const { accessToken, refreshToken } =
      await this.authService.loginAdministrator(req);

    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: false,
      sameSite: 'strict',
      maxAge: ACCESS_TOKEN_EXPIRE_TIME,
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: 'strict',
      maxAge: REFRESH_TOKEN_EXPIRE_TIME,
    });

    return res.status(HttpStatus.OK).json({
      statusCode: 200,
      success: true,
      data: { accessToken, refreshToken },
      error: null,
    });
  }

  @UseGuards(JwtRefreshAuthGuard)
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Làm mới access token' })
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @AuditLogAction({ action: 'LOGIN', entityName: 'auth.refresh' })
  async refresh(@Request() req, @Response() res) {
    const payload = req.user;
    const { newAccessToken, newRefreshToken } = await this.authService.refresh(
      req,
      payload,
    );
    res.cookie('accessToken', newAccessToken, {
      httpOnly: true,
      secure: false,
      sameSite: 'strict',
      maxAge: ACCESS_TOKEN_EXPIRE_TIME,
    });

    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: 'strict',
      maxAge: REFRESH_TOKEN_EXPIRE_TIME,
    });

    return res.status(HttpStatus.OK).json({
      statusCode: 200,
      success: true,
      data: { message: 'Làm mới token thành công !' },
      error: null,
    });
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PERMISSIONS.AUTH_LOGOUT)
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Đăng xuất' })
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @AuditLogAction({ action: 'LOGOUT', entityName: 'auth.logout' })
  async logout(@Request() req, @Response() res) {
    const { message } = await this.authService.logout(req);
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    return res.status(HttpStatus.OK).json({
      statusCode: 200,
      success: true,
      data: { message },
      error: null,
    });
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PERMISSIONS.AUTH_LOGOUT)
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Đăng xuất khỏi tất cả thiết bị' })
  @Post('logout-all')
  @HttpCode(HttpStatus.OK)
  @AuditLogAction({ action: 'LOGOUT', entityName: 'auth.logout-all' })
  async logoutAll(@Request() req) {
    const { message } = await this.authService.logoutAll(req);
    return { message };
  }

  @ApiOperation({ summary: 'Bắt đầu đăng nhập Google OAuth' })
  @Get('google')
  @UseGuards(GoogleAuthGuard)
  async googleAuth() {}

  @ApiOperation({ summary: 'Callback redirect từ Google OAuth' })
  @Get('google/redirect')
  @UseGuards(GoogleAuthGuard)
  @AuditLogAction({ action: 'LOGIN', entityName: 'auth.google' })
  async googleAuthRedirect(@Request() req, @Response() res) {
    const { accessToken, refreshToken } = await this.authService.login(req);

    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: false,
      sameSite: 'strict',
      maxAge: ACCESS_TOKEN_EXPIRE_TIME,
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: 'strict',
      maxAge: REFRESH_TOKEN_EXPIRE_TIME,
    });

    return res.redirect(
      this.configService.get<string>('FRONTEND_URL') || 'http://localhost:5173',
    );
  }

  @ApiOperation({ summary: 'Đặt lại mật khẩu mới' })
  @Post('set-new-password')
  @HttpCode(HttpStatus.OK)
  @AuditLogAction({ action: 'UPDATE', entityName: 'auth.password' })
  async setNewPassword(
    @Body('email') email: string,
    @Body('newPassword') newPassword: string,
  ) {
    const { message } = await this.authService.setNewPassword(
      email,
      newPassword,
    );
    return message;
  }
}
