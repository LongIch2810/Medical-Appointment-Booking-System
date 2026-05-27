import type { ChannelMember } from "./channel.interface";

export type MessageType = "TEXT" | "IMAGE" | "VIDEO" | "FILE" | "CALL";

export interface MessageAttachment {
  id: number;
  url: string;
  type: string;
  file_name: string;
  file_size: number;
  file_extension: string;
  public_id: string;
}

export interface Message {
  id: number;
  message_type: MessageType;
  content: string;
  is_read: boolean;
  message_attachments: MessageAttachment[];
  sender: ChannelMember;
  created_at: string;
  updated_at: string;
}
