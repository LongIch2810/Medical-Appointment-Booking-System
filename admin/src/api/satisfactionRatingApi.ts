import axiosInstance from "@/configs/axios";
import { normalizeAppointment, type RawAppointment } from "@/api/appointmentApi";
import type { ApiResponse } from "@/types/interface/api.interface";
import type {
  CreateSatisfactionRatingPayload,
  SatisfactionRating,
  SatisfactionRatingListPayload,
  SatisfactionRatingListResponse,
  UpdateSatisfactionRatingPayload,
} from "@/types/interface/satisfactionRating.interface";

type RawSatisfactionRating = Omit<SatisfactionRating, "appointment"> & {
  appointment?: RawAppointment | null;
};

function normalizeSatisfactionRating(
  rating: RawSatisfactionRating,
): SatisfactionRating {
  const appointment = rating.appointment
    ? normalizeAppointment(rating.appointment)
    : null;

  return {
    ...rating,
    appointment,
    rating: rating.rating ?? rating.rating_score ?? 0,
    comment: rating.comment ?? rating.feedback,
    appointment_id: rating.appointment_id ?? appointment?.id,
    patient: rating.patient ?? appointment?.patient,
    doctor: rating.doctor ?? appointment?.doctor,
  };
}

function normalizeSatisfactionRatingListResponse(
  data: SatisfactionRatingListResponse,
): SatisfactionRatingListResponse {
  return {
    ...data,
    satisfactionRatings: (
      data.satisfactionRatings as RawSatisfactionRating[]
    ).map(normalizeSatisfactionRating),
  };
}

function toBackendSatisfactionRatingPayload(
  data: CreateSatisfactionRatingPayload | UpdateSatisfactionRatingPayload,
) {
  return {
    ...data,
    rating_score: data.rating,
    feedback: data.comment,
    rating: undefined,
    comment: undefined,
  };
}

export const fetchSatisfactionRatings = async (
  data: SatisfactionRatingListPayload,
) => {
  const res = await axiosInstance.post<
    ApiResponse<SatisfactionRatingListResponse>
  >("/satisfaction-rating", data);
  return {
    ...res.data,
    data: normalizeSatisfactionRatingListResponse(res.data.data),
  };
};

export const fetchSatisfactionRatingDetail = async (ratingId: number) => {
  const res = await axiosInstance.get<ApiResponse<RawSatisfactionRating>>(
    `/satisfaction-rating/${ratingId}`,
  );
  return {
    ...res.data,
    data: normalizeSatisfactionRating(res.data.data),
  };
};

export const createSatisfactionRating = async (
  data: CreateSatisfactionRatingPayload,
) => {
  const res = await axiosInstance.post<ApiResponse<RawSatisfactionRating>>(
    "/satisfaction-rating/create-rating",
    toBackendSatisfactionRatingPayload(data),
  );
  return {
    ...res.data,
    data: normalizeSatisfactionRating(res.data.data),
  };
};

export const updateSatisfactionRating = async (
  ratingId: number,
  data: UpdateSatisfactionRatingPayload,
) => {
  const res = await axiosInstance.patch<ApiResponse<RawSatisfactionRating>>(
    `/satisfaction-rating/${ratingId}`,
    toBackendSatisfactionRatingPayload(data),
  );
  return {
    ...res.data,
    data: normalizeSatisfactionRating(res.data.data),
  };
};
