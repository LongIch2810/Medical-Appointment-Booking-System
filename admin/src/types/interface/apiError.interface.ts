export interface ApiError {
  statusCode: number;
  success: boolean;
  data: unknown;
  error: {
    code: string;
    details: string[] | string;
  };
}
