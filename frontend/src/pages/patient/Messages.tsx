import React, { useMemo, useState } from "react";
import { SendHorizontal, Stethoscope } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { usePatientPortal } from "@/pages/patient/usePatientPortal";

const Messages: React.FC = () => {
  const {
    conversations,
    selectedConversationId,
    selectConversation,
    messages,
    sendMessage,
  } = usePatientPortal();
  const [draft, setDraft] = useState("");

  const selectedConversation = useMemo(
    () =>
      conversations.find(
        (conversation) => conversation.id === selectedConversationId
      ),
    [conversations, selectedConversationId]
  );

  const currentMessages = useMemo(
    () =>
      messages.filter(
        (message) => message.conversationId === selectedConversationId
      ),
    [messages, selectedConversationId]
  );

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    sendMessage(draft);
    setDraft("");
  };

  return (
    <Card className="grid min-h-[600px] grid-cols-1 overflow-hidden border-primary/15 py-0 lg:grid-cols-[320px_1fr]">
      <div className="border-b border-slate-200 lg:border-b-0 lg:border-r">
        <div className="border-b border-slate-200 p-4">
          <h2 className="text-base font-bold text-slate-900">Tư vấn trực tuyến</h2>
          <p className="text-sm text-slate-600">Kết nối với bác sĩ đang theo dõi bạn</p>
        </div>
        <div className="space-y-2 p-3">
          {conversations.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-300 p-4 text-center text-sm text-slate-500">
              Chưa có hội thoại nào.
            </div>
          ) : (
            conversations.map((conversation) => (
              <button
                key={conversation.id}
                type="button"
                className={cn(
                  "w-full rounded-lg border p-3 text-left transition-colors",
                  conversation.id === selectedConversationId
                    ? "border-primary bg-primary/10"
                    : "border-slate-200 bg-white hover:border-primary/40"
                )}
                onClick={() => selectConversation(conversation.id)}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-900">
                    {conversation.doctorName}
                  </p>
                  {conversation.unread > 0 && (
                    <Badge>{conversation.unread}</Badge>
                  )}
                </div>
                <p className="text-xs text-slate-500">{conversation.specialty}</p>
                <p className="mt-1 line-clamp-1 text-sm text-slate-600">
                  {conversation.lastMessage}
                </p>
                <p className="mt-1 text-xs text-slate-400">{conversation.lastTime}</p>
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
              {selectedConversation?.doctorName ?? "Chưa chọn bác sĩ"}
            </p>
            <p className="text-sm text-slate-600">
              {selectedConversation?.specialty ?? "Hãy chọn hội thoại để bắt đầu"}
            </p>
          </div>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50 p-4">
          {currentMessages.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-500">
              Chưa có tin nhắn nào trong hội thoại này.
            </div>
          ) : (
            currentMessages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "max-w-[80%] rounded-2xl px-4 py-2 text-sm shadow-sm",
                  message.sender === "patient"
                    ? "ml-auto rounded-br-md bg-primary text-white"
                    : "rounded-bl-md bg-white text-slate-700"
                )}
              >
                <p>{message.content}</p>
                <p
                  className={cn(
                    "mt-1 text-[11px]",
                    message.sender === "patient"
                      ? "text-white/75"
                      : "text-slate-400"
                  )}
                >
                  {message.sentAt}
                </p>
              </div>
            ))
          )}
        </div>

        <form className="border-t border-slate-200 p-3" onSubmit={handleSubmit}>
          <div className="flex items-center gap-2">
            <Input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Nhập nội dung cần tư vấn với bác sĩ..."
            />
            <Button type="submit" className="gap-2">
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
