import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createMessage,
  fetchMessagesByChannel,
} from "@/api/messageApi";

export const messageQueryKeys = {
  list: (channelId: number, page: number) =>
    ["messages", channelId, page] as const,
};

export function useMessagesByChannel(channelId: number, page = 1) {
  return useQuery({
    queryKey: messageQueryKeys.list(channelId, page),
    queryFn: () => fetchMessagesByChannel(channelId, page),
    enabled: channelId > 0,
  });
}

export function useCreateMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createMessage,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["messages", variables.channel_id],
      });
      queryClient.invalidateQueries({ queryKey: ["channels"] });
    },
  });
}
