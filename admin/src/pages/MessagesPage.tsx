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
        title="Patient messages"
        description="A three-panel workspace for conversation triage, clinical context, and attachment review before the real channels/messages API is connected."
        actions={["Create note", "View attachments"]}
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
                className={`w-full rounded-lg border p-4 text-left transition ${
                  activeThread.id === thread.id
                    ? "border-[#212121] bg-[#f7f6f2]"
                    : "border-[#d9d9dd] bg-white hover:border-[#212121]"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-medium text-[#212121]">
                    {thread.patientName}
                  </div>
                  {thread.unreadCount ? (
                    <Badge variant="warning">{thread.unreadCount} new</Badge>
                  ) : null}
                </div>
                <div className="mt-1 text-xs text-[#75758a]">
                  {thread.concern} / {thread.updatedAt}
                </div>
                <div className="mt-3 text-sm text-[#75758a]">
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
                  className={`max-w-[92%] rounded-lg p-4 ${
                    message.sender === "doctor"
                      ? "ml-auto bg-[#071829] text-white"
                      : "border border-[#d9d9dd] bg-[#f7f6f2] text-[#212121]"
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
                  <div className="mono-label mt-3 text-[10px] opacity-70">
                    {message.time}
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-lg border border-[#d9d9dd] bg-[#f7f6f2] p-4">
              <Textarea placeholder="Mock reply composer..." />
              <div className="mt-3 flex justify-end">
                <Button>
                  <SendHorizonal className="size-4" />
                  Send reply
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
            <div className="rounded-lg border border-[#d9d9dd] bg-[#f7f6f2] p-4">
              <div className="text-sm font-medium text-[#212121]">
                {activeThread.patientName}
              </div>
              <div className="mt-1 text-sm text-[#75758a]">
                {activeThread.age} years old / {activeThread.concern}
              </div>
              <div className="mt-2">
                <Badge variant="outline">Risk {activeThread.riskLevel}</Badge>
              </div>
            </div>

            <div className="space-y-3">
              {activeThread.details.map((detail) => (
                <div key={detail.label} className="rounded-lg border border-[#d9d9dd] bg-white p-4">
                  <div className="mono-label text-[10px] text-[#75758a]">
                    {detail.label}
                  </div>
                  <div className="mt-1 text-sm font-medium text-[#212121]">
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
                  className="flex items-center gap-3 rounded-lg border border-[#d9d9dd] bg-white p-4 transition hover:border-[#212121]"
                >
                  <div className="rounded-full border border-[#d9d9dd] p-3 text-primary">
                    {file.type === "image" ? (
                      <FileImage className="size-4" />
                    ) : (
                      <FileText className="size-4" />
                    )}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-[#212121]">
                      {file.name}
                    </div>
                    <div className="text-xs text-[#75758a]">
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
