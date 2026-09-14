import { QueryFailedError } from 'typeorm';

export type DatabaseErrorMetadata = {
  name: string;
  code?: string;
  table?: string;
  constraint?: string;
};

export function getDatabaseErrorMetadata(
  error: unknown,
): DatabaseErrorMetadata {
  const name = error instanceof Error ? error.name : typeof error;
  if (!(error instanceof QueryFailedError)) return { name };

  const driverError = error.driverError as Record<string, unknown> | undefined;
  return {
    name,
    code: typeof driverError?.code === 'string' ? driverError.code : undefined,
    table:
      typeof driverError?.table === 'string' ? driverError.table : undefined,
    constraint:
      typeof driverError?.constraint === 'string'
        ? driverError.constraint
        : undefined,
  };
}
