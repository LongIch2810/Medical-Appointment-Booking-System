export type ChatbotUpstreamError = {
  status: number;
  code?: string;
  message?: string;
};

export function getChatbotUpstreamError(error: unknown): ChatbotUpstreamError {
  if (!error || typeof error !== 'object') return { status: 500 };

  const candidate = error as {
    code?: unknown;
    response?: { status?: unknown; data?: unknown };
  };
  const data =
    candidate.response?.data && typeof candidate.response.data === 'object'
      ? (candidate.response.data as Record<string, unknown>)
      : undefined;
  const nestedError =
    data?.error && typeof data.error === 'object'
      ? (data.error as Record<string, unknown>)
      : undefined;
  const details = nestedError?.details ?? data?.details;
  const messageCandidate =
    data?.message ??
    data?.err ??
    (typeof details === 'string'
      ? details
      : Array.isArray(details)
        ? details[0]
        : undefined);
  const codeCandidate = nestedError?.code ?? data?.code;
  const transportCode =
    typeof candidate.code === 'string' ? candidate.code : undefined;
  const isTimeout =
    transportCode === 'ECONNABORTED' || transportCode === 'ETIMEDOUT';

  return {
    status:
      typeof candidate.response?.status === 'number'
        ? candidate.response.status
        : isTimeout
          ? 504
          : 500,
    code: typeof codeCandidate === 'string' ? codeCandidate : undefined,
    message:
      typeof messageCandidate === 'string' ? messageCandidate : undefined,
  };
}
