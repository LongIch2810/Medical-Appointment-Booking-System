import { useState } from "react";
import { toast } from "react-toastify";
import type { createAppointmentData } from "@/api/appointmentApi";
import { getApiErrorMessage } from "@/utils/getApiErrorMessage";
import { useBookingAppointment } from "./useBookingAppointment";

const DEFAULT_BOOKING_ERROR_MESSAGE = "Đặt lịch khám thất bại!";

export function useDoctorBooking() {
  const [isPending, setIsPending] = useState(false);
  const [openConfirm, setOpenConfirm] = useState(false);
  const { mutate } = useBookingAppointment();

  const handleBookingAppointment = (data: createAppointmentData) => {
    if (!data.appointment_date) {
      toast.error("Vui lòng chọn ngày khám!");
      return;
    }
    if (!data.doctor_id) {
      toast.error("Vui lòng chọn bác sĩ!");
      return;
    }
    if (!data.doctor_schedule_id) {
      toast.error("Vui lòng chọn khung giờ khám!");
      return;
    }
    if (!data.relative_id) {
      toast.error("Vui lòng chọn người thân cần đặt lịch khám!");
      return;
    }

    setIsPending(true);
    mutate(data, {
      onSuccess: () => {
        setIsPending(false);
        setOpenConfirm(false);
      },
      onError: (error) => {
        setIsPending(false);
        toast.error(getApiErrorMessage(error, DEFAULT_BOOKING_ERROR_MESSAGE));
      },
    });
  };

  return {
    isPending,
    setIsPending,
    openConfirm,
    setOpenConfirm,
    handleBookingAppointment,
  };
}
