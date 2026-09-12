import { formatAnswerTemplate } from "./answerTemplate.js";

export const APPOINTMENT_SLOT_UNAVAILABLE = "APPOINTMENT_SLOT_UNAVAILABLE";

export type BookingFailure = {
  code: string;
  details: string;
  patientName?: string;
  specialtyName?: string;
  appointmentDate?: string;
  startTime?: string;
};

function formatAppointmentDate(date?: string) {
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return "ngày đã yêu cầu";
  }

  const [year, month, day] = date.split("-");
  return `${day}/${month}/${year}`;
}

export function formatBookingFailure(error: BookingFailure) {
  if (error.code === APPOINTMENT_SLOT_UNAVAILABLE) {
    const patientName = error.patientName ?? "Người được khám";
    const specialtyName = error.specialtyName ?? "chuyên khoa đã chọn";
    const appointmentDate = formatAppointmentDate(error.appointmentDate);
    const startTime = error.startTime ? ` lúc ${error.startTime}` : "";

    return formatAnswerTemplate({
      summary: "Chưa đặt được lịch khám.",
      details: `${patientName} chưa có lịch khám ${specialtyName} vào ${appointmentDate}${startTime} vì không còn ca trống.`,
      note: "Vui lòng chọn ngày hoặc giờ khác.",
    });
  }

  return formatAnswerTemplate({
    summary: "Đặt lịch không thành công.",
    details: error.details,
    note: "Vui lòng kiểm tra lại thông tin hoặc chọn khung giờ khác.",
  });
}
