import axiosInstance from "@/configs/axios";

export const uploadFilesMessage = async (data: FormData) => {
  const res = await axiosInstance.post("/uploads/messages/files", data);
  return res.data;
};
