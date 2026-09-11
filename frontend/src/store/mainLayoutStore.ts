import { create } from "zustand";

type MainLayoutStore = Record<string, never>;

export const useFilterDoctorsStore = create<MainLayoutStore>()(() => ({}));
