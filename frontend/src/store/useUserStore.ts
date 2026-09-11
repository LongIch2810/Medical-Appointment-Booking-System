import type { User } from "@/types/interface/user.interface";
import { create } from "zustand";

type UserStore = {
  userInfo: User | null;
  setUserInfo: (user: User | null) => void;
  resetState: () => void;
};

// Remove profile data left behind by the previous persisted store.
localStorage.removeItem("user-storage");

export const useUserStore = create<UserStore>()((set) => ({
  userInfo: null,
  setUserInfo: (user) => set({ userInfo: user }),
  resetState: () =>
    set({
      userInfo: null,
    }),
}));
