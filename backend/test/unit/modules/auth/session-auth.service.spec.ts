import { UnauthorizedException } from '@nestjs/common';
import { SessionAuthService } from 'src/modules/auth/session-auth.service';

describe('SessionAuthService', () => {
  let jwtService: { verify: jest.Mock };
  let configService: { get: jest.Mock };
  let redisService: { getData: jest.Mock };
  let service: SessionAuthService;

  beforeEach(() => {
    jwtService = { verify: jest.fn() };
    configService = { get: jest.fn().mockReturnValue('the-secret') };
    redisService = { getData: jest.fn() };
    service = new SessionAuthService(
      jwtService as never,
      configService as never,
      redisService as never,
    );
  });

  describe('getAccessTokenSecret', () => {
    it('throws when ACCESS_TOKEN_SECRET is not configured', () => {
      configService.get.mockReturnValue(undefined);
      expect(() => service.getAccessTokenSecret()).toThrow(
        UnauthorizedException,
      );
    });

    it('returns the configured secret', () => {
      expect(service.getAccessTokenSecret()).toBe('the-secret');
    });
  });

  describe('assertSessionValid', () => {
    it('rejects when sessionVersion no longer matches Redis (logout-all)', async () => {
      redisService.getData.mockResolvedValueOnce(2); // current session_version
      await expect(
        service.assertSessionValid({
          sub: 7,
          tokenId: 't1',
          sessionVersion: 1,
        }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('rejects a blacklisted tokenId (logout)', async () => {
      redisService.getData.mockResolvedValueOnce(1); // session_version matches
      redisService.getData.mockResolvedValueOnce(true); // blacklist:t1
      await expect(
        service.assertSessionValid({
          sub: 7,
          tokenId: 't1',
          sessionVersion: 1,
        }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('accepts a matching, non-blacklisted session', async () => {
      redisService.getData.mockResolvedValueOnce(1);
      redisService.getData.mockResolvedValueOnce(undefined);
      await expect(
        service.assertSessionValid({
          sub: 7,
          tokenId: 't1',
          sessionVersion: 1,
        }),
      ).resolves.toBeUndefined();
    });
  });

  describe('validateAccessToken', () => {
    it('rejects an invalid/expired signature', async () => {
      jwtService.verify.mockImplementation(() => {
        throw new Error('jwt expired');
      });
      await expect(
        service.validateAccessToken('bad.token'),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('rejects a payload missing subject/tokenId', async () => {
      jwtService.verify.mockReturnValue({ roles: ['PATIENT'] });
      await expect(
        service.validateAccessToken('malformed.token'),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('rejects a revoked session (blacklisted) even with a valid signature', async () => {
      jwtService.verify.mockReturnValue({
        sub: 7,
        roles: ['PATIENT'],
        tokenId: 't1',
        sessionVersion: 1,
      });
      redisService.getData.mockResolvedValueOnce(1);
      redisService.getData.mockResolvedValueOnce(true);

      await expect(
        service.validateAccessToken('revoked.token'),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('returns the validated identity for a valid, non-revoked session', async () => {
      jwtService.verify.mockReturnValue({
        sub: '7',
        roles: ['PATIENT'],
        tokenId: 't1',
        sessionVersion: 1,
      });
      redisService.getData.mockResolvedValueOnce(1);
      redisService.getData.mockResolvedValueOnce(undefined);

      await expect(
        service.validateAccessToken('valid.token'),
      ).resolves.toEqual({
        userId: 7,
        roles: ['PATIENT'],
        tokenId: 't1',
        sessionVersion: 1,
      });
      expect(jwtService.verify).toHaveBeenCalledWith('valid.token', {
        secret: 'the-secret',
      });
    });
  });
});
