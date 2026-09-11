import { minutes } from '@nestjs/throttler';

export const RATE_LIMIT_ERROR_CODE = 'RATE_LIMIT_EXCEEDED';
export const RATE_LIMIT_ERROR_MESSAGE =
  'Too many requests. Please try again later.';

export const GLOBAL_RATE_LIMIT = {
  limit: 100,
  ttl: minutes(1),
} as const;

export const RATE_LIMIT_POLICIES = {
  login: {
    default: {
      limit: 5,
      ttl: minutes(1),
      blockDuration: minutes(5),
    },
  },
  refresh: {
    default: {
      limit: 10,
      ttl: minutes(1),
      blockDuration: minutes(5),
    },
  },
  accountChange: {
    default: {
      limit: 3,
      ttl: minutes(10),
      blockDuration: minutes(5),
    },
  },
  otpVerification: {
    default: {
      limit: 5,
      ttl: minutes(5),
      blockDuration: minutes(5),
    },
  },
} as const;

export const WEBSOCKET_RATE_LIMIT_POLICIES = {
  connection: {
    limit: 20,
    ttl: minutes(1),
    blockDuration: minutes(5),
  },
  event: {
    default: {
      limit: 60,
      ttl: minutes(1),
      blockDuration: minutes(5),
    },
  },
  sendMessage: {
    default: {
      limit: 30,
      ttl: minutes(1),
      blockDuration: minutes(5),
    },
  },
} as const;

export const RATE_LIMIT_RESPONSE_HEADERS = [
  'X-RateLimit-Limit',
  'X-RateLimit-Remaining',
  'X-RateLimit-Reset',
  'Retry-After',
] as const;

export const RATE_LIMIT_STORAGE_LOG_COOLDOWN_MS = minutes(1);
export const RATE_LIMIT_STORAGE_TIMEOUT_MS = 500;
