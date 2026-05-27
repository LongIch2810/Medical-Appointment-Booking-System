import { create } from "zustand";
import { persist } from "zustand/middleware";

import {
  adminPermissionSet,
  doctorPermissionSet,
} from "@/config/permissions";
import type { User } from "@/types/interface/user.interface";

export type SessionRole = "admin" | "doctor" | null;

export function readRoleNames(user: User | null | undefined): string[] {
  return (user?.roles ?? []).map((role) =>
    (role.role_name ?? "").toUpperCase(),
  );
}

export function deriveRole(user: User | null | undefined): SessionRole {
  if (!user) return null;
  const names = readRoleNames(user);
  if (user.isAdmin || names.includes("ADMIN")) return "admin";
  if (names.includes("DOCTOR")) return "doctor";
  return null;
}

export function canAccessAdminConsole(
  user: User | null | undefined,
): boolean {
  if (!user) return false;
  if (user.isAdmin) return true;
  const names = readRoleNames(user);
  return names.some((name) => name !== "PATIENT");
}

export function derivePermissions(user: User | null | undefined): string[] {
  if (!user) return [];

  const backendPermissions = new Set<string>();

  if (Array.isArray(user.permissions)) {
    user.permissions.forEach((permission) => {
      if (permission) backendPermissions.add(permission);
    });
  }

  user.roles?.forEach((role) => {
    role.permissions?.forEach((permission) => {
      if (permission?.name) backendPermissions.add(permission.name);
    });
  });

  if (backendPermissions.size > 0) {
    return Array.from(backendPermissions);
  }

  // Fallback for older backends that do not yet expose permissions explicitly.
  const names = readRoleNames(user);
  const set = new Set<string>();
  if (user.isAdmin || names.includes("ADMIN")) {
    adminPermissionSet.forEach((permission) => set.add(permission));
  }
  if (names.includes("DOCTOR")) {
    doctorPermissionSet.forEach((permission) => set.add(permission));
  }
  return Array.from(set);
}

type AuthState = {
  currentUser: User | null;
  currentRole: SessionRole;
  permissions: string[];
  setSession: (user: User) => void;
  logout: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      currentUser: null,
      currentRole: null,
      permissions: [],
      setSession: (user) =>
        set({
          currentUser: user,
          currentRole: deriveRole(user),
          permissions: derivePermissions(user),
        }),
      logout: () =>
        set({ currentUser: null, currentRole: null, permissions: [] }),
    }),
    {
      name: "admin-auth-store",
      version: 3,
    },
  ),
);
