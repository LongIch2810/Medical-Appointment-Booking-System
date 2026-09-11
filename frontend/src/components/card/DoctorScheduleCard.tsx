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
      className={`w-full min-w-0
        rounded-xl border text-sm
        transition-all duration-200 ease-in-out p-3
        flex items-center justify-between gap-2
        ${
          isExpired || !is_active
            ? "bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed"
            : isBooked
            ? "bg-red-50 border-red-200 text-red-600 cursor-not-allowed"
            : isSelected
            ? "bg-sky-500 border-sky-500 text-white cursor-pointer shadow-sm"
            : "border-slate-200 bg-white hover:border-sky-300 hover:shadow-md cursor-pointer"
        }`}
    >
      {/* Thời gian */}
      <div className="flex items-center gap-2 min-w-0">
        <Clock className="h-4 w-4 shrink-0" />
        <span className="font-medium truncate">
          {toHHMM(start_time)} - {toHHMM(end_time)}
        </span>
      </div>

      {/* Trạng thái (không chỉ dựa vào màu sắc) */}
      {isBooked && (
        <span className="flex items-center gap-1 shrink-0 whitespace-nowrap text-[11px] font-semibold px-2 py-1 rounded-full bg-red-100 text-red-600">
          <XCircle className="h-3.5 w-3.5" /> Đã đặt
        </span>
      )}
      {!isBooked && (isExpired || !is_active) && (
        <span className="flex items-center gap-1 shrink-0 whitespace-nowrap text-[11px] font-semibold px-2 py-1 rounded-full bg-slate-200 text-slate-500">
          <Lock className="h-3.5 w-3.5" /> Hết hạn
        </span>
      )}
      {!isBooked && !isExpired && is_active && isSelected && (
        <span className="flex items-center gap-1 shrink-0 whitespace-nowrap text-[11px] font-semibold px-2 py-1 rounded-full bg-white/20 text-white">
          <CheckCircle2 className="h-3.5 w-3.5" /> Đang chọn
        </span>
      )}
    </button>
  );
};

export default DoctorScheduleCard;
