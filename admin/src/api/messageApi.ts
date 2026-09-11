import axiosInstance from "@/configs/axios";
import type { ApiResponse, PaginationMeta } from "@/types/interface/api.interface";
import type { Message, MessageType } from "@/types/interface/message.interface";

export interface MessageListResponse extends PaginationMeta {
  messages: Message[];
}

export interface CreateMessagePayload {
  message_type: MessageType;
  content: string;
  sender_id: number;
  channel_id: number;
}

export const fetchMessagesByChannel = async (
  channelId: number,
  page: number,
  limit?: number,
) => {
  const res = await axiosInstance.get<ApiResponse<MessageListResponse>>(
    `/messages/${channelId}`,
    { params: { page, limit } },
  );
  return res.data;
};

export const createMessage = async (data: CreateMessagePayload) => {
  const res = await axiosInstance.post<ApiResponse<Message>>(
    "/messages",
    data,
  );
  return res.data;
};

export const markChannelRead = async (channelId: number) => {
  const res = await axiosInstance.patch<ApiResponse<{ updated: number }>>(
    `/messages/${channelId}/read`,
  );
  return res.data;
};
