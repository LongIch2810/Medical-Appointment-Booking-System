import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

import {
  activateUser,
  changePassword,
  createUser,
  deactivateUser,
  fetchCurrentUser,
  fetchPatients,
  fetchUserDetail,
  fetchUsers,
  lockUser,
  unlockUser,
  updateCurrentUser,
  updateUserRoles,
} from "@/api/userApi";
import type {
  CreateUserPayload,
  UpdateUserFieldsPayload,
  UpdateUserRolesPayload,
  UserListPayload,
} from "@/types/interface/user.interface";

export const userQueryKeys = {
  profile: ["profile"] as const,
  list: (filters: UserListPayload) => ["users", filters] as const,
  patients: (filters: UserListPayload) => ["patients", filters] as const,
  detail: (userId: number) => ["user-detail", userId] as const,
};

export function useCurrentUser() {
  return useQuery({
    queryKey: userQueryKeys.profile,
    queryFn: fetchCurrentUser,
    staleTime: 1000 * 60 * 5,
  });
}

export function useUsers(filters: UserListPayload) {
  return useQuery({
    queryKey: userQueryKeys.list(filters),
    queryFn: () => fetchUsers(filters),
  });
}

export function usePatients(filters: UserListPayload) {
  return useQuery({
    queryKey: userQueryKeys.patients(filters),
    queryFn: () => fetchPatients(filters),
  });
}

export function useUserDetail(userId: number) {
  return useQuery({
    queryKey: userQueryKeys.detail(userId),
    queryFn: () => fetchUserDetail(userId),
    enabled: userId > 0,
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateUserPayload) => createUser(payload),
    onSuccess: () => {
      toast.success("Tạo người dùng thành công");
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["doctors"] });
    },
    onError: (error: unknown) => {
      const message =
        (error as { response?: { data?: { error?: { message?: string } } } })
          ?.response?.data?.error?.message ?? "Tạo người dùng thất bại";
      toast.error(message);
    },
  });
}

export function useUpdateCurrentUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      payload,
      file,
    }: {
      payload: UpdateUserFieldsPayload;
      file?: File;
    }) => updateCurrentUser(payload, file),
    onSuccess: () => {
      toast.success("Cập nhật thông tin thành công");
      queryClient.invalidateQueries({ queryKey: userQueryKeys.profile });
    },
    onError: () => {
      toast.error("Cập nhật thông tin thất bại");
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: changePassword,
    onSuccess: () => {
      toast.success("Đổi mật khẩu thành công");
    },
    onError: () => {
      toast.error("Đổi mật khẩu thất bại");
    },
  });
}

export function useLockUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: lockUser,
    onSuccess: (_, userId) => {
      toast.success("Khóa người dùng thành công");
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: userQueryKeys.detail(userId) });
    },
    onError: () => {
      toast.error("Khóa người dùng thất bại");
    },
  });
}

export function useUnlockUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: unlockUser,
    onSuccess: (_, userId) => {
      toast.success("Mở khóa người dùng thành công");
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: userQueryKeys.detail(userId) });
    },
    onError: () => {
      toast.error("Mở khóa người dùng thất bại");
    },
  });
}

export function useActivateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: activateUser,
    onSuccess: (_, userId) => {
      toast.success("Kích hoạt người dùng thành công");
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: userQueryKeys.detail(userId) });
    },
    onError: () => {
      toast.error("Kích hoạt người dùng thất bại");
    },
  });
}

export function useDeactivateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deactivateUser,
    onSuccess: (_, userId) => {
      toast.success("Vô hiệu hóa người dùng thành công");
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: userQueryKeys.detail(userId) });
    },
    onError: () => {
      toast.error("Vô hiệu hóa người dùng thất bại");
    },
  });
}

export function useUpdateUserRoles() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      userId,
      payload,
    }: {
      userId: number;
      payload: UpdateUserRolesPayload;
    }) => updateUserRoles(userId, payload),
    onSuccess: (_, variables) => {
      toast.success("Cập nhật vai trò thành công");
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({
        queryKey: userQueryKeys.detail(variables.userId),
      });
    },
    onError: () => {
      toast.error("Cập nhật vai trò thất bại");
    },
  });
}
