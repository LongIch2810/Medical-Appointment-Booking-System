import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FileImage, FileText, SendHorizonal } from "lucide-react";

import { PageHeader } from "@/components/app/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { mockApi, queryKeys } from "@/services/mockApi";

export function MessagesPage() {
  const { data } = useQuery({
    queryKey: queryKeys.messages,
    queryFn: () => mockApi.getMessages(),
  });
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const activeThread = useMemo(() => {
    if (!data?.length) return null;
    return data.find((thread) => thread.id === selectedId) ?? data[0];
  }, [data, selectedId]);

  if (!data || !activeThread) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Doctor messages"
        title="Tin nhắn bệnh nhân"
        description="Layout 3 cột mô phỏng channel list, chat timeline và panel thông tin bệnh nhân để nối với channels/messages sau này."
        actions={["Tạo note", "Xem attachments"]}
      />

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.3fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>Conversations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.map((thread) => (
              <button
                key={thread.id}
                onClick={() => setSelectedId(thread.id)}
                className={`w-full rounded-2xl border p-4 text-left transition ${
                  activeThread.id === thread.id
                    ? "border-primary bg-primary/5"
                    : "border-slate-100 bg-white/70 hover:border-slate-200"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-semibold text-slate-900">
                    {thread.patientName}
                  </div>
                  {thread.unreadCount ? (
                    <Badge variant="warning">{thread.unreadCount} mới</Badge>
                  ) : null}
                </div>
                <div className="mt-1 text-xs text-slate-500">
                  {thread.concern} • {thread.updatedAt}
                </div>
                <div className="mt-3 text-sm text-slate-600">
                  {thread.lastMessage}
                </div>
              </button>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{activeThread.patientName}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {activeThread.messages.map((message) => (
                <div
                  key={message.id}
                  className={`max-w-[92%] rounded-[1.4rem] p-4 ${
                    message.sender === "doctor"
                      ? "ml-auto bg-slate-950 text-white"
                      : "bg-slate-100 text-slate-900"
                  }`}
                >
                  <div className="text-sm leading-6">{message.content}</div>
                  {message.attachments?.length ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {message.attachments.map((file) => (
                        <div
                          key={file.id}
                          className="rounded-full bg-white/10 px-3 py-1 text-xs"
                        >
                          {file.name}
                        </div>
                      ))}
                    </div>
                  ) : null}
                  <div className="mt-3 text-[11px] uppercase tracking-[0.2em] opacity-70">
                    {message.time}
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-[1.6rem] border border-slate-100 bg-slate-50 p-4">
              <Textarea placeholder="Mock reply composer..." />
              <div className="mt-3 flex justify-end">
                <Button>
                  <SendHorizonal className="size-4" />
                  Gửi phản hồi
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Patient context</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-[1.4rem] bg-slate-50 p-4">
              <div className="text-sm font-semibold text-slate-900">
                {activeThread.patientName}
              </div>
              <div className="mt-1 text-sm text-slate-500">
                {activeThread.age} tuổi • {activeThread.concern}
              </div>
              <div className="mt-2">
                <Badge variant="outline">Risk {activeThread.riskLevel}</Badge>
              </div>
            </div>

            <div className="space-y-3">
              {activeThread.details.map((detail) => (
                <div key={detail.label} className="rounded-2xl border border-slate-100 bg-white/70 p-4">
                  <div className="text-xs uppercase tracking-[0.2em] text-slate-400">
                    {detail.label}
                  </div>
                  <div className="mt-1 text-sm font-semibold text-slate-800">
                    {detail.value}
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-3">
              {activeThread.attachments.map((file) => (
                <a
                  key={file.id}
                  href={file.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white/70 p-4"
                >
                  <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                    {file.type === "image" ? (
                      <FileImage className="size-4" />
                    ) : (
                      <FileText className="size-4" />
                    )}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-900">
                      {file.name}
                    </div>
                    <div className="text-xs text-slate-500">
                      {file.type.toUpperCase()} attachment
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
