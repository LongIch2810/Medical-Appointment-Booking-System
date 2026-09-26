import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  confirmReportAssistantPlan,
  createReportAssistantConversation,
  getReportAssistantConversation,
  getReportAssistantConversations,
  sendReportAssistantMessage,
} from "@/api/adminReportApi";

export const reportAssistantQueryKeys = {
  all: ["admin-report-assistant"] as const,
  conversations: () => [...reportAssistantQueryKeys.all, "conversations"] as const,
  conversation: (id: number) => [...reportAssistantQueryKeys.all, "conversation", id] as const,
};

export function useReportAssistantConversations() {
  return useInfiniteQuery({
    queryKey: reportAssistantQueryKeys.conversations(),
    queryFn: ({ pageParam = 1 }) => getReportAssistantConversations(pageParam, 20),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.data.page < lastPage.data.totalPages
        ? lastPage.data.page + 1
        : undefined,
  });
}

export function useReportAssistantConversation(id: number | null) {
  return useQuery({
    queryKey: reportAssistantQueryKeys.conversation(id ?? 0),
    queryFn: () => getReportAssistantConversation(id!),
    enabled: id !== null,
  });
}

function useRefreshAssistantQueries() {
  const queryClient = useQueryClient();
  return async (conversationId?: number) => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: reportAssistantQueryKeys.conversations() }),
      ...(conversationId
        ? [queryClient.invalidateQueries({ queryKey: reportAssistantQueryKeys.conversation(conversationId) })]
        : []),
    ]);
  };
}

export function useCreateReportAssistantConversation() {
  const refresh = useRefreshAssistantQueries();
  return useMutation({
    mutationFn: createReportAssistantConversation,
    onSuccess: async (response) => refresh(response.data.conversation.id),
    onError: async () => refresh(),
  });
}

export function useSendReportAssistantMessage() {
  const refresh = useRefreshAssistantQueries();
  return useMutation({
    mutationFn: ({ id, message }: { id: number; message: string }) =>
      sendReportAssistantMessage(id, message),
    onSuccess: async (_response, variables) => refresh(variables.id),
    onError: async (_error, variables) => refresh(variables.id),
  });
}

export function useConfirmReportAssistantPlan() {
  const refresh = useRefreshAssistantQueries();
  return useMutation({
    mutationFn: ({ id, messageId }: { id: number; messageId: number }) =>
      confirmReportAssistantPlan(id, messageId),
    onSuccess: async (_response, variables) => refresh(variables.id),
    onError: async (_error, variables) => refresh(variables.id),
  });
}

export function useLoadOlderReportAssistantMessages() {
  return useMutation({
    mutationFn: ({ id, beforeMessageId }: { id: number; beforeMessageId: number }) =>
      getReportAssistantConversation(id, beforeMessageId, 50),
  });
}
