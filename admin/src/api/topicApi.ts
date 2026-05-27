import axiosInstance from "@/configs/axios";
import type { ApiResponse } from "@/types/interface/api.interface";
import type {
  CreateTopicPayload,
  Topic,
  TopicListPayload,
  TopicListResponse,
  UpdateTopicPayload,
} from "@/types/interface/topic.interface";

export const fetchTopics = async (data: TopicListPayload) => {
  const res = await axiosInstance.post<ApiResponse<TopicListResponse>>(
    "/topics",
    data,
  );
  return res.data;
};

export const fetchTopicDetail = async (topicId: number) => {
  const res = await axiosInstance.get<ApiResponse<Topic>>(`/topics/${topicId}`);
  return res.data;
};

export const createTopic = async (data: CreateTopicPayload) => {
  const res = await axiosInstance.post<ApiResponse<Topic>>(
    "/topics/create-topic",
    data,
  );
  return res.data;
};

export const updateTopic = async (
  topicId: number,
  data: UpdateTopicPayload,
) => {
  const res = await axiosInstance.patch<ApiResponse<Topic>>(
    `/topics/${topicId}`,
    data,
  );
  return res.data;
};

export const deleteTopic = async (topicId: number) => {
  const res = await axiosInstance.delete<ApiResponse<{ message: string }>>(
    `/topics/${topicId}`,
  );
  return res.data;
};
