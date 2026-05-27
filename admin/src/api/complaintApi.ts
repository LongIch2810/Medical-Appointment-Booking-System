import axiosInstance from "@/configs/axios";
import type { ApiResponse } from "@/types/interface/api.interface";
import type {
  Complaint,
  ComplaintListPayload,
  ComplaintListResponse,
  CreateComplaintPayload,
  UpdateComplaintPayload,
} from "@/types/interface/complaint.interface";

export const fetchComplaints = async (data: ComplaintListPayload) => {
  const res = await axiosInstance.post<ApiResponse<ComplaintListResponse>>(
    "/complaints",
    data,
  );
  return res.data;
};

export const fetchComplaintDetail = async (complaintId: number) => {
  const res = await axiosInstance.get<ApiResponse<Complaint>>(
    `/complaints/${complaintId}`,
  );
  return res.data;
};

export const createComplaint = async (data: CreateComplaintPayload) => {
  const res = await axiosInstance.post<ApiResponse<Complaint>>(
    "/complaints/create",
    data,
  );
  return res.data;
};

export const updateComplaint = async (
  complaintId: number,
  data: UpdateComplaintPayload,
) => {
  const res = await axiosInstance.patch<ApiResponse<Complaint>>(
    `/complaints/${complaintId}`,
    data,
  );
  return res.data;
};

export const deleteComplaint = async (complaintId: number) => {
  const res = await axiosInstance.delete<ApiResponse<{ message: string }>>(
    `/complaints/${complaintId}`,
  );
  return res.data;
};
