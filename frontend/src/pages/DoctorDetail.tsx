import { useEffect, useRef } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { GraduationCap, Mail, MapPin, Phone, Stethoscope } from "lucide-react";
import AlertDialogConfirmBook from "@/components/dialog/AlertDialogConfirmBook";
import CalendarComponent from "@/components/calendar/CalendarComponent";
import DoctorScheduleList from "@/components/list/DoctorScheduleList";
import Loading from "@/components/loading/Loading";
import DoctorInfoSkeleton from "@/components/skeleton/DoctorInfoSkeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import ErrorState from "@/components/notification/ErrorState";
import { useDoctorBooking } from "@/hooks/useDoctorBooking";
import { useGetDoctorDetail } from "@/hooks/useGetDoctorDetail";
import { useNotifyAppointmentSocket } from "@/hooks/useNotifyAppointmentSocket";
import { useSocket } from "@/hooks/useSocket";
import { useBookingAppointmentStore } from "@/store/bookingAppointmentStore";
import { useUserStore } from "@/store/useUserStore";
import type { DoctorSchedule } from "@/types/interface/doctorSchedule.interface";
import { checkSchedulesExpireOrBooked } from "@/utils/checkSchedulesExpire";
import { formatDate, formatDateYYYYMMDD, getWeekday } from "@/utils/formatDate";

const DoctorDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { userInfo } = useUserStore();
  const {
    isPending,
    setIsPending,
    openConfirm,
    setOpenConfirm,
    handleBookingAppointment,
  } = useDoctorBooking();
  const {
    selectedDate,
    setSelectedDate,
    doctor_id,
    setDoctorId,
    doctor_schedule_id,
    setDoctorScheduleId,
    tempTime,
    setTempTime,
  } = useBookingAppointmentStore();
  const initialSearchParams = useRef(searchParams).current;

  const socket = useSocket();
  useNotifyAppointmentSocket(socket, doctor_id, setIsPending);

  useEffect(() => {
    const selectedDateParam = initialSearchParams.get("selectedDate");
    const urlSelectedDate = selectedDateParam
      ? new Date(selectedDateParam)
      : new Date();
    const urlDoctorScheduleId =
      Number(initialSearchParams.get("doctorScheduleId")) || 0;
    const urlStartTime = initialSearchParams.get("startTime") || "";
    const urlEndTime = initialSearchParams.get("endTime") || "";

    setSelectedDate(urlSelectedDate);
    setDoctorScheduleId(urlDoctorScheduleId);
    setTempTime({ start_time: urlStartTime, end_time: urlEndTime });
  }, [
    initialSearchParams,
    setDoctorScheduleId,
    setSelectedDate,
    setTempTime,
  ]);

  useEffect(() => {
    const params: Record<string, string> = {};
    if (selectedDate) params.selectedDate = formatDateYYYYMMDD(selectedDate);
    if (doctor_schedule_id) {
      params.doctorScheduleId = doctor_schedule_id.toString();
    }
    if (id) setDoctorId(Number(id));
    if (tempTime?.start_time) params.startTime = tempTime.start_time;
    if (tempTime?.end_time) params.endTime = tempTime.end_time;

    setSearchParams(params);
  }, [
    selectedDate,
    id,
    doctor_schedule_id,
    tempTime,
    setDoctorId,
    setSearchParams,
  ]);

  useEffect(() => {
    if (!userInfo) {
      navigate("/sign-in");
    }
  }, [userInfo, navigate]);

  const {
    data: doctorRes,
    isLoading,
    isError,
    refetch,
  } = useGetDoctorDetail(Number(id));

  if (isLoading) {
    return <DoctorInfoSkeleton />;
  }

  if (isError || !doctorRes?.data) {
    return (
      <div className="container mx-auto px-4 py-6 mt-16 md:mt-28">
        <ErrorState
          title="Không tìm thấy bác sĩ"
          description="Bác sĩ này có thể không tồn tại hoặc đã bị gỡ bỏ."
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  const doctor = doctorRes.data;
  const schedules =
    (doctor.doctor_schedules as Record<string, DoctorSchedule[]> | undefined) ??
    {};
  const selectedDaySchedules = schedules[getWeekday(selectedDate)] || [];

  return (
    <div className="container mx-auto px-4 py-6 max-w-5xl mt-16 md:mt-24 space-y-8 pb-16">
      {/* Doctor Header Profile */}
      <div className="overflow-hidden rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-xs space-y-8">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="relative shrink-0">
            <Avatar className="w-28 h-28 border-4 border-white dark:border-slate-800 ring-2 ring-primary/30 shadow-md">
              <AvatarImage src={doctor.picture} className="object-cover" />
              <AvatarFallback className="bg-primary/10 text-2xl font-bold text-primary">
                {doctor.fullname.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="absolute bottom-1 right-1 h-5 w-5 rounded-full border-2 border-white dark:border-slate-900 bg-emerald-500" />
          </div>

          <div className="flex-1 text-center sm:text-left space-y-2.5 min-w-0">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-100">
                BS. {doctor.fullname}
              </h2>
              {doctor.doctor_level && (
                <Badge variant="outline" className="border-primary/30 bg-primary/5 text-primary text-xs font-bold">
                  {doctor.doctor_level}
                </Badge>
              )}
            </div>

            <p className="text-sm sm:text-base font-semibold text-primary flex items-center justify-center sm:justify-start gap-2">
              <Stethoscope size={18} className="shrink-0" />
              <span>{doctor.specialty?.name || "Chuyên khoa"}</span>
            </p>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 flex items-center justify-center sm:justify-start gap-2">
              <MapPin size={16} className="text-slate-400 shrink-0" />
              <span>{doctor.workplace || "Bệnh viện / Phòng khám"}</span>
            </p>

            <div className="pt-1">
              <Badge
                variant="secondary"
                className="rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                <GraduationCap size={14} className="mr-1 text-primary" />
                {doctor.experience} năm kinh nghiệm công tác
              </Badge>
            </div>
          </div>
        </div>

        <Separator className="bg-slate-100 dark:bg-slate-800" />

        <div className="grid md:grid-cols-2 gap-8">
          <section className="space-y-3">
            <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-2 uppercase tracking-wider">
              Giới thiệu &amp; Tiểu sử chuyên môn
            </h3>
            <p className="text-xs sm:text-sm leading-relaxed text-slate-600 dark:text-slate-400 whitespace-pre-line">
              {doctor.about_me || "Bác sĩ chưa cập nhật thông tin giới thiệu chi tiết."}
            </p>
          </section>

          <section className="space-y-3">
            <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-2 uppercase tracking-wider">
              Thông tin liên hệ &amp; Làm việc
            </h3>
            <ul className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 space-y-3.5">
              <li className="flex items-start gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
                  <Phone size={15} />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Số điện thoại</p>
                  <p className="font-semibold text-slate-800 dark:text-slate-200">{doctor.phone || "Chưa cập nhật"}</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
                  <Mail size={15} />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Hòm thư điện tử</p>
                  <p className="font-semibold text-slate-800 dark:text-slate-200">{doctor.email || "Chưa cập nhật"}</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
                  <MapPin size={15} />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Địa chỉ làm việc</p>
                  <p className="font-semibold text-slate-800 dark:text-slate-200">{doctor.address || doctor.workplace || "Chưa cập nhật"}</p>
                </div>
              </li>
            </ul>
          </section>
        </div>
      </div>

      {/* Booking Calendar Section */}
      <div className="overflow-hidden rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
          <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
            Chọn lịch khám &amp; Khung giờ hẹn
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Chọn ngày mong muốn và nhấn vào khung giờ khả dụng để hoàn tất đặt lịch khám.
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          <div className="flex-1">
            <CalendarComponent />
          </div>

          <Separator className="md:hidden block bg-slate-100 dark:bg-slate-800" />

          <div className="flex-1 space-y-4">
            <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/60 p-3.5">
              <h4 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                Ca khám ngày {formatDate(selectedDate, "vi-VN")}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Hiện có <strong>{selectedDaySchedules.length}</strong> ca trực được thiết lập trong ngày này.
              </p>
            </div>

            <DoctorScheduleList
              list={selectedDaySchedules}
              selectedDate={selectedDate}
            />

            {selectedDaySchedules.length > 0 &&
              !checkSchedulesExpireOrBooked(
                selectedDaySchedules,
                selectedDate,
              ) && (
                <div className="flex justify-center pt-2">
                  <Button
                    disabled={isPending || !doctor_schedule_id}
                    onClick={() => setOpenConfirm(true)}
                    className="w-full md:w-auto px-8 rounded-2xl bg-primary hover:bg-primary/90 text-white font-bold shadow-xs cursor-pointer"
                  >
                    {isPending ? <Loading /> : "Tiếp tục xác nhận đặt lịch"}
                  </Button>
                </div>
              )}
          </div>
        </div>
      </div>

      {openConfirm && (
        <AlertDialogConfirmBook
          doctorId={doctor_id}
          doctorName={doctor.fullname}
          doctorScheduleId={doctor_schedule_id}
          handleConfirm={handleBookingAppointment}
          isPending={isPending}
          openConfirm={openConfirm}
          setOpenConfirm={setOpenConfirm}
          selectedDate={selectedDate}
          specialtyName={doctor.specialty?.name}
          tempTime={tempTime}
        />
      )}
    </div>
  );
};

export default DoctorDetail;
