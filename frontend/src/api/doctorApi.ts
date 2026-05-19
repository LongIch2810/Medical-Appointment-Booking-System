import axiosInstance from "@/configs/axios";
import type { DoctorCardData } from "@/types/global";
import type { filterDoctors } from "@/types/interface/filterDoctors";

type ApiResponse<T> = {
  statusCode: number;
  success: boolean;
  data: T;
  error: unknown;
};

type DoctorListResponse = {
  doctors: DoctorCardData[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

type DoctorSpecialtyResponse = {
  id?: number;
  name?: string | null;
  specialty_name?: string | null;
  description?: string | null;
  img_url?: string | null;
  slug?: string | null;
};

type DoctorUserResponse = {
  id?: number;
  fullname?: string | null;
  picture?: string | null;
  address?: string | null;
  phone?: string | null;
};

type DoctorResponse = Omit<Partial<DoctorCardData>, "specialty"> & {
  email?: string;
  gender?: boolean;
  date_of_birth?: string | null;
  about_me?: string;
  created_at?: string;
  updated_at?: string;
  doctor_schedules?: unknown;
  user?: DoctorUserResponse;
  specialty?: string | DoctorSpecialtyResponse | null;
};

const getSpecialtyName = (specialty: DoctorResponse["specialty"]) => {
  if (!specialty) return "";
  if (typeof specialty === "string") return specialty;
  return specialty.name ?? specialty.specialty_name ?? "";
};

const normalizeDoctorCard = (doctor: DoctorResponse): DoctorCardData => ({
  id: Number(doctor.id ?? 0),
  user_id: Number(doctor.user_id ?? doctor.user?.id ?? 0),
  fullname: doctor.fullname ?? doctor.user?.fullname ?? "",
  picture: doctor.picture ?? doctor.user?.picture ?? null,
  workplace: doctor.workplace ?? "",
  experience: Number(doctor.experience ?? 0),
  doctor_level: doctor.doctor_level ?? "",
  avg_rating: Number(doctor.avg_rating ?? 0),
  appointments_completed: Number(doctor.appointments_completed ?? 0),
  specialty: getSpecialtyName(doctor.specialty),
  address: doctor.address ?? doctor.user?.address ?? "",
  phone: doctor.phone ?? doctor.user?.phone ?? "",
  isOutstanding: Boolean(doctor.isOutstanding),
});

const normalizeDoctorList = (doctors: unknown): DoctorCardData[] =>
  Array.isArray(doctors)
    ? (doctors as DoctorResponse[]).map(normalizeDoctorCard)
    : [];

export const fetchOutstandingDoctors = async (): Promise<
  ApiResponse<DoctorCardData[]>
> => {
  const res = await axiosInstance.get("/doctors/outstanding-doctors");
  return {
    ...res.data,
    data: normalizeDoctorList(res.data.data),
  };
};

export const fetchDoctors = async (
  data: filterDoctors,
): Promise<ApiResponse<DoctorListResponse>> => {
  const res = await axiosInstance.post("/doctors", data);
  return {
    ...res.data,
    data: {
      ...res.data.data,
      doctors: normalizeDoctorList(res.data.data?.doctors),
    },
  };
};

export const fetchDoctorDetail = async (doctorId: number) => {
  const res = await axiosInstance.get(`/doctors/${doctorId}`);
  return res.data;
};
