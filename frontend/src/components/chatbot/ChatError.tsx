import { useTranslation } from "react-i18next";
import { AlertCircle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ChatErrorProps {
  onRetry: () => void;
}

export default function ChatError({ onRetry }: ChatErrorProps) {
  const { t } = useTranslation();

  return (
    <div
      role="alert"
      className="flex items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-3.5 text-destructive shadow-2xs dark:border-destructive/40 sm:max-w-md"
    >
      <AlertCircle className="mt-0.5 size-4.5 shrink-0" aria-hidden="true" />
      <div className="min-w-0 flex-1 space-y-2">
        <p className="text-xs sm:text-sm font-medium leading-relaxed">
          {t("chatbot.requestFailed")}
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onRetry}
          className="h-8 gap-1.5 rounded-lg border-destructive/40 text-xs font-semibold text-destructive hover:bg-destructive/10 cursor-pointer"
        >
          <RotateCcw className="size-3" aria-hidden="true" />
          <span>{t("chatbot.retryBtn")}</span>
        </Button>
      </div>
    </div>
  );
}

