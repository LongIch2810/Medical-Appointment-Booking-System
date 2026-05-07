import axiosInstance from "@/configs/axios";
import type {
  AppointmentListResponse,
  ApiResponse,
  ChannelListResponse,
  ExaminationResult,
  ExaminationResultListResponse,
  HealthProfile,
  HealthProfileListResponse,
  HealthProfilePayload,
  Message,
  MessageListResponse,
  PatientAppointment,
  PatientDashboard,
  PatientListPayload,
  PatientUser,
  PersonalAppointmentsPayload,
  RelationshipListResponse,
  Relative,
  RelativeListResponse,
  RelativePayload,
  SendMessagePayload,
  UpdateRelativePayload,
} from "@/types/interface/patient.interface";

export const fetchPatientDashboard = async () => {
  const res = await axiosInstance.get<ApiResponse<PatientDashboard>>(
    "/dashboard/patient",
  );
  return res.data;
};

export const updatePatientProfile = async (data: FormData) => {
  const res = await axiosInstance.patch<ApiResponse<PatientUser>>(
    "/users/update-info",
    data,
  );
  return res.data;
};

export const changePatientPassword = async (data: {
  old_password: string;
  new_password: string;
}) => {
  const res = await axiosInstance.put<ApiResponse<{ message: string }>>(
    "/users/change-password",
    data,
  );
  return res.data;
};

export const fetchPatientAppointments = async (
  data: PersonalAppointmentsPayload,
) => {
  const res = await axiosInstance.post<ApiResponse<AppointmentListResponse>>(
    "/appointments/personal-appointments",
    data,
  );
  return res.data;
};

export const cancelPatientAppointment = async (appointmentId: number) => {
  const res = await axiosInstance.delete<ApiResponse<PatientAppointment>>(
    `/appointments/cancel/${appointmentId}`,
  );
  return res.data;
};

export const fetchPatientAppointmentDetail = async (appointmentId: number) => {
  const res = await axiosInstance.get<ApiResponse<PatientAppointment>>(
    `/appointments/${appointmentId}`,
  );
  return res.data;
};

export const fetchPatientRelatives = async (params: PatientListPayload) => {
  const res = await axiosInstance.get<ApiResponse<RelativeListResponse>>(
    "/relatives/patient/relatives",
    { params },
  );
  return res.data;
};

export const createPatientRelative = async (data: RelativePayload) => {
  const res = await axiosInstance.post<ApiResponse<Relative>>(
    "/relatives",
    data,
  );
  return res.data;
};

export const updatePatientRelative = async ({
  relativeId,
  data,
}: {
  relativeId: number;
  data: UpdateRelativePayload;
}) => {
  const res = await axiosInstance.patch<ApiResponse<Relative>>(
    `/relatives/${relativeId}`,
    data,
  );
  return res.data;
};

export const deletePatientRelative = async (relativeId: number) => {
  const res = await axiosInstance.delete<ApiResponse<Relative>>(
    `/relatives/${relativeId}`,
  );
  return res.data;
};

export const fetchRelationships = async (data: PatientListPayload) => {
  const res = await axiosInstance.post<ApiResponse<RelationshipListResponse>>(
    "/relationships",
    data,
  );
  return res.data;
};

export const fetchPatientHealthProfiles = async (data: PatientListPayload) => {
  const res = await axiosInstance.post<ApiResponse<HealthProfileListResponse>>(
    "/health-profiles/patient/list",
    data,
  );
  return res.data;
};

export const fetchPatientHealthProfileDetail = async (relativeId: number) => {
  const res = await axiosInstance.get<ApiResponse<HealthProfile>>(
    `/health-profiles/${relativeId}`,
  );
  return res.data;
};

export const updatePatientHealthProfile = async ({
  relativeId,
  data,
}: {
  relativeId: number;
  data: HealthProfilePayload;
}) => {
  const res = await axiosInstance.patch<ApiResponse<HealthProfile>>(
    `/health-profiles/update/${relativeId}`,
    data,
  );
  return res.data;
};

export const fetchPatientExaminationResults = async (
  data: PatientListPayload & { relativeId?: number; date?: string },
) => {
  const res = await axiosInstance.post<
    ApiResponse<ExaminationResultListResponse>
  >("/examination-result/personal/list", data);
  return res.data;
};

export const fetchPatientExaminationResultDetail = async (resultId: number) => {
  const res = await axiosInstance.get<ApiResponse<ExaminationResult>>(
    `/examination-result/${resultId}`,
  );
  return res.data;
};

export const fetchPatientChannels = async (data: PatientListPayload) => {
  const res = await axiosInstance.post<ApiResponse<ChannelListResponse>>(
    "/channels/personal-channels",
    data,
  );
  return res.data;
};

export const fetchPatientMessages = async (
  channelId: number,
  page: number = 1,
) => {
  const res = await axiosInstance.get<ApiResponse<MessageListResponse>>(
    `/messages/${channelId}?page=${page}`,
  );
  return res.data;
};

export const sendPatientMessage = async (data: SendMessagePayload) => {
  const res = await axiosInstance.post<ApiResponse<Message>>("/messages", data);
  return res.data;
};
