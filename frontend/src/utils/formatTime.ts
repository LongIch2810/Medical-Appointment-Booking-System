import type { PatientAppointment } from "../types/interface/patient.interface";
import { formatDate } from "./formatDate";

export const formatTime = (date: Date): string => {
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
};

export const toHHMM = (time: string): string => {
  return time.slice(0, 5);
};

export const toMinutes = (time: string): number => {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
};

export const checkExpireTime = (
  selectedDate: Date,
  start_time: string,
  end_time: string,
  time: string,
): boolean => {
  const today = new Date();
  const todayDateOnly = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );
  const selectedDateOnly = new Date(
    selectedDate.getFullYear(),
    selectedDate.getMonth(),
    selectedDate.getDate(),
  );

  // Nếu ngày đã qua -> hết hạn
  if (selectedDateOnly < todayDateOnly) return true;

  // Nếu ngày còn ở tương lai -> chưa hết hạn
  if (selectedDateOnly > todayDateOnly) return false;
  const sMinutes = toMinutes(start_time);
  const eMinutes = toMinutes(end_time);
  const minutes = toMinutes(time);

  return (minutes >= sMinutes && minutes <= eMinutes) || minutes > eMinutes;
};

export const checkTimeBooked = (
  selectedDate: Date,
  appointments: PatientAppointment[],
): boolean => {
  let isBooked = false;
  (Array.isArray(appointments) ? appointments : []).forEach(
    (appointment: PatientAppointment) => {
      if (
        formatDate(selectedDate, "vi-VN", false) ===
        appointment.appointment_date
      ) {
        isBooked = true;
      }
    },
  );

  return isBooked;
};
