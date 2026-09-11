import type { DoctorSchedule } from "@/types/interface/doctorSchedule.interface";
import DoctorScheduleCard from "../card/DoctorScheduleCard";
import Legend from "../legend/Legend";

interface DoctorScheduleListProps {
  list: DoctorSchedule[];
  selectedDate: Date;
}

const DoctorScheduleList = ({
  list,
  selectedDate,
}: DoctorScheduleListProps) => {
  if (!list || list.length === 0) {
    return (
      <div className="text-center py-6 text-slate-500 dark:text-slate-400">
        Không có ca khám nào trong ngày này.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Danh sách ca khám */}
      <div className="space-y-2.5 rounded-lg border bg-white shadow-sm p-2.5 dark:border-slate-800 dark:bg-slate-900/60">
        {list.map((schedule) => (
          <DoctorScheduleCard
            key={schedule.id}
            item={schedule}
            selectedDate={selectedDate}
          />
        ))}
      </div>
      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-slate-500 dark:text-slate-400">
        <Legend color="bg-sky-500" label="Đang chọn" />
        <Legend color="bg-white border border-slate-300 dark:bg-slate-900 dark:border-slate-700" label="Khả dụng" />
        <Legend color="bg-red-400 dark:bg-rose-500" label="Đã đặt" />
        <Legend color="bg-slate-300 dark:bg-slate-700" label="Hết hạn / Không hoạt động" />
      </div>
    </div>
  );
};

export default DoctorScheduleList;
