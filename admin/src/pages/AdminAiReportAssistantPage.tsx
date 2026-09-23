import { useEffect, useRef, useState } from "react";
import { AlertCircle, MessageSquarePlus, Send, Sparkles } from "lucide-react";

import { AiReportLoadingOverlay } from "@/components/app/AiReportLoadingOverlay";
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
  const hasResolvedInitialSelection = useRef(false);
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
    if (selectedId !== null) {
      hasResolvedInitialSelection.current = true;
      return;
    }
    if (hasResolvedInitialSelection.current) return;
    const firstConversationId = conversations.data?.data.conversations[0]?.id;
    if (firstConversationId !== undefined) {
      hasResolvedInitialSelection.current = true;
      setSelectedId(firstConversationId);
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
      <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
        {/* Compact page title bar */}
        <div className="flex shrink-0 items-center justify-between gap-3 pb-2.5 sm:pb-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center rounded-md border border-primary/25 bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                Admin reports
              </span>
              <h1 className="truncate font-display text-base font-bold text-slate-900 dark:text-slate-100 sm:text-lg">
                Trợ lý báo cáo AI
              </h1>
            </div>
            <p className="mt-0.5 line-clamp-1 text-xs text-slate-500 dark:text-slate-400 sm:line-clamp-none">
              Trao đổi nhiều lượt để làm rõ câu hỏi, xác nhận kế hoạch và tạo báo cáo từ dữ liệu hệ thống.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9 shrink-0 gap-1.5 border-slate-200 shadow-xs lg:hidden dark:border-slate-800"
            onClick={() => setIsRailOpen(true)}
          >
            <MessageSquarePlus aria-hidden="true" className="size-4" />
            <span>Hội thoại</span>
          </Button>
        </div>

        {/* Main Workspace Frame */}
        <div className="flex min-h-0 min-w-0 flex-1 overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs dark:border-slate-800/90 dark:bg-slate-950">
          <aside className="hidden min-h-0 w-72 shrink-0 border-r border-slate-200/80 lg:flex lg:flex-col overflow-hidden xl:w-80 dark:border-slate-800/80">
            <ReportAssistantConversationList
              conversations={conversations.data?.data.conversations ?? []}
              selectedId={selectedId}
              isLoading={conversations.isLoading}
              isError={conversations.isError}
              onRetry={() => void conversations.refetch()}
              onSelect={(id) => {
                hasResolvedInitialSelection.current = true;
                setSelectedId(id);
              }}
              onNew={() => {
                clearTurnErrors();
                hasResolvedInitialSelection.current = true;
                setSelectedId(null);
                setDraft("");
              }}
            />
          </aside>

          <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
            <header className="flex h-13 shrink-0 items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/50 px-4 py-2.5 dark:border-slate-800 dark:bg-slate-900/30 sm:px-5">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {selectedTitle || "Cuộc hội thoại mới"}
                  </h2>
                  <span className="hidden items-center gap-1 rounded-md border border-emerald-500/20 bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700 sm:inline-flex dark:text-emerald-300">
                    <span className="size-1.5 rounded-full bg-emerald-500" />
                    Sẵn sàng
                  </span>
                </div>
                <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">
                  Phạm vi: Dữ liệu vận hành & quản trị hệ thống
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="hidden h-8.5 shrink-0 gap-1.5 border-slate-200 text-xs font-medium shadow-xs hover:bg-slate-100 sm:inline-flex dark:border-slate-800 dark:hover:bg-slate-850"
                onClick={() => {
                  clearTurnErrors();
                  hasResolvedInitialSelection.current = true;
                  setSelectedId(null);
                  setDraft("");
                }}
              >
                <Sparkles aria-hidden="true" className="size-3.5 text-primary" />
                <span>Hội thoại mới</span>
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

            <div className="shrink-0 border-t border-slate-100 bg-white p-2.5 dark:border-slate-800 dark:bg-slate-950 sm:p-3.5">
              {retryError ? (
                <div
                  className="mb-2.5 flex flex-col gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-xs sm:text-sm text-destructive sm:flex-row sm:items-center sm:justify-between"
                  role="alert"
                >
                  <div className="flex items-center gap-2">
                    <AlertCircle aria-hidden="true" className="size-4 shrink-0" />
                    <span>Không thể hoàn tất yêu cầu. Tin nhắn đã được giữ lại; bạn có thể thử lại.</span>
                  </div>
                  {retryAction ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 border-destructive/30 text-xs text-destructive hover:bg-destructive/10"
                      disabled={isPending}
                      onClick={() =>
                        retryAction.kind === "message"
                          ? void runMessage(retryAction.value)
                          : void runConfirm(retryAction.value)
                      }
                    >
                      Thử lại
                    </Button>
                  ) : null}
                </div>
              ) : null}

              {/* Accessible label for testing and screen readers */}
              <label
                htmlFor="report-assistant-composer"
                className="sr-only"
              >
                Tin nhắn của bạn
              </label>

              <div className="flex items-end gap-2">
                <Textarea
                  id="report-assistant-composer"
                  aria-label="Tin nhắn của bạn"
                  value={draft}
                  onChange={(event) => setDraft(event.target.value.slice(0, 4000))}
                  onKeyDown={handleComposerKeyDown}
                  placeholder="Mô tả báo cáo bạn cần (ví dụ: So sánh số lịch hẹn tháng này theo chuyên khoa)..."
                  maxLength={4000}
                  disabled={isPending}
                  className="min-h-[44px] max-h-32 resize-none text-xs sm:text-sm focus-visible:ring-primary py-2.5"
                  aria-describedby="report-assistant-composer-help"
                />
                <Button
                  type="button"
                  className="h-[44px] w-[44px] shrink-0 p-0 shadow-xs cursor-pointer"
                  onClick={handleSubmit}
                  disabled={isPending || !draft.trim()}
                  aria-label="Gửi tin nhắn"
                >
                  <Send aria-hidden="true" className="size-4" />
                </Button>
              </div>
              <div
                id="report-assistant-composer-help"
                className="mt-1 flex justify-between gap-2 text-[11px] text-slate-400 dark:text-slate-500"
              >
                <span>Enter để gửi · Shift+Enter để xuống dòng</span>
                <span>{draft.length}/4000</span>
              </div>
            </div>
          </main>
        </div>
      </div>

      <Sheet open={isRailOpen} onOpenChange={setIsRailOpen}>
        <SheetContent side="left" className="flex h-full min-h-0 w-[300px] sm:w-[340px] max-w-[85vw] flex-col overflow-hidden p-0">
          <div className="sr-only">
            <h2>Danh sách cuộc hội thoại</h2>
            <p>Chọn hoặc tạo mới cuộc hội thoại phân tích báo cáo</p>
          </div>
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
