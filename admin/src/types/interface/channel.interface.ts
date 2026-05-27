import type { PaginationMeta, PaginationPayload } from "./api.interface";

export interface ChannelMember {
  id: number;
  fullname: string;
  username: string;
  picture: string;
}

export interface LastMessage {
  content: string;
  created_at: string;
  sender_id: number;
}

export interface Channel {
  id: number;
  channel_id: number;
  last_message: LastMessage | null;
  unread_count: number;
  participants: ChannelMember[];
  created_at: string;
  updated_at: string;
}

export interface ChannelListPayload extends PaginationPayload {
  search?: string;
  arrange?: "desc" | "asc";
}

export interface ChannelListResponse extends PaginationMeta {
  channels: Channel[];
}
