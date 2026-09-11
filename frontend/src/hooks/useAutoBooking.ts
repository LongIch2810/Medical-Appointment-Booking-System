import { useState } from "react";
import { toast } from "react-toastify";
import type { createAutoAppointmentData } from "@/api/appointmentApi";
import { getApiErrorMessage } from "@/utils/getApiErrorMessage";
import { useAutoBookingAppointment } from "./useAutoBookingAppointment";

const DEFAULT_BOOKING_ERROR_MESSAGE = "Đặt lịch khám thất bại!";

export function useAutoBooking() {
  const [isPending, setIsPending] = useState(false);
  const [openConfirm, setOpenConfirm] = useState(false);
  const { mutate } = useAutoBookingAppointment();

  const handleAutoBooking = (
    data: createAutoAppointmentData,
    options?: { onSuccess?: () => void }
  ) => {
    if (!data.appointment_date) {
      toast.error("Vui lòng chọn ngày khám!");
      return;
    }
    if (!data.specialty_id) {
      toast.error("Vui lòng chọn chuyên khoa!");
      return;
    }
    if (!data.start_time) {
      toast.error("Vui lòng chọn giờ bắt đầu khám!");
      return;
    }
    if (!data.relative_id && !data.new_relative_profile) {
      toast.error("Vui lòng chọn người thân cần đặt lịch khám!");
      return;
    }
    if (data.new_relative_profile) {
      const { fullname, relationship_code, gender } =
        data.new_relative_profile;
      if (!fullname || !relationship_code || gender === undefined) {
        toast.error(
          "Vui lòng nhập đầy đủ họ tên, mối quan hệ và giới tính của người thân mới!"
        );
        return;
      }
    }

    setIsPending(true);
    mutate(data, {
      onSuccess: () => {
        setIsPending(false);
        setOpenConfirm(false);
        options?.onSuccess?.();
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
    handleAutoBooking,
  };
}
