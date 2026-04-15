import { messageThreads } from "@/mock/messages";
import { moduleConfigs } from "@/mock/modules";
import {
  dashboards,
  mockProfiles,
  permissionGroups,
  rolePermissionMatrix,
} from "@/mock/profiles";
import type {
  AppRole,
  ConversationThread,
  DashboardPayload,
  ModuleConfig,
  PermissionGroup,
  RolePermissionMatrix,
  UserProfile,
} from "@/types/app";

function withDelay<T>(value: T, ms = 220): Promise<T> {
  return new Promise((resolve) => {
    window.setTimeout(() => resolve(value), ms);
  });
}

export const queryKeys = {
  dashboard: (role: AppRole) => ["dashboard", role] as const,
  module: (moduleId: string) => ["module", moduleId] as const,
  messages: ["messages"] as const,
  rolePermission: ["role-permission"] as const,
  profiles: ["profiles"] as const,
};

export const mockApi = {
  getProfiles(): Promise<Record<AppRole, UserProfile>> {
    return withDelay(mockProfiles);
  },
  getDashboard(role: AppRole): Promise<DashboardPayload> {
    return withDelay(dashboards[role]);
  },
  getModule(moduleId: string): Promise<ModuleConfig> {
    return withDelay(moduleConfigs[moduleId]);
  },
  getMessages(): Promise<ConversationThread[]> {
    return withDelay(messageThreads);
  },
  getRolePermissions(): Promise<{
    groups: PermissionGroup[];
    matrix: RolePermissionMatrix[];
  }> {
    return withDelay({ groups: permissionGroups, matrix: rolePermissionMatrix });
  },
};
