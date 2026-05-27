import axiosInstance from "@/configs/axios";
import type { ApiResponse } from "@/types/interface/api.interface";
import type {
  CreateRelationshipPayload,
  Relationship,
  RelationshipListPayload,
  RelationshipListResponse,
  UpdateRelationshipPayload,
} from "@/types/interface/relationship.interface";

export const fetchRelationships = async (data: RelationshipListPayload) => {
  const res = await axiosInstance.post<ApiResponse<RelationshipListResponse>>(
    "/relationships",
    data,
  );
  return res.data;
};

export const fetchRelationshipDetail = async (relationshipCode: string) => {
  const res = await axiosInstance.get<ApiResponse<Relationship>>(
    `/relationships/${relationshipCode}`,
  );
  return res.data;
};

export const createRelationship = async (data: CreateRelationshipPayload) => {
  const res = await axiosInstance.post<ApiResponse<Relationship>>(
    "/relationships/create",
    data,
  );
  return res.data;
};

export const updateRelationship = async (
  relationshipCode: string,
  data: UpdateRelationshipPayload,
) => {
  const res = await axiosInstance.patch<ApiResponse<Relationship>>(
    `/relationships/${relationshipCode}`,
    data,
  );
  return res.data;
};

export const deleteRelationship = async (relationshipCode: string) => {
  const res = await axiosInstance.delete<ApiResponse<{ message: string }>>(
    `/relationships/${relationshipCode}`,
  );
  return res.data;
};
