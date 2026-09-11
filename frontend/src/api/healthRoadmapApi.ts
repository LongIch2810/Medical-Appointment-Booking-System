import axiosInstance from "@/configs/axios";
import type { HealthRoadmapResult } from "@/types/interface/healthRoadmap.interface";
import type { ApiResponse } from "@/types/interface/patient.interface";

export async function buildHealthRoadmap(relativeId: number) {
  const response = await axiosInstance.post<ApiResponse<HealthRoadmapResult>>(
    "/chat-history/build-health-roadmap",
    { relative_id: relativeId },
  );

  return response.data.data;
}
