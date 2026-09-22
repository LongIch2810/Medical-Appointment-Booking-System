import { useTranslation } from "react-i18next";
import MarkdownMessage from "@/components/message/MarkdownMessage";
import MedicalAILoading from "@/components/animation/MedicalAILoading";
import ChatError from "./ChatError";
import MedAiMark from "./MedAiMark";

interface AssistantMessageProps {
  content: string;
  isTyping?: boolean;
  elapsed?: number;
  isError?: boolean;
  onRetry?: () => void;
}

export default function AssistantMessage({
  content,
  isTyping,
  elapsed,
  isError,
  onRetry,
}: AssistantMessageProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-start gap-1.5">
      <div className="flex items-center gap-1.5 pl-1 text-xs font-semibold text-primary">
        <MedAiMark imgClassName="size-4 rounded-md" checkClassName="size-2.5" />
        <span>{t("chatbot.pageTitle")}</span>
        <span className="text-[10px] font-normal text-muted-foreground">· Cố vấn y tế</span>
      </div>

      {isTyping ? (
        <div className="rounded-2xl rounded-tl-xs border border-border/70 bg-card p-4 shadow-2xs">
          <MedicalAILoading elapsed={elapsed ?? 0} />
        </div>
      ) : isError && onRetry ? (
        <ChatError onRetry={onRetry} />
      ) : (
        <div className="max-w-[95%] sm:max-w-[88%] rounded-2xl rounded-tl-xs border border-border/70 bg-card p-4 sm:p-5 text-sm sm:text-[15px] leading-relaxed text-foreground shadow-2xs">
          <div className="prose prose-sm dark:prose-invert max-w-none break-words">
            <MarkdownMessage content={content} />
          </div>
        </div>
      )}
    </div>
  );
}

