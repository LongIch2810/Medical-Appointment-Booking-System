import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

import {
  createSatisfactionRating,
  fetchSatisfactionRatingDetail,
  fetchSatisfactionRatings,
  updateSatisfactionRating,
} from "@/api/satisfactionRatingApi";
import type {
  SatisfactionRatingListPayload,
  UpdateSatisfactionRatingPayload,
} from "@/types/interface/satisfactionRating.interface";

export const satisfactionRatingQueryKeys = {
  list: (filters: SatisfactionRatingListPayload) =>
    ["satisfaction-ratings", filters] as const,
  detail: (ratingId: number) =>
    ["satisfaction-rating-detail", ratingId] as const,
};

export function useSatisfactionRatings(
  filters: SatisfactionRatingListPayload,
) {
  return useQuery({
    queryKey: satisfactionRatingQueryKeys.list(filters),
    queryFn: () => fetchSatisfactionRatings(filters),
  });
}

export function useSatisfactionRatingDetail(ratingId: number) {
  return useQuery({
    queryKey: satisfactionRatingQueryKeys.detail(ratingId),
    queryFn: () => fetchSatisfactionRatingDetail(ratingId),
    enabled: ratingId > 0,
  });
}

export function useCreateSatisfactionRating() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createSatisfactionRating,
    onSuccess: () => {
      toast.success("Gửi đánh giá thành công");
      queryClient.invalidateQueries({ queryKey: ["satisfaction-ratings"] });
    },
    onError: () => {
      toast.error("Gửi đánh giá thất bại");
    },
  });
}

export function useUpdateSatisfactionRating() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      ratingId,
      payload,
    }: {
      ratingId: number;
      payload: UpdateSatisfactionRatingPayload;
    }) => updateSatisfactionRating(ratingId, payload),
    onSuccess: (_, variables) => {
      toast.success("Cập nhật đánh giá thành công");
      queryClient.invalidateQueries({ queryKey: ["satisfaction-ratings"] });
      queryClient.invalidateQueries({
        queryKey: satisfactionRatingQueryKeys.detail(variables.ratingId),
      });
    },
    onError: () => {
      toast.error("Cập nhật đánh giá thất bại");
    },
  });
}
