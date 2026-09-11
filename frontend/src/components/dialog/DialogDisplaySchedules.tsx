import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useGetDoctorSchedules } from "@/hooks/useGetDoctorSchedules";
import DoctorScheduleList from "../list/DoctorScheduleList";
import DoctorScheduleListSkeleton from "../skeleton/DoctorScheduleListSkeleton";
import { useBookingAppointmentStore } from "@/store/bookingAppointmentStore";
import { getWeekday } from "@/utils/formatDate";
import CalendarComponent from "../calendar/CalendarComponent";
import { Separator } from "../ui/separator";
import { Button } from "../ui/button";
import Loading from "../loading/Loading";
import AlertDialogConfirmBook from "./AlertDialogConfirmBook";
import { useDoctorBooking } from "@/hooks/useDoctorBooking";
import { useNotifyAppointmentSocket } from "@/hooks/useNotifyAppointmentSocket";
import { useSocket } from "@/hooks/useSocket";

interface DialogDisplaySchedulesProps {
  open: boolean;
  setOpen: (data: boolean) => void;
  doctorName: string;
  specialtyName: string;
  doctorId: number;
}
const DialogDisplaySchedules = ({
  open,
  setOpen,
  doctorName,
  specialtyName,
  doctorId,
}: DialogDisplaySchedulesProps) => {
  const { data: doctorSchedulesRes, isLoading: isLoadingSchedules } =
    useGetDoctorSchedules(doctorId);
  const { selectedDate, doctor_schedule_id, tempTime, reset } =
    useBookingAppointmentStore();
  const schedules = doctorSchedulesRes?.data || [];
  const {
    isPending,
    setIsPending,
    openConfirm,
    setOpenConfirm,
    handleBookingAppointment,
  } = useDoctorBooking();
  const socket = useSocket();
  useNotifyAppointmentSocket(socket, doctorId, setIsPending);

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(isOpen) => {
          setOpen(isOpen);
          if (!isOpen) {
            reset();
          }
        }}
      >
        <DialogContent
          className="w-full max-w-4xl sm:max-w-4xl p-0 gap-0 rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-2xl overflow-hidden bg-white dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="shrink-0 p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 pr-12">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100">
                Ca khám của BS. {doctorName}
              </DialogTitle>
              <DialogDescription className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Chuyên khoa {specialtyName} • Chọn ngày và khung giờ khám thực tế
              </DialogDescription>
            </DialogHeader>
          </div>

          {/* Nội dung body cuộn độc lập */}
          <div className="flex-1 min-h-0 min-w-0 overflow-y-auto overscroll-contain p-4 sm:p-6 scrollbar-soft">
            <div className="flex flex-col md:flex-row gap-6 md:gap-5 items-start">
              <div className="w-full md:w-[300px] shrink-0 flex justify-center">
                <CalendarComponent />
              </div>

              <Separator className="md:hidden w-full my-1 dark:bg-slate-800" />
              <Separator orientation="vertical" className="hidden md:block self-stretch h-auto dark:bg-slate-800" />

              <div className="flex-1 min-w-0 w-full space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide">
                    Khung giờ khám ({getWeekday(selectedDate)})
                  </h4>
                  {tempTime && (
                    <span className="text-xs font-semibold text-primary bg-primary/10 dark:bg-primary/20 dark:text-teal-300 px-2.5 py-1 rounded-full">
                      Đã chọn: {tempTime.start_time} - {tempTime.end_time}
                    </span>
                  )}
                </div>

                {isLoadingSchedules ? (
                  <DoctorScheduleListSkeleton />
                ) : (
                  <DoctorScheduleList
                    list={schedules[getWeekday(selectedDate)] || []}
                    selectedDate={selectedDate}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Footer cố định */}
          <div className="shrink-0 p-4 sm:p-5 bg-slate-50/90 dark:bg-slate-950/90 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs text-slate-500 dark:text-slate-400 text-center sm:text-left">
              {doctor_schedule_id ? (
                <span>Vui lòng nhấn &quot;Đặt lịch khám&quot; để sang bước xác nhận thông tin.</span>
              ) : (
                <span>Vui lòng bấm chọn một khung giờ khám màu xanh bên trên.</span>
              )}
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                className="flex-1 sm:flex-none rounded-xl"
              >
                Hủy
              </Button>
              <Button
                disabled={isPending || !doctor_schedule_id}
                onClick={() => setOpenConfirm(true)}
                className="flex-1 sm:flex-none rounded-xl font-bold !bg-primary hover:!bg-primary/90 text-white shadow-xs"
              >
                {isPending ? <Loading /> : "Đặt lịch khám"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {openConfirm && (
        <AlertDialogConfirmBook
          doctorId={doctorId}
          doctorName={doctorName}
          doctorScheduleId={doctor_schedule_id}
          handleConfirm={handleBookingAppointment}
          isPending={isPending}
          openConfirm={openConfirm}
          setOpenConfirm={setOpenConfirm}
          selectedDate={selectedDate}
          specialtyName={specialtyName}
          tempTime={tempTime}
        />
      )}
    </>
  );
};

export default DialogDisplaySchedules;
