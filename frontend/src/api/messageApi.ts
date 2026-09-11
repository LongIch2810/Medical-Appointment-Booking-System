import axiosInstance from "@/configs/axios";

export interface ChatMessageAttachment {
  id?: number;
  url: string;
}

export interface ChatMessage {
  id: number;
  content?: string | null;
  channel?: { id?: number };
  sender?: { id?: number };
  message_attachments?: ChatMessageAttachment[];
}

export interface MessagesPageResponse {
  data: {
    messages: ChatMessage[];
    page: number;
    totalPages: number;
  };
}

export const getMessagesByChannelId = async (
  channelId: number,
  page: number = 1
): Promise<MessagesPageResponse> => {
  const res = await axiosInstance.get(`/messages/${channelId}?page=${page}`);
  return res.data;
};
