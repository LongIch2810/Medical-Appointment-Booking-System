import { OtpsController } from 'src/modules/otps/otps.controller';

describe('OtpsController', () => {
  const otpsService = {
    sendOtpToEmail: jest.fn(),
    verifyOtp: jest.fn(),
  };
  const controller = new OtpsController(otpsService as never);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('sendOtp', () => {
    it('delegates to otpsService.sendOtpToEmail with the given email and returns its message', async () => {
      otpsService.sendOtpToEmail.mockResolvedValue({
        message: 'OTP sent',
      });

      const result = await controller.sendOtp('user@example.com');

      expect(otpsService.sendOtpToEmail).toHaveBeenCalledWith(
        'user@example.com',
      );
      expect(result).toBe('OTP sent');
    });
  });

  describe('verifyOtp', () => {
    it('delegates to otpsService.verifyOtp with otpCode and email and returns the message plus reset token', async () => {
      otpsService.verifyOtp.mockResolvedValue({
        message: 'OTP verified',
        resetToken: 'raw-reset-token',
      });

      const result = await controller.verifyOtp('123456', 'user@example.com');

      expect(otpsService.verifyOtp).toHaveBeenCalledWith(
        '123456',
        'user@example.com',
      );
      expect(result).toEqual({
        message: 'OTP verified',
        resetToken: 'raw-reset-token',
      });
    });
  });
});
