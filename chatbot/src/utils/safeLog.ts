type ErrorLike = {
  name?: unknown;
  code?: unknown;
  status?: unknown;
  response?: { status?: unknown };
};

export function logSafeError(context: string, error: unknown): void {
  const candidate =
    error && typeof error === "object" ? (error as ErrorLike) : undefined;

  console.error(context, {
    name: typeof candidate?.name === "string" ? candidate.name : undefined,
    code:
      typeof candidate?.code === "string" || typeof candidate?.code === "number"
        ? candidate.code
        : undefined,
    status:
      typeof candidate?.status === "number"
        ? candidate.status
        : typeof candidate?.response?.status === "number"
          ? candidate.response.status
          : undefined,
  });
}
