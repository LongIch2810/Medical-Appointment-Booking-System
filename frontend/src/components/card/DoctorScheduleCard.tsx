import { CheckCircle2, Clock, Lock, XCircle } from "lucide-react";
import { useNow } from "@/hooks/useNow";
import type { DoctorScheduleCardProps } from "@/types/global";
import {
  checkExpireTime,
  checkTimeBooked,
  formatTime,
  toHHMM,
} from "@/utils/formatTime";
import type { DoctorSchedule } from "@/types/interface/doctorSchedule.interface";
import { useBookingAppointmentStore } from "@/store/bookingAppointmentStore";

const DoctorScheduleCard = ({
  item,
  selectedDate,
}: DoctorScheduleCardProps) => {
  const { id, start_time, end_time, is_active, appointments } = item;
  const now = useNow();
  const timeNow = formatTime(now);
  const { doctor_schedule_id, setDoctorScheduleId, setTempTime } =
    useBookingAppointmentStore();

  const isExpired = checkExpireTime(
    selectedDate,
    toHHMM(start_time),
    toHHMM(end_time),
    timeNow
  );

  const isBooked =
    appointments &&
    appointments.length > 0 &&
    checkTimeBooked(selectedDate, appointments);

  const isDisabled = isExpired || !is_active || isBooked;
  const isSelected = doctor_schedule_id === id;

  const handleClick = (item: DoctorSchedule) => {
    if (isDisabled) return;
    setDoctorScheduleId(item.id);
    setTempTime({ start_time: item.start_time, end_time: item.end_time });
  };

  return (
    <button
      key={id}
      type="button"
      disabled={isDisabled}
      aria-pressed={isSelected}
      onClick={() => handleClick(item)}
      className={`w-full
        rounded-xl border text-sm sm:text-base
        transition-all duration-200 ease-in-out p-3
        flex items-center justify-between
        ${
          isExpired || !is_active
            ? "bg-gray-100 text-gray-500 cursor-not-allowed"
            : isBooked
            ? "bg-red-400 text-white cursor-not-allowed"
            : isSelected
            ? "bg-sky-500 text-white cursor-pointer"
            : "hover:shadow-md hover:scale-[1.02] bg-white cursor-pointer"
        }`}
    >
      {/* Thời gian */}
      <div className="flex items-center gap-2">
        <Clock className="h-4 w-4 flex-shrink-0" />
        <span className="font-medium">
          {toHHMM(start_time)} - {toHHMM(end_time)}
        </span>
      </div>

      {/* Trạng thái (không chỉ dựa vào màu sắc) */}
      {isBooked && (
        <span className="flex items-center gap-1 text-xs font-medium">
          <XCircle className="h-4 w-4" /> Đã đặt
        </span>
      )}
      {!isBooked && (isExpired || !is_active) && (
        <span className="flex items-center gap-1 text-xs font-medium">
          <Lock className="h-4 w-4" /> Hết hạn
        </span>
      )}
      {!isBooked && !isExpired && is_active && isSelected && (
        <span className="flex items-center gap-1 text-xs font-medium">
          <CheckCircle2 className="h-4 w-4" /> Đang chọn
        </span>
      )}
    </button>
  );
};

export default DoctorScheduleCard;
