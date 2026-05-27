import { createComplaint } from "@/api/complaintApi";
import type { ApiError } from "@/types/interface/apiError.interface";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { toast } from "react-toastify";

export function useComplaint() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createComplaint,
    onSuccess: () => {
      toast.success("Gửi góp ý thành công! Chúng tôi sẽ phản hồi sớm nhất.");
      queryClient.invalidateQueries({ queryKey: ["my-complaints"] });
    },
    onError: (error) => {
      const axiosError = error as AxiosError<ApiError>;
      const details = axiosError.response?.data.error?.details;
      const message = Array.isArray(details)
        ? details[0]
        : details || "Gửi góp ý thất bại!";
      toast.error(message);
    },
  });
}
