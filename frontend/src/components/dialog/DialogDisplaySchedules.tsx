import {
  Dialog,
  DialogClose,
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
import { useProfile } from "@/hooks/useProfile";
import { useNotifyAppointmentSocket } from "@/hooks/useNotifyAppointmentSocket";
import { useSocket } from "@/hooks/useSocket";
import { X } from "lucide-react";

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
  const { data: userRes } = useProfile();
  const socket = useSocket(userRes?.data?.id);
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
          showCloseButton={false}
          className="
    fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
    w-[95vw] md:max-w-[90vw] lg:max-w-[70vw] 2xl:max-w-[50vw]
    max-h-[90vh]
    p-3
    rounded-lg shadow-lg
    text-sm sm:text-base
  "
        >
          <DialogClose
            className="absolute -right-4 -top-4 z-50 rounded-full bg-error text-white
               hover:opacity-90 transition-opacity flex items-center justify-center h-7 w-7 cursor-pointer"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </DialogClose>
          <div className="max-h-[90vh] overflow-y-auto">
            <DialogHeader className="mb-3">
              <DialogTitle>Ca khám của {doctorName}</DialogTitle>
            </DialogHeader>
            <DialogDescription>
              Các khung giờ khám của bác sĩ.
            </DialogDescription>

            {/* Nội dung modal */}
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-1">
                  <CalendarComponent />
                </div>

                <Separator className="md:hidden block" />

                <div className="flex-1 space-y-4">
                  {isLoadingSchedules ? (
                    <DoctorScheduleListSkeleton />
                  ) : (
                    <DoctorScheduleList
                      list={schedules[getWeekday(selectedDate)] || []}
                      selectedDate={selectedDate}
                    />
                  )}

                  {schedules[getWeekday(selectedDate)]?.length > 0 && (
                    <div className="flex justify-center">
                      <Button
                        disabled={isPending}
                        onClick={() => setOpenConfirm(true)}
                        className="w-full md:w-auto"
                      >
                        {isPending ? <Loading /> : "Đặt lịch khám"}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
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
