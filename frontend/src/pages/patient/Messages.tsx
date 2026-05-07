import React, { useMemo, useState } from "react";
import { SendHorizontal, Stethoscope } from "lucide-react";
import { toast } from "react-toastify";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  usePatientChannels,
  usePatientMessages,
  useSendPatientMessage,
} from "@/hooks/usePatientPortalApi";
import { cn } from "@/lib/utils";
import { useUserStore } from "@/store/useUserStore";
import type { Channel } from "@/types/interface/patient.interface";

const getConversationTitle = (channel: Channel, currentUserId?: number) => {
  const participant =
    channel.participants.find((item) => item.id !== currentUserId) ??
    channel.participants[0];
  return participant?.fullname ?? "Hội thoại";
};

const getLastMessage = (channel: Channel) =>
  channel.chat_messages[0]?.content ?? "Chưa có tin nhắn";

const Messages: React.FC = () => {
  const currentUser = useUserStore((state) => state.userInfo);
  const { data: channelsResponse, isLoading, isError } = usePatientChannels({
    page: 1,
    limit: 50,
  });
  const channels = channelsResponse?.data.channels ?? [];
  const [selectedChannelId, setSelectedChannelId] = useState<number>(0);
  const [draft, setDraft] = useState("");

  const activeChannelId = selectedChannelId || channels[0]?.id || 0;
  const selectedChannel = useMemo(
    () => channels.find((channel) => channel.id === activeChannelId),
    [channels, activeChannelId],
  );

  const { data: messagesResponse } = usePatientMessages(activeChannelId);
  const sendMessageMutation = useSendPatientMessage(activeChannelId);

  const currentMessages = useMemo(
    () =>
      (messagesResponse?.pages.flatMap((page) => page.data.messages) ?? [])
        .slice()
        .reverse(),
    [messagesResponse],
  );

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
    <Card className="grid min-h-[600px] grid-cols-1 overflow-hidden border-primary/15 py-0 lg:grid-cols-[320px_1fr]">
      <div className="border-b border-slate-200 lg:border-b-0 lg:border-r">
        <div className="border-b border-slate-200 p-4">
          <h2 className="text-base font-bold text-slate-900">
            Tư vấn trực tuyến
          </h2>
          <p className="text-sm text-slate-600">
            Kết nối với bác sĩ đang theo dõi bạn
          </p>
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
                onClick={() => setSelectedChannelId(channel.id)}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-900">
                    {getConversationTitle(channel, currentUser?.id)}
                  </p>
                  {channel.chat_messages.some((message) => !message.is_read) && (
                    <Badge>New</Badge>
                  )}
                </div>
                <p className="mt-1 line-clamp-1 text-sm text-slate-600">
                  {getLastMessage(channel)}
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  {channel.updated_at}
                </p>
              </button>
            ))
          )}
        </div>
      </div>

      <div className="flex min-h-[420px] flex-col">
        <div className="flex items-center gap-2 border-b border-slate-200 p-4">
          <Stethoscope className="h-5 w-5 text-primary" />
          <div>
            <p className="font-semibold text-slate-900">
              {selectedChannel
                ? getConversationTitle(selectedChannel, currentUser?.id)
                : "Chưa chọn hội thoại"}
            </p>
            <p className="text-sm text-slate-600">
              {selectedChannel
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
  );
};

export default Messages;
