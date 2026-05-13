import React, { useState } from "react";
import {
  CalendarClock,
  Clock,
  Eye,
  MapPin,
  Stethoscope,
  UserRound,
} from "lucide-react";
import { toast } from "react-toastify";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  useCancelPatientAppointment,
  usePatientAppointmentDetail,
  usePatientAppointments,
} from "@/hooks/usePatientPortalApi";
import type {
  AppointmentStatus,
  PatientAppointment,
} from "@/types/interface/patient.interface";

const statusLabelMap: Record<AppointmentStatus, string> = {
  PENDING: "Chờ xác nhận",
  CONFIRMED: "Đã xác nhận",
  COMPLETED: "Đã khám",
  CANCELLED: "Đã hủy",
  ABSENT: "Vắng mặt",
};

const statusVariantMap: Record<
  AppointmentStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  PENDING: "secondary",
  CONFIRMED: "default",
  COMPLETED: "outline",
  CANCELLED: "destructive",
  ABSENT: "destructive",
};

const bookingModeLabelMap: Record<PatientAppointment["booking_mode"], string> =
  {
    user_select: "Người dùng chọn lịch",
    ai_select: "AI chọn lịch",
  };

const getSpecialtyName = (appointment: PatientAppointment) =>
  appointment.doctor.specialty.specialty_name ??
  appointment.doctor.specialty.name ??
  "Chưa cập nhật chuyên khoa";

const Appointments: React.FC = () => {
  const [selectedAppointmentId, setSelectedAppointmentId] = useState(0);
  const [openDetail, setOpenDetail] = useState(false);

  const { data, isLoading, isError } = usePatientAppointments({
    page: 1,
    limit: 50,
  });
  const cancelMutation = useCancelPatientAppointment();
  const { data: detailResponse, isLoading: isLoadingDetail } =
    usePatientAppointmentDetail(selectedAppointmentId, openDetail);

  const appointments = data?.data.appointments ?? [];
  const appointmentDetail = detailResponse?.data;

  const handleCancel = (appointmentId: number) => {
    cancelMutation.mutate(appointmentId, {
      onSuccess: () => toast.success("Đã hủy lịch khám."),
      onError: () => toast.error("Không thể hủy lịch khám này."),
    });
  };

  const handleOpenDetail = (appointmentId: number) => {
    setSelectedAppointmentId(appointmentId);
    setOpenDetail(true);
  };

  return (
    <>
      <Card className="border-primary/15 py-5">
        <CardHeader className="px-5">
          <CardTitle className="text-lg">Lịch khám đã đặt</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 px-5">
          {isLoading ? (
            <div className="rounded-xl border border-slate-200 p-5 text-sm text-slate-600">
              Đang tải lịch khám...
            </div>
          ) : isError ? (
            <div className="rounded-xl border border-red-200 p-5 text-sm text-red-600">
              Không thể tải lịch khám.
            </div>
          ) : appointments.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 p-5 text-center text-sm text-slate-500">
              Bạn chưa có lịch khám nào.
            </div>
          ) : (
            appointments.map((appointment) => {
              const canCancel = appointment.status === "PENDING";

              return (
                <div
                  key={appointment.id}
                  className="rounded-xl border border-slate-200 bg-white p-4"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-slate-900">
                        {appointment.doctor.user.fullname ??
                          "Bác sĩ chưa cập nhật"}{" "}
                        - {getSpecialtyName(appointment)}
                      </p>
                      <p className="text-sm text-slate-600">
                        {appointment.doctor.workplace}
                      </p>
                      <p className="text-sm text-slate-600">
                        {appointment.appointment_date} |{" "}
                        {appointment.doctor_schedule.start_time} -{" "}
                        {appointment.doctor_schedule.end_time}
                      </p>
                      <p className="text-sm text-slate-600">
                        Bệnh nhân: {appointment.patient.fullname}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={statusVariantMap[appointment.status]}>
                        {statusLabelMap[appointment.status]}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenDetail(appointment.id)}
                      >
                        <Eye className="mr-1 h-4 w-4" />
                        Chi tiết
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={!canCancel || cancelMutation.isPending}
                        onClick={() => handleCancel(appointment.id)}
                      >
                        Hủy lịch
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      <Dialog open={openDetail} onOpenChange={setOpenDetail}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Chi tiết lịch khám</DialogTitle>
            <DialogDescription>
              Thông tin đầy đủ của lịch khám đã đặt.
            </DialogDescription>
          </DialogHeader>

          {isLoadingDetail ? (
            <div className="rounded-lg border border-slate-200 p-4 text-sm text-slate-600">
              Đang tải chi tiết lịch khám...
            </div>
          ) : appointmentDetail ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 p-3">
                <div>
                  <p className="text-xs text-slate-500">Mã lịch khám</p>
                  <p className="font-semibold text-slate-900">
                    #{appointmentDetail.id}
                  </p>
                </div>
                <Badge variant={statusVariantMap[appointmentDetail.status]}>
                  {statusLabelMap[appointmentDetail.status]}
                </Badge>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-slate-200 p-3">
                  <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-900">
                    <Stethoscope className="h-4 w-4 text-primary" />
                    Bác sĩ
                  </div>
                  <p className="text-sm text-slate-700">
                    {appointmentDetail.doctor.user.fullname ??
                      "Bác sĩ chưa cập nhật"}
                  </p>
                  <p className="text-sm text-slate-500">
                    {getSpecialtyName(appointmentDetail)}
                  </p>
                </div>

                <div className="rounded-lg border border-slate-200 p-3">
                  <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-900">
                    <UserRound className="h-4 w-4 text-primary" />
                    Bệnh nhân
                  </div>
                  <p className="text-sm text-slate-700">
                    {appointmentDetail.patient.fullname ?? "Chưa cập nhật"}
                  </p>
                  <p className="text-sm text-slate-500">
                    {appointmentDetail.patient.relationship?.relationship_name}
                  </p>
                </div>

                <div className="rounded-lg border border-slate-200 p-3">
                  <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-900">
                    <CalendarClock className="h-4 w-4 text-primary" />
                    Ngày khám
                  </div>
                  <p className="text-sm text-slate-700">
                    {appointmentDetail.appointment_date}
                  </p>
                </div>

                <div className="rounded-lg border border-slate-200 p-3">
                  <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-900">
                    <Clock className="h-4 w-4 text-primary" />
                    Ca khám
                  </div>
                  <p className="text-sm text-slate-700">
                    {appointmentDetail.doctor_schedule.start_time} -{" "}
                    {appointmentDetail.doctor_schedule.end_time}
                  </p>
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 p-3">
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <MapPin className="h-4 w-4 text-primary" />
                  Địa điểm khám
                </div>
                <p className="text-sm text-slate-700">
                  {appointmentDetail.doctor.workplace || "Chưa cập nhật"}
                </p>
              </div>

              <div className="grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <p className="text-slate-500">Hình thức đặt</p>
                  <p className="font-medium text-slate-800">
                    {bookingModeLabelMap[appointmentDetail.booking_mode]}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500">Ngày tạo</p>
                  <p className="font-medium text-slate-800">
                    {appointmentDetail.created_at}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-red-200 p-4 text-sm text-red-600">
              Không thể tải chi tiết lịch khám.
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Appointments;
