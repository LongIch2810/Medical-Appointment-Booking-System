import { useTranslation } from "react-i18next";
import { AlertCircle } from "lucide-react";

export default function MedicalDisclaimer() {
  const { t } = useTranslation();

  return (
    <aside
      role="note"
      aria-label={t("chatbot.disclaimerStrong")}
      className="flex shrink-0 items-start gap-2.5 rounded-xl border border-amber-200/80 bg-amber-50/80 px-3.5 py-2.5 text-xs text-amber-900 shadow-2xs dark:border-amber-900/50 dark:bg-amber-950/25 dark:text-amber-200"
    >
      <AlertCircle
        className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400"
        aria-hidden="true"
      />
      <p className="min-w-0 leading-relaxed text-[11px] sm:text-xs">
        <strong className="font-bold text-amber-950 dark:text-amber-100">
          {t("chatbot.disclaimerStrong")}
        </strong>{" "}
        <span className="text-amber-850 dark:text-amber-200/90">
          {t("chatbot.disclaimerText")}
        </span>
      </p>
    </aside>
  );
}

