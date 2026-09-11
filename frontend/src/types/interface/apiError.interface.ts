export interface ApiError {
  statusCode?: number;
  success?: boolean;
  data?: unknown;
  message?: string[] | string;
  error?: { code?: string; details?: string[] | string };
}
