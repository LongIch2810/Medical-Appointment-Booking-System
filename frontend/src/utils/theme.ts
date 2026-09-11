import type { UserTheme } from "@/types/interface/settings.interface";

export const THEME_STORAGE_KEY = "ui-theme";

export function applyTheme(theme: UserTheme) {
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const isDark = theme === "DARK" || (theme === "SYSTEM" && prefersDark);
  document.documentElement.classList.toggle("dark", isDark);
  localStorage.setItem(THEME_STORAGE_KEY, theme);
}

export function applyStoredTheme() {
  const stored = localStorage.getItem(THEME_STORAGE_KEY) as UserTheme | null;
  applyTheme(
    stored && ["SYSTEM", "LIGHT", "DARK"].includes(stored)
      ? stored
      : "SYSTEM",
  );
}
