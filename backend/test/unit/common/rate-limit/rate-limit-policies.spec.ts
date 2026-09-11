import {
  THROTTLER_BLOCK_DURATION,
  THROTTLER_LIMIT,
  THROTTLER_TTL,
} from '@nestjs/throttler/dist/throttler.constants';
import { AuthController } from 'src/modules/auth/auth.controller';
import { OtpsController } from 'src/modules/otps/otps.controller';
import { RATE_LIMIT_POLICIES } from 'src/common/rate-limit/rate-limit.constants';

type ControllerType = { prototype: object };

function getPolicy(controller: ControllerType, methodName: string) {
  const handler = Reflect.get(controller.prototype, methodName) as object;
  return {
    limit: Reflect.getMetadata(`${THROTTLER_LIMIT}default`, handler),
    ttl: Reflect.getMetadata(`${THROTTLER_TTL}default`, handler),
    blockDuration: Reflect.getMetadata(
      `${THROTTLER_BLOCK_DURATION}default`,
      handler,
    ),
  };
}

describe('sensitive endpoint rate-limit policies', () => {
  it.each([
    [AuthController, 'register', RATE_LIMIT_POLICIES.accountChange.default],
    [AuthController, 'login', RATE_LIMIT_POLICIES.login.default],
    [AuthController, 'loginAdministrator', RATE_LIMIT_POLICIES.login.default],
    [AuthController, 'refresh', RATE_LIMIT_POLICIES.refresh.default],
    [
      AuthController,
      'setNewPassword',
      RATE_LIMIT_POLICIES.accountChange.default,
    ],
    [OtpsController, 'sendOtp', RATE_LIMIT_POLICIES.accountChange.default],
    [OtpsController, 'verifyOtp', RATE_LIMIT_POLICIES.otpVerification.default],
  ])('applies the expected policy to %p.%s', (controller, method, policy) => {
    expect(getPolicy(controller, method)).toEqual(policy);
  });
});
