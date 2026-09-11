import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";

import { EmptyState } from "@/components/app/EmptyState";
import { ErrorState } from "@/components/app/ErrorState";
import { LoadingState } from "@/components/app/LoadingState";
import { PageHeader } from "@/components/app/PageHeader";
import ChannelListPanel from "@/components/app/messages/ChannelListPanel";
import ConversationPanel from "@/components/app/messages/ConversationPanel";
import { usePersonalChannels } from "@/hooks/useChannels";
import {
  messageQueryKeys,
  useCreateMessage,
  useMarkChannelRead,
  useMessagesByChannel,
} from "@/hooks/useMessages";
import { useSocket } from "@/hooks/useSocket";
import { useAuthStore } from "@/store/useAuthStore";
import { cn } from "@/lib/utils";
import type { Message } from "@/types/interface/message.interface";
import { useQueryClient, type InfiniteData } from "@tanstack/react-query";
import type { ApiResponse } from "@/types/interface/api.interface";
import type { MessageListResponse } from "@/api/messageApi";

type MessagesCache = InfiniteData<ApiResponse<MessageListResponse>>;

export function MessagesPage() {
  const [page] = useState(1);
  const [selectedChannelId, setSelectedChannelId] = useState<number | null>(
    null,
  );
  const [messageText, setMessageText] = useState("");
  const currentUser = useAuthStore((s) => s.currentUser);
  const queryClient = useQueryClient();
  const socket = useSocket();
  const markedReadChannelRef = useRef<number>(0);

  const { data: channelsData, isLoading, isError, refetch } =
    usePersonalChannels({ page, limit: 50 });

  const {
    data: messagesData,
    isLoading: messagesLoading,
    isError: messagesError,
    refetch: refetchMessages,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useMessagesByChannel(selectedChannelId ?? 0);

  const createMessage = useCreateMessage(selectedChannelId ?? 0);
  const markChannelRead = useMarkChannelRead(selectedChannelId ?? 0);

  const channels = useMemo(
    () => channelsData?.data?.channels ?? [],
    [channelsData],
  );
  const messages = useMemo(
    () =>
      (messagesData?.pages.flatMap((p) => p.data.messages) ?? [])
        .slice()
        .reverse(),
    [messagesData],
  );
  const selectedChannel = useMemo(
    () =>
      channels.find((channel) => channel.channel_id === selectedChannelId) ??
      null,
    [channels, selectedChannelId],
  );
  const selectedChannelName = useMemo(() => {
    if (!selectedChannel) return null;
    const others = selectedChannel.participants.filter((p) => p.id !== 0);
    return others.map((p) => p.fullname).join(", ") || null;
  }, [selectedChannel]);

  useEffect(() => {
    if (channels.length > 0 && !selectedChannelId) {
      setSelectedChannelId(channels[0].channel_id);
    }
  }, [channels, selectedChannelId]);

  // Đánh dấu đã đọc mỗi khi mở một hội thoại.
  useEffect(() => {
    if (!selectedChannelId || markedReadChannelRef.current === selectedChannelId) {
      return;
    }
    markedReadChannelRef.current = selectedChannelId;
    markChannelRead.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedChannelId]);

  // Realtime: tham gia room hội thoại đang mở, nhận tin mới, dedupe theo id,
  // dọn dẹp khi đổi hội thoại/unmount.
  useEffect(() => {
    if (!socket || !selectedChannelId) return;

    const joinChannel = () =>
      socket.emit("channel:join", { channel_id: selectedChannelId });

    const handleReceiveMessage = (
      data: Message & { channel?: { id: number } },
    ) => {
      if (Number(data.channel?.id) !== selectedChannelId) return;

      queryClient.setQueryData<MessagesCache>(
        messageQueryKeys.list(selectedChannelId),
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
      queryClient.invalidateQueries({ queryKey: ["channels"] });
    };

    socket.on("connect", joinChannel);
    socket.on("receive:message", handleReceiveMessage);
    if (socket.connected) joinChannel();

    return () => {
      socket.off("connect", joinChannel);
      socket.off("receive:message", handleReceiveMessage);
      if (socket.connected) {
        socket.emit("channel:leave", { channel_id: selectedChannelId });
      }
    };
  }, [socket, selectedChannelId, queryClient]);

  const sendMessage = (content: string) => {
    if (!content || !selectedChannelId || !currentUser) return;
    createMessage.mutate({
      message_type: "regular",
      content,
      sender_id: currentUser.id,
      channel_id: selectedChannelId,
    });
  };

  const handleSend = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = messageText.trim();
    if (!trimmed || !selectedChannelId || createMessage.isPending || !currentUser) {
      return;
    }
    sendMessage(trimmed);
    setMessageText("");
  };

  const handleRetryMessage = (message: Message) => {
    if (!selectedChannelId || !message.content) return;
    queryClient.setQueryData<MessagesCache>(
      messageQueryKeys.list(selectedChannelId),
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

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Clinical comms"
          title="Hộp thư"
          description="Đang tải danh sách hội thoại..."
        />
        <LoadingState />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Clinical comms"
          title="Hộp thư"
          description="Không thể tải dữ liệu."
        />
        <ErrorState onRetry={() => refetch()} />
      </div>
    );
  }

  if (channels.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Clinical comms"
          title="Hộp thư"
          description="Trao đổi với bệnh nhân và đồng nghiệp"
        />
        <EmptyState
          title="Không có hội thoại"
          description="Hiện chưa có hội thoại nào. Hãy tạo hội thoại mới từ trang bệnh nhân."
        />
      </div>
    );
  }

  const mobileDetailOpen = Boolean(selectedChannelId);

  return (
    <div className="flex h-[calc(100vh-10rem)] flex-col gap-4 lg:flex-row">
      <ChannelListPanel
        className={cn(
          "w-full lg:w-80 lg:shrink-0",
          mobileDetailOpen ? "hidden lg:flex" : "flex",
        )}
        channels={channels}
        activeChannelId={selectedChannelId}
        onSelect={setSelectedChannelId}
      />
      <ConversationPanel
        className={cn("flex-1", mobileDetailOpen ? "flex" : "hidden lg:flex")}
        channelId={selectedChannelId}
        channelName={selectedChannelName}
        currentUserId={currentUser?.id}
        messages={messages}
        isLoadingMessages={messagesLoading}
        isErrorMessages={messagesError}
        onRetryMessages={() => refetchMessages()}
        hasNextPage={hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
        onLoadOlder={() => fetchNextPage()}
        messageText={messageText}
        onMessageTextChange={setMessageText}
        onSubmit={handleSend}
        isSending={createMessage.isPending}
        onRetryMessage={handleRetryMessage}
        onBack={() => setSelectedChannelId(null)}
      />
    </div>
  );
}
