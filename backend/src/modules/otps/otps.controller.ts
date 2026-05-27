import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { OtpsService } from './otps.service';
import { AuditLogAction } from 'src/common/decorators/auditLogAction.decorator';

@Controller('otps')
export class OtpsController {
  constructor(private otpsService: OtpsService) {}

  @Post('send-otp')
  @HttpCode(HttpStatus.OK)
  @AuditLogAction({ action: 'CREATE', entityName: 'otps.send' })
  async sendOtp(@Body('email') email: string) {
    const { message } = await this.otpsService.sendOtpToEmail(email);
    return message;
  }

  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  @AuditLogAction({ action: 'LOGIN', entityName: 'otps.verify' })
  async verifyOtp(
    @Body('otpCode') otpCode: string,
    @Body('email') email: string,
  ) {
    const { message } = await this.otpsService.verifyOtp(otpCode, email);
    return message;
  }
}
