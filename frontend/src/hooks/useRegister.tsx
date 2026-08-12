import { register } from "@/api/authApi";
import { getApiErrorMessage } from "@/utils/getApiErrorMessage";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

export function useRegister() {
  const navigate = useNavigate();
  return useMutation({
    mutationFn: register,
    onSuccess: (data) => {
      toast.success(data.data.message);
      navigate("/sign-in");
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Đăng ký thất bại!"));
    },
  });
}
