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
      <div className="text-center py-6 text-gray-500">
        Không có ca khám nào trong ngày này.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header + Legend */}
      <div className="space-y-2 rounded-lg border bg-white shadow-sm p-2">
        {list.map((schedule) => (
          <DoctorScheduleCard
            key={schedule.id}
            item={schedule}
            selectedDate={selectedDate}
          />
        ))}
      </div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-center gap-3 text-sm">
        <Legend color="bg-sky" label="Đang chọn" />
        <Legend color="bg-white border" label="Khả dụng" />
        <Legend color="bg-red-400" label="Đã đặt" />
        <Legend color="bg-gray-300" label="Hết hạn / Không hoạt động" />
      </div>
    </div>
  );
};

export default DoctorScheduleList;
