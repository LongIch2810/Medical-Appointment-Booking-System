import {
  createPatientChatConversation,
  deletePatientChatConversation,
  getPatientChatConversation,
  listPatientChatConversations,
  sendPatientChatMessage,
} from "@/api/conversationApi";
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const patientChatQueryKeys = {
  conversations: ["patient-chat", "conversations"] as const,
  conversation: (id: number | null) => ["patient-chat", "conversation", id] as const,
};

export function usePatientChatConversations(enabled: boolean) {
  return useQuery({
    queryKey: patientChatQueryKeys.conversations,
    queryFn: () => listPatientChatConversations(1, 50),
    enabled,
  });
}

export function usePatientChatConversation(conversationId: number | null) {
  return useInfiniteQuery({
    queryKey: patientChatQueryKeys.conversation(conversationId),
    queryFn: ({ pageParam }) =>
      getPatientChatConversation(conversationId!, pageParam, 50),
    initialPageParam: undefined as number | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.nextBeforeMessageId ?? undefined : undefined,
    enabled: conversationId !== null,
  });
}

export function useCreatePatientChatConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createPatientChatConversation,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: patientChatQueryKeys.conversations }),
  });
}

export function useSendPatientChatMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      conversationId,
      body,
    }: {
      conversationId: number;
      body: { message: string } | { approvalMessageId: number; decision: "APPROVE" | "CANCEL" };
    }) => sendPatientChatMessage(conversationId, body),
    onSuccess: (_turn, variables) => {
      queryClient.invalidateQueries({
        queryKey: patientChatQueryKeys.conversation(variables.conversationId),
      });
      queryClient.invalidateQueries({ queryKey: patientChatQueryKeys.conversations });
    },
    onError: (_error, variables) => {
      queryClient.invalidateQueries({
        queryKey: patientChatQueryKeys.conversation(variables.conversationId),
      });
    },
  });
}

export function useDeletePatientChatConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deletePatientChatConversation,
    onSuccess: (_result, conversationId) => {
      queryClient.removeQueries({
        queryKey: patientChatQueryKeys.conversation(conversationId),
      });
      queryClient.invalidateQueries({ queryKey: patientChatQueryKeys.conversations });
    },
  });
}

