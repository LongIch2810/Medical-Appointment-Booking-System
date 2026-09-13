import axiosInstance from "@/configs/axios";
import type { HealthRoadmapHistoryItem, HealthRoadmapResult } from "@/types/interface/healthRoadmap.interface";
import type { ApiResponse } from "@/types/interface/patient.interface";

export async function buildHealthRoadmap(relativeId: number) {
  const response = await axiosInstance.post<ApiResponse<HealthRoadmapResult>>(
    "/chat-history/build-health-roadmap",
    { relative_id: relativeId },
  );

  return response.data.data;
}

export async function getHealthRoadmapHistory(page = 1, limit = 10, relativeId?: number) {
  const response = await axiosInstance.get<ApiResponse<{ roadmaps: HealthRoadmapHistoryItem[]; total: number; page: number; limit: number; totalPages: number }>>(
    "/health-roadmaps",
    { params: { page, limit, relativeId } },
  );
  return response.data;
}

export async function deleteHealthRoadmap(id: number) {
  const response = await axiosInstance.delete<ApiResponse<{ success: boolean }>>(`/health-roadmaps/${id}`);
  return response.data;
}
