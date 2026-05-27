import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

import {
  createRelationship,
  deleteRelationship,
  fetchRelationshipDetail,
  fetchRelationships,
  updateRelationship,
} from "@/api/relationshipApi";
import type {
  RelationshipListPayload,
  UpdateRelationshipPayload,
} from "@/types/interface/relationship.interface";

export const relationshipQueryKeys = {
  list: (filters: RelationshipListPayload) =>
    ["relationships", filters] as const,
  detail: (relationshipCode: string) =>
    ["relationship-detail", relationshipCode] as const,
};

export function useRelationships(filters: RelationshipListPayload) {
  return useQuery({
    queryKey: relationshipQueryKeys.list(filters),
    queryFn: () => fetchRelationships(filters),
    staleTime: 1000 * 60 * 30,
  });
}

export function useRelationshipDetail(relationshipCode: string) {
  return useQuery({
    queryKey: relationshipQueryKeys.detail(relationshipCode),
    queryFn: () => fetchRelationshipDetail(relationshipCode),
    enabled: Boolean(relationshipCode),
  });
}

export function useCreateRelationship() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createRelationship,
    onSuccess: () => {
      toast.success("Tạo mối quan hệ thành công");
      queryClient.invalidateQueries({ queryKey: ["relationships"] });
    },
    onError: () => {
      toast.error("Tạo mối quan hệ thất bại");
    },
  });
}

export function useUpdateRelationship() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      relationshipCode,
      payload,
    }: {
      relationshipCode: string;
      payload: UpdateRelationshipPayload;
    }) => updateRelationship(relationshipCode, payload),
    onSuccess: (_, variables) => {
      toast.success("Cập nhật mối quan hệ thành công");
      queryClient.invalidateQueries({ queryKey: ["relationships"] });
      queryClient.invalidateQueries({
        queryKey: relationshipQueryKeys.detail(variables.relationshipCode),
      });
    },
    onError: () => {
      toast.error("Cập nhật mối quan hệ thất bại");
    },
  });
}

export function useDeleteRelationship() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteRelationship,
    onSuccess: () => {
      toast.success("Xóa mối quan hệ thành công");
      queryClient.invalidateQueries({ queryKey: ["relationships"] });
    },
    onError: () => {
      toast.error("Xóa mối quan hệ thất bại");
    },
  });
}
