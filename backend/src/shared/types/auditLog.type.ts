export type AuditLogData = {
  action: string;
  entity_name: string;
  old_data: Record<string, any>;
  new_data: Record<string, any>;
  endpoint: string;
  method: string;
  status_code: number;
  is_success: boolean;
  user_agent: string | null;
  ip_address: string | null;
  duration_ms: number;
  error_message?: string;
  user_id: number | null;
};
