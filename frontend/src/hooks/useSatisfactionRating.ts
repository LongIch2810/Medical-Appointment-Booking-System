import { createSatisfactionRating } from "@/api/satisfactionRatingApi";
import type { ApiError } from "@/types/interface/apiError.interface";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { toast } from "react-toastify";

export function useCreateSatisfactionRating() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createSatisfactionRating,
    onSuccess: () => {
      toast.success("Cảm ơn bạn đã đánh giá!");
      queryClient.invalidateQueries({ queryKey: ["patient-appointments"] });
    },
    onError: (error) => {
      const axiosError = error as AxiosError<ApiError>;
      const details = axiosError.response?.data.error?.details;
      const message = Array.isArray(details)
        ? details[0]
        : details || "Đánh giá thất bại!";
      toast.error(message);
    },
  });
}
