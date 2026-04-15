import type { ReactElement } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";

import { menuItems } from "@/config/menu";
import { permissions } from "@/config/permissions";
import { AdminLayout } from "@/layouts/AdminLayout";
import { getFirstAccessiblePath, hasPermissions } from "@/lib/navigation";
import { useAuthStore } from "@/store/useAuthStore";

import { AdminDashboardPage } from "@/pages/AdminDashboardPage";
import { DoctorSettingsPage } from "@/pages/DoctorSettingsPage";
import { DoctorDashboardPage } from "@/pages/DoctorDashboardPage";
import { ForbiddenPage } from "@/pages/ForbiddenPage";
import { GenericModulePage } from "@/pages/GenericModulePage";
import { LoginPage } from "@/pages/LoginPage";
import { MessagesPage } from "@/pages/MessagesPage";
import { NotFoundPage } from "@/pages/NotFoundPage";
import { RolePermissionPage } from "@/pages/RolePermissionPage";
import { SettingsPage } from "@/pages/SettingsPage";

function ProtectedRoute({ children }: { children: ReactElement }) {
  const currentUser = useAuthStore((state) => state.currentUser);
  const location = useLocation();

  if (!currentUser) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return children;
}

function PermissionRoute({
  requiredPermissions,
  children,
}: {
  requiredPermissions: string[];
  children: ReactElement;
}) {
  const currentUser = useAuthStore((state) => state.currentUser);

  if (!currentUser) return <Navigate to="/login" replace />;
  if (!hasPermissions(currentUser.permissions, requiredPermissions)) {
    return <Navigate to="/403" replace />;
  }

  return children;
}

function RootRedirect() {
  const currentUser = useAuthStore((state) => state.currentUser);
  return (
    <Navigate
      to={
        currentUser
          ? getFirstAccessiblePath(currentUser.permissions)
          : "/login"
      }
      replace
    />
  );
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/403" element={<ForbiddenPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<RootRedirect />} />
        <Route
          path="doctor/dashboard"
          element={
            <PermissionRoute requiredPermissions={[permissions.doctorDashboard]}>
              <DoctorDashboardPage />
            </PermissionRoute>
          }
        />
        <Route
          path="doctor/messages"
          element={
            <PermissionRoute requiredPermissions={[permissions.doctorMessages]}>
              <MessagesPage />
            </PermissionRoute>
          }
        />
        <Route
          path="doctor/settings"
          element={
            <PermissionRoute requiredPermissions={[permissions.doctorSettings]}>
              <DoctorSettingsPage />
            </PermissionRoute>
          }
        />
        <Route
          path="admin/dashboard"
          element={
            <PermissionRoute requiredPermissions={[permissions.adminDashboard]}>
              <AdminDashboardPage />
            </PermissionRoute>
          }
        />
        <Route
          path="admin/role-permissions"
          element={
            <PermissionRoute requiredPermissions={[permissions.rolePermissions]}>
              <RolePermissionPage />
            </PermissionRoute>
          }
        />
        <Route
          path="admin/settings"
          element={
            <PermissionRoute requiredPermissions={[permissions.settings]}>
              <SettingsPage />
            </PermissionRoute>
          }
        />
        {menuItems
          .filter(
            (item) =>
              item.moduleId &&
              item.id !== "admin-role-permissions" &&
              item.id !== "doctor-messages"
          )
          .map((item) => (
            <Route
              key={item.id}
              path={item.path.slice(1)}
              element={
                <PermissionRoute requiredPermissions={item.requiredPermissions}>
                  <GenericModulePage moduleId={item.moduleId!} />
                </PermissionRoute>
              }
            />
          ))}
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
