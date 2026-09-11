const RETRYABLE_HTTP_STATUSES = new Set([408, 429, 500, 502, 503, 504]);
const CONNECTION_ERROR_CODES = new Set([
  'ECONNABORTED',
  'ECONNRESET',
  'ECONNREFUSED',
  'ENOTFOUND',
  'EAI_AGAIN',
  'EPIPE',
  'ETIMEDOUT',
]);

export type ChatbotErrorCode =
  | 'INVALID_INPUT'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'SCHEMA_VALIDATION_FAILED'
  | 'BUSINESS_RULE_VIOLATION'
  | 'UPSTREAM_CONNECTION_ERROR'
  | 'UPSTREAM_REQUEST_TIMEOUT'
  | 'UPSTREAM_RATE_LIMITED'
  | 'UPSTREAM_INTERNAL_ERROR'
  | 'UPSTREAM_BAD_GATEWAY'
  | 'UPSTREAM_UNAVAILABLE'
  | 'UPSTREAM_GATEWAY_TIMEOUT'
  | 'INTERNAL_ERROR'
  | string;

type ErrorLike = {
  code?: string;
  cause?: unknown;
  details?: unknown;
  message?: string;
  name?: string;
  response?: {
    data?: { code?: string; error?: { code?: string; details?: unknown } };
    status?: number;
  };
  status?: number;
  statusCode?: number;
};

export class ChatbotOperationError extends Error {
  readonly status: number;
  readonly code: ChatbotErrorCode;
  readonly details: unknown;
  readonly retryable: boolean;

  constructor({
    status,
    code,
    message,
    details,
    retryable,
    cause,
  }: {
    status: number;
    code: ChatbotErrorCode;
    message: string;
    details?: unknown;
    retryable: boolean;
    cause?: unknown;
  }) {
    super(message, cause === undefined ? undefined : { cause });
    this.name = 'ChatbotOperationError';
    this.status = status;
    this.code = code;
    this.details = details ?? null;
    this.retryable = retryable;
  }
}

export function getErrorStatus(error: unknown): number | undefined {
  if (!error || typeof error !== 'object') return undefined;
  const candidate = error as ErrorLike;
  return candidate.status ?? candidate.statusCode ?? candidate.response?.status;
}

function getBackendErrorCode(error: unknown): string | undefined {
  if (!error || typeof error !== 'object') return undefined;
  const candidate = error as ErrorLike;
  return candidate.response?.data?.error?.code ?? candidate.response?.data?.code ??
    (candidate.code && !candidate.code.startsWith('ERR_') && !CONNECTION_ERROR_CODES.has(candidate.code)
      ? candidate.code
      : undefined);
}

function getErrorDetails(error: unknown): unknown {
  if (!error || typeof error !== 'object') return null;
  const candidate = error as ErrorLike;
  return candidate.details ?? candidate.response?.data?.error?.details ?? candidate.response?.data ?? null;
}

function getErrorMessage(error: unknown): string | undefined {
  return error && typeof error === 'object' && 'message' in error
    ? String((error as ErrorLike).message || '') || undefined
    : undefined;
}

export function isConnectionError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const candidate = error as ErrorLike;
  if (candidate.code && CONNECTION_ERROR_CODES.has(candidate.code)) return true;
  if (candidate.name === 'AbortError' || candidate.name === 'TimeoutError') return true;
  if (/timed?\s*out|timeout|network error|connection (?:reset|refused|error)/i.test(candidate.message ?? '')) {
    return true;
  }
  return candidate.cause ? isConnectionError(candidate.cause) : false;
}

export function isRetryableChatbotError(error: unknown): boolean {
  const status = getErrorStatus(error);
  return (status !== undefined && RETRYABLE_HTTP_STATUSES.has(status)) || isConnectionError(error);
}

function getRetryExhaustedCode(error: unknown, status: number | undefined): ChatbotErrorCode {
  if (isConnectionError(error) && status === undefined) return 'UPSTREAM_CONNECTION_ERROR';
  switch (status) {
    case 408:
      return 'UPSTREAM_REQUEST_TIMEOUT';
    case 429:
      return 'UPSTREAM_RATE_LIMITED';
    case 500:
      return 'UPSTREAM_INTERNAL_ERROR';
    case 502:
      return 'UPSTREAM_BAD_GATEWAY';
    case 503:
      return 'UPSTREAM_UNAVAILABLE';
    case 504:
      return 'UPSTREAM_GATEWAY_TIMEOUT';
    default:
      return 'UPSTREAM_CONNECTION_ERROR';
  }
}

function getNonRetryableCode(error: unknown, status: number): ChatbotErrorCode {
  const backendCode = getBackendErrorCode(error);
  if (backendCode) return backendCode;
  if ((error as ErrorLike | undefined)?.name === 'ZodError') return 'SCHEMA_VALIDATION_FAILED';
  switch (status) {
    case 400:
      return 'INVALID_INPUT';
    case 401:
      return 'UNAUTHORIZED';
    case 403:
      return 'FORBIDDEN';
    case 404:
      return 'NOT_FOUND';
    case 409:
      return 'CONFLICT';
    case 422:
      return 'SCHEMA_VALIDATION_FAILED';
    default:
      return 'INTERNAL_ERROR';
  }
}

export function normalizeChatbotError(error: unknown): ChatbotOperationError {
  if (error instanceof ChatbotOperationError) return error;

  const status = getErrorStatus(error);
  const retryable = isRetryableChatbotError(error);
  const backendCode = getBackendErrorCode(error);
  const isSchemaError = (error as ErrorLike | undefined)?.name === 'ZodError';
  const resolvedStatus = status ?? (
    isSchemaError
      ? 422
      : backendCode === 'BUSINESS_RULE_VIOLATION'
        ? 409
        : retryable
          ? 503
          : 500
  );
  const code = retryable
    ? getRetryExhaustedCode(error, status)
    : getNonRetryableCode(error, resolvedStatus);
  const message =
    getErrorMessage(error) ??
    (retryable ? 'Dịch vụ tạm thời không khả dụng. Vui lòng thử lại sau.' : 'Đã xảy ra lỗi khi xử lý yêu cầu.');

  return new ChatbotOperationError({
    status: resolvedStatus,
    code,
    message,
    details: getErrorDetails(error),
    retryable,
    cause: error,
  });
}

export type RetryOptions = {
  maxAttempts?: number;
  operation: string;
  sleep?: (delayMs: number) => Promise<void>;
  random?: () => number;
  /** Đồng hồ có thể inject được — dùng cho fake-timer test, mặc định Date.now. */
  now?: () => number;
  /**
   * Tổng ngân sách thời gian (ms) cho TOÀN BỘ vòng retry, tính từ lần gọi
   * withRetry() đầu tiên — không phải per-attempt. Nếu lần backoff tiếp theo
   * sẽ vượt ngân sách này, dừng ngay thay vì "reset" đồng hồ ở mỗi attempt.
   */
  totalTimeoutMs?: number;
  onRetry?: (context: {
    attempt: number;
    maxAttempts: number;
    error: unknown;
    delayMs: number;
  }) => void;
};

function defaultSleep(delayMs: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, delayMs));
}

function getRetryDelayMs(attempt: number, random: () => number) {
  const baseDelayMs = attempt === 1 ? 500 : 1000;
  return Math.round(baseDelayMs * (0.75 + random() * 0.25));
}

export async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions,
): Promise<T> {
  const maxAttempts = options.maxAttempts ?? 3;
  const sleep = options.sleep ?? defaultSleep;
  const random = options.random ?? Math.random;
  const now = options.now ?? Date.now;
  const deadlineAt =
    options.totalTimeoutMs !== undefined ? now() + options.totalTimeoutMs : undefined;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      const canRetry = attempt < maxAttempts && isRetryableChatbotError(error);
      if (!canRetry) throw normalizeChatbotError(error);

      const delayMs = getRetryDelayMs(attempt, random);
      if (deadlineAt !== undefined && now() + delayMs >= deadlineAt) {
        // Retrying would blow the total deadline — fail now instead of
        // sleeping into (or past) a budget that's already spent.
        throw normalizeChatbotError(error);
      }
      console.warn(
        JSON.stringify({
          scope: 'chatbot_retry',
          operation: options.operation,
          attempt,
          maxAttempts,
          status: getErrorStatus(error),
          code: (error as ErrorLike | undefined)?.code,
          delayMs,
        }),
      );
      options.onRetry?.({ attempt, maxAttempts, error, delayMs });
      await sleep(delayMs);
    }
  }

  throw new Error('Retry operation did not run');
}

export type CreateRetryingFetchOptions = {
  /** Ngân sách tổng cho toàn bộ chuỗi retry của MỘT lần gọi fetch() từ caller. */
  totalTimeoutMs?: number;
  /** Timeout riêng cho từng attempt — dùng setTimeout (không phải
   * AbortSignal.timeout tĩnh) để fake-timer test điều khiển được. */
  perAttemptTimeoutMs?: number;
};

export function createRetryingFetch(
  fetchImplementation: typeof fetch = fetch,
  options: CreateRetryingFetchOptions = {},
): typeof fetch {
  return async (input, init) =>
    withRetry(
      async () => {
        const request = input instanceof Request ? input.clone() : input;
        const controller = new AbortController();
        const callerSignal = init?.signal;
        const onCallerAbort = () => controller.abort(callerSignal?.reason);
        if (callerSignal) {
          if (callerSignal.aborted) controller.abort(callerSignal.reason);
          else callerSignal.addEventListener('abort', onCallerAbort, { once: true });
        }
        const timeoutId = options.perAttemptTimeoutMs
          ? setTimeout(() => {
              const timeoutError = new Error('LLM request timed out');
              timeoutError.name = 'TimeoutError';
              controller.abort(timeoutError);
            }, options.perAttemptTimeoutMs)
          : undefined;

        try {
          const response = await fetchImplementation(request, {
            ...init,
            signal: controller.signal,
          });
          if (RETRYABLE_HTTP_STATUSES.has(response.status)) {
            const error = new Error(`Upstream request failed with status ${response.status}`) as ErrorLike;
            error.status = response.status;
            throw error;
          }
          return response;
        } finally {
          if (timeoutId) clearTimeout(timeoutId);
          if (callerSignal) callerSignal.removeEventListener('abort', onCallerAbort);
        }
      },
      { operation: 'llm_request', totalTimeoutMs: options.totalTimeoutMs },
    );
}
