import DoctorSchedule from 'src/entities/doctorSchedule.entity';
import { AppointmentStatus } from 'src/shared/enums/appointmentStatus';
import { DayOfWeek } from 'src/shared/enums/dayOfWeek';
import { formatDateDDMMYYYY } from './formatDate';
import { toHHMM } from './toMinutes';

export type GroupedScheduleAppointment = {
  id: number;
  appointment_date: string;
  status: AppointmentStatus;
};

export type GroupedSchedule = {
  id: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
  appointments: GroupedScheduleAppointment[];
};

const OCCUPIED_APPOINTMENT_STATUSES = new Set([
  AppointmentStatus.PENDING,
  AppointmentStatus.CONFIRMED,
]);

export const groupSchedulesByDay = (
  schedules: DoctorSchedule[] = [],
): Record<DayOfWeek, GroupedSchedule[]> => {
  return schedules.reduce(
    (acc, schedule): Record<DayOfWeek, GroupedSchedule[]> => {
      if (!schedule?.start_time || !schedule?.end_time) {
        return acc;
      }

      const day = schedule.day_of_week;
      if (!acc[day]) {
        acc[day] = [];
      }

      acc[day].push({
        id: schedule.id,
        start_time: toHHMM(schedule.start_time),
        end_time: toHHMM(schedule.end_time),
        is_active: schedule.is_active,
        appointments: (schedule.appointments ?? []).flatMap((appointment) => {
          if (!OCCUPIED_APPOINTMENT_STATUSES.has(appointment.status)) return [];

          const appointmentDate = formatDateDDMMYYYY(
            appointment.appointment_date,
          );
          if (!appointmentDate) return [];

          return [
            {
              id: appointment.id,
              appointment_date: appointmentDate.replace(/\//g, '-'),
              status: appointment.status,
            },
          ];
        }),
      });

      return acc;
    },
    {} as Record<
      DayOfWeek,
      {
        id: number;
        start_time: string;
        end_time: string;
        is_active: boolean;
        appointments: GroupedScheduleAppointment[];
      }[]
    >,
  );
};
