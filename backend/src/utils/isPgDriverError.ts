import { PgDriverError } from '../shared/types/global.type';

export function isPgDriverError(value: unknown): value is PgDriverError {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const maybeError = value as Record<string, unknown>;

  return (
    (maybeError.code === undefined || typeof maybeError.code === 'string') &&
    (maybeError.constraint === undefined ||
      typeof maybeError.constraint === 'string')
  );
}
