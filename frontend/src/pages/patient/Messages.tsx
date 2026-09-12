import React, { useEffect, useMemo, useRef, useState } from "react";
import { Search } from "lucide-react";
import {
  type InfiniteData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";

import { createChannel, getChannelById } from "@/api/channelApi";
import { fetchDoctors } from "@/api/doctorApi";
import { fetchPatientChannels } from "@/api/patientApi";
import ChannelList from "@/components/messages/ChannelList";
import ChatPanel from "@/components/messages/ChatPanel";
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
import { useSocket } from "@/hooks/useSocket";
import { cn } from "@/lib/utils";
import {
  patientQueryKeys,
  useMarkChannelRead,
  usePatientChannels,
  usePatientMessages,
  useSendPatientMessage,
} from "@/hooks/usePatientPortalApi";
import { useUserStore } from "@/store/useUserStore";
import type { DoctorCardData } from "@/types/global";
import type {
  ApiResponse,
  Channel,
  Message,
  MessageListResponse,
} from "@/types/interface/patient.interface";
import { cancelPendingEvent, safeEmit } from "@/utils/socket";
import { useTranslation } from "react-i18next";

type DirectChannelResponse = {
  data?: Partial<Channel> & { channel_id?: number };
};

type CreateDirectChannelPayload = {
  senderId: number;
  receiverId: number;
};

type MessagesCache = InfiniteData<ApiResponse<MessageListResponse>>;

const CHANNEL_LIMIT = 8;
const DOCTOR_LIMIT = 8;

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
  const { t } = useTranslation();
  const currentUser = useUserStore((state) => state.userInfo);
  const queryClient = useQueryClient();
  const socket = useSocket();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedDoctorUserId = Number(searchParams.get("doctorUserId")) || 0;
  const requestedChannelId = Number(searchParams.get("channelId")) || 0;
  const handledDoctorUserIdRef = useRef<number>(0);
  const markedReadChannelRef = useRef<number>(0);

  const [channelPage, setChannelPage] = useState(1);
  const [selectedChannelId, setSelectedChannelId] = useState<number>(0);
  const [draft, setDraft] = useState("");
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [doctorSearch, setDoctorSearch] = useState("");
  const [doctorPage, setDoctorPage] = useState(1);
  const [selectedChannelSnapshot, setSelectedChannelSnapshot] =
    useState<Channel | null>(null);

  const {
    data: channelsResponse,
    isLoading,
    isError,
    refetch: refetchChannels,
  } = usePatientChannels({
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
      toast.error(t("common.error"));
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
  // Trên mobile chỉ hiện khung chat khi người dùng đã chủ động chọn / mở một
  // hội thoại cụ thể — không tự mở hội thoại đầu tiên (đó chỉ là fallback
  // hiển thị cho desktop, nơi cả 2 vùng luôn hiện song song).
  const mobileDetailOpen = Boolean(selectedChannelId || requestedChannelId);

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

  const {
    data: messagesResponse,
    isLoading: isLoadingMessages,
    isError: isErrorMessages,
    refetch: refetchMessages,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = usePatientMessages(activeChannelId);
  const sendMessageMutation = useSendPatientMessage(activeChannelId);
  const markChannelReadMutation = useMarkChannelRead(activeChannelId);

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

  // Đánh dấu đã đọc mỗi khi người dùng mở một hội thoại (không lặp lại khi
  // component re-render vì cùng một kênh).
  useEffect(() => {
    if (!activeChannelId || markedReadChannelRef.current === activeChannelId) {
      return;
    }
    markedReadChannelRef.current = activeChannelId;
    markChannelReadMutation.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeChannelId]);

  // Realtime: tham gia room của hội thoại đang mở, lắng nghe tin nhắn mới,
  // dedupe theo id để tránh trùng với optimistic update / refetch, dọn dẹp
  // listener + rời room khi đổi hội thoại hoặc unmount.
  useEffect(() => {
    if (!socket || !activeChannelId) return;

    let pendingJoinEventId: number | undefined;
    const joinChannel = () => {
      if (pendingJoinEventId !== undefined) {
        cancelPendingEvent(pendingJoinEventId);
      }
      pendingJoinEventId = safeEmit("channel:join", {
        channel_id: activeChannelId,
      });
    };

    const handleReceiveMessage = (data: Message & { channel?: { id: number } }) => {
      if (Number(data.channel?.id) !== activeChannelId) return;

      queryClient.setQueryData<MessagesCache>(
        patientQueryKeys.messages(activeChannelId),
        (old) => {
          if (!old) return old;
          const exists = old.pages.some((page) =>
            page.data.messages.some((message) => message.id === data.id),
          );
          if (exists) return old;

          const pages = [...old.pages];
          const lastIndex = pages.length - 1;
          pages[lastIndex] = {
            ...pages[lastIndex],
            data: {
              ...pages[lastIndex].data,
              messages: [...pages[lastIndex].data.messages, data],
            },
          };
          return { ...old, pages };
        },
      );
      queryClient.invalidateQueries({ queryKey: ["patient-channels"] });
    };

    socket.on("connect", joinChannel);
    socket.on("receive:message", handleReceiveMessage);
    if (socket.connected) {
      joinChannel();
    }

    return () => {
      socket.off("connect", joinChannel);
      socket.off("receive:message", handleReceiveMessage);
      if (pendingJoinEventId !== undefined) {
        cancelPendingEvent(pendingJoinEventId);
      }
      if (socket.connected) {
        socket.emit("channel:leave", { channel_id: activeChannelId });
      }
    };
  }, [socket, activeChannelId, queryClient]);

  const handleSelectChannel = (channelId: number) => {
    setSelectedChannelSnapshot(
      channels.find((channel) => channel.id === channelId) ?? null,
    );
    setSelectedChannelId(channelId);
    setSearchParams({ channelId: String(channelId) }, { replace: true });
  };

  const handleBackToList = () => {
    setSelectedChannelId(0);
    setSearchParams({}, { replace: true });
  };

  const handleStartConversation = (doctor: DoctorCardData) => {
    if (!currentUser?.id) return;
    if (!doctor.user_id) {
      toast.error(t("common.error"));
      return;
    }

    const existingChannel = findChannelByParticipant(channels, doctor.user_id);
    if (existingChannel) {
      setOpenCreateDialog(false);
      handleSelectChannel(existingChannel.id);
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

  const sendMessage = (content: string) => {
    if (!content || !activeChannelId || !currentUser?.id) return;
    sendMessageMutation.mutate(
      {
        message_type: "regular",
        content,
        sender_id: currentUser.id,
        channel_id: activeChannelId,
      },
      {
        onError: () => toast.error(t("common.error")),
      },
    );
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const content = draft.trim();
    if (!content) return;
    sendMessage(content);
    setDraft("");
  };

  const handleRetryMessage = (message: Message) => {
    if (!activeChannelId || !message.content) return;
    queryClient.setQueryData<MessagesCache>(
      patientQueryKeys.messages(activeChannelId),
      (old) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            data: {
              ...page.data,
              messages: page.data.messages.filter((m) => m.id !== message.id),
            },
          })),
        };
      },
    );
    sendMessage(message.content);
  };

  return (
    <>
      <Card className="grid h-[calc(100vh-8rem)] min-h-[520px] grid-cols-1 overflow-hidden border-slate-200/80 bg-white dark:border-slate-800/80 dark:bg-slate-900 py-0 shadow-xs lg:grid-cols-[340px_1fr] rounded-3xl">
        <ChannelList
          className={mobileDetailOpen ? "hidden lg:flex" : "flex"}
          channels={channels}
          activeChannelId={activeChannelId}
          currentUserId={currentUser?.id}
          isLoading={isLoading}
          isError={isError}
          onRetry={() => refetchChannels()}
          onSelectChannel={handleSelectChannel}
          onCreateNew={() => setOpenCreateDialog(true)}
          page={channelPage}
          totalPages={channelTotalPages}
          onPageChange={setChannelPage}
        />

        <ChatPanel
          className={cn(mobileDetailOpen ? "flex" : "hidden lg:flex")}
          channel={displayedChannel}
          currentUserId={currentUser?.id}
          activeChannelId={activeChannelId}
          messages={currentMessages}
          isLoadingMessages={isLoadingMessages}
          isErrorMessages={isErrorMessages}
          onRetryMessages={() => refetchMessages()}
          hasNextPage={hasNextPage}
          isFetchingNextPage={isFetchingNextPage}
          onLoadOlder={() => fetchNextPage()}
          draft={draft}
          onDraftChange={setDraft}
          onSubmit={handleSubmit}
          isSending={sendMessageMutation.isPending}
          onRetryMessage={handleRetryMessage}
          onBack={handleBackToList}
        />
      </Card>

      <Dialog open={openCreateDialog} onOpenChange={setOpenCreateDialog}>
        <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden rounded-2xl sm:rounded-3xl">
          <div className="shrink-0 p-5 pb-3 border-b border-slate-100 dark:border-slate-800 space-y-3 pr-12">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {t("messages.searchDoctorTitle")}
              </DialogTitle>
              <DialogDescription className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                {t("messages.searchDoctorDesc")}
              </DialogDescription>
            </DialogHeader>

            <div className="flex items-center gap-2 pt-1">
              <Input
                value={doctorSearch}
                onChange={(event) => {
                  setDoctorSearch(event.target.value);
                  setDoctorPage(1);
                }}
                placeholder={t("messages.doctorSearchPlaceholder")}
                aria-label={t("messages.doctorSearchPlaceholder")}
                icon={<Search className="h-4 w-4" />}
                className="rounded-xl"
              />
            </div>
          </div>

          <div className="flex-1 min-h-0 min-w-0 overflow-y-auto overscroll-contain p-5 space-y-2.5 scrollbar-soft">
            {isLoadingDoctors ? (
              <div className="rounded-xl border border-slate-200 p-6 text-center text-sm text-slate-500">
                {t("common.loading")}
              </div>
            ) : doctors.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
                {t("doctor.noResultsTitle")}
              </div>
            ) : (
              doctors.map((doctor) => (
                <div
                  key={doctor.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-slate-200/80 bg-white p-3.5 transition hover:border-primary/40 hover:shadow-2xs dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-slate-900 dark:text-slate-100">
                      {t("appointments.doctorPrefix")} {doctor.fullname}
                    </p>
                    <p className="truncate text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                      {doctor.specialty || t("common.notUpdated")}
                    </p>
                    <p className="truncate text-xs text-slate-400">
                      {doctor.workplace || t("common.notUpdated")}
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    disabled={createDirectChannelMutation.isPending}
                    onClick={() => handleStartConversation(doctor)}
                    className="rounded-xl font-bold !bg-primary text-white shrink-0 cursor-pointer"
                  >
                    {t("messages.startChatBtn")}
                  </Button>
                </div>
              ))
            )}
          </div>

          <div className="shrink-0 p-4 bg-slate-50/80 dark:bg-slate-950/80 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={doctorPage <= 1}
              onClick={() => setDoctorPage((page) => Math.max(1, page - 1))}
              className="rounded-xl cursor-pointer"
            >
              {t("common.back")}
            </Button>
            <span className="text-xs text-slate-500">
              {t("common.page")} {doctorPage}/{doctorTotalPages}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={doctorPage >= doctorTotalPages}
              onClick={() =>
                setDoctorPage((page) => Math.min(doctorTotalPages, page + 1))
              }
              className="rounded-xl cursor-pointer"
            >
              {t("common.more")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Messages;
