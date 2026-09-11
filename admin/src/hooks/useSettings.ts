import {
  fetchSystemSettings,
  fetchUserSettings,
  updateSystemSettings,
  updateUserSettings,
} from "@/api/settingsApi";
import type {
  UpdateSystemSettings,
  UpdateUserSettings,
} from "@/types/interface/settings.interface";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

export const settingsQueryKeys = {
  user: ["settings", "user", "me"] as const,
  system: ["settings", "system"] as const,
};

export function useUserSettings(enabled = true) {
  return useQuery({
    queryKey: settingsQueryKeys.user,
    queryFn: fetchUserSettings,
    enabled,
  });
}

export function useUpdateUserSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: UpdateUserSettings) => updateUserSettings(body),
    onSuccess: (response) => {
      queryClient.setQueryData(settingsQueryKeys.user, response);
      toast.success("Đã lưu cài đặt cá nhân");
    },
    onError: () => toast.error("Không thể lưu cài đặt cá nhân"),
  });
}

export function useSystemSettings() {
  return useQuery({
    queryKey: settingsQueryKeys.system,
    queryFn: fetchSystemSettings,
  });
}

export function useUpdateSystemSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: UpdateSystemSettings) => updateSystemSettings(body),
    onSuccess: (response) => {
      queryClient.setQueryData(settingsQueryKeys.system, response);
      toast.success("Đã cập nhật cấu hình hệ thống");
    },
    onError: () => toast.error("Không thể cập nhật cấu hình hệ thống"),
  });
}
