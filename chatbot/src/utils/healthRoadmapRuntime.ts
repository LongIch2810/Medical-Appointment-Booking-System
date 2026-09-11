import {
  getErrorStatus,
  isConnectionError,
  isRetryableChatbotError,
  normalizeChatbotError,
  withRetry,
} from "./retry.js";

const DEFAULT_HEALTH_ROADMAP_MAX_RETRIES = 2;

export type HealthRoadmapNodeError = {
  status: number;
  code: string;
  message: string;
  node: string;
};

type HealthRoadmapLogEvent = {
  requestId: string;
  relativeId: number;
  event: string;
  node?: string;
  attempt?: number;
  maxAttempts?: number;
  durationMs?: number;
  errorType?: string;
  status?: number;
};

export function getHealthRoadmapMaxRetries(
  value = process.env.LLM_HEALTH_ROADMAP_MAX_RETRIES,
) {
  const maxRetries = Number(value);

  return Number.isSafeInteger(maxRetries) && maxRetries >= 0
    ? maxRetries
    : DEFAULT_HEALTH_ROADMAP_MAX_RETRIES;
}

export function isHealthRoadmapTimeoutError(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const candidate = error as {
    code?: string;
    name?: string;
    message?: string;
    status?: number;
    statusCode?: number;
    response?: { status?: number };
  };

  return (
    candidate.status === 504 ||
    candidate.statusCode === 504 ||
    candidate.response?.status === 504 ||
    isConnectionError(error)
  );
}

export function getHealthRoadmapErrorType(error: unknown) {
  if (isHealthRoadmapTimeoutError(error)) {
    return "timeout";
  }

  if (!error || typeof error !== "object") {
    return "unknown";
  }

  const candidate = error as { code?: string; name?: string };
  return candidate.code ?? candidate.name ?? "unknown";
}

export function isRetryableHealthRoadmapError(error: unknown) {
  return isRetryableChatbotError(error);
}

export async function runHealthRoadmapOperation<T>(
  operation: () => Promise<T>,
  runtime: {
    requestId: string;
    relativeId: number;
    node: string;
  },
  options: {
    maxRetries?: number;
    retryDelayMs?: number;
  } = {},
) {
  const maxRetries = options.maxRetries ?? getHealthRoadmapMaxRetries();
  const maxAttempts = maxRetries + 1;

  try {
    return await withRetry(operation, {
      operation: runtime.node,
      maxAttempts,
      sleep:
        options.retryDelayMs === undefined
          ? undefined
          : (delayMs) =>
              new Promise<void>((resolve) =>
                setTimeout(resolve, options.retryDelayMs ?? delayMs),
              ),
      onRetry: ({ attempt, error }) => {
        logHealthRoadmapEvent({
          requestId: runtime.requestId,
          relativeId: runtime.relativeId,
          node: runtime.node,
          event: "node_retry_scheduled",
          attempt,
          maxAttempts,
          errorType: getHealthRoadmapErrorType(error),
          status: getErrorStatus(error),
        });
      },
    });
  } catch (error) {
    const normalized = normalizeChatbotError(error);
    logHealthRoadmapEvent({
      requestId: runtime.requestId,
      relativeId: runtime.relativeId,
      node: runtime.node,
      event: "node_attempt_failed",
      attempt: maxAttempts,
      maxAttempts,
      errorType: normalized.code,
      status: normalized.status,
    });
    throw normalized;
  }
}

export function toHealthRoadmapNodeError(
  error: unknown,
  node: string,
  fallbackMessage: string,
): HealthRoadmapNodeError {
  if (isHealthRoadmapTimeoutError(error)) {
    return {
      status: 504,
      code: "UPSTREAM_GATEWAY_TIMEOUT",
      message: `AI chưa phản hồi sau ${getHealthRoadmapMaxRetries() + 1} lần thử. Vui lòng thử lại sau.`,
      node,
    };
  }

  const normalized = normalizeChatbotError(error);

  return {
    status: normalized.status,
    code: normalized.code,
    message: fallbackMessage,
    node,
  };
}

export function getHealthRoadmapFinalError(errors: HealthRoadmapNodeError[]): {
  status: number;
  code: string;
  success: false;
  message: string;
} {
  const selected = errors.find((error) => error.status === 504) ?? errors[0];
  const status = selected?.status ?? 500;

  const maxAttempts = getHealthRoadmapMaxRetries() + 1;
  const messages: Record<number, string> = {
    400: "Thông tin hồ sơ sức khỏe chưa hợp lệ. Vui lòng kiểm tra và thử lại.",
    401: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
    403: "Bạn không có quyền tạo báo cáo cho hồ sơ này.",
    404: "Không tìm thấy hồ sơ hoặc dữ liệu sức khỏe cần thiết.",
    504: `AI chưa phản hồi sau ${maxAttempts} lần thử. Vui lòng thử lại sau.`,
  };

  return {
    status,
    code: selected?.code ?? "INTERNAL_ERROR",
    success: false,
    message:
      messages[status] ??
      `Không thể tạo báo cáo sức khỏe sau ${maxAttempts} lần thử. Vui lòng thử lại sau.`,
  };
}

export function logHealthRoadmapEvent(event: HealthRoadmapLogEvent) {
  const { relativeId: _relativeId, ...safeEvent } = event;
  console.info(
    JSON.stringify({
      scope: "health_roadmap",
      ...safeEvent,
    }),
  );
}
