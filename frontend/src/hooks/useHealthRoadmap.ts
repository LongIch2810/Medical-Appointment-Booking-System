import { buildHealthRoadmap } from "@/api/healthRoadmapApi";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useBuildHealthRoadmap() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: buildHealthRoadmap,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["health-roadmap-history"] });
    },
  });
}
