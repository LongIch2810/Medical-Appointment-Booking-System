import { useTranslation } from "react-i18next";
import MedAiMark from "./MedAiMark";

export default function ChatHeader() {
  const { t } = useTranslation();

  return (
    <div className="shrink-0 flex items-center gap-2.5 px-1 py-3 sm:py-4">
      <MedAiMark imgClassName="w-9 h-9 sm:w-10 sm:h-10" checkClassName="w-3.5 h-3.5" />
      <div className="min-w-0">
        <h1 className="font-bold text-slate-900 dark:text-[#F1F5F9] text-base sm:text-lg leading-tight">
          {t("chatbot.pageTitle")}
        </h1>
        <p className="text-[11px] sm:text-xs text-slate-500 dark:text-[#94A3B8] font-medium truncate">
          {t("chatbot.pageSubtitle")}
        </p>
      </div>
    </div>
  );
}
