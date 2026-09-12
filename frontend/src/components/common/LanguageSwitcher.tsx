import React from "react";
import { useTranslation } from "react-i18next";
import { Globe, Check } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  LANGUAGE_OPTIONS,
  type SupportedLanguage,
} from "@/i18n/types";
import { setAppLanguage } from "@/i18n";
import { cn } from "@/lib/utils";

interface LanguageSwitcherProps {
  variant?: "dropdown" | "pills" | "compact";
  className?: string;
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  variant = "dropdown",
  className,
}) => {
  const { i18n, t } = useTranslation();
  const currentLang = (i18n.language?.slice(0, 2) as SupportedLanguage) || "vi";

  const handleSelect = (lang: SupportedLanguage) => {
    if (lang === currentLang) return;
    setAppLanguage(lang);
  };

  const currentOption =
    LANGUAGE_OPTIONS.find((opt) => opt.code === currentLang) ??
    LANGUAGE_OPTIONS[0];

  // Pill variant (used in Settings and Mobile menu drawer)
  if (variant === "pills") {
    return (
      <div
        role="group"
        aria-label={t("header.switchLanguage")}
        className={cn("flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700", className)}
      >
        {LANGUAGE_OPTIONS.map((option) => {
          const isActive = option.code === currentLang;
          return (
            <button
              key={option.code}
              type="button"
              onClick={() => handleSelect(option.code)}
              aria-pressed={isActive}
              className={cn(
                "min-h-[44px] min-w-[44px] flex-1 inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-bold transition-all cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary",
                isActive
                  ? "bg-white dark:bg-slate-900 text-primary shadow-xs border border-slate-200/80 dark:border-slate-700"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              )}
            >
              <Globe className={cn("h-3.5 w-3.5", isActive ? "text-primary" : "text-slate-400")} />
              <span>{option.nativeName}</span>
              {isActive && <Check className="h-3 w-3 text-primary ml-0.5" />}
            </button>
          );
        })}
      </div>
    );
  }

  // Compact toggle button (direct switch between vi <-> en)
  if (variant === "compact") {
    const nextLang = currentLang === "vi" ? "en" : "vi";
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleSelect(nextLang)}
        aria-label={t("header.switchLanguage")}
        className={cn(
          "min-h-[44px] min-w-[44px] h-10 px-2.5 gap-1.5 rounded-xl border border-slate-200/80 dark:border-slate-800 hover:border-primary/40 hover:bg-primary/5 text-slate-700 dark:text-slate-200 font-bold text-xs cursor-pointer shadow-2xs",
          className
        )}
      >
        <Globe className="h-4 w-4 text-primary" />
        <span className="tracking-wide uppercase font-extrabold">{currentOption.shortLabel}</span>
      </Button>
    );
  }

  // Standard Dropdown variant (used in Header)
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          aria-label={t("header.switchLanguage")}
          className={cn(
            "min-h-[44px] min-w-[44px] h-10 px-3 gap-2 rounded-xl border-slate-200/90 dark:border-slate-800 bg-white/90 dark:bg-slate-900 hover:border-primary/40 hover:bg-slate-50 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-200 font-bold text-xs transition-all shadow-2xs cursor-pointer focus-visible:ring-primary/20",
            className
          )}
        >
          <Globe className="h-4 w-4 text-primary shrink-0" />
          <span className="font-extrabold text-[11px] tracking-wider uppercase text-slate-800 dark:text-slate-200">
            {currentOption.shortLabel}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={6}
        className="w-44 p-1.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-lg"
      >
        <div className="px-2 py-1.5 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
          {t("header.switchLanguage")}
        </div>
        {LANGUAGE_OPTIONS.map((option) => {
          const isActive = option.code === currentLang;
          return (
            <DropdownMenuItem
              key={option.code}
              onClick={() => handleSelect(option.code)}
              className={cn(
                "min-h-[44px] flex items-center justify-between rounded-xl px-2.5 py-2 text-xs font-semibold cursor-pointer transition-colors",
                isActive
                  ? "bg-primary/10 text-primary dark:bg-primary/20 font-bold"
                  : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              )}
            >
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-500 dark:text-slate-400 text-[11px] w-5">
                  {option.shortLabel}
                </span>
                <span>{option.nativeName}</span>
              </div>
              {isActive && <Check className="h-4 w-4 text-primary" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageSwitcher;
