import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import type { AxiosError } from "axios";
import { GraduationCap, Mail, MapPin, Phone, Stethoscope } from "lucide-react";
import { toast } from "react-toastify";
import AlertDialogConfirmBook from "@/components/dialog/AlertDialogConfirmBook";
import CalendarComponent from "@/components/calendar/CalendarComponent";
import DoctorScheduleList from "@/components/list/DoctorScheduleList";
import Loading from "@/components/loading/Loading";
import DoctorInfoSkeleton from "@/components/skeleton/DoctorInfoSkeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { createAppointmentData } from "@/api/appointmentApi";
import { useBookingAppointment } from "@/hooks/useBookingAppointment";
import { useGetDoctorDetail } from "@/hooks/useGetDoctorDetail";
import { useNotifyAppointmentSocket } from "@/hooks/useNotifyAppointmentSocket";
import { useSocket } from "@/hooks/useSocket";
import { useBookingAppointmentStore } from "@/store/bookingAppointmentStore";
import { useUserStore } from "@/store/useUserStore";
import type { ApiError } from "@/types/interface/apiError.interface";
import type { DoctorSchedule } from "@/types/interface/doctorSchedule.interface";
import { checkSchedulesExpireOrBooked } from "@/utils/checkSchedulesExpire";
import { formatDate, formatDateYYYYMMDD, getWeekday } from "@/utils/formatDate";

const DoctorDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { userInfo } = useUserStore();
  const [isPending, setIsPending] = useState(false);
  const [openConfirm, setOpenConfirm] = useState(false);
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

  const socket = useSocket(userInfo?.id);
  useNotifyAppointmentSocket(socket, doctor_id, setIsPending);

  const { mutate, error, isError: isErrorBooking } = useBookingAppointment();

  useEffect(() => {
    const selectedDateParam = searchParams.get("selectedDate");
    const urlSelectedDate = selectedDateParam
      ? new Date(selectedDateParam)
      : new Date();
    const urlDoctorScheduleId =
      Number(searchParams.get("doctorScheduleId")) || 0;
    const urlStartTime = searchParams.get("startTime") || "";
    const urlEndTime = searchParams.get("endTime") || "";

    setSelectedDate(urlSelectedDate);
    setDoctorScheduleId(urlDoctorScheduleId);
    setTempTime({ start_time: urlStartTime, end_time: urlEndTime });
  }, []);

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
  }, [selectedDate, id, doctor_schedule_id, tempTime]);

  useEffect(() => {
    if (!userInfo) {
      navigate("/sign-in");
    }
  }, [userInfo, navigate]);

  useEffect(() => {
    if (isErrorBooking) {
      const axiosError = error as AxiosError<ApiError>;
      const details = axiosError.response?.data.error.details;
      const message =
        typeof details === "string"
          ? details
          : (details?.[0] ?? "Đặt lịch khám thất bại!");
      toast.error(message);
    }
  }, [error, isErrorBooking]);

  const {
    data: doctorRes,
    isLoading,
    isError,
  } = useGetDoctorDetail(Number(id));

  if (isLoading) {
    return <DoctorInfoSkeleton />;
  }

  if (isError || !doctorRes?.data) {
    return (
      <div className="container mx-auto p-6 text-red-500">
        Không tìm thấy bác sĩ.
      </div>
    );
  }

  const doctor = doctorRes.data;
  const schedules =
    (doctor.doctor_schedules as Record<string, DoctorSchedule[]> | undefined) ??
    {};
  const selectedDaySchedules = schedules[getWeekday(selectedDate)] || [];

  const handleBookingAppointment = (data: createAppointmentData) => {
    if (!data.appointment_date) {
      toast.error("Vui lòng chọn ngày khám!");
    } else if (!data.doctor_id) {
      toast.error("Vui lòng chọn bác sĩ!");
    } else if (!data.doctor_schedule_id) {
      toast.error("Vui lòng chọn khung giờ khám!");
    } else if (!data.relative_id) {
      toast.error("Vui lòng chọn người thân cần đặt lịch khám!");
    } else {
      setIsPending(true);
      mutate(data, {
        onSuccess: () => {
          setIsPending(false);
          setOpenConfirm(false);
        },
        onError: () => {
          setIsPending(false);
        },
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-5xl mt-16 md:mt-28 space-y-8">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow p-6 space-y-8">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <Avatar className="w-28 h-28 ring-2 ring-primary/40">
            <AvatarImage src={doctor.picture} />
            <AvatarFallback>{doctor.fullname}</AvatarFallback>
          </Avatar>

          <div className="flex-1 text-center sm:text-left space-y-3">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold">
              {doctor.fullname}
            </h2>
            <p className="text-sm sm:text-base md:text-lg text-muted-foreground flex items-center justify-center sm:justify-start gap-2">
              <Stethoscope size={20} />
              <span>
                {doctor.doctor_level} - {doctor.specialty.name}
              </span>
            </p>
            <p className="text-sm sm:text-base md:text-lg text-gray-600 flex items-center justify-center sm:justify-start gap-2">
              <MapPin size={20} />
              <span>{doctor.workplace}</span>
            </p>
            <Badge
              variant="secondary"
              className="mt-2 text-xs sm:text-sm md:text-base py-1 px-3"
            >
              <GraduationCap size={16} className="mr-1" />
              {doctor.experience} năm kinh nghiệm
            </Badge>
          </div>
        </div>

        <Separator />

        <div className="grid md:grid-cols-2 gap-8">
          <section className="space-y-3">
            <h3 className="font-semibold text-base sm:text-lg md:text-xl border-b pb-2">
              Giới thiệu
            </h3>
            <p className="text-sm sm:text-base md:text-lg leading-relaxed text-gray-700 dark:text-gray-300">
              {doctor.about_me || "Chưa có thông tin giới thiệu."}
            </p>
          </section>

          <section className="space-y-3">
            <h3 className="font-semibold text-base sm:text-lg md:text-xl border-b pb-2">
              Thông tin liên hệ
            </h3>
            <ul className="text-sm sm:text-base md:text-lg text-gray-700 dark:text-gray-300 space-y-3">
              <li className="flex items-start gap-3">
                <Phone size={20} className="text-primary mt-1" />
                <div>
                  <p className="font-medium">Điện thoại</p>
                  <p>{doctor.phone}</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Mail size={20} className="text-primary mt-1" />
                <div>
                  <p className="font-medium">Email</p>
                  <p>{doctor.email}</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <MapPin size={20} className="text-primary mt-1" />
                <div>
                  <p className="font-medium">Địa chỉ</p>
                  <p>{doctor.address}</p>
                </div>
              </li>
            </ul>
          </section>
        </div>
      </div>

      <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow p-6 space-y-6">
        <h3 className="text-lg sm:text-xl md:text-2xl font-semibold">
          Lịch làm việc
        </h3>
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-1">
            <CalendarComponent />
          </div>

          <Separator className="md:hidden block" />

          <div className="flex-1 space-y-4">
            <h4 className="text-sm sm:text-base md:text-lg font-medium">
              Ca khám ngày {formatDate(selectedDate, "vi-VN")}
            </h4>

            <h4 className="text-sm sm:text-base md:text-lg font-medium">
              Có {selectedDaySchedules.length} khung giờ khám
            </h4>

            <DoctorScheduleList
              list={selectedDaySchedules}
              selectedDate={selectedDate}
            />

            {selectedDaySchedules.length > 0 &&
              !checkSchedulesExpireOrBooked(
                selectedDaySchedules,
                selectedDate,
              ) && (
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
