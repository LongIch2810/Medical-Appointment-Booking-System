import { useBookingAppointmentStore } from "@/store/bookingAppointmentStore";
import { formatDate, getWeekday, toDate } from "@/utils/formatDate";
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

    const parseAppointmentDate = (appointmentDate: string) => {
      if (/^\d{4}-\d{2}-\d{2}/.test(appointmentDate)) {
        return new Date(appointmentDate);
      }

      return toDate(appointmentDate);
    };

    const getDoctorScheduleId = (slot: AppointmentSlot) =>
      slot.doctor_schedule_id ?? slot.doctor_schedule?.id;

    const normalizeSlot = (slot: AppointmentSlot): AppointmentSlot => ({
      ...slot,
      appointment_date: formatDate(
        parseAppointmentDate(slot.appointment_date),
        "vi-VN",
        false,
      ),
      doctor_schedule_id: getDoctorScheduleId(slot),
    });

    const markSlotBooked = (slot: AppointmentSlot) => {
      const bookedSlot = normalizeSlot(slot);
      const doctorScheduleId = getDoctorScheduleId(bookedSlot);
      if (!doctorScheduleId || !bookedSlot.appointment_date) return;

      const patchSchedules = (schedules: GroupedSchedules | undefined) => {
        const weekday = getWeekday(
          parseAppointmentDate(bookedSlot.appointment_date),
        );
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

      const appointmentDate = parseAppointmentDate(data.appointment_date);
      const startTime = data.doctor_schedule?.start_time ?? "";
      const endTime = data.doctor_schedule?.end_time ?? "";
      const doctorName =
        data.doctor?.user?.fullname ?? data.doctor?.fullname ?? "bác sĩ";

      toast.success(
        `Đặt lịch khám thành công vào lúc ${startTime} - ${endTime} ${formatDate(
          appointmentDate,
          "vi-VN",
        )} với BS.${doctorName}`,
      );
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
