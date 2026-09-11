import { fetchUserSettings, updateUserSettings } from "@/api/settingsApi";
import type { UpdateUserSettings } from "@/types/interface/settings.interface";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const settingsQueryKey = ["user-settings", "me"] as const;

export function useUserSettings(enabled = true) {
  return useQuery({
    queryKey: settingsQueryKey,
    queryFn: fetchUserSettings,
    enabled,
  });
}

export function useUpdateUserSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: UpdateUserSettings) => updateUserSettings(body),
    onSuccess: (response) => {
      queryClient.setQueryData(settingsQueryKey, response);
    },
  });
}
