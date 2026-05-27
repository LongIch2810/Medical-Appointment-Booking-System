import { useEffect, useMemo, useRef, useState } from "react";
import { Send } from "lucide-react";

import { EmptyState } from "@/components/app/EmptyState";
import { ErrorState } from "@/components/app/ErrorState";
import { LoadingState } from "@/components/app/LoadingState";
import { PageHeader } from "@/components/app/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePersonalChannels } from "@/hooks/useChannels";
import { useCreateMessage, useMessagesByChannel } from "@/hooks/useMessages";
import { useAuthStore } from "@/store/useAuthStore";
import type { Channel } from "@/types/interface/channel.interface";

export function MessagesPage() {
  const [page] = useState(1);
  const [selectedChannelId, setSelectedChannelId] = useState<number | null>(
    null,
  );
  const [messageText, setMessageText] = useState("");
  const currentUser = useAuthStore((s) => s.currentUser);

  const { data: channelsData, isLoading, isError, refetch } =
    usePersonalChannels({ page, limit: 50 });

  const { data: messagesData, isLoading: messagesLoading } =
    useMessagesByChannel(selectedChannelId ?? 0);

  const createMessage = useCreateMessage();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const channels = useMemo(
    () => channelsData?.data?.channels ?? [],
    [channelsData],
  );
  const messages = useMemo(
    () => messagesData?.data?.messages ?? [],
    [messagesData],
  );

  useEffect(() => {
    if (channels.length > 0 && !selectedChannelId) {
      setSelectedChannelId(channels[0].channel_id);
    }
  }, [channels, selectedChannelId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    const trimmed = messageText.trim();
    if (!trimmed || !selectedChannelId || createMessage.isPending || !currentUser) return;
    createMessage
      .mutateAsync({
        message_type: "TEXT",
        content: trimmed,
        sender_id: currentUser.id,
        channel_id: selectedChannelId,
      })
      .then(() => {
        setMessageText("");
      })
      .catch(() => {});
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

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-4">
      <div className="flex w-80 shrink-0 flex-col rounded-lg border border-[#d9d9dd] bg-white">
        <div className="border-b border-[#d9d9dd] px-4 py-3">
          <h2 className="text-sm font-semibold text-[#212121]">Hội thoại</h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          {channels.map((channel: Channel) => {
            const otherParticipants = channel.participants.filter(
              (p) => p.id !== 0,
            );
            const displayName =
              otherParticipants.map((p) => p.fullname).join(", ") ||
              `#${channel.channel_id}`;
            const lastMsg = channel.last_message;

            return (
              <button
                key={channel.channel_id}
                type="button"
                onClick={() => setSelectedChannelId(channel.channel_id)}
                className={`w-full border-b border-[#f0f0f0] px-4 py-3 text-left transition-colors hover:bg-[#f7f6f2] ${
                  selectedChannelId === channel.channel_id
                    ? "bg-[#f7f6f2]"
                    : ""
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="truncate text-sm font-medium text-[#212121]">
                    {displayName}
                  </span>
                  {channel.unread_count > 0 ? (
                    <Badge variant="danger" className="ml-2 shrink-0">
                      {channel.unread_count}
                    </Badge>
                  ) : null}
                </div>
                {lastMsg ? (
                  <p className="mt-1 truncate text-xs text-[#75758a]">
                    {lastMsg.content}
                  </p>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-1 flex-col rounded-lg border border-[#d9d9dd] bg-white">
        {selectedChannelId ? (
          <>
            <div className="flex-1 overflow-y-auto p-4">
              {messagesLoading ? (
                <LoadingState />
              ) : messages.length === 0 ? (
                <div className="flex h-full items-center justify-center">
                  <p className="text-sm text-[#75758a]">
                    Chưa có tin nhắn nào.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {messages.map((msg) => {
                    const isMine = msg.sender.id === currentUser?.id;
                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[70%] rounded-lg px-3 py-2 text-sm ${
                            isMine
                              ? "bg-[#212121] text-white"
                              : "bg-[#f7f6f2] text-[#212121]"
                          }`}
                        >
                          {!isMine ? (
                            <p className="mb-1 text-[10px] font-medium text-[#75758a]">
                              {msg.sender.fullname}
                            </p>
                          ) : null}
                          <p className="whitespace-pre-wrap break-words">
                            {msg.content}
                          </p>
                          <p
                            className={`mt-1 text-[10px] ${
                              isMine ? "text-[#b0b0b0]" : "text-[#75758a]"
                            }`}
                          >
                            {msg.created_at}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>
            <div className="border-t border-[#d9d9dd] p-3">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="flex gap-2"
              >
                <Input
                  placeholder="Nhập tin nhắn..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  className="flex-1"
                />
                <Button
                  type="submit"
                  size="sm"
                  disabled={!messageText.trim() || createMessage.isPending}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-[#75758a]">Chọn một hội thoại</p>
          </div>
        )}
      </div>
    </div>
  );
}
