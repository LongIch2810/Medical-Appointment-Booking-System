import { useTranslation } from "react-i18next";
import MedAiMark from "./MedAiMark";

export default function ChatHeader() {
  const { t } = useTranslation();

  return (
    <div className="flex shrink-0 items-center justify-between gap-3 px-1 py-2 sm:py-3">
      <div className="flex min-w-0 items-center gap-3">
        <div className="relative">
          <MedAiMark imgClassName="size-9 sm:size-10 rounded-xl" checkClassName="size-3 sm:size-3.5" />
          <span
            className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-background bg-emerald-500"
            title={t("chatbot.onlineBadge")}
            aria-label={t("chatbot.onlineBadge")}
          />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="font-heading text-base font-bold tracking-tight text-foreground sm:text-lg">
              {t("chatbot.pageTitle")}
            </h1>
            <span className="hidden items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 sm:inline-flex">
              {t("chatbot.onlineBadge")}
            </span>
          </div>
          <p className="truncate text-xs text-muted-foreground">
            {t("chatbot.pageSubtitle")}
          </p>
        </div>
      </div>
    </div>
  );
}

