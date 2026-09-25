import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  AlertCircle,
  CalendarCheck,
  Check,
  CheckCircle2,
  Copy,
  HelpCircle,
} from "lucide-react";
import MarkdownMessage from "@/components/message/MarkdownMessage";
import MedicalAILoading from "@/components/animation/MedicalAILoading";
import type { PatientChatAction } from "@/types/interface/patientChat.interface";
import ChatError from "./ChatError";
import MedAiMark from "./MedAiMark";

interface AssistantMessageProps {
  content: string;
  isTyping?: boolean;
  elapsed?: number;
  isError?: boolean;
  onRetry?: () => void;
  createdAt?: string;
  action?: PatientChatAction | null;
}

const messageTimeFormatter = new Intl.DateTimeFormat("vi-VN", {
  hour: "2-digit",
  minute: "2-digit",
});

function formatTime(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${messageTimeFormatter.format(date)} · ${day}/${month}`;
}

function getActionBadge(action?: PatientChatAction | null) {
  switch (action) {
    case "CLARIFY":
      return {
        label: "Cần thêm thông tin",
        icon: HelpCircle,
        className:
          "bg-amber-500/10 text-amber-700 border-amber-500/30 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/40",
      };
    case "BOOKING_APPROVAL":
      return {
        label: "Đề xuất lịch khám",
        icon: CalendarCheck,
        className:
          "bg-teal-500/10 text-teal-700 border-teal-500/30 dark:bg-teal-500/15 dark:text-teal-300 dark:border-teal-500/40",
      };
    case "BOOKING_CONFIRMED":
      return {
        label: "Đã xác nhận đặt lịch",
        icon: CheckCircle2,
        className:
          "bg-emerald-500/10 text-emerald-700 border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/40",
      };
    case "REFUSE":
      return {
        label: "Ngoài phạm vi hỗ trợ",
        icon: AlertCircle,
        className:
          "bg-rose-500/10 text-rose-700 border-rose-500/30 dark:bg-rose-500/15 dark:text-rose-300 dark:border-rose-500/40",
      };
    default:
      return null;
  }
}

export default function AssistantMessage({
  content,
  isTyping,
  elapsed,
  isError,
  onRetry,
  createdAt,
  action,
}: AssistantMessageProps) {
  const { t } = useTranslation();
  const [isCopied, setIsCopied] = useState(false);
  const actionBadge = getActionBadge(action);
  const timeString = formatTime(createdAt);

  const handleCopy = async () => {
    if (!content) return;
    try {
      await navigator.clipboard.writeText(content);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      // Ignore clipboard write failure
    }
  };

  return (
    <div className="flex flex-col items-start gap-1.5 w-full">
      <div className="flex items-center gap-2 pl-1 text-xs font-semibold text-primary">
        <MedAiMark imgClassName="size-4.5 rounded-md" checkClassName="size-2.5" />
        <span>{t("chatbot.pageTitle")}</span>
        <span className="text-[10px] font-normal text-muted-foreground">· Cố vấn y tế</span>
        {actionBadge && (
          <span
            className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${actionBadge.className}`}
          >
            <actionBadge.icon className="size-3" aria-hidden="true" />
            <span>{actionBadge.label}</span>
          </span>
        )}
      </div>

      {isTyping ? (
        <div className="w-full max-w-[95%] sm:max-w-[88%] rounded-2xl rounded-tl-xs border border-border/80 bg-card p-4 sm:p-5 shadow-2xs">
          <MedicalAILoading elapsed={elapsed ?? 0} />
        </div>
      ) : isError && onRetry ? (
        <ChatError onRetry={onRetry} />
      ) : (
        <div className="group relative max-w-[95%] sm:max-w-[88%] rounded-2xl rounded-tl-xs border border-border/70 bg-card p-4 sm:p-5 text-sm sm:text-[15px] leading-relaxed text-foreground shadow-2xs">
          <div className="prose prose-sm dark:prose-invert max-w-none break-words">
            <MarkdownMessage content={content} />
          </div>

          {/* Footer bar with timestamp and copy button */}
          <div className="mt-3 flex items-center justify-between border-t border-border/50 pt-2 text-[11px] text-muted-foreground">
            <span>{timeString}</span>
            <button
              type="button"
              onClick={() => void handleCopy()}
              className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
              title="Sao chép nội dung lời khuyên"
              aria-label="Sao chép nội dung lời khuyên"
            >
              {isCopied ? (
                <>
                  <Check className="size-3 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Đã chép</span>
                </>
              ) : (
                <>
                  <Copy className="size-3" />
                  <span>Sao chép</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

