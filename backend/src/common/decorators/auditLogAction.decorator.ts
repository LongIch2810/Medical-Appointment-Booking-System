import { SetMetadata } from '@nestjs/common';
import { AUDIT_LOG_KEY } from 'src/utils/constants';
interface AuditLogMetadata {
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'READ' | 'LOGIN' | 'LOGOUT';
  entityName: string;
}
export const AuditLogAction = (metadata: AuditLogMetadata) =>
  SetMetadata(AUDIT_LOG_KEY, metadata);
