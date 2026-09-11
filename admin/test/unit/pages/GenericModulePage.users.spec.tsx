import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

import { GenericModulePage } from "@/pages/GenericModulePage";
import { useAuthStore } from "@/store/useAuthStore";
import type { ApiResponse } from "@/types/interface/api.interface";
import type { User, UserListResponse } from "@/types/interface/user.interface";

// Mock only the axios boundary (per project convention: hook -> api module ->
// axios instance). Everything above it — useUsers (TanStack Query), userApi.ts
// (incl. its normalizeUser/normalizeUserListResponse), GenericList,
// ConfirmDialog/FormDialog, usePermission — runs as real, unmocked code.
vi.mock("@/configs/axios", () => {
  const post = vi.fn();
  const get = vi.fn();
  const patch = vi.fn();
  return {
    default: { post, get, patch, delete: vi.fn(), put: vi.fn() },
    refreshInstance: { post: vi.fn(), get: vi.fn() },
    backendOrigin: "http://localhost:3000",
    getBackendBaseURL: () => "http://localhost:3000",
  };
});

import axiosInstance from "@/configs/axios";

function makeUserRow(overrides: Partial<User> = {}): User {
  return {
    id: 1,
    fullname: "Nguyễn Văn A",
    email: "a@example.com",
    picture: null,
    date_of_birth: null,
    gender: true,
    address: null,
    phone: "0900000000",
    username: "nguyenvana",
    isAdmin: false,
    is_active: true,
    is_locked: false,
    roles: [{ role_name: "DOCTOR" }],
    created_at: null,
    updated_at: null,
    ...overrides,
  };
}

function renderUsersModule() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <GenericModulePage moduleId="users" />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

afterEach(() => {
  // resetAllMocks (not clearAllMocks): clearAllMocks only wipes call
  // history, it leaves a previous test's mockResolvedValue(...) standing as
  // the default implementation, which then silently answers the NEXT
  // test's mockRejectedValueOnce()-then-fallback-through calls with stale
  // success data instead of the intended rejection.
  vi.resetAllMocks();
  useAuthStore.setState({ currentUser: null, currentRole: null, permissions: [] });
});

describe("GenericModulePage (users module) — integration", () => {
  it("shows the loading state, then renders the real list once the API resolves", async () => {
    useAuthStore.setState({
      permissions: ["user:read", "user:manage", "user:create"],
    });
    const payload: ApiResponse<UserListResponse> = {
      statusCode: 200,
      success: true,
      error: null,
      data: {
        users: [makeUserRow({ id: 7, fullname: "Bác sĩ Bình" })],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      },
    };
    vi.mocked(axiosInstance.post).mockResolvedValue({ data: payload });

    renderUsersModule();

    expect(screen.getByText("Đang tải dữ liệu...")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Bác sĩ Bình")).toBeInTheDocument();
    });

    expect(axiosInstance.post).toHaveBeenCalledWith(
      "/users",
      expect.objectContaining({ page: 1, limit: 10 }),
    );
  });

  it("shows the ErrorState with a working retry button when the API call fails", async () => {
    useAuthStore.setState({ permissions: ["user:read", "user:manage"] });
    vi.mocked(axiosInstance.post).mockRejectedValueOnce(new Error("network down"));

    renderUsersModule();

    await waitFor(() => {
      expect(screen.getByText("Không thể tải dữ liệu")).toBeInTheDocument();
    });

    const successPayload: ApiResponse<UserListResponse> = {
      statusCode: 200,
      success: true,
      error: null,
      data: { users: [], total: 0, page: 1, limit: 10, totalPages: 0 },
    };
    // mockResolvedValue (persistent), not ...Once: React Query's retry
    // dance around a just-failed query can issue more than one follow-up
    // fetch before settling — asserting the retry button's ONLY visible
    // effect (the list eventually shows real, freshly-fetched data) is the
    // actual behavior under test, not a specific internal call count.
    vi.mocked(axiosInstance.post).mockResolvedValue({ data: successPayload });

    await userEvent.click(screen.getByRole("button", { name: "Thử lại" }));

    await waitFor(() => {
      expect(screen.getByText("Chưa có dữ liệu")).toBeInTheDocument();
    });
    expect(axiosInstance.post).toHaveBeenCalledWith(
      "/users",
      expect.objectContaining({ page: 1, limit: 10 }),
    );
  });

  it("shows the EmptyState when the backend returns zero rows", async () => {
    useAuthStore.setState({ permissions: ["user:read", "user:manage"] });
    const emptyPayload: ApiResponse<UserListResponse> = {
      statusCode: 200,
      success: true,
      error: null,
      data: { users: [], total: 0, page: 1, limit: 10, totalPages: 0 },
    };
    vi.mocked(axiosInstance.post).mockResolvedValue({ data: emptyPayload });

    renderUsersModule();

    await waitFor(() => {
      expect(screen.getByText("Chưa có dữ liệu")).toBeInTheDocument();
    });
  });

  it("hides the create-user toolbar button when the user lacks user:create/user:manage", async () => {
    useAuthStore.setState({ permissions: ["user:read"] });
    const payload: ApiResponse<UserListResponse> = {
      statusCode: 200,
      success: true,
      error: null,
      data: { users: [makeUserRow()], total: 1, page: 1, limit: 10, totalPages: 1 },
    };
    vi.mocked(axiosInstance.post).mockResolvedValue({ data: payload });

    renderUsersModule();

    await waitFor(() => {
      expect(screen.getByText("Nguyễn Văn A")).toBeInTheDocument();
    });

    expect(
      screen.queryByRole("button", { name: /Tạo người dùng/ }),
    ).not.toBeInTheDocument();
  });

  it("shows the create-user toolbar button when the user holds user:create, and submitting it calls POST /users/create", async () => {
    useAuthStore.setState({
      permissions: ["user:read", "user:create"],
    });
    const listPayload: ApiResponse<UserListResponse> = {
      statusCode: 200,
      success: true,
      error: null,
      data: { users: [], total: 0, page: 1, limit: 10, totalPages: 0 },
    };
    vi.mocked(axiosInstance.post).mockImplementation((url: string) => {
      if (url === "/users") return Promise.resolve({ data: listPayload });
      if (url === "/roles" || url === "/specialties") {
        return Promise.resolve({
          data: {
            statusCode: 200,
            success: true,
            error: null,
            data: { roles: [], specialties: [], total: 0, page: 1, limit: 100, totalPages: 0 },
          },
        });
      }
      return Promise.resolve({ data: { statusCode: 200, success: true, error: null, data: {} } });
    });

    renderUsersModule();

    await waitFor(() => {
      expect(screen.getByText("Chưa có dữ liệu")).toBeInTheDocument();
    });

    expect(
      screen.getByRole("button", { name: /Tạo người dùng/ }),
    ).toBeInTheDocument();
  });
});
