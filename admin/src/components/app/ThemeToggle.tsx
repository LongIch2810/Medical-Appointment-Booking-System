import { Laptop, Moon, Sun } from "lucide-react";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { useUiStore, type ThemeMode } from "@/store/useUiStore";

export function ThemeToggle() {
  const theme = useUiStore((state) => state.theme);
  const setTheme = useUiStore((state) => state.setTheme);

  useEffect(() => {
    const root = document.documentElement;
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const applyTheme = (targetTheme: ThemeMode) => {
      let isDark = false;
      if (targetTheme === "dark") {
        isDark = true;
      } else if (targetTheme === "system") {
        isDark = mediaQuery.matches;
      } else {
        isDark = false;
      }

      if (isDark) {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
    };

    applyTheme(theme);

    const handleSystemChange = () => {
      if (theme === "system") {
        applyTheme("system");
      }
    };

    mediaQuery.addEventListener("change", handleSystemChange);
    return () => mediaQuery.removeEventListener("change", handleSystemChange);
  }, [theme]);

  const cycleTheme = () => {
    if (theme === "light") setTheme("dark");
    else if (theme === "dark") setTheme("system");
    else setTheme("light");
  };

  const getIcon = () => {
    if (theme === "dark") return <Moon className="size-4 text-sky-400" />;
    if (theme === "system") return <Laptop className="size-4 text-violet-400" />;
    return <Sun className="size-4 text-amber-500" />;
  };

  const getTooltip = () => {
    if (theme === "dark") return "Giao diện: Tối";
    if (theme === "system") return "Giao diện: Hệ thống";
    return "Giao diện: Sáng";
  };

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={cycleTheme}
      title={getTooltip()}
      className="relative transition-all duration-200 hover:bg-black/5 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800"
      aria-label="Toggle theme"
    >
      {getIcon()}
    </Button>
  );
}
