import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import {
  login,
  logout,
  logoutAll,
  refresh,
  register,
  setNewPassword,
} from "@/api/authApi";
import { fetchCurrentUser } from "@/api/userApi";
import {
  canAccessAdminConsole,
  derivePermissions,
  deriveRole,
  readRoleNames,
  useAuthStore,
} from "@/store/useAuthStore";
import { getFirstAccessiblePath } from "@/lib/navigation";
import type { ApiError } from "@/types/interface/apiError.interface";

function readErrorMessage(error: unknown, fallback: string) {
  const axiosError = error as AxiosError<ApiError>;
  const details = axiosError.response?.data?.error?.details;
  if (Array.isArray(details)) return details[0] ?? fallback;
  return details || fallback;
}

function readLoginErrorMessage(error: unknown) {
  const message = readErrorMessage(error, "Đăng nhập thất bại!");
  if (message === "Bạn không có quyền truy cập!") {
    return "Tài khoản này không thể vào trang quản trị.";
  }
  return message;
}

function readAccessDeniedMessage(user: Parameters<typeof readRoleNames>[0]) {
  const roles = readRoleNames(user);
  const roleLabel = roles.length ? roles.join(", ") : "không có role";
  return `Tài khoản ${roleLabel} không thể vào trang quản trị.`;
}

export function useLogin() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const setSession = useAuthStore((state) => state.setSession);
  const storeLogout = useAuthStore((state) => state.logout);

  return useMutation({
    mutationFn: login,
    onSuccess: async () => {
      try {
        const profile = await queryClient.fetchQuery({
          queryKey: ["profile"],
          queryFn: fetchCurrentUser,
        });
        const user = profile?.data;
        if (!user) {
          throw new Error("Không lấy được hồ sơ người dùng");
        }
        if (!canAccessAdminConsole(user)) {
          // Account exists but doesn't have admin/doctor access (e.g. patient).
          toast.error(readAccessDeniedMessage(user));
          try {
            await logout();
          } catch {
            // Ignore logout failures, we still clear local state.
          }
          queryClient.clear();
          storeLogout();
          navigate("/login", { replace: true });
          return;
        }

        const permissions = derivePermissions(user);
        const role = deriveRole(user);
        setSession(user);
        toast.success("Đăng nhập thành công!");
        const target = getFirstAccessiblePath(permissions, role);
        navigate(target, { replace: true });
      } catch (error) {
        toast.error(readErrorMessage(error, "Đăng nhập thất bại!"));
        try {
          await logout();
        } catch {
          // ignore
        }
        queryClient.clear();
        storeLogout();
        navigate("/login", { replace: true });
      }
    },
    onError: (error) => {
      toast.error(readLoginErrorMessage(error));
    },
  });
}

export function useRegister() {
  const navigate = useNavigate();
  return useMutation({
    mutationFn: register,
    onSuccess: () => {
      toast.success("Đăng ký thành công!");
      navigate("/login");
    },
    onError: (error) => {
      toast.error(readErrorMessage(error, "Đăng ký thất bại!"));
    },
  });
}

export function useLogout() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const storeLogout = useAuthStore((state) => state.logout);

  return useMutation({
    mutationFn: logout,
    onSuccess: (data) => {
      toast.success(data?.data?.message ?? "Đăng xuất thành công");
      queryClient.clear();
      queryClient.removeQueries({ queryKey: ["profile"] });
      storeLogout();
      navigate("/login");
    },
    onError: (error) => {
      toast.error(readErrorMessage(error, "Đăng xuất thất bại!"));
    },
  });
}

export function useLogoutAll() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const storeLogout = useAuthStore((state) => state.logout);
  return useMutation({
    mutationFn: logoutAll,
    onSuccess: (data) => {
      toast.success(
        data?.data?.message ?? "Đăng xuất tất cả thiết bị thành công",
      );
      queryClient.clear();
      storeLogout();
      navigate("/login");
    },
    onError: (error) => {
      toast.error(readErrorMessage(error, "Đăng xuất thất bại!"));
    },
  });
}

export function useRefreshSession() {
  return useMutation({ mutationFn: refresh });
}

export function useSetNewPassword() {
  return useMutation({
    mutationFn: setNewPassword,
    onSuccess: () => {
      toast.success("Đặt lại mật khẩu thành công");
    },
    onError: (error) => {
      toast.error(readErrorMessage(error, "Đặt lại mật khẩu thất bại"));
    },
  });
}
