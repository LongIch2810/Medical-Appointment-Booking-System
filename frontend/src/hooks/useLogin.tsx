import { login } from "@/api/authApi";
import { fetchUserInfo } from "@/api/userApi";
import { useUserStore } from "@/store/useUserStore";
import { getApiErrorMessage } from "@/utils/getApiErrorMessage";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
      toast.error(getApiErrorMessage(error, "Đăng nhập thất bại!"));
    },
  });
}
