import { useEffect, useState } from "react";
import { MessageSquarePlus, Send } from "lucide-react";

import { AiReportLoadingOverlay } from "@/components/app/AiReportLoadingOverlay";
import { PageHeader } from "@/components/app/PageHeader";
import { ReportAssistantConversationList } from "@/components/app/ReportAssistantConversationList";
import { ReportAssistantChat } from "@/components/app/ReportAssistantChat";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import {
  useConfirmReportAssistantPlan,
  useCreateReportAssistantConversation,
  useLoadOlderReportAssistantMessages,
  useReportAssistantConversation,
  useReportAssistantConversations,
  useSendReportAssistantMessage,
} from "@/hooks/useAdminReportAssistant";
import type {
  ReportAssistantMessage,
} from "@/types/interface/adminReport.interface";

type RetryAction =
  | { kind: "message"; value: string }
  | { kind: "confirm"; value: number }
  | null;


export function AdminAiReportAssistantPage() {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [draft, setDraft] = useState("");
  const [isRailOpen, setIsRailOpen] = useState(false);
  const [olderPagesByConversation, setOlderPagesByConversation] = useState<Record<number, Array<{
    messages: ReportAssistantMessage[];
    nextBeforeMessageId: number | null;
  }>>>({});
  const [retryAction, setRetryAction] = useState<RetryAction>(null);
  const conversations = useReportAssistantConversations();
  const conversation = useReportAssistantConversation(selectedId);
  const createMutation = useCreateReportAssistantConversation();
  const sendMutation = useSendReportAssistantMessage();
  const confirmMutation = useConfirmReportAssistantPlan();
  const loadOlderMutation = useLoadOlderReportAssistantMessages();
  const isPending =
    createMutation.isPending || sendMutation.isPending || confirmMutation.isPending;

  const clearTurnErrors = () => {
    createMutation.reset();
    sendMutation.reset();
    confirmMutation.reset();
    loadOlderMutation.reset();
    setRetryAction(null);
  };

  const currentPage = conversation.data?.data;
  const olderPages = selectedId === null ? [] : olderPagesByConversation[selectedId] ?? [];
  const messages = [
    ...olderPages.slice().reverse().flatMap((page) => page.messages),
    ...(currentPage?.messages ?? []),
  ];
  useEffect(() => {
    if (selectedId === null && conversations.data?.data.conversations.length) {
      setSelectedId(conversations.data.data.conversations[0].id);
    }
  }, [conversations.data, selectedId]);

  const olderCursor = olderPages.length
    ? olderPages[olderPages.length - 1].nextBeforeMessageId
    : currentPage?.nextBeforeMessageId;

  const loadOlder = async () => {
    const conversationId = selectedId;
    const cursor = olderCursor;
    if (!conversationId || !cursor || loadOlderMutation.isPending) return;
    const result = await loadOlderMutation.mutateAsync({
      id: conversationId,
      beforeMessageId: cursor,
    });
    setOlderPagesByConversation((pages) => ({
      ...pages,
      [conversationId]: [...(pages[conversationId] ?? []), {
        messages: result.data.messages,
        nextBeforeMessageId: result.data.nextBeforeMessageId,
      }],
    }));
  };

  const runMessage = async (message: string) => {
    const value = message.trim();
    if (!value || isPending) return;
    clearTurnErrors();
    setRetryAction({ kind: "message", value });
    try {
      if (selectedId === null) {
        const result = await createMutation.mutateAsync(value);
        setSelectedId(result.data.conversation.id);
      } else {
        await sendMutation.mutateAsync({ id: selectedId, message: value });
      }
      setDraft("");
      setRetryAction(null);
      setIsRailOpen(false);
    } catch {
      // The persisted user request remains visible after upstream failures; retry is explicit below.
    }
  };

  const runConfirm = async (messageId: number) => {
    if (selectedId === null || isPending) return;
    clearTurnErrors();
    setRetryAction({ kind: "confirm", value: messageId });
    try {
      await confirmMutation.mutateAsync({ id: selectedId, messageId });
      setRetryAction(null);
    } catch {
      // Keep the plan visible so the admin can retry after a transient failure.
    }
  };

  const handleSubmit = () => void runMessage(draft);
  const handleComposerKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      handleSubmit();
    }
  };

  const retryError = createMutation.error || sendMutation.error || confirmMutation.error;
  const selectedTitle = conversation.data?.data.conversation.title;

  return (
    <>
      <AiReportLoadingOverlay isLoading={isPending} />
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <PageHeader
            eyebrow="Admin reports"
            title="Trợ lý báo cáo AI"
            description="Trao đổi nhiều lượt để làm rõ câu hỏi, xác nhận kế hoạch và tạo báo cáo từ dữ liệu hệ thống."
          />
          <Button
            type="button"
            variant="outline"
            className="min-h-11 shrink-0 gap-2 lg:hidden"
            onClick={() => setIsRailOpen(true)}
          >
            <MessageSquarePlus aria-hidden="true" className="size-4" />
            Hội thoại
          </Button>
        </div>

        <div className="flex h-[70vh] min-h-[34rem] overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
          <aside className="hidden w-72 shrink-0 border-r border-slate-200 lg:flex lg:flex-col dark:border-slate-800">
            <ReportAssistantConversationList
              conversations={conversations.data?.data.conversations ?? []}
              selectedId={selectedId}
              isLoading={conversations.isLoading}
              isError={conversations.isError}
              onRetry={() => void conversations.refetch()}
              onSelect={(id) => setSelectedId(id)}
              onNew={() => {
                clearTurnErrors();
                setSelectedId(null);
                setDraft("");
              }}
            />
          </aside>

          <main className="flex min-w-0 flex-1 flex-col">
            <header className="flex min-h-14 items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 dark:border-slate-800 sm:px-6">
              <div className="min-w-0">
                <h2 className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {selectedTitle || "Cuộc hội thoại mới"}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Phạm vi: dữ liệu quản trị hiện có
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                className="hidden min-h-11 shrink-0 gap-2 sm:inline-flex"
                onClick={() => {
                  clearTurnErrors();
                  setSelectedId(null);
                  setDraft("");
                }}
              >
                <MessageSquarePlus aria-hidden="true" className="size-4" />
                Hội thoại mới
              </Button>
            </header>

            <ReportAssistantChat
              conversationId={selectedId}
              messages={messages}
              isLoading={conversation.isLoading}
              isError={conversation.isError}
              onRetry={() => void conversation.refetch()}
              olderCursor={olderCursor}
              isLoadingOlder={loadOlderMutation.isPending}
              hasOlderError={Boolean(loadOlderMutation.error)}
              onLoadOlder={() => void loadOlder()}
              isPending={isPending}
              onConfirm={(messageId) => void runConfirm(messageId)}
              onQuickPrompt={(prompt) => void runMessage(prompt)}
            />

            <div className="border-t border-slate-100 bg-white p-3 dark:border-slate-800 dark:bg-slate-950 sm:p-4">
              {retryError ? (
                <div className="mb-3 flex flex-col gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive sm:flex-row sm:items-center sm:justify-between" role="alert">
                  <span>Không thể hoàn tất yêu cầu. Tin nhắn đã được giữ lại nếu đã lưu; bạn có thể thử lại.</span>
                  {retryAction ? (
                    <Button
                      type="button"
                      variant="outline"
                      className="min-h-11 border-destructive/30 text-destructive"
                      disabled={isPending}
                      onClick={() => retryAction.kind === "message"
                        ? void runMessage(retryAction.value)
                        : void runConfirm(retryAction.value)}
                    >
                      Thử lại
                    </Button>
                  ) : null}
                </div>
              ) : null}
              <label htmlFor="report-assistant-composer" className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Tin nhắn của bạn
              </label>
              <div className="flex items-end gap-2">
                <Textarea
                  id="report-assistant-composer"
                  value={draft}
                  onChange={(event) => setDraft(event.target.value.slice(0, 4000))}
                  onKeyDown={handleComposerKeyDown}
                  placeholder="Mô tả báo cáo bạn cần…"
                  maxLength={4000}
                  disabled={isPending}
                  className="min-h-12 max-h-36 resize-y"
                  aria-describedby="report-assistant-composer-help"
                />
                <Button
                  type="button"
                  className="min-h-12 min-w-12 shrink-0 px-3"
                  onClick={handleSubmit}
                  disabled={isPending || !draft.trim()}
                  aria-label="Gửi tin nhắn"
                >
                  <Send aria-hidden="true" className="size-4" />
                </Button>
              </div>
              <div id="report-assistant-composer-help" className="mt-1 flex justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
                <span>Enter để gửi · Shift+Enter để xuống dòng</span>
                <span>{draft.length}/4000</span>
              </div>
            </div>
          </main>
        </div>
      </div>

      <Sheet open={isRailOpen} onOpenChange={setIsRailOpen}>
        <SheetContent side="left" className="p-0">
          <ReportAssistantConversationList
            conversations={conversations.data?.data.conversations ?? []}
            selectedId={selectedId}
            isLoading={conversations.isLoading}
            isError={conversations.isError}
            onRetry={() => void conversations.refetch()}
            onSelect={(id) => {
              clearTurnErrors();
              setSelectedId(id);
              setIsRailOpen(false);
            }}
            onNew={() => {
              clearTurnErrors();
              setSelectedId(null);
              setDraft("");
              setIsRailOpen(false);
            }}
          />
        </SheetContent>
      </Sheet>
    </>
  );
}
