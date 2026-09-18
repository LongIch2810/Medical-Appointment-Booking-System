import React from "react";
import { useBookingAppointmentStore } from "@/store/bookingAppointmentStore";
import Legend from "../legend/Legend";
import { Calendar } from "../ui/calendar";
import { vi } from "date-fns/locale";
import { cn } from "@/lib/utils";

export interface CalendarComponentProps {
  className?: string;
  calendarClassName?: string;
  selectedDate?: Date;
  onSelect?: (date: Date | undefined) => void;
  minDate?: Date;
  hideLegend?: boolean;
}

const CalendarComponent: React.FC<CalendarComponentProps> = ({
  className,
  calendarClassName,
  selectedDate: propSelectedDate,
  onSelect: propOnSelect,
  minDate,
  hideLegend = false,
}) => {
  const store = useBookingAppointmentStore();
  const selectedDate = propSelectedDate !== undefined ? propSelectedDate : store.selectedDate;
  const setSelectedDate = propOnSelect ?? store.setSelectedDate;

  const startOfToday = minDate ?? new Date();
  startOfToday.setHours(0, 0, 0, 0);

  return (
    <div className={cn("flex flex-col gap-3 w-full", className)}>
      <div className="flex justify-center w-full">
        <Calendar
          mode="single"
          defaultMonth={selectedDate || startOfToday}
          selected={selectedDate}
          onSelect={setSelectedDate}
          className={cn(
            "rounded-xl border border-border bg-card p-2 sm:p-3 shadow-2xs w-full max-w-full md:max-w-md mx-auto text-card-foreground",
            calendarClassName
          )}
          disabled={(date) => date < startOfToday}
          locale={vi}
          required={true}
        />
      </div>

      {/* Legend responsive */}
      {!hideLegend && (
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
          <Legend
            color="bg-muted text-muted-foreground border border-border/50"
            label="Đã qua / không chọn được"
          />
          <Legend color="bg-primary" label="Đang chọn" />
        </div>
      )}
    </div>
  );
};

export default CalendarComponent;
