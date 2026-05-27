import axiosInstance from "@/configs/axios";
import type { User } from "@/types/interface/user.interface";

type UserInfoResponse = {
  data: User;
};

export const fetchUserInfo = async () => {
  const res = await axiosInstance.get<UserInfoResponse>("/users/info");
  return res.data;
};
