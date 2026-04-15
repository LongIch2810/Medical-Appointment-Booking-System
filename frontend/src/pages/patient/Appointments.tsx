import React from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AppointmentStatus } from "@/pages/patient/patientTypes";
import { usePatientPortal } from "@/pages/patient/usePatientPortal";

const statusLabelMap: Record<AppointmentStatus, string> = {
  confirmed: "Đã xác nhận",
  pending: "Chờ xác nhận",
  completed: "Đã khám",
  cancelled: "Đã hủy",
};

const statusVariantMap: Record<AppointmentStatus, "default" | "secondary" | "destructive" | "outline"> =
  {
    confirmed: "default",
    pending: "secondary",
    completed: "outline",
    cancelled: "destructive",
  };

const Appointments: React.FC = () => {
  const { appointments, cancelAppointment } = usePatientPortal();

  const canCancel = (status: AppointmentStatus) =>
    status === "confirmed" || status === "pending";

  return (
    <Card className="border-primary/15 py-5">
      <CardHeader className="px-5">
        <CardTitle className="text-lg">Lịch khám đã đặt</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 px-5">
        {appointments.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 p-5 text-center text-sm text-slate-500">
            Bạn chưa có lịch khám nào.
          </div>
        ) : (
          appointments.map((appointment) => (
            <div
              key={appointment.id}
              className="rounded-xl border border-slate-200 bg-white p-4"
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-slate-900">
                    {appointment.doctorName} - {appointment.specialty}
                  </p>
                  <p className="text-sm text-slate-600">{appointment.clinic}</p>
                  <p className="text-sm text-slate-600">
                    {appointment.date} | {appointment.time}
                  </p>
                  <p className="text-sm text-slate-600">Phí khám: {appointment.fee}</p>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant={statusVariantMap[appointment.status]}>
                    {statusLabelMap[appointment.status]}
                  </Badge>
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={!canCancel(appointment.status)}
                    onClick={() => cancelAppointment(appointment.id)}
                  >
                    Hủy lịch
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};

export default Appointments;
