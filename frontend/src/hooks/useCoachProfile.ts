import {
  createCoachProfile,
  fetchMyCoachProfile,
  updateCoachProfile,
} from "@/api/coachProfileApi";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const coachProfileQueryKeys = {
  me: ["coach-profile-me"] as const,
};

// retry: false — 404 (chưa tạo hồ sơ) là kết quả hợp lệ, không phải lỗi cần
// thử lại.
export function useCoachProfile(enabled: boolean) {
  return useQuery({
    queryKey: coachProfileQueryKeys.me,
    queryFn: fetchMyCoachProfile,
    enabled,
    retry: false,
  });
}

export function useCreateCoachProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createCoachProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: coachProfileQueryKeys.me });
    },
  });
}

export function useUpdateCoachProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateCoachProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: coachProfileQueryKeys.me });
    },
  });
}
