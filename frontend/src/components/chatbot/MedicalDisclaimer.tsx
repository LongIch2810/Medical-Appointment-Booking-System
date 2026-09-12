import { useTranslation } from "react-i18next";
import { Info } from "lucide-react";

export default function MedicalDisclaimer() {
  const { t } = useTranslation();

  return (
    <div className="shrink-0 flex items-start gap-2 px-3 py-2 rounded-lg bg-amber-50/70 dark:bg-amber-500/10 text-amber-800 dark:text-amber-300">
      <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
      <p className="leading-snug text-[11px] sm:text-xs">
        <strong className="font-semibold">{t("chatbot.disclaimerStrong")}</strong>{" "}
        {t("chatbot.disclaimerText")}
      </p>
    </div>
  );
}
