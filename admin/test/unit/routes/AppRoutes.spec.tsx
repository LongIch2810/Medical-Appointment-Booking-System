import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AppRoutes, ProtectedRoute, PermissionRoute, RootRedirect } from "@/routes/AppRoutes";
import { menuItems } from "@/config/menu";
import { permissions } from "@/config/permissions";
import { useAuthStore } from "@/store/useAuthStore";
import type { User } from "@/types/interface/user.interface";

vi.mock("@/layouts/AdminLayout", async () => {
  const { Outlet } = await import("react-router-dom");
  return { AdminLayout: () => <Outlet /> };
});
vi.mock("@/pages/AdminAiReportAssistantPage", () => ({
  AdminAiReportAssistantPage: () => <div>Assistant report route</div>,
}));

function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: 1,
    fullname: "Test User",
    email: "test@example.com",
    isAdmin: false,
    roles: [],
    ...overrides,
  } as User;
}

afterEach(() => {
  useAuthStore.setState({ currentUser: null, currentRole: null, permissions: [] });
});

describe("ProtectedRoute", () => {
  it("redirects to /login when there is no authenticated user", () => {
    render(
      <MemoryRouter initialEntries={["/admin/dashboard"]}>
        <Routes>
          <Route path="/login" element={<div>Login page</div>} />
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute>
                <div>Protected content</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("Login page")).toBeInTheDocument();
    expect(screen.queryByText("Protected content")).not.toBeInTheDocument();
  });

  it("renders the protected content once a user is authenticated", () => {
    useAuthStore.setState({ currentUser: makeUser() });

    render(
      <MemoryRouter initialEntries={["/admin/dashboard"]}>
        <Routes>
          <Route path="/login" element={<div>Login page</div>} />
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute>
                <div>Protected content</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("Protected content")).toBeInTheDocument();
  });
});

describe("PermissionRoute", () => {
  it("redirects to /login when there is no authenticated user, even before checking permissions", () => {
    render(
      <MemoryRouter initialEntries={["/admin/users"]}>
        <Routes>
          <Route path="/login" element={<div>Login page</div>} />
          <Route path="/403" element={<div>Forbidden page</div>} />
          <Route
            path="/admin/users"
            element={
              <PermissionRoute requiredPermissions={["user:read"]}>
                <div>Users page</div>
              </PermissionRoute>
            }
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("Login page")).toBeInTheDocument();
  });

  it("redirects to /403 when the authenticated user is missing a required permission", () => {
    useAuthStore.setState({
      currentUser: makeUser(),
      permissions: ["appointment:read"],
    });

    render(
      <MemoryRouter initialEntries={["/admin/users"]}>
        <Routes>
          <Route path="/login" element={<div>Login page</div>} />
          <Route path="/403" element={<div>Forbidden page</div>} />
          <Route
            path="/admin/users"
            element={
              <PermissionRoute requiredPermissions={["user:read"]}>
                <div>Users page</div>
              </PermissionRoute>
            }
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("Forbidden page")).toBeInTheDocument();
    expect(screen.queryByText("Users page")).not.toBeInTheDocument();
  });

  it("requires ALL listed permissions, not just one", () => {
    useAuthStore.setState({
      currentUser: makeUser(),
      permissions: ["user:read"],
    });

    render(
      <MemoryRouter initialEntries={["/admin/users"]}>
        <Routes>
          <Route path="/403" element={<div>Forbidden page</div>} />
          <Route
            path="/admin/users"
            element={
              <PermissionRoute requiredPermissions={["user:read", "user:update"]}>
                <div>Users page</div>
              </PermissionRoute>
            }
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("Forbidden page")).toBeInTheDocument();
  });

  it("renders the route content when the user holds every required permission", () => {
    useAuthStore.setState({
      currentUser: makeUser(),
      permissions: ["user:read", "user:update"],
    });

    render(
      <MemoryRouter initialEntries={["/admin/users"]}>
        <Routes>
          <Route path="/403" element={<div>Forbidden page</div>} />
          <Route
            path="/admin/users"
            element={
              <PermissionRoute requiredPermissions={["user:read", "user:update"]}>
                <div>Users page</div>
              </PermissionRoute>
            }
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("Users page")).toBeInTheDocument();
  });
});

describe("RootRedirect", () => {
  it("sends an unauthenticated user to /login", () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route path="/login" element={<div>Login page</div>} />
          <Route path="/" element={<RootRedirect />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("Login page")).toBeInTheDocument();
  });

  it("sends a user with no accessible menu item to /403", () => {
    useAuthStore.setState({ currentUser: makeUser(), permissions: [] });

    render(
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route path="/403" element={<div>Forbidden page</div>} />
          <Route path="/" element={<RootRedirect />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("Forbidden page")).toBeInTheDocument();
  });
});

describe("admin report routes", () => {
  it("keeps the assistant route behind the existing report permission", () => {
    const path = "/admin/ai-report-assistant";
    useAuthStore.setState({
      currentUser: makeUser(),
      permissions: [permissions.aiCoachReport],
    });
    render(
      <MemoryRouter initialEntries={[path]}>
        <AppRoutes />
      </MemoryRouter>,
    );
    expect(screen.getByText("Assistant report route")).toBeInTheDocument();
  });

  it("registers only the assistant menu entry with the report permission", () => {
    const entries = menuItems.filter((item) => item.path === "/admin/ai-report-assistant");
    expect(entries.map((item) => item.path)).toEqual(["/admin/ai-report-assistant"]);
    expect(entries.every((item) => item.requiredPermissions.includes(permissions.aiCoachReport))).toBe(true);
  });
});
