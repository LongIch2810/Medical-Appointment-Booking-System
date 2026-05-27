import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

import {
  fetchAdminHealthProfiles,
  fetchHealthProfileByRelativeId,
  fetchPersonalHealthProfiles,
  updateHealthProfile,
} from "@/api/healthProfileApi";
import type {
  HealthProfileListPayload,
  UpdateHealthProfilePayload,
} from "@/types/interface/healthProfile.interface";

export const healthProfileQueryKeys = {
  admin: (filters: HealthProfileListPayload) =>
    ["health-profiles", "admin", filters] as const,
  personal: (filters: HealthProfileListPayload) =>
    ["health-profiles", "personal", filters] as const,
  byRelative: (relativeId: number) =>
    ["health-profile", "relative", relativeId] as const,
};

export function useAdminHealthProfiles(filters: HealthProfileListPayload) {
  return useQuery({
    queryKey: healthProfileQueryKeys.admin(filters),
    queryFn: () => fetchAdminHealthProfiles(filters),
  });
}

export function usePersonalHealthProfiles(filters: HealthProfileListPayload) {
  return useQuery({
    queryKey: healthProfileQueryKeys.personal(filters),
    queryFn: () => fetchPersonalHealthProfiles(filters),
  });
}

export function useHealthProfileByRelative(relativeId: number) {
  return useQuery({
    queryKey: healthProfileQueryKeys.byRelative(relativeId),
    queryFn: () => fetchHealthProfileByRelativeId(relativeId),
    enabled: relativeId > 0,
  });
}

export function useUpdateHealthProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      relativeId,
      payload,
    }: {
      relativeId: number;
      payload: UpdateHealthProfilePayload;
    }) => updateHealthProfile(relativeId, payload),
    onSuccess: (_, variables) => {
      toast.success("Cập nhật hồ sơ sức khỏe thành công");
      queryClient.invalidateQueries({ queryKey: ["health-profiles"] });
      queryClient.invalidateQueries({
        queryKey: healthProfileQueryKeys.byRelative(variables.relativeId),
      });
    },
    onError: () => {
      toast.error("Cập nhật hồ sơ sức khỏe thất bại");
    },
  });
}
