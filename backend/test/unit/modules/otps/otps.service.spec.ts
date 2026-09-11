import { UnauthorizedException } from '@nestjs/common';
import { OtpsService } from 'src/modules/otps/otps.service';
import { OtpPurpose } from 'src/shared/enums/otpPurpose';
import { hashSecret } from 'src/utils/hashSecret';

describe('OtpsService', () => {
  let otpRepository: any;
  let resetTokenRepository: any;
  let usersService: any;
  let emailProducer: any;
  let service: OtpsService;

  beforeEach(() => {
    otpRepository = {
      delete: jest.fn().mockResolvedValue({ affected: 2 }),
      update: jest.fn().mockResolvedValue({ affected: 0 }),
      findOne: jest.fn(),
      save: jest.fn().mockImplementation((value) => Promise.resolve(value)),
      create: jest.fn((value) => value),
    };
    resetTokenRepository = {
      delete: jest.fn().mockResolvedValue({ affected: 0 }),
      save: jest.fn().mockImplementation((value) => Promise.resolve(value)),
      create: jest.fn((value) => value),
    };
    usersService = { findByUsernameOrEmail: jest.fn() };
    emailProducer = { sendOtp: jest.fn().mockResolvedValue(undefined) };
    service = new OtpsService(
      otpRepository,
      resetTokenRepository,
      usersService,
      emailProducer,
    );
  });

  describe('deleteExpireOtps', () => {
    it('deletes expired OTPs and expired reset tokens', async () => {
      const log = jest.spyOn(console, 'log').mockImplementation(() => undefined);
      await service.deleteExpireOtps();
      expect(otpRepository.delete).toHaveBeenCalledWith(
        expect.objectContaining({ expiresAt: expect.anything() }),
      );
      expect(resetTokenRepository.delete).toHaveBeenCalledWith(
        expect.objectContaining({ expiresAt: expect.anything() }),
      );
      expect(log).toHaveBeenCalledWith(
        'Deleted 2 expired Otps, 0 expired reset tokens',
      );
    });
  });

  describe('sendOtpToEmail', () => {
    it('returns the same generic message for an unknown email, without sending mail (no user enumeration)', async () => {
      usersService.findByUsernameOrEmail.mockResolvedValue(null);

      const result = await service.sendOtpToEmail('missing@example.com');

      expect(result.message).toBe(
        'Nếu email tồn tại trong hệ thống, mã OTP đã được gửi.',
      );
      expect(emailProducer.sendOtp).not.toHaveBeenCalled();
      expect(otpRepository.save).not.toHaveBeenCalled();
    });

    it('invalidates prior unconsumed OTPs, stores only a hash, and emails the raw code', async () => {
      usersService.findByUsernameOrEmail.mockResolvedValue({
        id: 1,
        username: 'patient',
      });

      const result = await service.sendOtpToEmail('patient@example.com');

      expect(result.message).toBe(
        'Nếu email tồn tại trong hệ thống, mã OTP đã được gửi.',
      );
      expect(otpRepository.update).toHaveBeenCalledWith(
        expect.objectContaining({
          user: { id: 1 },
          purpose: OtpPurpose.PASSWORD_RESET,
        }),
        expect.objectContaining({ consumedAt: expect.any(Date) }),
      );
      expect(otpRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          otpHash: expect.any(String),
          attempts: 0,
          purpose: OtpPurpose.PASSWORD_RESET,
        }),
      );
      const savedOtp = otpRepository.save.mock.calls[0][0];
      expect(savedOtp.otpHash).not.toMatch(/^\d{6}$/); // never plaintext

      expect(emailProducer.sendOtp).toHaveBeenCalledWith(
        'patient@example.com',
        expect.stringMatching(/^\d{6}$/),
        'patient',
      );
      const [, mailedCode] = emailProducer.sendOtp.mock.calls[0];
      expect(savedOtp.otpHash).toBe(hashSecret(mailedCode));
    });
  });

  describe('verifyOtp', () => {
    it('rejects with a generic message for an unknown email (no user enumeration)', async () => {
      usersService.findByUsernameOrEmail.mockResolvedValue(null);
      await expect(
        service.verifyOtp('123456', 'missing@example.com'),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('rejects when there is no active (unconsumed) OTP', async () => {
      usersService.findByUsernameOrEmail.mockResolvedValue({ id: 1 });
      otpRepository.findOne.mockResolvedValue(null);
      await expect(
        service.verifyOtp('123456', 'patient@example.com'),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('rejects an expired OTP', async () => {
      usersService.findByUsernameOrEmail.mockResolvedValue({ id: 1 });
      otpRepository.findOne.mockResolvedValue({
        id: 10,
        otpHash: hashSecret('123456'),
        attempts: 0,
        expiresAt: new Date(Date.now() - 1_000),
      });
      await expect(
        service.verifyOtp('123456', 'patient@example.com'),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('rejects once the max attempt count has been reached', async () => {
      usersService.findByUsernameOrEmail.mockResolvedValue({ id: 1 });
      otpRepository.findOne.mockResolvedValue({
        id: 10,
        otpHash: hashSecret('123456'),
        attempts: 5,
        expiresAt: new Date(Date.now() + 60_000),
      });
      await expect(
        service.verifyOtp('123456', 'patient@example.com'),
      ).rejects.toBeInstanceOf(UnauthorizedException);
      expect(otpRepository.save).not.toHaveBeenCalled();
    });

    it('increments attempts and rejects a wrong code without consuming the OTP', async () => {
      usersService.findByUsernameOrEmail.mockResolvedValue({ id: 1 });
      const otp = {
        id: 10,
        otpHash: hashSecret('123456'),
        attempts: 0,
        expiresAt: new Date(Date.now() + 60_000),
        consumedAt: null,
      };
      otpRepository.findOne.mockResolvedValue(otp);

      await expect(
        service.verifyOtp('000000', 'patient@example.com'),
      ).rejects.toBeInstanceOf(UnauthorizedException);

      expect(otpRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ attempts: 1, consumedAt: null }),
      );
    });

    it('rejects reusing an OTP that was already verified/consumed', async () => {
      usersService.findByUsernameOrEmail.mockResolvedValue({ id: 1 });
      // The repository query filters on consumedAt IS NULL — a fully
      // consumed OTP simply won't be found as the active one anymore.
      otpRepository.findOne.mockResolvedValue(null);

      await expect(
        service.verifyOtp('123456', 'patient@example.com'),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('consumes the OTP and issues a one-time reset token on a correct, unexpired code', async () => {
      usersService.findByUsernameOrEmail.mockResolvedValue({ id: 1 });
      const otp = {
        id: 10,
        otpHash: hashSecret('123456'),
        attempts: 2,
        expiresAt: new Date(Date.now() + 60_000),
        consumedAt: null,
      };
      otpRepository.findOne.mockResolvedValue(otp);

      const result = await service.verifyOtp('123456', 'patient@example.com');

      expect(otpRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ consumedAt: expect.any(Date) }),
      );
      expect(resetTokenRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          tokenHash: expect.any(String),
          purpose: OtpPurpose.PASSWORD_RESET,
          user: { id: 1 },
        }),
      );
      expect(result.message).toBe('Xác thực mã OTP thành công.');
      expect(result.resetToken).toEqual(expect.any(String));
      const savedToken = resetTokenRepository.save.mock.calls[0][0];
      expect(savedToken.tokenHash).toBe(hashSecret(result.resetToken));
    });
  });
});
