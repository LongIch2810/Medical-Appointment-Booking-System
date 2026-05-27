import axiosInstance from "@/configs/axios";
import { normalizeAppointment, type RawAppointment } from "@/api/appointmentApi";
import type { ApiResponse } from "@/types/interface/api.interface";
import type {
  CreateExaminationResultPayload,
  ExaminationResult,
  ExaminationResultListPayload,
  ExaminationResultListResponse,
  UpdateExaminationResultPayload,
} from "@/types/interface/examinationResult.interface";

type RawExaminationResult = Omit<ExaminationResult, "appointment"> & {
  appointment?: RawAppointment | null;
};

type RawExaminationResultListResponse = Omit<
  ExaminationResultListResponse,
  "examinationResults"
> & {
  examination_results?: RawExaminationResult[];
  examinationResults?: RawExaminationResult[];
};

function normalizeExaminationResult(
  result: RawExaminationResult,
): ExaminationResult {
  const appointment = result.appointment
    ? normalizeAppointment(result.appointment)
    : null;

  return {
    ...result,
    appointment,
    patient: result.patient ?? appointment?.patient,
    doctor: result.doctor ?? appointment?.doctor,
    examined_at: result.examined_at ?? result.created_at,
  };
}

function normalizeExaminationResultListResponse(
  data: RawExaminationResultListResponse,
): ExaminationResultListResponse {
  const results = data.examinationResults ?? data.examination_results ?? [];

  return {
    ...data,
    examinationResults: results.map(normalizeExaminationResult),
  };
}

export const fetchExaminationResults = async (
  data: ExaminationResultListPayload,
) => {
  const res = await axiosInstance.post<
    ApiResponse<RawExaminationResultListResponse>
  >("/examination-result", data);
  return {
    ...res.data,
    data: normalizeExaminationResultListResponse(res.data.data),
  };
};

export const fetchPersonalExaminationResults = async (
  data: ExaminationResultListPayload,
) => {
  const res = await axiosInstance.post<
    ApiResponse<RawExaminationResultListResponse>
  >("/examination-result/personal/list", data);
  return {
    ...res.data,
    data: normalizeExaminationResultListResponse(res.data.data),
  };
};

export const fetchDoctorExaminationResults = async (
  data: ExaminationResultListPayload,
) => {
  const res = await axiosInstance.post<
    ApiResponse<RawExaminationResultListResponse>
  >("/examination-result/personal/doctor/list", data);
  return {
    ...res.data,
    data: normalizeExaminationResultListResponse(res.data.data),
  };
};

export const fetchExaminationResultDetail = async (resultId: number) => {
  const res = await axiosInstance.get<ApiResponse<RawExaminationResult>>(
    `/examination-result/${resultId}`,
  );
  return {
    ...res.data,
    data: normalizeExaminationResult(res.data.data),
  };
};

export const createExaminationResult = async (
  data: CreateExaminationResultPayload,
) => {
  const res = await axiosInstance.post<ApiResponse<RawExaminationResult>>(
    "/examination-result/create",
    data,
  );
  return {
    ...res.data,
    data: normalizeExaminationResult(res.data.data),
  };
};

export const updateExaminationResult = async (
  resultId: number,
  data: UpdateExaminationResultPayload,
) => {
  const res = await axiosInstance.patch<ApiResponse<RawExaminationResult>>(
    `/examination-result/${resultId}`,
    data,
  );
  return {
    ...res.data,
    data: normalizeExaminationResult(res.data.data),
  };
};

export const deleteExaminationResult = async (resultId: number) => {
  const res = await axiosInstance.delete<ApiResponse<RawExaminationResult>>(
    `/examination-result/${resultId}`,
  );
  return {
    ...res.data,
    data: normalizeExaminationResult(res.data.data),
  };
};
