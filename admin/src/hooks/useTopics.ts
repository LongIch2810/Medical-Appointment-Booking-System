import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

import {
  createTopic,
  deleteTopic,
  fetchTopicDetail,
  fetchTopics,
  updateTopic,
} from "@/api/topicApi";
import type {
  TopicListPayload,
  UpdateTopicPayload,
} from "@/types/interface/topic.interface";

export const topicQueryKeys = {
  list: (filters: TopicListPayload) => ["topics", filters] as const,
  detail: (topicId: number) => ["topic-detail", topicId] as const,
};

export function useTopics(filters: TopicListPayload) {
  return useQuery({
    queryKey: topicQueryKeys.list(filters),
    queryFn: () => fetchTopics(filters),
    staleTime: 1000 * 60 * 30,
  });
}

export function useTopicDetail(topicId: number) {
  return useQuery({
    queryKey: topicQueryKeys.detail(topicId),
    queryFn: () => fetchTopicDetail(topicId),
    enabled: topicId > 0,
  });
}

export function useCreateTopic() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createTopic,
    onSuccess: () => {
      toast.success("Tạo chủ đề thành công");
      queryClient.invalidateQueries({ queryKey: ["topics"] });
    },
    onError: () => {
      toast.error("Tạo chủ đề thất bại");
    },
  });
}

export function useUpdateTopic() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      topicId,
      payload,
    }: {
      topicId: number;
      payload: UpdateTopicPayload;
    }) => updateTopic(topicId, payload),
    onSuccess: (_, variables) => {
      toast.success("Cập nhật chủ đề thành công");
      queryClient.invalidateQueries({ queryKey: ["topics"] });
      queryClient.invalidateQueries({
        queryKey: topicQueryKeys.detail(variables.topicId),
      });
    },
    onError: () => {
      toast.error("Cập nhật chủ đề thất bại");
    },
  });
}

export function useDeleteTopic() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteTopic,
    onSuccess: () => {
      toast.success("Xóa chủ đề thành công");
      queryClient.invalidateQueries({ queryKey: ["topics"] });
    },
    onError: () => {
      toast.error("Xóa chủ đề thất bại");
    },
  });
}
