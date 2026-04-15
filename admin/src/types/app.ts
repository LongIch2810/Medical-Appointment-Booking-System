import type { LucideIcon } from "lucide-react";

export type AppRole = "doctor" | "admin";

export type Tone = "default" | "success" | "warning" | "danger" | "info";

export type Permission = string;

export type UserProfile = {
  id: number;
  displayName: string;
  email: string;
  avatar: string;
  department: string;
  title: string;
  roleCodes: AppRole[];
  permissions: Permission[];
};

export type MenuItem = {
  id: string;
  label: string;
  path: string;
  section: string;
  icon: LucideIcon;
  requiredPermissions: Permission[];
  moduleId?: string;
};

export type KpiMetric = {
  label: string;
  value: string;
  delta: string;
  tone?: Tone;
};

export type ActivityItem = {
  id: string;
  title: string;
  description: string;
  time: string;
  tone?: Tone;
};

export type WidgetStat = {
  label: string;
  value: string;
  hint: string;
};

export type DashboardPayload = {
  heroTitle: string;
  heroDescription: string;
  metrics: KpiMetric[];
  focusCards: WidgetStat[];
  activity: ActivityItem[];
  schedule: Array<{
    id: string;
    title: string;
    time: string;
    status: string;
    accent: string;
  }>;
};

export type TableCell =
  | string
  | {
      label: string;
      sublabel?: string;
      tone?: Tone;
    };

export type TableColumn = {
  key: string;
  label: string;
};

export type RecordAttachment = {
  id: string;
  name: string;
  type: "image" | "pdf";
  url: string;
};

export type ModuleRow = {
  id: string;
  cells: Record<string, TableCell>;
  summary: string;
  meta: Array<{ label: string; value: string }>;
  attachments?: RecordAttachment[];
};

export type ModuleConfig = {
  id: string;
  title: string;
  description: string;
  searchPlaceholder: string;
  statusLabel: string;
  metrics: KpiMetric[];
  columns: TableColumn[];
  rows: ModuleRow[];
  quickActions: string[];
  emptyTitle: string;
  emptyDescription: string;
  backendModule?: string;
  integrationNote: string;
};

export type MessageAttachment = {
  id: string;
  name: string;
  type: "image" | "pdf";
  url: string;
};

export type MessageBubble = {
  id: string;
  sender: "doctor" | "patient";
  content: string;
  time: string;
  attachments?: MessageAttachment[];
};

export type ConversationThread = {
  id: string;
  patientName: string;
  lastMessage: string;
  unreadCount: number;
  age: number;
  concern: string;
  riskLevel: string;
  updatedAt: string;
  messages: MessageBubble[];
  attachments: MessageAttachment[];
  details: Array<{ label: string; value: string }>;
};

export type PermissionGroup = {
  id: string;
  label: string;
  permissions: Array<{
    code: string;
    label: string;
    description: string;
  }>;
};

export type RolePermissionMatrix = {
  role: AppRole;
  label: string;
  grants: string[];
};
