import React from "react";
import { toast } from "react-toastify";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  useCancelPatientAppointment,
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

const getSpecialtyName = (appointment: PatientAppointment) =>
  appointment.doctor.specialty.specialty_name ??
  appointment.doctor.specialty.name ??
  "Chưa cập nhật chuyên khoa";

const Appointments: React.FC = () => {
  const { data, isLoading, isError } = usePatientAppointments({
    page: 1,
    limit: 50,
  });
  const cancelMutation = useCancelPatientAppointment();
  const appointments = data?.data.appointments ?? [];

  const handleCancel = (appointmentId: number) => {
    cancelMutation.mutate(appointmentId, {
      onSuccess: () => toast.success("Đã hủy lịch khám."),
      onError: () => toast.error("Không thể hủy lịch khám này."),
    });
  };

  return (
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

                  <div className="flex items-center gap-2">
                    <Badge variant={statusVariantMap[appointment.status]}>
                      {statusLabelMap[appointment.status]}
                    </Badge>
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
  );
};

export default Appointments;
