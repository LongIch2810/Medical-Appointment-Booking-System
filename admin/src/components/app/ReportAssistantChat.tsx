import { useEffect, useLayoutEffect, useRef } from "react";
import {
  AlertCircle,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  CalendarRange,
  Database,
  FileCheck,
  FileText,
  HelpCircle,
  Info,
  ShieldCheck,
  Sparkles,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type {
  ReportAssistantAction,
  ReportAssistantMessage,
} from "@/types/interface/adminReport.interface";

const QUICK_PROMPTS = [
  "So sánh số lịch hẹn theo chuyên khoa trong tháng này với tháng trước.",
  "Tỷ lệ hủy lịch có bất thường không? Hãy hỏi thêm nếu cần kỳ so sánh.",
  "Phân tích khung giờ và ngày trong tuần có lượng đặt khám cao nhất.",
  "Tôi có thể yêu cầu những loại báo cáo nào từ dữ liệu hiện có?",
];

function getActionMeta(action: ReportAssistantAction | null) {
  switch (action) {
    case "CLARIFY":
      return {
        label: "Cần làm rõ yêu cầu",
        icon: HelpCircle,
        className:
          "bg-amber-500/10 text-amber-700 border-amber-500/30 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/40",
      };
    case "ANSWER":
      return {
        label: "Hướng dẫn & Trả lời",
        icon: Sparkles,
        className:
          "bg-sky-500/10 text-sky-700 border-sky-500/30 dark:bg-sky-500/15 dark:text-sky-300 dark:border-sky-500/40",
      };
    case "PROPOSE_PLAN":
      return {
        label: "Kế hoạch báo cáo",
        icon: FileCheck,
        className:
          "bg-emerald-500/10 text-emerald-700 border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/40",
      };
    case "GENERATE_REPORT":
      return {
        label: "Báo cáo hoàn tất",
        icon: FileText,
        className:
          "bg-primary/10 text-primary border-primary/30 dark:bg-primary/15 dark:text-teal-300 dark:border-primary/40",
      };
    case "REFUSE":
      return {
        label: "Ngoài phạm vi dữ liệu",
        icon: AlertCircle,
        className:
          "bg-rose-500/10 text-rose-700 border-rose-500/30 dark:bg-rose-500/15 dark:text-rose-300 dark:border-rose-500/40",
      };
    default:
      return null;
  }
}

const messageTimeFormatter = new Intl.DateTimeFormat("vi-VN", {
  hour: "2-digit",
  minute: "2-digit",
});

function formatTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${messageTimeFormatter.format(date)} · ${day}/${month}`;
}

function MessageItem({
  message,
  isActiveArtifact,
  onViewArtifact,
}: {
  message: ReportAssistantMessage;
  isActiveArtifact: boolean;
  onViewArtifact?: (messageId: number) => void;
}) {
  const isUser = message.role === "USER";
  const actionMeta = getActionMeta(message.action);
  const ActionIcon = actionMeta?.icon;

  return (
    <article
      aria-label={
        isUser ? "Tin nhắn của bạn" : actionMeta?.label || "Phản hồi trợ lý"
      }
      className={`min-w-0 max-w-full overflow-hidden rounded-2xl p-4 sm:p-5 outline-none focus-visible:ring-2 focus-visible:ring-primary ${
        isUser
          ? "ml-auto sm:max-w-[85%] border border-slate-200/90 bg-slate-100/95 text-slate-900 shadow-2xs dark:border-slate-700/80 dark:bg-slate-800/95 dark:text-slate-100"
          : "mr-auto sm:max-w-[92%] border border-slate-200/90 bg-white text-slate-900 shadow-2xs dark:border-slate-800/90 dark:bg-slate-900 dark:text-slate-100"
      }`}
    >
      {/* Sender Header */}
      <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div
            className={`flex size-6.5 items-center justify-center rounded-lg text-xs font-semibold ${
              isUser
                ? "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200"
                : "bg-primary/10 text-primary dark:bg-primary/20 dark:text-teal-300"
            }`}
          >
            {isUser ? (
              <User aria-hidden="true" className="size-3.5" />
            ) : (
              <Sparkles aria-hidden="true" className="size-3.5" />
            )}
          </div>
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
            {isUser ? "Bạn (Quản trị viên)" : "Trợ lý báo cáo AI"}
          </span>
          {actionMeta ? (
            <span
              className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-semibold leading-none ${actionMeta.className}`}
            >
              {ActionIcon ? (
                <ActionIcon aria-hidden="true" className="size-3 shrink-0" />
              ) : null}
              {actionMeta.label}
            </span>
          ) : null}
        </div>
        <time
          dateTime={message.createdAt}
          className="inline-flex shrink-0 items-center whitespace-nowrap rounded-md border border-slate-200/80 bg-slate-100/80 px-2 py-0.5 text-[11px] font-medium leading-4 tabular-nums text-slate-500 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-400"
        >
          {formatTime(message.createdAt)}
        </time>
      </div>

      {/* Message Content */}
      <p className="whitespace-pre-wrap break-words text-xs sm:text-sm leading-relaxed text-slate-800 dark:text-slate-200">
        {message.content}
      </p>

      {/* Out of scope / REFUSE Callout */}
      {!isUser && message.action === "REFUSE" && (
        <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50/60 p-3.5 text-xs text-rose-900 dark:border-rose-900/40 dark:bg-rose-950/20 dark:text-rose-200">
          <div className="flex items-center gap-2 font-semibold">
            <Info
              className="size-4 shrink-0 text-rose-600 dark:text-rose-400"
              aria-hidden="true"
            />
            <span>Phạm vi dữ liệu hỗ trợ</span>
          </div>
          <p className="mt-1 leading-relaxed text-rose-800 dark:text-rose-300">
            Hệ thống trợ lý AI chỉ truy vấn trên các nguồn dữ liệu vận hành
            phòng khám: Lịch hẹn khám bệnh, Chuyên khoa y tế, Bác sĩ, và Người
            dùng. Dữ liệu ngoài phạm vi (như tài chính chi tiết, kho dược ngoài
            hệ thống) hiện không được cung cấp.
          </p>
        </div>
      )}

      {/* Plan Anchor Card inside Chat */}
      {!isUser && message.plan && (
        <div
          className={`mt-3.5 flex flex-col gap-2.5 rounded-xl border p-3.5 transition-colors sm:flex-row sm:items-center sm:justify-between ${
            isActiveArtifact
              ? "border-emerald-500/50 bg-emerald-50/40 dark:border-emerald-500/50 dark:bg-emerald-950/30"
              : "border-slate-200/90 bg-slate-50/70 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-850/60"
          }`}
        >
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-300">
              <FileCheck
                className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400"
                aria-hidden="true"
              />
              <span className="truncate">Đề xuất: {message.plan.title}</span>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1">
                <CalendarRange
                  className="size-3 text-slate-400"
                  aria-hidden="true"
                />
                {message.plan.fromDate} – {message.plan.toDate}
              </span>
              <span>·</span>
              <span>{message.plan.metrics.length} chỉ số</span>
              {isActiveArtifact && (
                <span className="rounded-md bg-emerald-500/15 px-1.5 py-0.2 text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                  Đang chọn
                </span>
              )}
            </div>
          </div>

          {onViewArtifact && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 shrink-0 gap-1.5 border-emerald-500/30 bg-white text-xs font-semibold text-emerald-700 hover:bg-emerald-50 dark:border-emerald-500/40 dark:bg-slate-900 dark:text-emerald-300 dark:hover:bg-slate-800 cursor-pointer"
              onClick={() => onViewArtifact(message.id)}
            >
              <span>Xem chi tiết & duyệt</span>
              <ArrowUpRight className="size-3.5" aria-hidden="true" />
            </Button>
          )}
        </div>
      )}

      {/* Report Anchor Card inside Chat */}
      {!isUser && message.report && (
        <div
          className={`mt-3.5 flex flex-col gap-2.5 rounded-xl border p-3.5 transition-colors sm:flex-row sm:items-center sm:justify-between ${
            isActiveArtifact
              ? "border-primary/50 bg-primary/5 dark:border-primary/50 dark:bg-primary/10"
              : "border-slate-200/90 bg-slate-50/70 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-850/60"
          }`}
        >
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-slate-100">
              <BarChart3
                className="size-4 shrink-0 text-primary"
                aria-hidden="true"
              />
              <span className="truncate">
                Báo cáo:{" "}
                {message.report.report?.title || "Báo cáo phân tích quản trị"}
              </span>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-slate-500 dark:text-slate-400">
              <span>Kỳ: {message.report.rangeLabel}</span>
              <span>·</span>
              <span>{message.report.tableRows.length} dòng dữ liệu</span>
              {isActiveArtifact && (
                <span className="rounded-md bg-primary/15 px-1.5 py-0.2 text-[10px] font-bold text-primary dark:text-teal-300">
                  Đang chọn
                </span>
              )}
            </div>
          </div>

          {onViewArtifact && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 shrink-0 gap-1.5 border-primary/30 bg-white text-xs font-semibold text-primary hover:bg-primary/5 dark:border-primary/40 dark:bg-slate-900 dark:text-teal-300 dark:hover:bg-slate-800 cursor-pointer"
              onClick={() => onViewArtifact(message.id)}
            >
              <span>Xem báo cáo</span>
              <ArrowUpRight className="size-3.5" aria-hidden="true" />
            </Button>
          )}
        </div>
      )}
    </article>
  );
}

export function ReportAssistantChat({
  conversationId,
  messages,
  isLoading,
  isError,
  onRetry,
  olderCursor,
  isLoadingOlder,
  hasOlderError,
  onLoadOlder,
  isPending,
  onQuickPrompt,
  activeArtifactId,
  onViewArtifact,
}: {
  conversationId: number | null;
  messages: ReportAssistantMessage[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  olderCursor: number | null | undefined;
  isLoadingOlder: boolean;
  hasOlderError: boolean;
  onLoadOlder: () => void;
  isPending: boolean;
  onQuickPrompt: (prompt: string) => void;
  activeArtifactId?: number | null;
  onViewArtifact?: (messageId: number) => void;
  // Kept for backward compatibility with existing tests/parent callers
  onConfirm?: (messageId: number) => void;
}) {
  const containerRef = useRef<HTMLElement>(null);
  const isNearBottomRef = useRef(true);
  const scrollOffsetFromBottomRef = useRef<number | null>(null);
  const prevFirstMessageIdRef = useRef<number | null>(messages[0]?.id ?? null);
  const prevLastMessageIdRef = useRef<number | null>(
    messages[messages.length - 1]?.id ?? null,
  );
  const prevConversationIdRef = useRef<number | null>(conversationId);
  const isInitialLoadRef = useRef(true);

  // Measure scroll position to know if the user is reading near bottom
  const handleScroll = () => {
    const container = containerRef.current;
    if (!container) return;
    const threshold = 120;
    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;
    isNearBottomRef.current = distanceFromBottom <= threshold;
  };

  // Preserve scroll position when older messages are prepended
  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const firstMessageId = messages[0]?.id ?? null;
    const isPrepended =
      scrollOffsetFromBottomRef.current !== null &&
      firstMessageId !== prevFirstMessageIdRef.current;

    if (isPrepended) {
      container.scrollTop =
        container.scrollHeight - scrollOffsetFromBottomRef.current!;
      scrollOffsetFromBottomRef.current = null;
    }

    prevFirstMessageIdRef.current = firstMessageId;
  }, [messages]);

  // When switching conversations or initial mount, scroll to bottom
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    if (
      conversationId !== prevConversationIdRef.current ||
      isInitialLoadRef.current
    ) {
      prevConversationIdRef.current = conversationId;
      isInitialLoadRef.current = false;
      container.scrollTop = container.scrollHeight;
      isNearBottomRef.current = true;
    }
  }, [conversationId, messages.length]);

  // Handle new messages appended (user message or assistant reply)
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !messages.length) return;

    const lastMessage = messages[messages.length - 1];
    const lastMessageId = lastMessage?.id ?? null;

    if (lastMessageId !== prevLastMessageIdRef.current) {
      prevLastMessageIdRef.current = lastMessageId;

      // Always auto-scroll if user sent the message, or if user was already at bottom
      if (lastMessage.role === "USER" || isNearBottomRef.current) {
        const behavior = window.matchMedia?.("(prefers-reduced-motion: reduce)")
          .matches
          ? "auto"
          : "smooth";
        if (typeof container.scrollTo === "function") {
          container.scrollTo({ top: container.scrollHeight, behavior });
        } else {
          container.scrollTop = container.scrollHeight;
        }
        isNearBottomRef.current = true;
      }
    }
  }, [messages]);

  const handleLoadOlder = () => {
    const container = containerRef.current;
    if (container) {
      scrollOffsetFromBottomRef.current =
        container.scrollHeight - container.scrollTop;
    }
    onLoadOlder();
  };

  return (
    <section
      ref={containerRef}
      onScroll={handleScroll}
      className="scrollbar-soft min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6"
      aria-label="Nội dung hội thoại"
      aria-live="polite"
    >
      {/* Older Messages Pagination */}
      {olderCursor ? (
        <div className="flex justify-center pb-1 pt-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8.5 border-slate-200 bg-white text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer"
            disabled={isLoadingOlder}
            onClick={handleLoadOlder}
          >
            {isLoadingOlder ? "Đang tải tin nhắn cũ…" : "Tải tin nhắn cũ hơn"}
          </Button>
        </div>
      ) : null}

      {hasOlderError ? (
        <p className="text-center text-xs text-destructive" role="alert">
          Không tải được tin nhắn cũ hơn. Bạn có thể bấm thử lại khi sẵn sàng.
        </p>
      ) : null}

      {/* Loading state for conversation */}
      {isLoading && conversationId !== null ? (
        <div
          className="flex flex-col items-center justify-center py-16 text-center"
          role="status"
        >
          <div className="size-7 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="mt-3 text-xs font-semibold text-slate-500">
            Đang tải nội dung hội thoại…
          </p>
        </div>
      ) : isError ? (
        <div
          className="mx-auto max-w-lg rounded-2xl border border-destructive/30 bg-destructive/5 p-5 text-sm"
          role="alert"
        >
          <div className="flex items-center gap-2 font-bold text-destructive">
            <AlertCircle aria-hidden="true" className="size-4.5" />
            <span>Không tải được hội thoại này.</span>
          </div>
          <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-400">
            Dữ liệu có thể tạm thời không khả dụng hoặc phiên làm việc đã hết
            hạn.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-3 h-8.5 border-destructive/30 text-xs font-semibold text-destructive hover:bg-destructive/10 cursor-pointer"
            onClick={onRetry}
          >
            Thử tải lại
          </Button>
        </div>
      ) : messages.length ? (
        messages.map((message) => (
          <MessageItem
            key={message.id}
            message={message}
            isActiveArtifact={message.id === activeArtifactId}
            onViewArtifact={onViewArtifact}
          />
        ))
      ) : (
        /* State 1: Mới bắt đầu (Executive Analytics Welcome) */
        <div className="mx-auto flex max-w-2xl flex-col items-center py-6 text-center sm:py-8">
          <div className="flex size-13 items-center justify-center rounded-2xl border border-primary/25 bg-primary/10 text-primary shadow-xs dark:border-primary/30 dark:bg-primary/20">
            <Sparkles aria-hidden="true" className="size-6.5 text-primary" />
          </div>

          <h3 className="mt-3.5 text-lg font-bold text-slate-900 dark:text-slate-100 sm:text-xl">
            Không gian phân tích báo cáo quản trị
          </h3>

          <p className="mt-1.5 max-w-lg text-xs leading-relaxed text-slate-600 dark:text-slate-400 sm:text-sm">
            Trao đổi trực tiếp để làm rõ yêu cầu, kiểm tra kế hoạch truy vấn và
            trích xuất báo cáo vận hành y tế từ cơ sở dữ liệu thực tế.
          </p>

          {/* 3 Core Principles */}
          <div className="mt-5 grid w-full gap-2.5 sm:grid-cols-3 text-left">
            <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3 text-xs dark:border-slate-800 dark:bg-slate-900/60">
              <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-slate-100">
                <Database
                  className="size-3.5 text-primary"
                  aria-hidden="true"
                />
                <span>Dữ liệu thực tế</span>
              </div>
              <p className="mt-1 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                Chỉ truy vấn từ các bảng dữ liệu vận hành đã phân quyền, không
                bịa số liệu.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3 text-xs dark:border-slate-800 dark:bg-slate-900/60">
              <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-slate-100">
                <ShieldCheck
                  className="size-3.5 text-emerald-600 dark:text-emerald-400"
                  aria-hidden="true"
                />
                <span>Duyệt trước khi tạo</span>
              </div>
              <p className="mt-1 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                Luôn lập kế hoạch rõ ràng để bạn kiểm tra các chỉ số trước khi
                khởi tạo báo cáo.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3 text-xs dark:border-slate-800 dark:bg-slate-900/60">
              <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-slate-100">
                <BarChart3
                  className="size-3.5 text-sky-600 dark:text-sky-400"
                  aria-hidden="true"
                />
                <span>Trực quan & Xuất tệp</span>
              </div>
              <p className="mt-1 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                Hiển thị biểu đồ tương tác, bảng dữ liệu và hỗ trợ xuất file
                PDF, CSV nhanh chóng.
              </p>
            </div>
          </div>

          {/* Quick Prompts */}
          <div className="mt-6 w-full text-left">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Gợi ý câu hỏi phân tích thực tế
            </h4>
            <div className="mt-2.5 grid gap-2.5 sm:grid-cols-2">
              {QUICK_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  disabled={isPending}
                  onClick={() => onQuickPrompt(prompt)}
                  className="group relative flex min-h-13 flex-col justify-between rounded-xl border border-slate-200/90 bg-white p-3.5 text-left text-xs sm:text-sm text-slate-800 shadow-2xs transition-all hover:border-primary/60 hover:bg-slate-50 hover:shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-primary/50 dark:hover:bg-slate-800/80 cursor-pointer"
                >
                  <span className="font-medium leading-snug">{prompt}</span>
                  <div className="mt-2 flex items-center justify-end text-[11px] font-semibold text-primary opacity-70 group-hover:opacity-100 transition-opacity">
                    <span>Sử dụng câu hỏi này</span>
                    <ArrowRight aria-hidden="true" className="ml-1 size-3" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
