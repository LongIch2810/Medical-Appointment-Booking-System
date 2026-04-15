import { create } from "zustand";
import { persist } from "zustand/middleware";

import { mockProfiles } from "@/mock/profiles";
import type { AppRole, UserProfile } from "@/types/app";

type AuthState = {
  currentRole: AppRole | null;
  currentUser: UserProfile | null;
  loginAs: (role: AppRole) => void;
  logout: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      currentRole: null,
      currentUser: null,
      loginAs: (role) => {
        set({
          currentRole: role,
          currentUser: mockProfiles[role],
        });
      },
      logout: () => {
        set({
          currentRole: null,
          currentUser: null,
        });
      },
    }),
    {
      name: "admin-auth-store",
    }
  )
);
