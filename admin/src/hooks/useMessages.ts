import {
  type InfiniteData,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "react-toastify";

import {
  createMessage,
  fetchMessagesByChannel,
  markChannelRead,
  type MessageListResponse,
} from "@/api/messageApi";
import type { ApiResponse } from "@/types/interface/api.interface";
import type { Channel, ChannelListResponse } from "@/types/interface/channel.interface";
import type { Message } from "@/types/interface/message.interface";

export const messageQueryKeys = {
  list: (channelId: number) => ["messages", channelId] as const,
};

type MessagesCache = InfiniteData<ApiResponse<MessageListResponse>>;

export function useMessagesByChannel(channelId: number) {
  return useInfiniteQuery({
    queryKey: messageQueryKeys.list(channelId),
    queryFn: ({ pageParam }) =>
      fetchMessagesByChannel(channelId, pageParam as number),
    getNextPageParam: (lastPage) => {
      const { page, totalPages } = lastPage.data;
      return page < totalPages ? page + 1 : undefined;
    },
    initialPageParam: 1,
    enabled: channelId > 0,
  });
}

export function useCreateMessage(channelId: number) {
  const queryClient = useQueryClient();
  const messagesKey = messageQueryKeys.list(channelId);

  return useMutation({
    mutationFn: createMessage,
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey: messagesKey });
      const previous = queryClient.getQueryData<MessagesCache>(messagesKey);
      const tempId = -Date.now();

      queryClient.setQueryData<MessagesCache>(messagesKey, (old) => {
        if (!old) return old;
        const optimisticMessage: Message = {
          id: tempId,
          message_type: payload.message_type,
          content: payload.content,
          is_read: false,
          message_attachments: [],
          sender: { id: payload.sender_id, fullname: "", username: "", picture: "" },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          isOptimistic: true,
        };
        const pages = [...old.pages];
        const lastIndex = pages.length - 1;
        pages[lastIndex] = {
          ...pages[lastIndex],
          data: {
            ...pages[lastIndex].data,
            messages: [...pages[lastIndex].data.messages, optimisticMessage],
          },
        };
        return { ...old, pages };
      });

      return { previous, tempId };
    },
    onError: (_error, _payload, context) => {
      toast.error("Không thể gửi tin nhắn. Vui lòng thử lại.");
      if (!context) return;
      queryClient.setQueryData<MessagesCache>(messagesKey, (old) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            data: {
              ...page.data,
              messages: page.data.messages.map((message) =>
                message.id === context.tempId
                  ? { ...message, isOptimistic: false, failed: true }
                  : message,
              ),
            },
          })),
        };
      });
    },
    onSuccess: (_response, _payload, context) => {
      if (context) {
        queryClient.setQueryData<MessagesCache>(messagesKey, (old) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              data: {
                ...page.data,
                messages: page.data.messages.filter(
                  (message) => message.id !== context.tempId,
                ),
              },
            })),
          };
        });
      }
      queryClient.invalidateQueries({ queryKey: messagesKey });
      queryClient.invalidateQueries({ queryKey: ["channels"] });
    },
  });
}

export function useMarkChannelRead(channelId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => markChannelRead(channelId),
    onSuccess: () => {
      queryClient.setQueriesData<ApiResponse<ChannelListResponse>>(
        { queryKey: ["channels"] },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            data: {
              ...old.data,
              channels: old.data.channels.map((channel: Channel) =>
                channel.channel_id === channelId
                  ? { ...channel, unread_count: 0 }
                  : channel,
              ),
            },
          };
        },
      );
    },
  });
}
