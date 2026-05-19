import axiosInstance from "@/configs/axios";
import type {
  ApiResponse,
  Channel as PatientChannel,
  LastMessage,
} from "@/types/interface/patient.interface";

type ChannelResponse = PatientChannel & {
  channel_id: number;
  participants: Array<
    PatientChannel["participants"][number] & { username?: string | null }
  >;
};

const normalizeLastMessage = (
  value: PatientChannel["last_message"] | undefined,
): LastMessage | null => {
  if (!value) return null;
  return {
    content: value.content ?? "",
    created_at: value.created_at ?? "",
    sender_id: Number(value.sender_id ?? 0),
  };
};

const normalizeChannel = (
  channel: PatientChannel & { channel_id?: number },
): ChannelResponse => {
  const channelId = Number(channel.id ?? channel.channel_id ?? 0);

  return {
    ...channel,
    id: channelId,
    channel_id: channelId,
    last_message: normalizeLastMessage(channel.last_message),
    unread_count: Number(channel.unread_count ?? 0),
    participants: (channel.participants ?? []).map((participant) => ({
      ...participant,
      username: participant.username ?? participant.fullname ?? "",
    })),
  };
};

export const createChannel = async (memberIds: number[]) => {
  const res =
    await axiosInstance.post<ApiResponse<PatientChannel & { channel_id?: number }>>(
      "/channels/create",
      memberIds,
    );

  return {
    ...res.data,
    data: normalizeChannel(res.data.data),
  };
};

export const getChannelById = async (channelId: number) => {
  const res = await axiosInstance.get<
    ApiResponse<PatientChannel & { channel_id?: number }>
  >(`/channels/${channelId}`);

  return {
    ...res.data,
    data: normalizeChannel(res.data.data),
  };
};

export const findChannelByParticipants = async (data: {
  senderId: number;
  receiverId: number;
}) => createChannel([data.senderId, data.receiverId]);
