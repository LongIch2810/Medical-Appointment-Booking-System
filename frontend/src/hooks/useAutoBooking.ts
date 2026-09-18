import { useState } from "react";
import { toast } from "react-toastify";
import type { AxiosError } from "axios";
import type { createAutoAppointmentData } from "@/api/appointmentApi";
import { getApiErrorMessage } from "@/utils/getApiErrorMessage";
import { formatDateYYYYMMDD, getVietnamTimeHHmm } from "@/utils/formatDate";
import { useAutoBookingAppointment } from "./useAutoBookingAppointment";

const DEFAULT_BOOKING_ERROR_MESSAGE = "Đặt lịch khám thất bại!";
const SLOT_UNAVAILABLE_MESSAGE =
  "Chưa tìm thấy ca phù hợp trong khoảng thời gian này. Vui lòng chọn ngày hoặc khoảng thời gian khác và thử lại.";

export function useAutoBooking() {
  const [isPending, setIsPending] = useState(false);
  const [openConfirm, setOpenConfirm] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const { mutate } = useAutoBookingAppointment();

  const clearApiError = () => setApiError(null);

  const handleAutoBooking = (
    data: createAutoAppointmentData,
    options?: {
      onSuccess?: () => void;
      onError?: (error: unknown, userFriendlyMessage: string) => void;
    }
  ) => {
    setApiError(null);

    if (!data.appointment_date) {
      const msg = "Vui lòng chọn ngày khám!";
      setApiError(msg);
      toast.error(msg);
      return;
    }
    if (!data.specialty_id) {
      const msg = "Vui lòng chọn chuyên khoa!";
      setApiError(msg);
      toast.error(msg);
      return;
    }
    if (!data.start_time) {
      const msg = "Vui lòng chọn giờ bắt đầu khám!";
      setApiError(msg);
      toast.error(msg);
      return;
    }
    if (data.appointment_date === formatDateYYYYMMDD(new Date())) {
      if (data.start_time <= getVietnamTimeHHmm(new Date())) {
        const msg = "Không thể đặt lịch cho khung giờ đã qua!";
        setApiError(msg);
        toast.error(msg);
        return;
      }
    }
    if (!data.relative_id && !data.new_relative_profile) {
      const msg = "Vui lòng chọn người thân cần đặt lịch khám!";
      setApiError(msg);
      toast.error(msg);
      return;
    }
    if (data.new_relative_profile) {
      const { fullname, relationship_code, gender } =
        data.new_relative_profile;
      if (!fullname || !relationship_code || gender === undefined) {
        const msg =
          "Vui lòng nhập đầy đủ họ tên, mối quan hệ và giới tính của người thân mới!";
        setApiError(msg);
        toast.error(msg);
        return;
      }
    }

    setIsPending(true);
    mutate(data, {
      onSuccess: () => {
        setIsPending(false);
        setOpenConfirm(false);
        setApiError(null);
        options?.onSuccess?.();
      },
      onError: (error: unknown) => {
        setIsPending(false);
        const axiosErr = error as AxiosError<{
          message?: string;
          error?: { message?: string; details?: unknown };
        }>;
        const status = axiosErr?.response?.status;
        const rawMessage =
          axiosErr?.response?.data?.message ||
          (typeof axiosErr?.response?.data?.error?.details === "string"
            ? axiosErr.response.data.error.details
            : "");

        const isSlotUnavailable =
          status === 409 ||
          (typeof rawMessage === "string" &&
            (rawMessage.includes("Không tìm thấy") ||
              rawMessage.includes("phù hợp") ||
              rawMessage.includes("khung giờ")));

        const errorMessage = isSlotUnavailable
          ? SLOT_UNAVAILABLE_MESSAGE
          : getApiErrorMessage(error, DEFAULT_BOOKING_ERROR_MESSAGE);

        setApiError(errorMessage);
        if (options?.onError) {
          options.onError(error, errorMessage);
        } else {
          toast.error(errorMessage);
        }
      },
    });
  };

  return {
    isPending,
    setIsPending,
    openConfirm,
    setOpenConfirm,
    apiError,
    setApiError,
    clearApiError,
    handleAutoBooking,
  };
}
