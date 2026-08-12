import { CalendarDays, Stethoscope, User } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";
import { formatDate, formatDateYYYYMMDD } from "@/utils/formatDate";
import Loading from "../loading/Loading";
import { usePatientRelatives } from "@/hooks/usePatientPortalApi";

interface AlertDialogConfirmBookProps {
  doctorId: number;
  doctorScheduleId: number;
  openConfirm: boolean;
  setOpenConfirm: (data: boolean) => void;
  selectedDate: Date;
  tempTime: { start_time: string; end_time: string };
  doctorName: string;
  specialtyName: string;
  isPending: boolean;
  setIsPending?: (data: boolean) => void;
  handleConfirm: (data: {
    appointment_date: string;
    doctor_id: number;
    doctor_schedule_id: number;
    relative_id: number;
  }) => void;
}

const AlertDialogConfirmBook = ({
  doctorId,
  doctorScheduleId,
  openConfirm,
  setOpenConfirm,
  selectedDate,
  tempTime,
  doctorName,
  specialtyName,
  isPending,
  handleConfirm,
}: AlertDialogConfirmBookProps) => {
  const [selectedRelativeId, setSelectedRelativeId] = useState(0);
  const { data: relativesResponse, isLoading: isLoadingRelatives } =
    usePatientRelatives({
      page: 1,
      limit: 100,
      arrange: "asc",
    });
  const relatives = relativesResponse?.data.relatives ?? [];

  const handleBook = () => {
    if (!selectedRelativeId) {
      toast.error("Vui lòng chọn người thân cần đặt lịch khám!");
      return;
    }

    handleConfirm({
      appointment_date: formatDateYYYYMMDD(selectedDate),
      doctor_id: doctorId,
      doctor_schedule_id: doctorScheduleId,
      relative_id: selectedRelativeId,
    });
  };

  return (
    <AlertDialog open={openConfirm} onOpenChange={setOpenConfirm}>
      <AlertDialogContent className="max-w-md rounded-2xl shadow-lg bg-white dark:bg-neutral-900">
        <AlertDialogHeader className="space-y-3">
          <div className="flex items-center justify-center w-12 h-12 mx-auto rounded-full bg-primary/10 text-primary">
            <CalendarDays size={28} />
          </div>
          <AlertDialogTitle className="text-center text-xl font-bold">
            Xác nhận đặt lịch khám
          </AlertDialogTitle>

          <AlertDialogDescription asChild>
            <div className="text-center text-gray-600 dark:text-gray-300 space-y-2">
              <span>
                Bạn có chắc chắn muốn đặt lịch vào ngày{" "}
                <strong className="text-primary">
                  {formatDate(selectedDate, "vi-VN")}
                </strong>{" "}
                lúc{" "}
                <strong className="text-primary">
                  {tempTime?.start_time} - {tempTime?.end_time}
                </strong>
                ?
              </span>

              <div className="flex flex-col items-center gap-1 mt-2 text-sm">
                <div className="flex items-center gap-2">
                  <Stethoscope size={18} className="text-primary" />
                  Bác sĩ: <strong>{doctorName}</strong>
                </div>
                <div className="flex items-center gap-2">
                  <User size={18} className="text-primary" />
                  Chuyên khoa: <strong>{specialtyName}</strong>
                </div>
                <label className="w-full max-w-xs text-left font-medium text-gray-700 dark:text-gray-200">
                  Đặt lịch khám cho
                  <select
                    value={selectedRelativeId}
                    disabled={isLoadingRelatives || isPending}
                    onChange={(event) =>
                      setSelectedRelativeId(Number(event.target.value))
                    }
                    className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:bg-gray-100 dark:border-neutral-700 dark:bg-neutral-800 dark:text-gray-100"
                  >
                    <option value={0}>
                      {isLoadingRelatives
                        ? "Đang tải người thân..."
                        : "Chọn người thân"}
                    </option>
                    {relatives.map((relative) => (
                      <option key={relative.id} value={relative.id}>
                        {relative.fullname || "Chưa có tên"} -{" "}
                        {relative.relationship?.relationship_name}
                      </option>
                    ))}
                  </select>
                </label>
                {!isLoadingRelatives && relatives.length === 0 && (
                  <p className="w-full max-w-xs text-left text-sm text-error">
                    Bạn chưa có hồ sơ người thân nào.{" "}
                    <Link
                      to="/patient/relatives"
                      className="font-medium underline hover:text-primary"
                    >
                      Thêm người thân
                    </Link>{" "}
                    trước khi đặt lịch.
                  </p>
                )}
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter className="flex justify-between gap-4 mt-6">
          <AlertDialogCancel className="py-2 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-neutral-800 dark:hover:bg-neutral-700">
            Hủy
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={
              isPending ||
              isLoadingRelatives ||
              relatives.length === 0 ||
              !selectedRelativeId
            }
            onClick={handleBook}
            className="py-2 rounded-xl bg-primary text-white hover:bg-white hover:text-primary"
          >
            {isPending ? <Loading /> : "Xác nhận"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default AlertDialogConfirmBook;
