import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Eraser,
  FileCheck,
  FileText,
  Lightbulb,
  MessageSquare,
  MessageSquarePlus,
  PanelLeftOpen,
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
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

function getApiErrorCode(error: unknown): string | undefined {
  if (!error || typeof error !== "object") return undefined;

  const response = (error as { response?: { data?: unknown } }).response;
  const data = response?.data;
  if (!data || typeof data !== "object") return undefined;

  const payload = data as {
    code?: unknown;
    error?: { code?: unknown };
  };
  if (typeof payload.error?.code === "string") return payload.error.code;
  return typeof payload.code === "string" ? payload.code : undefined;
}

const PROMPT_TEMPLATE_GROUPS = [
  {
    category: "Lịch hẹn & So sánh kỳ",
    items: [
      {
        title: "So sánh lịch hẹn tháng này vs tháng trước",
        description: "Đối chiếu số lượng ca khám theo chuyên khoa giữa 2 kỳ liên tiếp",
        prompt: "So sánh số lượng lịch hẹn theo từng chuyên khoa trong tháng này với tháng trước.",
      },
      {
        title: "Tổng quan trạng thái lịch hẹn 30 ngày",
        description: "Thống kê ca khám hoàn tất, đang chờ, đã hủy và bệnh nhân vắng mặt",
        prompt: "Thống kê tổng số lịch hẹn đã hoàn tất, đang chờ khám và bị hủy trong 30 ngày qua.",
      },
    ],
  },
  {
    category: "Chất lượng dịch vụ & Tỷ lệ hủy",
    items: [
      {
        title: "Đánh giá tỷ lệ hủy lịch theo chuyên khoa",
        description: "Tìm chuyên khoa có rủi ro hủy khám hoặc bệnh nhân không đến cao nhất",
        prompt: "Thống kê tỷ lệ hủy lịch và bệnh nhân vắng mặt theo từng chuyên khoa trong tháng này, kèm đánh giá xu hướng.",
      },
      {
        title: "So sánh công suất vs tỷ lệ hoàn tất",
        description: "Chuyên khoa có lượt đặt cao nhưng tỷ lệ hoàn tất thấp",
        prompt: "Chuyên khoa nào có số lượt đặt khám cao nhất nhưng tỷ lệ hoàn tất thấp nhất trong 3 tháng qua?",
      },
    ],
  },
  {
    category: "Vận hành & Giờ cao điểm",
    items: [
      {
        title: "Khung giờ và ngày cao điểm",
        description: "Phân tích lưu lượng bệnh nhân theo giờ và thứ trong tuần để bố trí trực",
        prompt: "Phân tích khung giờ và ngày trong tuần có lượng đặt khám cao nhất để đề xuất phương án bố trí bác sĩ trực.",
      },
      {
        title: "Lưu lượng sáng vs chiều",
        description: "Đánh giá số lượng lịch hẹn phân bổ theo các buổi trong tuần",
        prompt: "Đánh giá và so sánh số lượng lịch hẹn trung bình giữa các ca khám buổi sáng và buổi chiều trong tuần.",
      },
    ],
  },
  {
    category: "Hiệu suất nhân sự & Bác sĩ",
    items: [
      {
        title: "Báo cáo ca khám hoàn tất theo bác sĩ",
        description: "Thống kê năng suất khám của các bác sĩ theo từng chuyên khoa",
        prompt: "Báo cáo tổng số lượt khám hoàn tất của từng bác sĩ theo chuyên khoa trong tháng hiện tại.",
      },
      {
        title: "Khám phá danh mục báo cáo khả dụng",
        description: "Xem các chỉ số và view dữ liệu AI có thể truy vấn",
        prompt: "Tôi có thể yêu cầu những loại báo cáo nào từ dữ liệu hiện có trong hệ thống?",
      },
    ],
  },
];

export function AdminAiReportAssistantPage() {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [draft, setDraft] = useState("");
  const [isRailOpen, setIsRailOpen] = useState(false);
  const [isArtifactPanelOpen, setIsArtifactPanelOpen] = useState(true);
  const [isHistorySidebarOpen, setIsHistorySidebarOpen] = useState(true);
  const [selectedArtifactMessageId, setSelectedArtifactMessageId] = useState<
    number | null
  >(null);
  const [mobileView, setMobileView] = useState<"chat" | "artifact">("chat");
  const [isPromptTemplatesOpen, setIsPromptTemplatesOpen] = useState(false);
  const [showTips, setShowTips] = useState(false);
  const composerRef = useRef<HTMLTextAreaElement>(null);

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
  const lastAutoCollapsedArtifactId = useRef<number | null>(null);

  const conversations = useReportAssistantConversations();
  const conversationsList = useMemo(() => {
    if (!conversations.data) return [];
    if ("pages" in (conversations.data as object) && Array.isArray((conversations.data as any).pages)) {
      return (conversations.data as any).pages.flatMap(
        (page: any) => page?.data?.conversations ?? [],
      );
    }
    return (conversations.data as any)?.data?.conversations ?? [];
  }, [conversations.data]);
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

  // On standard desktop screens (< 1536px), when an artifact is active,
  // prioritize Chat + Artifact by default so the chat column is not squeezed.
  useEffect(() => {
    if (
      hasArtifact &&
      activeArtifactMessage &&
      activeArtifactMessage.id !== lastAutoCollapsedArtifactId.current &&
      typeof window !== "undefined" &&
      window.innerWidth < 1536
    ) {
      lastAutoCollapsedArtifactId.current = activeArtifactMessage.id;
      setIsHistorySidebarOpen(false);
    }
  }, [hasArtifact, activeArtifactMessage]);

  useEffect(() => {
    if (selectedId !== null) {
      hasResolvedInitialSelection.current = true;
      return;
    }
    if (hasResolvedInitialSelection.current) return;
    const firstConversationId = conversationsList[0]?.id;
    if (firstConversationId !== undefined) {
      hasResolvedInitialSelection.current = true;
      setSelectedId(firstConversationId);
    }
  }, [conversationsList, selectedId]);

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

  const handleClearDraft = () => {
    setDraft("");
    composerRef.current?.focus();
  };

  const handleSelectTemplate = (templatePrompt: string) => {
    setDraft(templatePrompt);
    setIsPromptTemplatesOpen(false);
    if (mobileView === "artifact") {
      setMobileView("chat");
    }
    composerRef.current?.focus();
  };

  const handleFillPrompt = (text: string) => {
    setDraft(text);
    if (mobileView === "artifact") {
      setMobileView("chat");
    }
    composerRef.current?.focus();
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
  const isRateLimited = getApiErrorCode(retryError) === "CHATBOT_RATE_LIMITED";
  const selectedTitle = conversation.data?.data.conversation.title;

  return (
    <>
      <AiReportLoadingOverlay isLoading={isPending} />
      <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
        <h1 className="sr-only">Trợ lý báo cáo AI</h1>

        {/* Main Workspace Frame */}
        <div className="flex min-h-0 min-w-0 flex-1 overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs dark:border-slate-800/90 dark:bg-slate-950">
          {/* Left Aside: Conversation List (Desktop ≥ 1024px) */}
          {isHistorySidebarOpen && (
            <aside className="hidden min-h-0 w-64 shrink-0 border-r border-slate-200/80 lg:flex lg:flex-col overflow-hidden dark:border-slate-800/80">
              <ReportAssistantConversationList
                conversations={conversationsList}
                selectedId={selectedId}
                isLoading={conversations.isLoading}
                isError={conversations.isError}
                hasNextPage={conversations.hasNextPage}
                isFetchingNextPage={conversations.isFetchingNextPage}
                onLoadMore={() => void conversations.fetchNextPage()}
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
                  setIsHistorySidebarOpen(true);
                }}
                onCollapse={() => setIsHistorySidebarOpen(false)}
              />
            </aside>
          )}

          {/* Main Area & Artifact Split Frame */}
          <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
            {/* Switch between chat and artifact until the workspace is wide enough for both (screens < 1280px). */}
            {hasArtifact && (
              <div className="flex shrink-0 items-center justify-between border-b border-slate-200/80 bg-slate-50/70 p-1.5 xl:hidden dark:border-slate-800 dark:bg-slate-900/50">
                <div
                  role="group"
                  aria-label="Chế độ hiển thị"
                  className="flex w-full items-center gap-1 rounded-xl bg-slate-200/70 p-0.5 dark:bg-slate-800/80"
                >
                  <button
                    type="button"
                    aria-pressed={mobileView === "chat"}
                    onClick={() => setMobileView("chat")}
                    className={`flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 cursor-pointer ${
                      mobileView === "chat"
                        ? "bg-white text-slate-900 shadow-2xs dark:bg-slate-900 dark:text-slate-100"
                        : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
                    }`}
                  >
                    <MessageSquare className="size-3.5" aria-hidden="true" />
                    <span>Trao đổi ({messages.length})</span>
                  </button>
                  <button
                    type="button"
                    aria-pressed={mobileView === "artifact"}
                    onClick={() => setMobileView("artifact")}
                    className={`flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 cursor-pointer ${
                      mobileView === "artifact"
                        ? "bg-white text-slate-900 shadow-2xs dark:bg-slate-900 dark:text-slate-100"
                        : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
                    }`}
                  >
                    {activeArtifactMessage?.report ? (
                      <BarChart3 className="size-3.5 text-primary" aria-hidden="true" />
                    ) : (
                      <FileCheck className="size-3.5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                    )}
                    <span>
                      {activeArtifactMessage?.report
                        ? "Báo cáo phân tích"
                        : "Kế hoạch đề xuất"}
                    </span>
                  </button>
                </div>
              </div>
            )}

            {/* Split Content Area */}
            <div className="flex min-h-0 min-w-0 flex-1 overflow-hidden">
              {/* Chat Column */}
              <main
                className={`min-h-0 min-w-0 flex-1 flex-col overflow-hidden lg:min-w-[400px] ${
                  mobileView === "artifact" ? "hidden xl:flex" : "flex"
                }`}
              >
                {/* Chat Top Header */}
                <header className="flex h-13 shrink-0 items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/50 px-4 py-2.5 dark:border-slate-800 dark:bg-slate-900/30 sm:px-5">
                  <div className="flex items-center gap-2.5 min-w-0">
                    {!isHistorySidebarOpen && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="hidden h-8.5 shrink-0 gap-1.5 rounded-lg border-slate-200 px-2.5 text-xs font-semibold shadow-2xs hover:border-primary/40 hover:bg-primary/5 hover:text-primary lg:inline-flex dark:border-slate-800 dark:hover:bg-slate-800 cursor-pointer"
                        onClick={() => {
                          setIsHistorySidebarOpen(true);
                          if (typeof window !== "undefined" && window.innerWidth < 1536) {
                            setIsArtifactPanelOpen(false);
                            setMobileView("chat");
                          }
                        }}
                        title="Mở rộng danh sách hội thoại"
                        aria-label="Mở rộng danh sách hội thoại"
                      >
                        <PanelLeftOpen aria-hidden="true" className="size-4 text-primary" />
                        <span>Hội thoại</span>
                      </Button>
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h2 className="truncate text-sm font-bold text-slate-900 dark:text-slate-100">
                          {selectedTitle || "Cuộc hội thoại mới"}
                        </h2>
                        {isPending ? (
                          <span className="hidden shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-700 sm:inline-flex dark:text-amber-300">
                            <span className="size-1.5 rounded-full bg-amber-500 animate-pulse" />
                            Đang xử lý…
                          </span>
                        ) : (
                          <span className="hidden shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 sm:inline-flex dark:text-emerald-300">
                            <span className="size-1.5 rounded-full bg-emerald-500" />
                            Sẵn sàng
                          </span>
                        )}
                      </div>
                      <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">
                        Phạm vi: Lịch hẹn, Chuyên khoa, Bác sĩ, Người dùng (CSDL thực tế)
                      </p>
                    </div>
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

                    {/* On wide layouts (≥ 1024px), allow the artifact panel to be collapsed and reopened with context badge. */}
                    {hasArtifact && !isArtifactPanelOpen && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="hidden h-8.5 shrink-0 gap-1.5 rounded-lg border-primary/30 bg-primary/5 px-2.5 text-xs font-semibold text-primary shadow-2xs hover:border-primary/50 hover:bg-primary/10 lg:inline-flex dark:border-primary/40 dark:bg-primary/15 dark:text-teal-300 cursor-pointer"
                        onClick={() => {
                          setIsArtifactPanelOpen(true);
                          setMobileView("artifact");
                          if (typeof window !== "undefined" && window.innerWidth < 1536) {
                            setIsHistorySidebarOpen(false);
                          }
                        }}
                        title="Mở lại bảng phân tích & kế hoạch"
                        aria-label="Mở bảng kết quả"
                      >
                        {activeArtifactMessage?.report ? (
                          <BarChart3 className="size-3.5 text-primary" aria-hidden="true" />
                        ) : (
                          <FileCheck className="size-3.5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                        )}
                        <span>
                          {activeArtifactMessage?.report ? "Xem lại báo cáo" : "Xem lại kế hoạch"}
                        </span>
                        <PanelRightOpen
                          aria-hidden="true"
                          className="size-3.5 opacity-70"
                        />
                      </Button>
                    )}

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="hidden h-9 shrink-0 gap-1.5 whitespace-nowrap rounded-lg border-slate-200 px-3 text-xs font-semibold shadow-2xs transition-colors hover:border-primary/40 hover:bg-primary/5 sm:inline-flex dark:border-slate-800 dark:hover:bg-slate-800 cursor-pointer"
                      aria-label="Tạo hội thoại mới"
                      onClick={() => {
                        clearTurnErrors();
                        hasResolvedInitialSelection.current = true;
                        setSelectedId(null);
                        setSelectedArtifactMessageId(null);
                        setDraft("");
                        setMobileView("chat");
                        setIsHistorySidebarOpen(true);
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
                  onFillPrompt={handleFillPrompt}
                  activeArtifactId={activeArtifactMessage?.id}
                  onViewArtifact={(messageId) => {
                    setSelectedArtifactMessageId(messageId);
                    setIsArtifactPanelOpen(true);
                    setMobileView("artifact");
                    if (typeof window !== "undefined" && window.innerWidth < 1536) {
                      setIsHistorySidebarOpen(false);
                    }
                  }}
                  onConfirm={(messageId) => void runConfirm(messageId)}
                />

                {/* Composer area */}
                <div className="shrink-0 border-t border-slate-100 bg-white p-2.5 dark:border-slate-800 dark:bg-slate-950 sm:p-3">
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
                          {isRateLimited
                            ? "Đã đạt giới hạn tạo báo cáo trong giờ hiện tại. Vui lòng thử lại sau."
                            : "Không thể hoàn tất yêu cầu. Tin nhắn đã được giữ lại; bạn có thể thử lại."}
                        </span>
                      </div>
                      {retryAction && !isRateLimited ? (
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

                  {/* Expandable Prompt Writing Tips Banner */}
                  {showTips && (
                    <div className="mb-2.5 rounded-xl border border-emerald-500/30 bg-emerald-50/50 p-3 text-xs text-slate-700 dark:border-emerald-500/30 dark:bg-emerald-950/20 dark:text-slate-300 animate-in fade-in duration-200">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2">
                          <Lightbulb className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" aria-hidden="true" />
                          <div className="space-y-1">
                            <p className="font-semibold text-slate-900 dark:text-slate-100">
                              Công thức viết prompt chuẩn cho AI Report:
                            </p>
                            <p className="font-mono text-[11px] text-emerald-700 dark:text-emerald-300 bg-emerald-100/60 dark:bg-emerald-900/40 px-2 py-0.5 rounded inline-block">
                              [Khoảng thời gian] + [Chỉ số cần đo] + [Tiêu chí phân nhóm / so sánh]
                            </p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                              Ví dụ: <em>&ldquo;So sánh số lịch hẹn (chỉ số) theo chuyên khoa (phân nhóm) trong tháng này với tháng trước (thời gian)&rdquo;</em>.
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowTips(false)}
                          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 cursor-pointer"
                          aria-label="Đóng mẹo viết prompt"
                        >
                          <span className="sr-only">Đóng</span>
                          ×
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Composer Tools Bar: Templates, Tips, and Clear Button */}
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setIsPromptTemplatesOpen(true)}
                        className="h-7.5 gap-1.5 rounded-lg border-primary/30 bg-primary/5 px-2.5 text-[11px] font-semibold text-primary hover:bg-primary/10 dark:border-primary/40 dark:bg-primary/15 dark:text-teal-300 cursor-pointer shadow-2xs"
                      >
                        <FileText className="size-3" aria-hidden="true" />
                        <span>Mẫu prompt</span>
                      </Button>

                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowTips((prev) => !prev)}
                        className={`h-7.5 gap-1 rounded-lg px-2 text-[11px] font-medium transition-colors cursor-pointer ${
                          showTips
                            ? "bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300"
                            : "text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                        }`}
                      >
                        <Lightbulb className="size-3" aria-hidden="true" />
                        <span>Mẹo viết</span>
                      </Button>
                    </div>

                    {draft.trim().length > 0 && (
                      <button
                        type="button"
                        onClick={handleClearDraft}
                        className="flex items-center gap-1 text-[11px] font-medium text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer transition-colors"
                        title="Xóa nội dung đang soạn thảo"
                      >
                        <Eraser className="size-3" aria-hidden="true" />
                        <span>Xóa</span>
                      </button>
                    )}
                  </div>

                  {/* Accessible label */}
                  <label
                    htmlFor="report-assistant-composer"
                    className="sr-only"
                  >
                    Tin nhắn của bạn
                  </label>

                  <div className="flex items-end gap-2">
                    <Textarea
                      ref={composerRef}
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
                      className="min-h-[44px] max-h-32 resize-none text-xs sm:text-sm focus-visible:ring-primary py-2.5 rounded-xl border-slate-200 dark:border-slate-800 shadow-2xs"
                      aria-describedby="report-assistant-composer-help"
                    />
                    <Button
                      type="button"
                      className="h-[44px] w-[44px] shrink-0 p-0 shadow-xs cursor-pointer rounded-xl bg-primary text-white hover:bg-primary/90 disabled:opacity-50"
                      onClick={handleSubmit}
                      disabled={isPending || !draft.trim()}
                      aria-label="Gửi tin nhắn"
                    >
                      <Send aria-hidden="true" className="size-4" />
                    </Button>
                  </div>
                  <div
                    id="report-assistant-composer-help"
                    className="mt-1.5 flex justify-between gap-2 text-[11px] text-slate-400 dark:text-slate-500"
                  >
                    <span>Enter để gửi · Shift+Enter để xuống dòng</span>
                    <span className="tabular-nums">{draft.length}/4000</span>
                  </div>
                </div>
              </main>

              {/* Artifact Panel: Shown ONLY when hasArtifact is true AND isArtifactPanelOpen is true */}
              {hasArtifact && isArtifactPanelOpen && (
                <aside
                  className={`min-h-0 border-l border-slate-200/90 bg-slate-50/60 flex-col overflow-hidden dark:border-slate-800 dark:bg-slate-950 ${
                    mobileView === "artifact"
                      ? "flex flex-1 xl:w-1/2 xl:max-w-[620px] 2xl:w-[32rem] xl:flex-none"
                      : "hidden xl:flex xl:w-1/2 xl:max-w-[620px] 2xl:w-[32rem] xl:shrink"
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
                      {/* Mobile / Tablet view switch back to chat */}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 gap-1 text-xs xl:hidden cursor-pointer"
                        onClick={() => setMobileView("chat")}
                      >
                        <ArrowLeft className="size-3.5" aria-hidden="true" />
                        <span>Quay lại chat</span>
                      </Button>

                      {/* Desktop collapse panel button (≥ 1280px) */}
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="hidden size-8 text-slate-400 hover:text-slate-700 xl:inline-flex dark:text-slate-500 dark:hover:text-slate-300 cursor-pointer"
                        onClick={() => {
                          setIsArtifactPanelOpen(false);
                          setMobileView("chat");
                        }}
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
                        key={activeArtifactMessage.report.id}
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
            conversations={conversationsList}
            selectedId={selectedId}
            isLoading={conversations.isLoading}
            isError={conversations.isError}
            hasNextPage={conversations.hasNextPage}
            isFetchingNextPage={conversations.isFetchingNextPage}
            onLoadMore={() => void conversations.fetchNextPage()}
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

      {/* Prompt Templates Library Dialog */}
      <Dialog
        open={isPromptTemplatesOpen}
        onOpenChange={setIsPromptTemplatesOpen}
      >
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col gap-0 rounded-2xl p-0 overflow-hidden">
          <DialogHeader className="gap-0 border-b border-slate-100 px-6 py-5 pr-14 dark:border-slate-800 sm:px-7">
            <div className="flex items-start gap-3.5">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary dark:bg-primary/20">
                <FileText className="size-5" aria-hidden="true" />
              </span>
              <div className="min-w-0 pt-0.5">
                <div className="flex items-center gap-2">
                  <DialogTitle className="text-lg font-bold text-slate-900 dark:text-slate-100">
                    Thư viện mẫu câu hỏi phân tích
                  </DialogTitle>
                  <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary dark:text-teal-300">
                    Chuẩn CSDL
                  </span>
                </div>
                <DialogDescription className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Chọn câu hỏi mẫu bên dưới để nạp vào khung soạn thảo và chỉnh sửa theo nhu cầu.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-6 sm:p-7 space-y-6">
            {PROMPT_TEMPLATE_GROUPS.map((group) => (
              <div key={group.category} className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                  <span className="size-1.5 rounded-full bg-primary" />
                  {group.category}
                </h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  {group.items.map((item) => (
                    <div
                      key={item.title}
                      className="group flex flex-col justify-between rounded-xl border border-slate-200/90 bg-white p-3.5 shadow-2xs transition-all hover:border-primary/50 hover:shadow-xs dark:border-slate-800 dark:bg-slate-900"
                    >
                      <div>
                        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100">
                          {item.title}
                        </h4>
                        <p className="mt-1 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                          {item.description}
                        </p>
                        <div className="mt-2.5 rounded-lg bg-slate-50 p-2 text-xs font-medium text-slate-700 italic dark:bg-slate-800/80 dark:text-slate-300">
                          &ldquo;{item.prompt}&rdquo;
                        </div>
                      </div>
                      <div className="mt-3 flex items-center justify-end border-t border-slate-100 pt-2.5 dark:border-slate-800">
                        <Button
                          type="button"
                          size="sm"
                          className="h-8 gap-1.5 rounded-lg bg-primary/10 text-xs font-semibold text-primary hover:bg-primary hover:text-white dark:bg-primary/20 dark:text-teal-300 dark:hover:bg-primary dark:hover:text-white cursor-pointer transition-colors"
                          onClick={() => handleSelectTemplate(item.prompt)}
                        >
                          <span>Dùng mẫu này</span>
                          <ArrowRight className="size-3" aria-hidden="true" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/50 px-6 py-3.5 dark:border-slate-800 dark:bg-slate-900/50 sm:px-7">
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              Có thể chỉnh sửa kỳ thời gian và chuyên khoa sau khi nạp mẫu
            </span>
            <DialogClose asChild>
              <Button type="button" variant="outline" size="sm" className="h-8.5 rounded-lg cursor-pointer">
                Đóng
              </Button>
            </DialogClose>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
