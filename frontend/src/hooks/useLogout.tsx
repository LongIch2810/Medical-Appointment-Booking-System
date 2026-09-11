import { logout } from "@/api/authApi";
import { useUserStore } from "@/store/useUserStore";
import { disconnectSocket } from "@/utils/socket";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

export function useLogout() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { resetState } = useUserStore();
  return useMutation({
    mutationFn: logout,
    onSuccess: (data) => {
      toast.success(data.data.message);
      queryClient.clear();
      queryClient.removeQueries({ queryKey: ["profile"] });
      resetState();
      disconnectSocket();
      navigate("sign-in");
    },
    onError: () => {
      toast.error("Đăng xuất thất bại !");
    },
  });
}
