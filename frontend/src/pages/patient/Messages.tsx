import React, { useEffect, useMemo, useRef, useState } from "react";
import { Plus, Search, SendHorizontal, Stethoscope } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";

import { createChannel, getChannelById } from "@/api/channelApi";
import { fetchDoctors } from "@/api/doctorApi";
import { fetchPatientChannels } from "@/api/patientApi";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  usePatientChannels,
  usePatientMessages,
  useSendPatientMessage,
} from "@/hooks/usePatientPortalApi";
import { cn } from "@/lib/utils";
import { useUserStore } from "@/store/useUserStore";
import type { DoctorCardData } from "@/types/global";
import type { Channel } from "@/types/interface/patient.interface";

type DirectChannelResponse = {
  data?: Partial<Channel> & { channel_id?: number };
};

type CreateDirectChannelPayload = {
  senderId: number;
  receiverId: number;
};

const CHANNEL_LIMIT = 8;
const DOCTOR_LIMIT = 8;

const getConversationParticipant = (channel: Channel, currentUserId?: number) =>
  channel.participants.find((item) => item.id !== currentUserId) ??
  channel.participants[0];

const getChatPersonName = (channel: Channel, currentUserId?: number) => {
  const participant = getConversationParticipant(channel, currentUserId);
  return (
    participant?.fullname ??
    participant?.username ??
    getConversationTitle(channel, currentUserId)
  );
};

const getChatPersonAvatar = (channel: Channel, currentUserId?: number) =>
  getConversationParticipant(channel, currentUserId)?.picture;

const getChatPersonInitial = (channel: Channel, currentUserId?: number) =>
  getChatPersonName(channel, currentUserId).slice(0, 2).toUpperCase();

const getDoctorInitial = (channel?: Channel | null, currentUserId?: number) => {
  if (!channel) return "BS";

  return getChatPersonInitial(channel, currentUserId);
};

const getDoctorAvatar = (channel?: Channel | null, currentUserId?: number) =>
  channel ? getChatPersonAvatar(channel, currentUserId) : undefined;

const getDoctorDisplayName = (
  channel?: Channel | null,
  currentUserId?: number,
) =>
  channel
    ? getChatPersonName(channel, currentUserId)
    : "Chưa chọn hội thoại";

const getDoctorSubtitle = (channel?: Channel | null) =>
  channel ? "Đang nhắn với bác sĩ" : "Hãy chọn hội thoại để bắt đầu";

const getConversationTitle = (channel: Channel, currentUserId?: number) => {
  const participant =
    channel.participants.find((item) => item.id !== currentUserId) ??
    channel.participants[0];
  return participant?.fullname ?? "Hội thoại";
};

const getLastMessage = (channel: Channel) =>
  channel.chat_messages[0]?.content ?? "Chưa có tin nhắn";

const getChannelIdFromResponse = (response: DirectChannelResponse) =>
  Number(response.data?.id ?? response.data?.channel_id ?? 0);

const findChannelByParticipant = (channels: Channel[], userId: number) =>
  channels.find((channel) =>
    channel.participants.some((participant) => participant.id === userId),
  );

const findExistingDirectChannel = async (receiverId: number) => {
  const response = await fetchPatientChannels({
    page: 1,
    limit: 1000,
  });

  return findChannelByParticipant(response.data.channels, receiverId);
};

const Messages: React.FC = () => {
  const currentUser = useUserStore((state) => state.userInfo);
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedDoctorUserId = Number(searchParams.get("doctorUserId")) || 0;
  const requestedChannelId = Number(searchParams.get("channelId")) || 0;
  const handledDoctorUserIdRef = useRef<number>(0);

  const [channelPage, setChannelPage] = useState(1);
  const [selectedChannelId, setSelectedChannelId] = useState<number>(0);
  const [draft, setDraft] = useState("");
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [doctorSearch, setDoctorSearch] = useState("");
  const [doctorPage, setDoctorPage] = useState(1);
  const [selectedChannelSnapshot, setSelectedChannelSnapshot] =
    useState<Channel | null>(null);

  const { data: channelsResponse, isLoading, isError } = usePatientChannels({
    page: channelPage,
    limit: CHANNEL_LIMIT,
  });
  const channels = useMemo(
    () => channelsResponse?.data.channels ?? [],
    [channelsResponse?.data.channels],
  );
  const channelTotalPages = channelsResponse?.data.totalPages ?? 1;

  const createDirectChannelMutation = useMutation({
    mutationFn: async ({ senderId, receiverId }: CreateDirectChannelPayload) => {
      const existingChannel = await findExistingDirectChannel(receiverId);
      if (existingChannel) {
        return {
          data: existingChannel,
          existed: true,
        };
      }

      const response = await createChannel([senderId, receiverId]);
      return {
        ...response,
        existed: false,
      };
    },
    onSuccess: (response: DirectChannelResponse & { existed?: boolean }) => {
      const channelId = getChannelIdFromResponse(response);
      const channel = response.data as Channel | undefined;
      queryClient.invalidateQueries({ queryKey: ["patient-channels"] });
      if (channelId) {
        if (channel?.id || channel?.channel_id) {
          setSelectedChannelSnapshot({
            ...channel,
            id: channelId,
          } as Channel);
          queryClient.setQueryData(["channel-detail", channelId], {
            ...response,
            data: {
              ...channel,
              id: channelId,
            },
          });
        }
        setSelectedChannelId(channelId);
        setSearchParams({ channelId: String(channelId) }, { replace: true });
      }
      if (response.existed) {
        toast.warning("Cuộc trò chuyện với bác sĩ này đã tồn tại.");
      } else {
        toast.success("Đã tạo cuộc trò chuyện.");
      }
    },
    onError: () => {
      toast.error("Không thể tạo cuộc trò chuyện.");
    },
  });

  const { data: doctorsResponse, isLoading: isLoadingDoctors } = useQuery({
    queryKey: ["message-doctors", doctorSearch, doctorPage],
    queryFn: () =>
      fetchDoctors({
        page: doctorPage,
        limit: DOCTOR_LIMIT,
        search: doctorSearch.trim() || undefined,
      }),
    enabled: openCreateDialog,
  });
  const doctors = doctorsResponse?.data.doctors ?? [];
  const doctorTotalPages = doctorsResponse?.data.totalPages ?? 1;

  const activeChannelId =
    selectedChannelId || requestedChannelId || channels[0]?.id || 0;
  const selectedChannel = useMemo(
    () => channels.find((channel) => channel.id === activeChannelId),
    [channels, activeChannelId],
  );
  const { data: selectedChannelResponse } = useQuery({
    queryKey: ["channel-detail", activeChannelId],
    queryFn: () => getChannelById(activeChannelId),
    enabled: !!activeChannelId && !selectedChannel,
  });
  const snapshotChannel =
    selectedChannelSnapshot?.id === activeChannelId
      ? selectedChannelSnapshot
      : null;
  const displayedChannel =
    selectedChannel ?? snapshotChannel ?? selectedChannelResponse?.data ?? null;

  const { data: messagesResponse } = usePatientMessages(activeChannelId);
  const sendMessageMutation = useSendPatientMessage(activeChannelId);

  const currentMessages = useMemo(
    () =>
      (messagesResponse?.pages.flatMap((page) => page.data.messages) ?? [])
        .slice()
        .reverse(),
    [messagesResponse],
  );

  useEffect(() => {
    if (requestedChannelId) {
      const channel = channels.find((item) => item.id === requestedChannelId);
      if (channel) {
        setSelectedChannelSnapshot(channel);
      }
      setSelectedChannelId(requestedChannelId);
    }
  }, [channels, requestedChannelId]);

  useEffect(() => {
    if (
      !requestedDoctorUserId ||
      !currentUser?.id ||
      isLoading ||
      handledDoctorUserIdRef.current === requestedDoctorUserId
    ) {
      return;
    }

    const existingChannel = findChannelByParticipant(
      channels,
      requestedDoctorUserId,
    );
    handledDoctorUserIdRef.current = requestedDoctorUserId;

    if (existingChannel) {
      setSelectedChannelSnapshot(existingChannel);
      setSelectedChannelId(existingChannel.id);
      setSearchParams(
        { channelId: String(existingChannel.id) },
        { replace: true },
      );
      toast.warning("Cuộc trò chuyện với bác sĩ này đã tồn tại.");
      return;
    }

    createDirectChannelMutation.mutate({
      senderId: currentUser.id,
      receiverId: requestedDoctorUserId,
    });
  }, [
    channels,
    createDirectChannelMutation,
    currentUser?.id,
    isLoading,
    requestedDoctorUserId,
    setSearchParams,
  ]);

  const handleSelectChannel = (channelId: number) => {
    setSelectedChannelSnapshot(
      channels.find((channel) => channel.id === channelId) ?? null,
    );
    setSelectedChannelId(channelId);
    setSearchParams({ channelId: String(channelId) }, { replace: true });
  };

  const handleStartConversation = (doctor: DoctorCardData) => {
    if (!currentUser?.id) return;

    const existingChannel = findChannelByParticipant(channels, doctor.user_id);
    if (existingChannel) {
      setOpenCreateDialog(false);
      handleSelectChannel(existingChannel.id);
      toast.warning("Cuộc trò chuyện với bác sĩ này đã tồn tại.");
      return;
    }

    createDirectChannelMutation.mutate(
      { senderId: currentUser.id, receiverId: doctor.user_id },
      {
        onSuccess: () => {
          setOpenCreateDialog(false);
        },
      },
    );
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const content = draft.trim();
    if (!content || !activeChannelId || !currentUser?.id) return;

    sendMessageMutation.mutate(
      {
        message_type: "regular",
        content,
        sender_id: currentUser.id,
        channel_id: activeChannelId,
      },
      {
        onSuccess: () => setDraft(""),
        onError: () => toast.error("Không thể gửi tin nhắn."),
      },
    );
  };

  return (
    <>
      <Card className="grid min-h-[600px] grid-cols-1 overflow-hidden border-primary/15 py-0 lg:grid-cols-[320px_1fr]">
        <div className="border-b border-slate-200 lg:border-b-0 lg:border-r">
          <div className="flex items-start justify-between gap-3 border-b border-slate-200 p-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Tư vấn trực tuyến
              </h2>
              <p className="text-sm text-slate-600">
                Kết nối với bác sĩ đang theo dõi bạn
              </p>
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setOpenCreateDialog(true)}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="space-y-2 p-3">
            {isLoading ? (
              <div className="rounded-lg border border-slate-200 p-4 text-sm text-slate-500">
                Đang tải hội thoại...
              </div>
            ) : isError ? (
              <div className="rounded-lg border border-red-200 p-4 text-sm text-red-600">
                Không thể tải hội thoại.
              </div>
            ) : channels.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-300 p-4 text-center text-sm text-slate-500">
                Chưa có hội thoại nào.
              </div>
            ) : (
              channels.map((channel) => (
                <button
                  key={channel.id}
                  type="button"
                  className={cn(
                    "w-full rounded-lg border p-3 text-left transition-colors",
                    channel.id === activeChannelId
                      ? "border-primary bg-primary/10"
                      : "border-slate-200 bg-white hover:border-primary/40",
                  )}
                  onClick={() => handleSelectChannel(channel.id)}
                >
                  <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10 border border-slate-200">
                      <AvatarImage
                        src={getChatPersonAvatar(channel, currentUser?.id) ?? ""}
                        alt={getChatPersonName(channel, currentUser?.id)}
                      />
                      <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                        {getChatPersonInitial(channel, currentUser?.id)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-semibold text-slate-900">
                          {getChatPersonName(channel, currentUser?.id)}
                        </p>
                        {channel.chat_messages.some(
                          (message) => !message.is_read,
                        ) && <Badge>New</Badge>}
                      </div>
                      <p className="mt-0.5 text-xs font-medium text-primary">
                        Đang nhắn với bác sĩ
                      </p>
                      <p className="mt-1 line-clamp-1 text-sm text-slate-600">
                        {getLastMessage(channel)}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        {channel.updated_at}
                      </p>
                    </div>
                  </div>
                </button>
              ))
            )}

            <div className="flex items-center justify-between gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={channelPage <= 1}
                onClick={() => setChannelPage((page) => Math.max(1, page - 1))}
              >
                Trước
              </Button>
              <span className="text-xs text-slate-500">
                Trang {channelPage}/{channelTotalPages}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={channelPage >= channelTotalPages}
                onClick={() =>
                  setChannelPage((page) =>
                    Math.min(channelTotalPages, page + 1),
                  )
                }
              >
                Sau
              </Button>
            </div>
          </div>
        </div>

        <div className="flex min-h-[420px] flex-col">
          <div className="flex items-center gap-3 border-b border-slate-200 p-4">
            <Avatar className="h-11 w-11 border border-primary/20">
              <AvatarImage
                src={getDoctorAvatar(displayedChannel, currentUser?.id) ?? ""}
                alt={getDoctorDisplayName(displayedChannel, currentUser?.id)}
              />
              <AvatarFallback className="bg-primary/10 text-sm font-semibold text-primary">
                {displayedChannel ? (
                  getDoctorInitial(displayedChannel, currentUser?.id)
                ) : (
                  <Stethoscope className="h-5 w-5" />
                )}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="font-semibold text-slate-900">
                {displayedChannel ? "BS. " : ""}
                {displayedChannel
                  ? getChatPersonName(displayedChannel, currentUser?.id)
                  : "Chưa chọn hội thoại"}
              </p>
              <p className="text-xs font-medium text-primary">
                {getDoctorSubtitle(displayedChannel)}
              </p>
              <p className="text-sm text-slate-600">
                {displayedChannel
                  ? "Trao đổi với nhân sự y tế"
                  : "Hãy chọn hội thoại để bắt đầu"}
              </p>
            </div>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50 p-4">
            {currentMessages.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-500">
                Chưa có tin nhắn nào trong hội thoại này.
              </div>
            ) : (
              currentMessages.map((message) => {
                const isMine = message.sender.id === currentUser?.id;
                return (
                  <div
                    key={message.id}
                    className={cn(
                      "max-w-[80%] rounded-2xl px-4 py-2 text-sm shadow-sm",
                      isMine
                        ? "ml-auto rounded-br-md bg-primary text-white"
                        : "rounded-bl-md bg-white text-slate-700",
                    )}
                  >
                    {!isMine && (
                      <p className="mb-1 text-xs font-semibold text-slate-900">
                        {message.sender.fullname ??
                          message.sender.username ??
                          "Người gửi"}
                      </p>
                    )}
                    <p>{message.content}</p>
                    <p
                      className={cn(
                        "mt-1 text-[11px]",
                        isMine ? "text-white/75" : "text-slate-400",
                      )}
                    >
                      {message.created_at}
                    </p>
                  </div>
                );
              })
            )}
          </div>

          <form className="border-t border-slate-200 p-3" onSubmit={handleSubmit}>
            <div className="flex items-center gap-2">
              <Input
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder="Nhập nội dung cần tư vấn với bác sĩ..."
                disabled={!activeChannelId}
              />
              <Button
                type="submit"
                className="gap-2"
                disabled={!activeChannelId || sendMessageMutation.isPending}
              >
                <SendHorizontal className="h-4 w-4" />
                Gửi
              </Button>
            </div>
          </form>
        </div>
      </Card>

      <Dialog open={openCreateDialog} onOpenChange={setOpenCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Tạo cuộc trò chuyện</DialogTitle>
            <DialogDescription>
              Chọn bác sĩ bạn muốn tư vấn trực tuyến.
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center gap-2">
            <Input
              value={doctorSearch}
              onChange={(event) => {
                setDoctorSearch(event.target.value);
                setDoctorPage(1);
              }}
              placeholder="Tìm bác sĩ..."
              icon={<Search className="h-4 w-4" />}
            />
          </div>

          <div className="max-h-[420px] space-y-2 overflow-y-auto">
            {isLoadingDoctors ? (
              <div className="rounded-lg border border-slate-200 p-4 text-sm text-slate-500">
                Đang tải danh sách bác sĩ...
              </div>
            ) : doctors.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-300 p-4 text-center text-sm text-slate-500">
                Không tìm thấy bác sĩ phù hợp.
              </div>
            ) : (
              doctors.map((doctor) => (
                <div
                  key={doctor.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 p-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">
                      BS.{doctor.fullname}
                    </p>
                    <p className="truncate text-sm text-slate-500">
                      {doctor.specialty || "Chưa cập nhật chuyên khoa"}
                    </p>
                    <p className="truncate text-xs text-slate-400">
                      {doctor.workplace || "Chưa cập nhật nơi làm việc"}
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    disabled={createDirectChannelMutation.isPending}
                    onClick={() => handleStartConversation(doctor)}
                  >
                    Tạo
                  </Button>
                </div>
              ))
            )}
          </div>

          <div className="flex items-center justify-between gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={doctorPage <= 1}
              onClick={() => setDoctorPage((page) => Math.max(1, page - 1))}
            >
              Trước
            </Button>
            <span className="text-xs text-slate-500">
              Trang {doctorPage}/{doctorTotalPages}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={doctorPage >= doctorTotalPages}
              onClick={() =>
                setDoctorPage((page) => Math.min(doctorTotalPages, page + 1))
              }
            >
              Sau
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Messages;
