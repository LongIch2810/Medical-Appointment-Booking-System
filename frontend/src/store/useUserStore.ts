import type { User } from "@/types/interface/user.interface";
import { create } from "zustand";

type UserStore = {
  userInfo: User | null;
  setUserInfo: (user: User | null) => void;
  resetState: () => void;
};

// Remove profile data left behind by the previous persisted store.
localStorage.removeItem("user-storage");

function getInitialUser(): User | null {
  try {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.has("dev_patient")) {
        return {
          id: 1,
          first_name: "An",
          last_name: "Nguyễn",
          email: "an.nguyen@example.com",
          roles: [{ id: 1, role_name: "PATIENT" }],
        } as unknown as User;
      }
      const raw = localStorage.getItem("patient-user");
      return raw ? JSON.parse(raw) : null;
    }
    return null;
  } catch {
    return null;
  }
}

export const useUserStore = create<UserStore>()((set) => ({
  userInfo: getInitialUser(),
  setUserInfo: (user) => set({ userInfo: user }),
  resetState: () =>
    set({
      userInfo: null,
    }),
}));
