import axiosInstance from "@/configs/axios";
import type { ApiResponse } from "@/types/interface/api.interface";
import type {
  CreateTagPayload,
  Tag,
  TagListPayload,
  TagListResponse,
  UpdateTagPayload,
} from "@/types/interface/tag.interface";

export const fetchTags = async (data: TagListPayload) => {
  const res = await axiosInstance.post<ApiResponse<TagListResponse>>(
    "/tags",
    data,
  );
  return res.data;
};

export const fetchTagDetail = async (tagId: number) => {
  const res = await axiosInstance.get<ApiResponse<Tag>>(`/tags/${tagId}`);
  return res.data;
};

export const createTag = async (data: CreateTagPayload) => {
  const res = await axiosInstance.post<ApiResponse<Tag>>(
    "/tags/create-tag",
    data,
  );
  return res.data;
};

export const updateTag = async (tagId: number, data: UpdateTagPayload) => {
  const res = await axiosInstance.patch<ApiResponse<Tag>>(
    `/tags/${tagId}`,
    data,
  );
  return res.data;
};

export const deleteTag = async (tagId: number) => {
  const res = await axiosInstance.delete<ApiResponse<{ message: string }>>(
    `/tags/${tagId}`,
  );
  return res.data;
};
