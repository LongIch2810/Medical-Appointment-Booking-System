import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

import {
  createTag,
  deleteTag,
  fetchTagDetail,
  fetchTags,
  updateTag,
} from "@/api/tagApi";
import type {
  TagListPayload,
  UpdateTagPayload,
} from "@/types/interface/tag.interface";

export const tagQueryKeys = {
  list: (filters: TagListPayload) => ["tags", filters] as const,
  detail: (tagId: number) => ["tag-detail", tagId] as const,
};

export function useTags(filters: TagListPayload) {
  return useQuery({
    queryKey: tagQueryKeys.list(filters),
    queryFn: () => fetchTags(filters),
    staleTime: 1000 * 60 * 30,
  });
}

export function useTagDetail(tagId: number) {
  return useQuery({
    queryKey: tagQueryKeys.detail(tagId),
    queryFn: () => fetchTagDetail(tagId),
    enabled: tagId > 0,
  });
}

export function useCreateTag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createTag,
    onSuccess: () => {
      toast.success("Tạo tag thành công");
      queryClient.invalidateQueries({ queryKey: ["tags"] });
    },
    onError: () => {
      toast.error("Tạo tag thất bại");
    },
  });
}

export function useUpdateTag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      tagId,
      payload,
    }: {
      tagId: number;
      payload: UpdateTagPayload;
    }) => updateTag(tagId, payload),
    onSuccess: (_, variables) => {
      toast.success("Cập nhật tag thành công");
      queryClient.invalidateQueries({ queryKey: ["tags"] });
      queryClient.invalidateQueries({
        queryKey: tagQueryKeys.detail(variables.tagId),
      });
    },
    onError: () => {
      toast.error("Cập nhật tag thất bại");
    },
  });
}

export function useDeleteTag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteTag,
    onSuccess: () => {
      toast.success("Xóa tag thành công");
      queryClient.invalidateQueries({ queryKey: ["tags"] });
    },
    onError: () => {
      toast.error("Xóa tag thất bại");
    },
  });
}
