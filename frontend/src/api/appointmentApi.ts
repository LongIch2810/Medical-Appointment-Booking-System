import axiosInstance from "@/configs/axios";

// Thông tin để backend tự tạo hồ sơ người thân mới (kèm hồ sơ sức khỏe rỗng)
// ngay trong lúc đặt lịch, dùng khi chưa có relative_id sẵn — khớp
// BodyCreateRelativeDto ở backend (phone và dob tùy chọn, các field còn lại
// bắt buộc).
export interface NewRelativeProfile {
  fullname: string;
  relationship_code: string;
  gender: boolean;
  dob?: string;
  phone?: string;
}

// relative_id và new_relative_profile loại trừ lẫn nhau — luôn cung cấp
// đúng một trong hai (khớp IsValidPatientSelectionConstraint ở backend).
type PatientSelection =
  | { relative_id: number; new_relative_profile?: undefined }
  | { relative_id?: undefined; new_relative_profile: NewRelativeProfile };

export type createAppointmentData = {
  appointment_date: string;
  doctor_id: number;
  doctor_schedule_id: number;
} & PatientSelection;

export type createAutoAppointmentData = {
  appointment_date: string;
  specialty_id: number;
  start_time: string;
  end_time?: string;
} & PatientSelection;

export const bookingAppointment = async ({
  appointment_date,
  doctor_schedule_id,
  relative_id,
  new_relative_profile,
}: createAppointmentData) => {
  const res = await axiosInstance.post("/appointments/booking", {
    appointment_date,
    doctor_schedule_id,
    ...(relative_id ? { relative_id } : { new_relative_profile }),
    booking_mode: "user_select",
  });
  return res.data;
};

export const bookingAutoAppointment = async ({
  appointment_date,
  relative_id,
  new_relative_profile,
  specialty_id,
  start_time,
  end_time,
}: createAutoAppointmentData) => {
  const res = await axiosInstance.post("/appointments/booking", {
    appointment_date,
    ...(relative_id ? { relative_id } : { new_relative_profile }),
    specialty_id,
    start_time,
    ...(end_time ? { end_time } : {}),
    booking_mode: "user_select",
  });
  return res.data;
};
