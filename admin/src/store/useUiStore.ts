import { create } from "zustand";

type UiState = {
  isSidebarCollapsed: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (value: boolean) => void;
};

export const useUiStore = create<UiState>((set) => ({
  isSidebarCollapsed: false,
  toggleSidebar: () =>
    set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
  setSidebarCollapsed: (value) => set({ isSidebarCollapsed: value }),
}));
