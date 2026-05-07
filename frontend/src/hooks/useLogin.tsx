import { login } from "@/api/authApi";
import { fetchUserInfo } from "@/api/userApi";
import { useUserStore } from "@/store/useUserStore";
import type { ApiError } from "@/types/interface/apiError.interface";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

export function useLogin() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const setUserInfo = useUserStore((s) => s.setUserInfo);

  return useMutation({
    mutationFn: login,
    onSuccess: async () => {
      toast.success("Đăng nhập thành công!");
      const query = await queryClient.fetchQuery({
        queryKey: ["profile"],
        queryFn: fetchUserInfo,
      });
      setUserInfo(query.data);
      navigate("/");
    },
    onError: (error) => {
      const axiosError = error as AxiosError<ApiError>;
      const details = axiosError.response?.data.error?.details;
      const message = Array.isArray(details)
        ? details[0]
        : details || "Đăng nhập thất bại!";
      toast.error(message);
    },
  });
}
