import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createChannel,
  fetchChannelDetail,
  fetchPersonalChannels,
} from "@/api/channelApi";
import type { ChannelListPayload } from "@/types/interface/channel.interface";

export const channelQueryKeys = {
  list: (filters: ChannelListPayload) => ["channels", filters] as const,
  detail: (channelId: number) => ["channel-detail", channelId] as const,
};

export function usePersonalChannels(filters: ChannelListPayload) {
  return useQuery({
    queryKey: channelQueryKeys.list(filters),
    queryFn: () => fetchPersonalChannels(filters),
  });
}

export function useChannelDetail(channelId: number) {
  return useQuery({
    queryKey: channelQueryKeys.detail(channelId),
    queryFn: () => fetchChannelDetail(channelId),
    enabled: channelId > 0,
  });
}

export function useCreateChannel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createChannel,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["channels"] });
    },
  });
}
