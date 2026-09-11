import type { Channel } from "@/types/interface/patient.interface";

export const getConversationParticipant = (
  channel: Channel,
  currentUserId?: number,
) =>
  channel.participants.find((item) => item.id !== currentUserId) ??
  channel.participants[0];

export const getConversationTitle = (
  channel: Channel,
  currentUserId?: number,
) => getConversationParticipant(channel, currentUserId)?.fullname ?? "Hội thoại";

export const getChatPersonName = (channel: Channel, currentUserId?: number) => {
  const participant = getConversationParticipant(channel, currentUserId);
  return (
    participant?.fullname ??
    participant?.username ??
    getConversationTitle(channel, currentUserId)
  );
};

export const getChatPersonAvatar = (channel: Channel, currentUserId?: number) =>
  getConversationParticipant(channel, currentUserId)?.picture;

export const getChatPersonInitial = (
  channel: Channel,
  currentUserId?: number,
) => getChatPersonName(channel, currentUserId).slice(0, 2).toUpperCase();

export const getDoctorInitial = (
  channel?: Channel | null,
  currentUserId?: number,
) => (channel ? getChatPersonInitial(channel, currentUserId) : "BS");

export const getDoctorAvatar = (
  channel?: Channel | null,
  currentUserId?: number,
) => (channel ? getChatPersonAvatar(channel, currentUserId) : undefined);

export const getDoctorDisplayName = (
  channel?: Channel | null,
  currentUserId?: number,
) => (channel ? getChatPersonName(channel, currentUserId) : "Chưa chọn hội thoại");

export const getDoctorSubtitle = (channel?: Channel | null) =>
  channel ? "Đang nhắn với bác sĩ" : "Hãy chọn hội thoại để bắt đầu";

export const getLastMessage = (channel: Channel) =>
  channel.last_message?.content ?? "Chưa có tin nhắn";

export const getLastMessageTime = (channel: Channel) =>
  channel.last_message?.created_at ?? channel.updated_at;
