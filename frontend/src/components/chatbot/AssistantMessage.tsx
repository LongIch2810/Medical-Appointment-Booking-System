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
    <div className="flex flex-col gap-1.5 items-start animate-in fade-in-0 slide-in-from-bottom-2 duration-200">
      <div className="flex items-center gap-1.5">
        <MedAiMark imgClassName="w-4 h-4 rounded-md" checkClassName="w-2.5 h-2.5" />
        <span className="text-xs font-semibold text-primary">{t("chatbot.pageTitle")}</span>
      </div>

      {isTyping ? (
        <MedicalAILoading elapsed={elapsed ?? 0} />
      ) : isError && onRetry ? (
        <ChatError onRetry={onRetry} />
      ) : (
        <div className="max-w-[92%] text-slate-800 dark:text-[#F1F5F9] text-sm md:text-base leading-relaxed">
          <MarkdownMessage content={content} />
        </div>
      )}
    </div>
  );
}
