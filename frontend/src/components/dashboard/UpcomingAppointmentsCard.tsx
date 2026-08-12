import React, { useMemo } from "react";
import { CalendarClock, Clock, Plus, Stethoscope } from "lucide-react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AppointmentStatusBadge } from "@/components/badge/AppointmentStatusBadge";
import ErrorState from "@/components/notification/ErrorState";
import { usePatientAppointments } from "@/hooks/usePatientPortalApi";

const UPCOMING_STATUSES = new Set(["PENDING", "CONFIRMED"]);

const UpcomingAppointmentsCard: React.FC = () => {
  const { data, isLoading, isError, refetch } = usePatientAppointments({
    page: 1,
    limit: 50,
  });

  const upcoming = useMemo(
    () =>
      (data?.data.appointments ?? [])
        .filter((appointment) => UPCOMING_STATUSES.has(appointment.status))
        .sort((a, b) => a.appointment_date.localeCompare(b.appointment_date))
        .slice(0, 3),
    [data],
  );

  return (
    <Card className="border-slate-200 py-0 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <CalendarClock className="h-4 w-4" />
          </span>
          <CardTitle className="text-base font-semibold text-slate-900">
            Lịch khám sắp tới
          </CardTitle>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild size="sm" className="h-8 gap-1.5 rounded-lg text-xs">
            <Link to="/doctors">
              <Plus className="h-3.5 w-3.5" />
              Đặt lịch khám
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 px-5 py-5">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 2 }).map((_, idx) => (
              <Skeleton key={idx} className="h-20 rounded-xl" />
            ))}
          </div>
        ) : isError ? (
          <ErrorState
            title="Không thể tải lịch khám sắp tới"
            description="Đã có lỗi xảy ra khi tải dữ liệu. Vui lòng thử lại."
            onRetry={() => refetch()}
          />
        ) : upcoming.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/50 p-6 text-center">
            <CalendarClock className="mx-auto mb-2 h-8 w-8 text-slate-400" />
            <p className="text-sm font-medium text-slate-600">
              Bạn chưa có lịch khám sắp tới nào.
            </p>
            <Button asChild size="sm" className="mt-3 rounded-lg text-xs">
              <Link to="/doctors">Tìm bác sĩ &amp; đặt lịch ngay</Link>
            </Button>
          </div>
        ) : (
          <>
            {upcoming.map((appointment) => (
              <div
                key={appointment.id}
                className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-3.5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Stethoscope className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 space-y-1">
                    <p className="text-sm font-bold text-slate-900">
                      BS. {appointment.doctor.user.fullname ?? "Chưa cập nhật"}
                    </p>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                      <span className="inline-flex items-center gap-1">
                        <CalendarClock className="h-3.5 w-3.5" />
                        {appointment.appointment_date}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {appointment.doctor_schedule.start_time} -{" "}
                        {appointment.doctor_schedule.end_time}
                      </span>
                    </div>
                  </div>
                </div>
                <AppointmentStatusBadge status={appointment.status} />
              </div>
            ))}
            <Link
              to="/patient/appointments"
              className="block text-center text-xs font-semibold text-primary hover:underline"
            >
              Xem tất cả lịch khám
            </Link>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default UpcomingAppointmentsCard;
