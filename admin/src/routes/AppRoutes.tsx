import type { ReactElement } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";

import { menuItems } from "@/config/menu";
import { permissions } from "@/config/permissions";
import { AdminLayout } from "@/layouts/AdminLayout";
import { getFirstAccessiblePath, hasPermissions } from "@/lib/navigation";
import { useAuthStore } from "@/store/useAuthStore";

import { AdminAiReportGeneratorPage } from "@/pages/AdminAiReportGeneratorPage";
import { AdminDashboardPage } from "@/pages/AdminDashboardPage";
import { DoctorSettingsPage } from "@/pages/DoctorSettingsPage";
import { EnterpriseReportsDashboardPage } from "@/pages/EnterpriseReportsDashboardPage";
import { DoctorDashboardPage } from "@/pages/DoctorDashboardPage";
import { ForbiddenPage } from "@/pages/ForbiddenPage";
import { GenericModulePage } from "@/pages/GenericModulePage";
import { LoginPage } from "@/pages/LoginPage";
import { MedicalRecordSummaryPage } from "@/pages/MedicalRecordSummaryPage";
import { MessagesPage } from "@/pages/MessagesPage";
import { MyNotificationsPage } from "@/pages/MyNotificationsPage";
import { NotFoundPage } from "@/pages/NotFoundPage";
import { RolePermissionPage } from "@/pages/RolePermissionPage";
import { SettingsPage } from "@/pages/SettingsPage";

// Exported (chỉ để test trực tiếp qua AppRoutes.spec.tsx) — render toàn bộ
// cây <AppRoutes/> thật để test riêng 3 guard này sẽ kéo theo GenericModulePage
// (4800+ dòng, hàng chục hook TanStack Query) không cần thiết cho việc kiểm
// tra logic điều hướng/permission thuần tuý. Không đổi hành vi, chỉ export.
export function ProtectedRoute({ children }: { children: ReactElement }) {
  const currentUser = useAuthStore((state) => state.currentUser);
  const location = useLocation();

  if (!currentUser) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return children;
}

export function PermissionRoute({
  requiredPermissions,
  children,
}: {
  requiredPermissions: string[];
  children: ReactElement;
}) {
  const currentUser = useAuthStore((state) => state.currentUser);
  const userPermissions = useAuthStore((state) => state.permissions);

  if (!currentUser) return <Navigate to="/login" replace />;
  if (!hasPermissions(userPermissions, requiredPermissions)) {
    return <Navigate to="/403" replace />;
  }

  return children;
}

export function RootRedirect() {
  const currentUser = useAuthStore((state) => state.currentUser);
  const userPermissions = useAuthStore((state) => state.permissions);
  const currentRole = useAuthStore((state) => state.currentRole);
  return (
    <Navigate
      to={
        currentUser
          ? getFirstAccessiblePath(userPermissions, currentRole)
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
          path="doctor/patient-records"
          element={
            <PermissionRoute requiredPermissions={[permissions.patientRecords]}>
              <MedicalRecordSummaryPage />
            </PermissionRoute>
          }
        />
        <Route
          path="doctor/settings"
          element={<Navigate to="/account/settings" replace />}
        />
        <Route path="account/settings" element={<DoctorSettingsPage />} />
        <Route
          path="account/notifications"
          element={
            <PermissionRoute requiredPermissions={[permissions.notificationInbox]}>
              <MyNotificationsPage />
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
          path="admin/ai-coach-reports"
          element={
            <PermissionRoute requiredPermissions={[permissions.aiCoachReport]}>
              <AdminAiReportGeneratorPage />
            </PermissionRoute>
          }
        />
        <Route
          path="admin/enterprise-reports"
          element={
            <PermissionRoute requiredPermissions={[permissions.enterpriseReports]}>
              <EnterpriseReportsDashboardPage />
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
        <Route
          path="admin/my-notifications"
          element={
            <PermissionRoute requiredPermissions={[permissions.notificationInbox]}>
              <MyNotificationsPage />
            </PermissionRoute>
          }
        />
        {menuItems
          .filter(
            (item) =>
              item.moduleId &&
              item.id !== "admin-role-permissions" &&
              item.id !== "doctor-messages" &&
              item.id !== "doctor-records"
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
