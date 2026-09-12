import React, { useEffect, useState } from "react";
import { Sun, Moon, Monitor, Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import type { UserTheme } from "@/types/interface/settings.interface";
import { applyTheme, THEME_STORAGE_KEY } from "@/utils/theme";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  variant?: "dropdown" | "compact" | "pills";
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  variant = "dropdown",
  className,
}) => {
  const { t } = useTranslation();
  const [theme, setTheme] = useState<UserTheme>("SYSTEM");
  const [resolvedDark, setResolvedDark] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(THEME_STORAGE_KEY) as UserTheme | null;
    const currentTheme =
      stored && ["SYSTEM", "LIGHT", "DARK"].includes(stored) ? stored : "SYSTEM";
    setTheme(currentTheme);

    const isDarkNow = document.documentElement.classList.contains("dark");
    setResolvedDark(isDarkNow);

    const observer = new MutationObserver(() => {
      setResolvedDark(document.documentElement.classList.contains("dark"));
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleMediaChange = () => {
      const stored = localStorage.getItem(THEME_STORAGE_KEY) as UserTheme | null;
      if (!stored || stored === "SYSTEM") {
        applyTheme("SYSTEM");
        setResolvedDark(mediaQuery.matches);
      }
    };
    mediaQuery.addEventListener("change", handleMediaChange);

    return () => {
      observer.disconnect();
      mediaQuery.removeEventListener("change", handleMediaChange);
    };
  }, []);

  const handleSelect = (selectedTheme: UserTheme) => {
    setTheme(selectedTheme);
    applyTheme(selectedTheme);
    setResolvedDark(document.documentElement.classList.contains("dark"));
  };

  const themeOptions: { code: UserTheme; label: string; icon: typeof Sun }[] = [
    {
      code: "LIGHT",
      label: t("settings.themeLight", { defaultValue: "Sáng" }),
      icon: Sun,
    },
    {
      code: "DARK",
      label: t("settings.themeDark", { defaultValue: "Tối" }),
      icon: Moon,
    },
    {
      code: "SYSTEM",
      label: t("settings.themeSystem", { defaultValue: "Hệ thống" }),
      icon: Monitor,
    },
  ];

  // Pill variant (used in mobile drawer)
  if (variant === "pills") {
    return (
      <div
        role="group"
        aria-label="Chọn giao diện hiển thị"
        className={cn(
          "flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-[#172033] border border-slate-200/80 dark:border-[#293548]",
          className,
        )}
      >
        {themeOptions.map((option) => {
          const isActive = theme === option.code;
          const Icon = option.icon;
          return (
            <button
              key={option.code}
              type="button"
              onClick={() => handleSelect(option.code)}
              aria-pressed={isActive}
              className={cn(
                "min-h-[40px] flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold transition-all cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary",
                isActive
                  ? "bg-white dark:bg-[#1E293B] text-primary shadow-xs border border-slate-200/80 dark:border-[#293548]"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200",
              )}
            >
              <Icon className={cn("h-3.5 w-3.5", isActive ? "text-primary" : "text-slate-400")} />
              <span>{option.label}</span>
            </button>
          );
        })}
      </div>
    );
  }

  // Compact toggle (direct toggle between Light & Dark)
  if (variant === "compact") {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleSelect(resolvedDark ? "LIGHT" : "DARK")}
        aria-label={resolvedDark ? "Chuyển sang giao diện Sáng" : "Chuyển sang giao diện Tối"}
        className={cn(
          "min-h-[40px] min-w-[40px] h-10 px-2.5 rounded-xl border border-slate-200/80 dark:border-[#293548] hover:border-primary/40 text-slate-700 dark:text-slate-200 cursor-pointer shadow-2xs",
          className,
        )}
      >
        {resolvedDark ? (
          <Sun className="h-4 w-4 text-amber-400" />
        ) : (
          <Moon className="h-4 w-4 text-slate-600" />
        )}
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
          aria-label="Chọn giao diện hiển thị"
          className={cn(
            "min-h-[40px] min-w-[40px] h-10 px-2.5 sm:px-3 gap-1.5 rounded-xl border-slate-200/90 dark:border-[#293548] bg-white/90 dark:bg-[#172033] hover:border-primary/40 hover:bg-slate-50 dark:hover:bg-[#1E293B] text-slate-700 dark:text-slate-200 font-bold text-xs transition-all shadow-2xs cursor-pointer focus-visible:ring-primary/20",
            className,
          )}
        >
          {resolvedDark ? (
            <Moon className="h-4 w-4 text-teal-400 shrink-0" />
          ) : (
            <Sun className="h-4 w-4 text-amber-500 shrink-0" />
          )}
          <span className="hidden xl:inline text-[11px] font-bold text-slate-700 dark:text-slate-200">
            {theme === "SYSTEM"
              ? t("settings.themeSystem", { defaultValue: "Hệ thống" })
              : theme === "DARK"
                ? t("settings.themeDark", { defaultValue: "Tối" })
                : t("settings.themeLight", { defaultValue: "Sáng" })}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={6}
        className="w-40 p-1.5 rounded-2xl bg-white dark:bg-[#172033] border border-slate-200/90 dark:border-[#293548] shadow-xl"
      >
        <div className="px-2 py-1.5 text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider">
          {t("settings.appearance", { defaultValue: "Giao diện" })}
        </div>
        {themeOptions.map((option) => {
          const isActive = theme === option.code;
          const Icon = option.icon;
          return (
            <DropdownMenuItem
              key={option.code}
              onClick={() => handleSelect(option.code)}
              className={cn(
                "min-h-[40px] flex items-center justify-between rounded-xl px-2.5 py-2 text-xs font-semibold cursor-pointer transition-colors",
                isActive
                  ? "bg-primary/10 text-primary dark:bg-primary/20 font-bold"
                  : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1E293B]",
              )}
            >
              <div className="flex items-center gap-2">
                <Icon className={cn("h-4 w-4", isActive ? "text-primary" : "text-slate-400")} />
                <span>{option.label}</span>
              </div>
              {isActive && <Check className="h-4 w-4 text-primary" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ThemeToggle;
