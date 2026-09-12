import { useState } from "react";
import { useTranslation } from "react-i18next";
import { GraduationCap, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface DemoProjectBannerProps {
  className?: string;
}

export default function DemoProjectBanner({ className }: DemoProjectBannerProps) {
  const { t } = useTranslation();
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div
      className={cn(
        "flex items-start gap-2.5 px-4 py-2.5 sm:px-6 bg-amber-50 dark:bg-amber-500/10 border-b border-amber-200/80 dark:border-amber-500/20 text-amber-800 dark:text-amber-300",
        className,
      )}
      role="note"
    >
      <GraduationCap className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
      <p className="flex-1 text-xs sm:text-[13px] leading-snug">{t("demoNotice.text")}</p>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label={t("demoNotice.dismiss")}
        className="shrink-0 rounded-md p-0.5 text-amber-700/70 hover:text-amber-900 hover:bg-amber-100 dark:text-amber-400/70 dark:hover:text-amber-200 dark:hover:bg-amber-500/15 transition-colors cursor-pointer"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
