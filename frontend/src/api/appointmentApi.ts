import axiosInstance from "@/configs/axios";

export interface createAppointmentData {
  appointment_date: string;
  doctor_id: number;
  doctor_schedule_id: number;
}

export const bookingAppointment = async ({
  appointment_date,
  doctor_id,
  doctor_schedule_id,
}: createAppointmentData) => {
  const res = await axiosInstance.post("/appointments/booking", {
    appointment_date,
    doctor_id,
    doctor_schedule_id,
    booking_mode: "user_select",
  });
  return res.data;
};
