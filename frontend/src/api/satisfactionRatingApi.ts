import axiosInstance from "@/configs/axios";
import type { SatisfactionRatingPayload } from "@/types/interface/patient.interface";

export const createSatisfactionRating = async (
  data: SatisfactionRatingPayload,
) => {
  const res = await axiosInstance.post(
    "/satisfaction-rating/create-rating",
    data,
  );
  return res.data;
};
