import { create } from "zustand";

export type ThemeMode = "light" | "dark" | "system";

type UiState = {
  isSidebarCollapsed: boolean;
  theme: ThemeMode;
  isCommandPaletteOpen: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (value: boolean) => void;
  setTheme: (theme: ThemeMode) => void;
  setCommandPaletteOpen: (open: boolean) => void;
  toggleCommandPalette: () => void;
};

const getInitialTheme = (): ThemeMode => {
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem("ui-theme") as ThemeMode | null;
    if (saved === "light" || saved === "dark" || saved === "system") {
      return saved;
    }
  }
  return "light";
};

export const useUiStore = create<UiState>((set) => ({
  isSidebarCollapsed: false,
  theme: getInitialTheme(),
  isCommandPaletteOpen: false,
  toggleSidebar: () =>
    set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
  setSidebarCollapsed: (value) => set({ isSidebarCollapsed: value }),
  setTheme: (theme) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("ui-theme", theme);
    }
    set({ theme });
  },
  setCommandPaletteOpen: (open) => set({ isCommandPaletteOpen: open }),
  toggleCommandPalette: () =>
    set((state) => ({ isCommandPaletteOpen: !state.isCommandPaletteOpen })),
}));

