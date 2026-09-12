import { useBookingAppointmentStore } from "@/store/bookingAppointmentStore";
import { formatDate, getWeekdayKey } from "@/utils/formatDate";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { toast } from "react-toastify";
import type { Socket } from "socket.io-client";

type AppointmentSocketSchedule = {
  id: number;
  start_time: string;
  end_time: string;
  appointments?: AppointmentSlot[];
};

type AppointmentSlot = {
  id?: number;
  appointment_date: string;
  doctor_schedule_id?: number;
  doctor_schedule?: {
    id?: number;
    start_time?: string;
    end_time?: string;
  };
  doctor?: {
    fullname?: string;
    user?: {
      fullname?: string;
    };
  };
};

type GroupedSchedules = Record<string, AppointmentSocketSchedule[]>;

type ApiCacheResponse<T> = {
  data: T;
};

const parseAppointmentDate = (appointmentDate: string): Date | null => {
  const isoDate = appointmentDate.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoDate) {
    const [, year, month, day] = isoDate;
    return new Date(Number(year), Number(month) - 1, Number(day));
  }

  const displayDate = appointmentDate.match(
    /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/,
  );
  if (!displayDate) return null;

  const [, day, month, year] = displayDate;
  const parsedDate = new Date(Number(year), Number(month) - 1, Number(day));

  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
};

export function useNotifyAppointmentSocket(
  socket: Socket | null,
  doctorId: number,
  setIsPending: (data: boolean) => void,
) {
  const queryClient = useQueryClient();
  const { setDoctorScheduleId, setTempTime, setDoctorId } =
    useBookingAppointmentStore();

  useEffect(() => {
    if (!socket || !doctorId) return;

    const getDoctorScheduleId = (slot: AppointmentSlot) =>
      slot.doctor_schedule_id ?? slot.doctor_schedule?.id;

    const markSlotBooked = (slot: AppointmentSlot) => {
      const parsedAppointmentDate = parseAppointmentDate(
        slot.appointment_date,
      );
      if (!parsedAppointmentDate) return;

      const bookedSlot: AppointmentSlot = {
        ...slot,
        appointment_date: formatDate(
          parsedAppointmentDate,
          "vi-VN",
          false,
        ),
        doctor_schedule_id: getDoctorScheduleId(slot),
      };
      const doctorScheduleId = getDoctorScheduleId(bookedSlot);
      if (!doctorScheduleId || !bookedSlot.appointment_date) return;

      const patchSchedules = (schedules: GroupedSchedules | undefined) => {
        const weekday = getWeekdayKey(parsedAppointmentDate);
        if (!schedules?.[weekday]) return schedules;

        return {
          ...schedules,
          [weekday]: schedules[weekday].map((schedule) => {
            if (schedule.id !== doctorScheduleId) return schedule;

            const appointments = schedule.appointments ?? [];
            const alreadyBooked = appointments.some(
              (appointment) =>
                (bookedSlot.id && appointment.id === bookedSlot.id) ||
                appointment.appointment_date === bookedSlot.appointment_date,
            );

            return {
              ...schedule,
              appointments: alreadyBooked
                ? appointments
                : [...appointments, bookedSlot],
            };
          }),
        };
      };

      queryClient.setQueryData(
        ["doctor-schedules", Number(doctorId)],
        (oldData: ApiCacheResponse<GroupedSchedules> | undefined) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            data: patchSchedules(oldData.data),
          };
        },
      );

      queryClient.setQueryData(
        ["doctor-detail", Number(doctorId)],
        (
          oldData:
            | ApiCacheResponse<{ doctor_schedules?: GroupedSchedules }>
            | undefined,
        ) => {
          if (!oldData?.data) return oldData;
          return {
            ...oldData,
            data: {
              ...oldData.data,
              doctor_schedules: patchSchedules(oldData.data.doctor_schedules),
            },
          };
        },
      );
    };

    const handleAppointmentSuccess = (data: AppointmentSlot) => {
      markSlotBooked(data);
      setIsPending(false);

      setDoctorScheduleId(0);
      setTempTime({ start_time: "", end_time: "" });
      setDoctorId(0);
      queryClient.invalidateQueries({ queryKey: ["patient-appointments"] });
      queryClient.invalidateQueries({ queryKey: ["patient-dashboard"] });
    };

    const handleAppointmentFail = (message: string) => {
      setIsPending(false);
      toast.error(message);
    };

    const handleAppointmentSlotBooked = (slot: AppointmentSlot) => {
      markSlotBooked(slot);
    };

    socket.on("appointment:success", handleAppointmentSuccess);
    socket.on("appointment:fail", handleAppointmentFail);
    socket.on("appointment:slotBooked", handleAppointmentSlotBooked);

    return () => {
      socket.off("appointment:success", handleAppointmentSuccess);
      socket.off("appointment:fail", handleAppointmentFail);
      socket.off("appointment:slotBooked", handleAppointmentSlotBooked);
    };
  }, [
    doctorId,
    queryClient,
    setDoctorId,
    setDoctorScheduleId,
    setIsPending,
    setTempTime,
    socket,
  ]);
}
