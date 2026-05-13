import DoctorSchedule from 'src/entities/doctorSchedule.entity';
import { DayOfWeek } from 'src/shared/enums/dayOfWeek';
import { toHHMM } from './toMinutes';

export type GroupedSchedule = {
  id: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
};

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
      }[]
    >,
  );
};
