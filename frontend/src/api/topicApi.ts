import axiosInstance from "@/configs/axios";
import type {
  TopicListPayload,
  TopicListResponse,
} from "@/types/interface/article.interface";
import type { ApiResponse } from "@/types/interface/patient.interface";

export const fetchTopics = async (data: TopicListPayload) => {
  const res = await axiosInstance.post<ApiResponse<TopicListResponse>>(
    "/topics",
    data,
  );
  return res.data;
};
