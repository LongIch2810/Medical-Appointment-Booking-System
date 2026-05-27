import axiosInstance from "@/configs/axios";
import type { ApiResponse } from "@/types/interface/api.interface";
import type { Message } from "@/types/interface/message.interface";

export interface MessageListResponse {
  messages: Message[];
  total: number;
}

export interface CreateMessagePayload {
  message_type: "TEXT";
  content: string;
  sender_id: number;
  channel_id: number;
}

export const fetchMessagesByChannel = async (
  channelId: number,
  page: number,
) => {
  const res = await axiosInstance.get<ApiResponse<MessageListResponse>>(
    `/messages/${channelId}`,
    { params: { page } },
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
