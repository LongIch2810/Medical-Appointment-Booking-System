import { useBookingAppointmentStore } from "@/store/bookingAppointmentStore";
import Legend from "../legend/Legend";
import { Calendar } from "../ui/calendar";
import { vi } from "date-fns/locale";

const CalendarComponent = () => {
  const { selectedDate, setSelectedDate } = useBookingAppointmentStore();
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  return (
    <div className="flex flex-col gap-4 w-full">
      <Calendar
        mode="single"
        defaultMonth={startOfToday}
        selected={selectedDate}
        onSelect={setSelectedDate}
        className="rounded-md border shadow w-full max-w-full md:max-w-md mx-auto dark:border-slate-800 dark:bg-slate-900"
        disabled={(date) => date < startOfToday}
        locale={vi}
        required={true}
      />

      {/* Legend responsive */}
      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-slate-500 dark:text-slate-400">
        <Legend color="bg-slate-200 dark:bg-slate-700" label="Đã qua / không chọn được" />
        <Legend color="bg-primary" label="Đang chọn" />
      </div>
    </div>
  );
};

export default CalendarComponent;
