import axiosInstance from "@/configs/axios";

export const login = async (data: {
  usernameOrEmail: string;
  password: string;
}) => {
  const res = await axiosInstance.post("/auth/login", data);
  return res.data;
};

export const register = async (data: {
  username: string;
  email: string;
  password: string;
  fullname: string;
}) => {
  const res = await axiosInstance.post("/auth/register", data);
  return res.data;
};

export const logout = async () => {
  const res = await axiosInstance.post("/auth/logout");
  return res.data;
};

export const refresh = async () => {
  const res = await axiosInstance.post("/auth/refresh");
  return res.data;
};
