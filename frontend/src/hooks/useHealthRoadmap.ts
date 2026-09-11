import { buildHealthRoadmap } from "@/api/healthRoadmapApi";
import { useMutation } from "@tanstack/react-query";

export function useBuildHealthRoadmap() {
  return useMutation({ mutationFn: buildHealthRoadmap });
}
