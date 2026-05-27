import axiosInstance from "@/configs/axios";

export interface CreateComplaintData {
  title: string;
  description: string;
}

export interface MyComplaintsPayload {
  page: number;
  limit: number;
  status?: string;
}

export const createComplaint = async (data: CreateComplaintData) => {
  const res = await axiosInstance.post("/complaints/create", data);
  return res.data;
};

export const fetchMyComplaints = async (data: MyComplaintsPayload) => {
  const res = await axiosInstance.post("/complaints/my", data);
  return res.data;
};
