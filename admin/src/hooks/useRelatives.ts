import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

import {
  createRelative,
  deleteRelative,
  fetchAdminRelatives,
  fetchPersonalRelatives,
  fetchRelativeDetail,
  updateRelative,
} from "@/api/relativeApi";
import type {
  RelativeListPayload,
  UpdateRelativePayload,
} from "@/types/interface/relative.interface";

export const relativeQueryKeys = {
  admin: (filters: RelativeListPayload) =>
    ["relatives", "admin", filters] as const,
  personal: (filters?: RelativeListPayload) =>
    ["relatives", "personal", filters] as const,
  detail: (relativeId: number) => ["relative-detail", relativeId] as const,
};

export function useAdminRelatives(filters: RelativeListPayload) {
  return useQuery({
    queryKey: relativeQueryKeys.admin(filters),
    queryFn: () => fetchAdminRelatives(filters),
  });
}

export function usePersonalRelatives(filters?: RelativeListPayload) {
  return useQuery({
    queryKey: relativeQueryKeys.personal(filters),
    queryFn: () => fetchPersonalRelatives(filters),
  });
}

export function useRelativeDetail(relativeId: number) {
  return useQuery({
    queryKey: relativeQueryKeys.detail(relativeId),
    queryFn: () => fetchRelativeDetail(relativeId),
    enabled: relativeId > 0,
  });
}

export function useCreateRelative() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createRelative,
    onSuccess: () => {
      toast.success("Thêm người thân thành công");
      queryClient.invalidateQueries({ queryKey: ["relatives"] });
    },
    onError: () => {
      toast.error("Thêm người thân thất bại");
    },
  });
}

export function useUpdateRelative() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      relativeId,
      payload,
    }: {
      relativeId: number;
      payload: UpdateRelativePayload;
    }) => updateRelative(relativeId, payload),
    onSuccess: (_, variables) => {
      toast.success("Cập nhật người thân thành công");
      queryClient.invalidateQueries({ queryKey: ["relatives"] });
      queryClient.invalidateQueries({
        queryKey: relativeQueryKeys.detail(variables.relativeId),
      });
    },
    onError: () => {
      toast.error("Cập nhật người thân thất bại");
    },
  });
}

export function useDeleteRelative() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteRelative,
    onSuccess: () => {
      toast.success("Xóa người thân thành công");
      queryClient.invalidateQueries({ queryKey: ["relatives"] });
    },
    onError: () => {
      toast.error("Xóa người thân thất bại");
    },
  });
}
