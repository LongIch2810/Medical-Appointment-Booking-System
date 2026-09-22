import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { Sparkles, User, HelpCircle, FileCheck, AlertCircle, ArrowUpRight } from "lucide-react";

import { ReportAssistantPlanCard } from "@/components/app/ReportAssistantPlanCard";
import { ReportAssistantPreview } from "@/components/app/ReportAssistantPreview";
import { Button } from "@/components/ui/button";
import type {
  ReportAssistantAction,
  ReportAssistantMessage,
} from "@/types/interface/adminReport.interface";

const QUICK_PROMPTS = [
  "So sánh số lịch hẹn theo chuyên khoa trong tháng này với tháng trước.",
  "Tỷ lệ hủy lịch có bất thường không? Hãy hỏi thêm nếu cần kỳ so sánh.",
  "Tôi có thể yêu cầu những loại báo cáo nào từ dữ liệu hiện có?",
];

function getActionMeta(action: ReportAssistantAction | null) {
  switch (action) {
    case "CLARIFY":
      return {
        label: "Cần làm rõ",
        icon: HelpCircle,
        className: "bg-amber-500/10 text-amber-700 border-amber-500/30 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/40",
      };
    case "ANSWER":
      return {
        label: "Hướng dẫn",
        icon: Sparkles,
        className: "bg-sky-500/10 text-sky-700 border-sky-500/30 dark:bg-sky-500/15 dark:text-sky-300 dark:border-sky-500/40",
      };
    case "PROPOSE_PLAN":
      return {
        label: "Kế hoạch báo cáo",
        icon: FileCheck,
        className: "bg-emerald-500/10 text-emerald-700 border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/40",
      };
    case "GENERATE_REPORT":
      return {
        label: "Báo cáo đã tạo",
        icon: FileCheck,
        className: "bg-primary/10 text-primary border-primary/30 dark:bg-primary/15 dark:text-teal-300 dark:border-primary/40",
      };
    case "REFUSE":
      return {
        label: "Ngoài phạm vi dữ liệu",
        icon: AlertCircle,
        className: "bg-rose-500/10 text-rose-700 border-rose-500/30 dark:bg-rose-500/15 dark:text-rose-300 dark:border-rose-500/40",
      };
    default:
      return null;
  }
}

function formatTime(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? ""
    : new Intl.DateTimeFormat("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        day: "2-digit",
        month: "2-digit",
      }).format(date);
}

function MessageItem({
  message,
  canConfirm,
  isPending,
  onConfirm,
}: {
  message: ReportAssistantMessage;
  isLatest: boolean;
  canConfirm: boolean;
  isPending: boolean;
  onConfirm: (messageId: number) => void;
}) {
  const isUser = message.role === "USER";
  const actionMeta = getActionMeta(message.action);
  const ActionIcon = actionMeta?.icon;

  return (
    <article
      aria-label={isUser ? "Tin nhắn của bạn" : actionMeta?.label || "Phản hồi trợ lý"}
      className={`min-w-0 max-w-full overflow-hidden rounded-2xl p-3.5 sm:p-4 outline-none focus-visible:ring-2 focus-visible:ring-primary ${
        isUser
          ? "ml-auto sm:max-w-[85%] border border-slate-200 bg-slate-100/90 text-slate-900 shadow-xs dark:border-slate-700/70 dark:bg-slate-800/90 dark:text-slate-100"
          : "mr-auto sm:max-w-[92%] border border-slate-200/90 bg-white text-slate-900 shadow-xs dark:border-slate-800/90 dark:bg-slate-900/90 dark:text-slate-100"
      }`}
    >
      <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div
            className={`flex size-6 items-center justify-center rounded-md text-xs font-semibold ${
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
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            {isUser ? "Bạn (Quản trị viên)" : "Trợ lý báo cáo AI"}
          </span>
          {actionMeta ? (
            <span
              className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[11px] font-medium leading-none ${actionMeta.className}`}
            >
              {ActionIcon ? <ActionIcon aria-hidden="true" className="size-3" /> : null}
              {actionMeta.label}
            </span>
          ) : null}
        </div>
        <time className="text-xs text-slate-400 dark:text-slate-500">
          {formatTime(message.createdAt)}
        </time>
      </div>

      <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-800 dark:text-slate-200">
        {message.content}
      </p>

      {!isUser && message.plan && canConfirm ? (
        <ReportAssistantPlanCard
          plan={message.plan}
          messageId={message.id}
          isPending={isPending}
          onConfirm={onConfirm}
        />
      ) : null}

      {!isUser && message.report ? (
        <ReportAssistantPreview report={message.report} />
      ) : null}
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
  onConfirm,
  onQuickPrompt,
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
  onConfirm: (messageId: number) => void;
  onQuickPrompt: (prompt: string) => void;
}) {
  const containerRef = useRef<HTMLElement>(null);
  const isNearBottomRef = useRef(true);
  const scrollOffsetFromBottomRef = useRef<number | null>(null);
  const prevFirstMessageIdRef = useRef<number | null>(messages[0]?.id ?? null);
  const prevLastMessageIdRef = useRef<number | null>(messages[messages.length - 1]?.id ?? null);
  const prevConversationIdRef = useRef<number | null>(conversationId);
  const isInitialLoadRef = useRef(true);

  const latestMessage = messages[messages.length - 1];
  const latestPlanId = useMemo(
    () =>
      latestMessage?.role === "ASSISTANT" &&
      latestMessage.action === "PROPOSE_PLAN" &&
      latestMessage.plan
        ? latestMessage.id
        : null,
    [latestMessage],
  );

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
      container.scrollTop = container.scrollHeight - scrollOffsetFromBottomRef.current!;
      scrollOffsetFromBottomRef.current = null;
    }

    prevFirstMessageIdRef.current = firstMessageId;
  }, [messages]);

  // When switching conversations or initial mount, scroll to bottom
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    if (conversationId !== prevConversationIdRef.current || isInitialLoadRef.current) {
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
        const behavior = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
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
      scrollOffsetFromBottomRef.current = container.scrollHeight - container.scrollTop;
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
      {olderCursor ? (
        <div className="flex justify-center pb-1 pt-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8.5 border-slate-200 bg-white text-xs font-medium text-slate-700 shadow-xs hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer"
            disabled={isLoadingOlder}
            onClick={handleLoadOlder}
          >
            {isLoadingOlder ? "Đang tải…" : "Tải tin nhắn cũ hơn"}
          </Button>
        </div>
      ) : null}

      {hasOlderError ? (
        <p className="text-center text-xs text-destructive" role="alert">
          Không tải được tin nhắn cũ hơn. Thử lại khi sẵn sàng.
        </p>
      ) : null}

      {isLoading && conversationId !== null ? (
        <div className="flex flex-col items-center justify-center py-12 text-center" role="status">
          <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="mt-3 text-sm text-slate-500">Đang tải hội thoại…</p>
        </div>
      ) : isError ? (
        <div
          className="mx-auto max-w-lg rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm"
          role="alert"
        >
          <div className="flex items-center gap-2 font-medium text-destructive">
            <AlertCircle aria-hidden="true" className="size-4" />
            <span>Không tải được hội thoại này.</span>
          </div>
          <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
            Dữ liệu có thể tạm thời không khả dụng hoặc phiên làm việc đã hết hạn.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-3 h-8.5 border-destructive/30 text-destructive hover:bg-destructive/10"
            onClick={onRetry}
          >
            Thử tải lại
          </Button>
        </div>
      ) : messages.length ? (
        messages.map((message, index) => (
          <MessageItem
            key={message.id}
            message={message}
            isLatest={index === messages.length - 1}
            canConfirm={message.id === latestPlanId}
            isPending={isPending}
            onConfirm={onConfirm}
          />
        ))
      ) : (
        <div className="mx-auto flex max-w-2xl flex-col items-center py-6 text-center sm:py-10">
          <div className="flex size-12 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary shadow-xs dark:border-primary/30 dark:bg-primary/20">
            <Sparkles aria-hidden="true" className="size-6" />
          </div>
          <h3 className="mt-3 text-base font-semibold text-slate-900 dark:text-slate-100 sm:text-lg">
            Bạn muốn tìm hiểu điều gì?
          </h3>
          <p className="mt-1.5 max-w-lg text-xs leading-relaxed text-slate-600 dark:text-slate-400 sm:text-sm">
            Trợ lý chỉ báo cáo trên các dữ liệu đang có. Nội dung chat không tạo báo cáo cho đến khi bạn xác nhận kế hoạch.
          </p>

          <div className="mt-6 grid w-full gap-2.5 text-left sm:grid-cols-2">
            {QUICK_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                type="button"
                disabled={isPending}
                onClick={() => onQuickPrompt(prompt)}
                className="group relative flex min-h-12 flex-col justify-between rounded-xl border border-slate-200 bg-white p-3.5 text-xs sm:text-sm leading-relaxed text-slate-700 shadow-xs transition-all hover:border-primary/60 hover:bg-slate-50 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-primary/50 dark:hover:bg-slate-800/80 cursor-pointer"
              >
                <span className="font-medium text-slate-800 dark:text-slate-200">{prompt}</span>
                <div className="mt-2 flex items-center justify-end text-[11px] font-semibold text-primary opacity-0 transition-opacity group-hover:opacity-100">
                  <span>Sử dụng gợi ý</span>
                  <ArrowUpRight aria-hidden="true" className="ml-1 size-3" />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
