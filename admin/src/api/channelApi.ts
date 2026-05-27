import axiosInstance from "@/configs/axios";
import type { ApiResponse } from "@/types/interface/api.interface";
import type {
  Channel,
  ChannelListPayload,
  ChannelListResponse,
} from "@/types/interface/channel.interface";

export const fetchPersonalChannels = async (data: ChannelListPayload) => {
  const res = await axiosInstance.post<ApiResponse<ChannelListResponse>>(
    "/channels/personal-channels",
    data,
  );
  return res.data;
};

export const fetchChannelDetail = async (channelId: number) => {
  const res = await axiosInstance.get<ApiResponse<Channel>>(
    `/channels/${channelId}`,
  );
  return res.data;
};

export const createChannel = async (memberIds: number[]) => {
  const res = await axiosInstance.post<ApiResponse<Channel>>(
    "/channels/create",
    memberIds,
  );
  return res.data;
};
