import { useTranslation } from "react-i18next";
import { AlertCircle } from "lucide-react";

interface ChatErrorProps {
  onRetry: () => void;
}

export default function ChatError({ onRetry }: ChatErrorProps) {
  const { t } = useTranslation();

  return (
    <div className="flex items-start gap-2.5 px-3.5 py-2.5 rounded-xl bg-rose-50/80 dark:bg-rose-950/25 text-rose-700 dark:text-rose-300 max-w-[80%]">
      <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
      <div className="min-w-0 space-y-1.5">
        <p className="text-sm leading-snug">{t("chatbot.requestFailed")}</p>
        <button
          type="button"
          onClick={onRetry}
          className="text-xs font-semibold underline underline-offset-2 hover:no-underline cursor-pointer"
        >
          {t("chatbot.retryBtn")}
        </button>
      </div>
    </div>
  );
}
