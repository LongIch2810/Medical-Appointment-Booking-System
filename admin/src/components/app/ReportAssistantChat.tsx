import { useEffect, useMemo, useRef } from "react";
import { Sparkles } from "lucide-react";

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

function actionLabel(action: ReportAssistantAction | null) {
  switch (action) {
    case "CLARIFY": return "Cần làm rõ";
    case "ANSWER": return "Hướng dẫn";
    case "PROPOSE_PLAN": return "Kế hoạch báo cáo";
    case "GENERATE_REPORT": return "Báo cáo đã tạo";
    case "REFUSE": return "Ngoài phạm vi dữ liệu";
    default: return null;
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
  isLatest,
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
  const label = actionLabel(message.action);

  return (
    <article
      ref={!isUser && isLatest ? (node) => node?.focus() : undefined}
      tabIndex={!isUser && isLatest ? -1 : undefined}
      aria-label={isUser ? "Tin nhắn của bạn" : label || "Phản hồi trợ lý"}
      className={`max-w-full rounded-2xl p-4 outline-none focus-visible:ring-2 focus-visible:ring-primary sm:max-w-[88%] ${
        isUser
          ? "ml-auto border border-primary/20 bg-primary/5 text-slate-800 dark:bg-primary/10 dark:text-slate-100"
          : "mr-auto border border-slate-200 bg-white text-slate-800 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
      }`}
    >
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
          {isUser ? "Bạn" : "Trợ lý báo cáo AI"}{label ? ` · ${label}` : ""}
        </span>
        <time className="text-xs text-slate-400 dark:text-slate-500">{formatTime(message.createdAt)}</time>
      </div>
      <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
      {!isUser && message.plan && canConfirm ? (
        <ReportAssistantPlanCard
          plan={message.plan}
          messageId={message.id}
          isPending={isPending}
          onConfirm={onConfirm}
        />
      ) : null}
      {!isUser && message.report ? <ReportAssistantPreview report={message.report} /> : null}
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
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const latestMessage = messages[messages.length - 1];
  const latestPlanId = useMemo(() =>
    latestMessage?.role === "ASSISTANT" &&
    latestMessage.action === "PROPOSE_PLAN" &&
    latestMessage.plan
      ? latestMessage.id
      : null,
  [latestMessage]);

  useEffect(() => {
    const behavior = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
      ? "auto"
      : "smooth";
    transcriptEndRef.current?.scrollIntoView?.({ behavior, block: "end" });
  }, [conversationId, messages.length]);

  return (
    <section
      className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-5 sm:px-6"
      aria-label="Nội dung hội thoại"
      aria-live="polite"
    >
      {olderCursor ? (
        <div className="flex justify-center">
          <Button type="button" variant="outline" className="min-h-11" disabled={isLoadingOlder} onClick={onLoadOlder}>
            {isLoadingOlder ? "Đang tải…" : "Tải tin nhắn cũ hơn"}
          </Button>
        </div>
      ) : null}
      {hasOlderError ? <p className="text-center text-sm text-destructive" role="alert">Không tải được tin nhắn cũ hơn. Thử lại khi sẵn sàng.</p> : null}
      {isLoading && conversationId !== null ? (
        <p className="py-8 text-center text-sm text-slate-500" role="status">Đang tải hội thoại…</p>
      ) : isError ? (
        <div className="mx-auto max-w-lg rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm" role="alert">
          <p>Không tải được hội thoại này.</p>
          <Button type="button" variant="outline" className="mt-3 min-h-11" onClick={onRetry}>Thử tải lại</Button>
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
        <div className="mx-auto flex max-w-2xl flex-col items-center py-8 text-center sm:py-12">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Sparkles aria-hidden="true" className="size-6" />
          </span>
          <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-slate-100">Bạn muốn tìm hiểu điều gì?</h3>
          <p className="mt-2 max-w-lg text-sm leading-relaxed text-slate-600 dark:text-slate-400">
            Trợ lý chỉ báo cáo trên các dữ liệu đang có. Nội dung chat không tạo báo cáo cho đến khi bạn xác nhận kế hoạch.
          </p>
          <div className="mt-6 grid w-full gap-2 text-left sm:grid-cols-2">
            {QUICK_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                type="button"
                disabled={isPending}
                onClick={() => onQuickPrompt(prompt)}
                className="min-h-14 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-relaxed text-slate-700 transition-colors hover:border-primary/50 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      )}
      <div ref={transcriptEndRef} />
    </section>
  );
}
