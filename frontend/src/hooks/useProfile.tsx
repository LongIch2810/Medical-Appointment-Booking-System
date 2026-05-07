import { fetchUserInfo } from "@/api/userApi";
import { useQuery } from "@tanstack/react-query";

export function useProfile(enabled = true) {
  return useQuery({
    queryKey: ["profile"],
    queryFn: fetchUserInfo,
    enabled,
    staleTime: 1000 * 60 * 10,
  });
}
