export type AuditLogData = {
  action: string;
  entity_type: string;
  old_data?: Record<string, any>;
  new_data?: Record<string, any>;
  endpoint: string;
  method: string;
  status_code: number;
  is_success: boolean;
  error_message?: string;
  user_id: number;
};
