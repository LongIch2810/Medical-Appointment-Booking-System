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
import {
  getAuthCookieOptions,
  getClearAuthCookieOptions,
} from 'src/utils/cookieOptions';
import { AuditLogAction } from 'src/common/decorators/auditLogAction.decorator';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { RATE_LIMIT_POLICIES } from 'src/common/rate-limit/rate-limit.constants';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  private setAuthCookies(res, accessToken: string, refreshToken: string): void {
    res.cookie(
      'accessToken',
      accessToken,
      getAuthCookieOptions(this.configService, ACCESS_TOKEN_EXPIRE_TIME),
    );
    res.cookie(
      'refreshToken',
      refreshToken,
      getAuthCookieOptions(this.configService, REFRESH_TOKEN_EXPIRE_TIME),
    );
  }

  @ApiOperation({ summary: 'Đăng ký tài khoản' })
  @Throttle(RATE_LIMIT_POLICIES.accountChange)
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @AuditLogAction({ action: 'CREATE', entityName: 'auth.register' })
  async register(@Body() registerData: BodyRegisterDto) {
    const newUser = await this.authService.register(registerData);
    return newUser;
  }

  @ApiOperation({ summary: 'Đăng nhập' })
  @Throttle(RATE_LIMIT_POLICIES.login)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @UseGuards(LocalAuthGuard)
  @AuditLogAction({ action: 'LOGIN', entityName: 'auth.login' })
  async login(@Request() req, @Response() res) {
    const { accessToken, refreshToken } = await this.authService.login(req);

    this.setAuthCookies(res, accessToken, refreshToken);

    // Token đã ở HttpOnly cookie — không trả lại trong body để tránh lộ ra
    // nơi client-side JS có thể đọc được (XSS) hoặc bị log lại.
    // Không `return` giá trị của res.json(...) (chính là đối tượng Response
    // của Express) — global interceptors (DateFormatInterceptor,
    // WriteAuditLogInterceptor) nhận giá trị trả về này và cố duyệt đệ quy
    // qua nó, gây "Maximum call stack size exceeded" vì Response có tham
    // chiếu vòng (res.req.res === res, ...). Response thật đã được gửi cho
    // client ở dòng trên nên giá trị trả về ở đây không ảnh hưởng HTTP response.
    res.status(HttpStatus.OK).json({
      statusCode: 200,
      success: true,
      data: { message: 'Đăng nhập thành công.' },
      error: null,
    });
  }

  @ApiOperation({ summary: 'Đăng nhập cho admin/bác sĩ' })
  @Throttle(RATE_LIMIT_POLICIES.login)
  @Post('/admin/login')
  @HttpCode(HttpStatus.OK)
  @UseGuards(LocalAuthGuard)
  @AuditLogAction({ action: 'LOGIN', entityName: 'auth.login-administrator' })
  async loginAdministrator(@Request() req, @Response() res) {
    const { accessToken, refreshToken } =
      await this.authService.loginAdministrator(req);

    this.setAuthCookies(res, accessToken, refreshToken);

    // Không `return` res.json(...) — xem chú thích ở login() phía trên.
    res.status(HttpStatus.OK).json({
      statusCode: 200,
      success: true,
      data: { message: 'Đăng nhập thành công.' },
      error: null,
    });
  }

  @UseGuards(JwtRefreshAuthGuard)
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Làm mới access token' })
  @Throttle(RATE_LIMIT_POLICIES.refresh)
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @AuditLogAction({ action: 'LOGIN', entityName: 'auth.refresh' })
  async refresh(@Request() req, @Response() res) {
    const payload = req.user;
    const { newAccessToken, newRefreshToken } = await this.authService.refresh(
      req,
      payload,
    );
    this.setAuthCookies(res, newAccessToken, newRefreshToken);

    // Không `return` res.json(...) — xem chú thích ở login() phía trên.
    res.status(HttpStatus.OK).json({
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
    const clearOptions = getClearAuthCookieOptions(this.configService);
    res.clearCookie('accessToken', clearOptions);
    res.clearCookie('refreshToken', clearOptions);
    // Không `return` res.json(...) — xem chú thích ở login() phía trên.
    res.status(HttpStatus.OK).json({
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

    this.setAuthCookies(res, accessToken, refreshToken);

    // Không `return` res.redirect(...) — xem chú thích ở login() phía trên.
    res.redirect(
      this.configService.get<string>('FRONTEND_URL') || 'http://localhost:5173',
    );
  }

  @ApiOperation({
    summary: 'Đặt lại mật khẩu mới (yêu cầu reset token từ /otps/verify-otp)',
  })
  @Throttle(RATE_LIMIT_POLICIES.accountChange)
  @Post('set-new-password')
  @HttpCode(HttpStatus.OK)
  @AuditLogAction({ action: 'UPDATE', entityName: 'auth.password' })
  async setNewPassword(
    @Body('resetToken') resetToken: string,
    @Body('newPassword') newPassword: string,
  ) {
    const { message } = await this.authService.setNewPassword(
      resetToken,
      newPassword,
    );
    return message;
  }
}
