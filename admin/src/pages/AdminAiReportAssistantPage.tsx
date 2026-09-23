import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  FileCheck,
  FileText,
  MessageSquarePlus,
  PanelRightClose,
  PanelRightOpen,
  Send,
} from "lucide-react";

import { AiReportLoadingOverlay } from "@/components/app/AiReportLoadingOverlay";
import { ReportAssistantChat } from "@/components/app/ReportAssistantChat";
import { ReportAssistantConversationList } from "@/components/app/ReportAssistantConversationList";
import { ReportAssistantPlanCard } from "@/components/app/ReportAssistantPlanCard";
import { ReportAssistantPreview } from "@/components/app/ReportAssistantPreview";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import {
  useConfirmReportAssistantPlan,
  useCreateReportAssistantConversation,
  useLoadOlderReportAssistantMessages,
  useReportAssistantConversation,
  useReportAssistantConversations,
  useSendReportAssistantMessage,
} from "@/hooks/useAdminReportAssistant";
import type { ReportAssistantMessage } from "@/types/interface/adminReport.interface";

type RetryAction =
  | { kind: "message"; value: string }
  | { kind: "confirm"; value: number }
  | null;

export function AdminAiReportAssistantPage() {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [draft, setDraft] = useState("");
  const [isRailOpen, setIsRailOpen] = useState(false);
  const [isArtifactPanelOpen, setIsArtifactPanelOpen] = useState(true);
  const [selectedArtifactMessageId, setSelectedArtifactMessageId] = useState<
    number | null
  >(null);
  const [mobileView, setMobileView] = useState<"chat" | "artifact">("chat");

  const [olderPagesByConversation, setOlderPagesByConversation] = useState<
    Record<
      number,
      Array<{
        messages: ReportAssistantMessage[];
        nextBeforeMessageId: number | null;
      }>
    >
  >({});
  const [retryAction, setRetryAction] = useState<RetryAction>(null);
  const hasResolvedInitialSelection = useRef(false);

  const conversations = useReportAssistantConversations();
  const conversation = useReportAssistantConversation(selectedId);
  const createMutation = useCreateReportAssistantConversation();
  const sendMutation = useSendReportAssistantMessage();
  const confirmMutation = useConfirmReportAssistantPlan();
  const loadOlderMutation = useLoadOlderReportAssistantMessages();

  const isPending =
    createMutation.isPending ||
    sendMutation.isPending ||
    confirmMutation.isPending;

  const clearTurnErrors = () => {
    createMutation.reset();
    sendMutation.reset();
    confirmMutation.reset();
    loadOlderMutation.reset();
    setRetryAction(null);
  };

  const currentPage = conversation.data?.data;
  const olderPages = useMemo(
    () =>
      selectedId === null ? [] : (olderPagesByConversation[selectedId] ?? []),
    [selectedId, olderPagesByConversation],
  );
  const messages = useMemo(
    () => [
      ...olderPages
        .slice()
        .reverse()
        .flatMap((page) => page.messages),
      ...(currentPage?.messages ?? []),
    ],
    [olderPages, currentPage?.messages],
  );

  // Active artifact resolution: defaults to the latest message with a plan or report
  const activeArtifactMessage = useMemo(() => {
    if (selectedArtifactMessageId !== null) {
      const found = messages.find(
        (m) => m.id === selectedArtifactMessageId && (m.plan || m.report),
      );
      if (found) return found;
    }
    // Default to the latest message with a plan or report
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].plan || messages[i].report) {
        return messages[i];
      }
    }
    return null;
  }, [messages, selectedArtifactMessageId]);

  const hasArtifact = Boolean(
    activeArtifactMessage &&
    (activeArtifactMessage.plan || activeArtifactMessage.report),
  );

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
      [conversationId]: [
        ...(pages[conversationId] ?? []),
        {
          messages: result.data.messages,
          nextBeforeMessageId: result.data.nextBeforeMessageId,
        },
      ],
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
      // Auto-open artifact panel when new plan/report arrives
      setIsArtifactPanelOpen(true);
      setMobileView("chat");
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
      setIsArtifactPanelOpen(true);
    } catch {
      // Keep the plan visible so the admin can retry after a transient failure.
    }
  };

  const handleSubmit = () => void runMessage(draft);
  const handleComposerKeyDown = (
    event: React.KeyboardEvent<HTMLTextAreaElement>,
  ) => {
    if (
      event.key === "Enter" &&
      !event.shiftKey &&
      !event.nativeEvent.isComposing
    ) {
      event.preventDefault();
      handleSubmit();
    }
  };

  const retryError =
    createMutation.error || sendMutation.error || confirmMutation.error;
  const selectedTitle = conversation.data?.data.conversation.title;

  return (
    <>
      <AiReportLoadingOverlay isLoading={isPending} />
      <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
        <h1 className="sr-only">Trợ lý báo cáo AI</h1>

        {/* Main Workspace Frame */}
        <div className="flex min-h-0 min-w-0 flex-1 overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs dark:border-slate-800/90 dark:bg-slate-950">
          {/* Left Aside: Conversation List (Desktop) */}
          <aside className="hidden min-h-0 w-64 shrink-0 border-r border-slate-200/80 lg:flex lg:flex-col overflow-hidden 2xl:w-72 dark:border-slate-800/80">
            <ReportAssistantConversationList
              conversations={conversations.data?.data.conversations ?? []}
              selectedId={selectedId}
              isLoading={conversations.isLoading}
              isError={conversations.isError}
              onRetry={() => void conversations.refetch()}
              onSelect={(id) => {
                hasResolvedInitialSelection.current = true;
                setSelectedId(id);
                setSelectedArtifactMessageId(null);
                setMobileView("chat");
              }}
              onNew={() => {
                clearTurnErrors();
                hasResolvedInitialSelection.current = true;
                setSelectedId(null);
                setSelectedArtifactMessageId(null);
                setDraft("");
                setMobileView("chat");
              }}
            />
          </aside>

          {/* Main Area & Artifact Split Frame */}
          <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
            {/* Switch between chat and artifact until the workspace is wide enough for both. */}
            {hasArtifact && (
              <div className="flex shrink-0 items-center justify-between border-b border-slate-200/80 bg-slate-50/70 p-1 2xl:hidden dark:border-slate-800 dark:bg-slate-900/50">
                <div
                  role="group"
                  aria-label="Chế độ hiển thị"
                  className="flex w-full items-center gap-1 rounded-xl bg-slate-200/70 p-0.5 dark:bg-slate-800/80"
                >
                  <button
                    type="button"
                    aria-pressed={mobileView === "chat"}
                    onClick={() => setMobileView("chat")}
                    className={`flex min-h-11 flex-1 items-center justify-center rounded-lg px-3 py-1.5 text-xs font-bold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 cursor-pointer ${
                      mobileView === "chat"
                        ? "bg-white text-slate-900 shadow-2xs dark:bg-slate-900 dark:text-slate-100"
                        : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
                    }`}
                  >
                    Trao đổi ({messages.length})
                  </button>
                  <button
                    type="button"
                    aria-pressed={mobileView === "artifact"}
                    onClick={() => setMobileView("artifact")}
                    className={`flex min-h-11 flex-1 items-center justify-center rounded-lg px-3 py-1.5 text-xs font-bold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 cursor-pointer ${
                      mobileView === "artifact"
                        ? "bg-white text-slate-900 shadow-2xs dark:bg-slate-900 dark:text-slate-100"
                        : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
                    }`}
                  >
                    {activeArtifactMessage?.report
                      ? "Báo cáo phân tích"
                      : "Kế hoạch đề xuất"}
                  </button>
                </div>
              </div>
            )}

            {/* Split Content Area */}
            <div className="flex min-h-0 min-w-0 flex-1 overflow-hidden">
              {/* Chat Column */}
              <main
                className={`min-h-0 min-w-0 flex-1 flex-col overflow-hidden ${
                  mobileView === "artifact" ? "hidden 2xl:flex" : "flex"
                }`}
              >
                {/* Chat Top Header */}
                <header className="flex h-13 shrink-0 items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/50 px-4 py-2.5 dark:border-slate-800 dark:bg-slate-900/30 sm:px-5">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h2 className="truncate text-sm font-bold text-slate-900 dark:text-slate-100">
                        {selectedTitle || "Cuộc hội thoại mới"}
                      </h2>
                      <span className="hidden shrink-0 items-center gap-1 whitespace-nowrap rounded-md border border-emerald-500/20 bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 sm:inline-flex dark:text-emerald-300">
                        <span className="size-1.5 rounded-full bg-emerald-500" />
                        Sẵn sàng
                      </span>
                    </div>
                    <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">
                      Phạm vi: Dữ liệu vận hành & quản trị hệ thống
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="min-h-11 min-w-11 shrink-0 lg:hidden"
                      aria-label="Mở danh sách hội thoại"
                      onClick={() => setIsRailOpen(true)}
                    >
                      <MessageSquarePlus
                        aria-hidden="true"
                        className="size-4"
                      />
                    </Button>

                    {/* On wide layouts, allow the artifact panel to be collapsed and reopened. */}
                    {hasArtifact && !isArtifactPanelOpen && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="hidden h-8.5 shrink-0 gap-1.5 border-emerald-500/30 text-xs font-semibold text-emerald-700 shadow-2xs hover:bg-emerald-50 2xl:inline-flex dark:border-emerald-500/40 dark:text-emerald-300 dark:hover:bg-slate-850 cursor-pointer"
                        onClick={() => setIsArtifactPanelOpen(true)}
                      >
                        <PanelRightOpen
                          aria-hidden="true"
                          className="size-3.5"
                        />
                        <span>Mở bảng kết quả</span>
                      </Button>
                    )}

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="hidden h-9 shrink-0 gap-1.5 whitespace-nowrap rounded-lg border-slate-200 px-3 text-xs font-semibold shadow-2xs transition-colors hover:border-primary/40 hover:bg-primary/5 sm:inline-flex dark:border-slate-800 dark:hover:bg-slate-850 cursor-pointer"
                      aria-label="Tạo hội thoại mới"
                      onClick={() => {
                        clearTurnErrors();
                        hasResolvedInitialSelection.current = true;
                        setSelectedId(null);
                        setSelectedArtifactMessageId(null);
                        setDraft("");
                        setMobileView("chat");
                      }}
                    >
                      <MessageSquarePlus
                        aria-hidden="true"
                        className="size-4 text-primary"
                      />
                      <span>Tạo mới</span>
                    </Button>
                  </div>
                </header>

                {/* Chat Messages Flow */}
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
                  onQuickPrompt={(prompt) => void runMessage(prompt)}
                  activeArtifactId={activeArtifactMessage?.id}
                  onViewArtifact={(messageId) => {
                    setSelectedArtifactMessageId(messageId);
                    setIsArtifactPanelOpen(true);
                    setMobileView("artifact");
                  }}
                  onConfirm={(messageId) => void runConfirm(messageId)}
                />

                {/* Composer area */}
                <div className="shrink-0 border-t border-slate-100 bg-white p-2 dark:border-slate-800 dark:bg-slate-950 sm:p-2.5">
                  {retryError ? (
                    <div
                      className="mb-2.5 flex flex-col gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-xs sm:text-sm text-destructive sm:flex-row sm:items-center sm:justify-between"
                      role="alert"
                    >
                      <div className="flex items-center gap-2">
                        <AlertCircle
                          aria-hidden="true"
                          className="size-4 shrink-0"
                        />
                        <span>
                          Không thể hoàn tất yêu cầu. Tin nhắn đã được giữ lại;
                          bạn có thể thử lại.
                        </span>
                      </div>
                      {retryAction ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8 border-destructive/30 text-xs text-destructive hover:bg-destructive/10 cursor-pointer"
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

                  {/* Accessible label */}
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
                      onChange={(event) =>
                        setDraft(event.target.value.slice(0, 4000))
                      }
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

              {/* Artifact Panel: Shown ONLY when hasArtifact is true */}
              {hasArtifact && (isArtifactPanelOpen || mobileView === "artifact") && (
                <aside
                  className={`min-h-0 border-l border-slate-200/90 bg-slate-50/50 flex-col overflow-hidden dark:border-slate-800 dark:bg-slate-925 ${
                    mobileView === "chat"
                      ? "hidden 2xl:flex 2xl:w-[30rem] 2xl:shrink-0"
                      : "flex flex-1 2xl:w-[30rem] 2xl:flex-none"
                  }`}
                  aria-label="Bảng kế hoạch và kết quả báo cáo"
                >
                  {/* Artifact Panel Header */}
                  <div className="flex h-13 shrink-0 items-center justify-between gap-3 border-b border-slate-200/80 bg-white px-4 py-2.5 dark:border-slate-800 dark:bg-slate-900 sm:px-5">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary dark:bg-primary/20">
                        {activeArtifactMessage?.plan ? (
                          <FileCheck className="size-4" aria-hidden="true" />
                        ) : (
                          <FileText className="size-4" aria-hidden="true" />
                        )}
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h3 className="truncate text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">
                            Bảng kế hoạch & báo cáo
                          </h3>
                          <span
                            className={`rounded px-1.5 py-0.2 text-[10px] font-bold ${
                              activeArtifactMessage?.plan
                                ? "bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300"
                                : "bg-primary/10 text-primary dark:bg-primary/20 dark:text-teal-300"
                            }`}
                          >
                            {activeArtifactMessage?.plan
                              ? "Kế hoạch đề xuất"
                              : "Báo cáo phân tích"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {/* Mobile view switch back to chat */}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 gap-1 text-xs 2xl:hidden cursor-pointer"
                        onClick={() => setMobileView("chat")}
                      >
                        <span>Quay lại chat</span>
                      </Button>

                      {/* Desktop collapse panel button */}
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="hidden size-8 text-slate-400 hover:text-slate-700 2xl:inline-flex dark:text-slate-500 dark:hover:text-slate-300 cursor-pointer"
                        onClick={() => setIsArtifactPanelOpen(false)}
                        title="Thu gọn bảng phân tích"
                        aria-label="Thu gọn bảng phân tích"
                      >
                        <PanelRightClose
                          className="size-4"
                          aria-hidden="true"
                        />
                      </Button>
                    </div>
                  </div>

                  {/* Artifact Content Container */}
                  <div className="scrollbar-soft min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
                    {activeArtifactMessage?.plan ? (
                      <ReportAssistantPlanCard
                        plan={activeArtifactMessage.plan}
                        messageId={activeArtifactMessage.id}
                        isPending={isPending}
                        onConfirm={(messageId) => void runConfirm(messageId)}
                      />
                    ) : activeArtifactMessage?.report ? (
                      <ReportAssistantPreview
                        report={activeArtifactMessage.report}
                      />
                    ) : null}
                  </div>
                </aside>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Drawer (Sheet) for Conversation List */}
      <Sheet open={isRailOpen} onOpenChange={setIsRailOpen}>
        <SheetContent
          side="left"
          className="flex h-full min-h-0 w-[300px] sm:w-[340px] max-w-[85vw] flex-col overflow-hidden p-0"
        >
          <div className="sr-only">
            <SheetTitle>Danh sách cuộc hội thoại</SheetTitle>
            <SheetDescription>
              Chọn hoặc tạo mới cuộc hội thoại phân tích báo cáo
            </SheetDescription>
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
              setSelectedArtifactMessageId(null);
              setIsRailOpen(false);
              setMobileView("chat");
            }}
            onNew={() => {
              clearTurnErrors();
              setSelectedId(null);
              setSelectedArtifactMessageId(null);
              setDraft("");
              setIsRailOpen(false);
              setMobileView("chat");
            }}
          />
        </SheetContent>
      </Sheet>
    </>
  );
}
