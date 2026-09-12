import React, { useMemo } from "react";
import { CalendarClock, Clock, Plus, Stethoscope, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { prefetchPatientRoute } from "@/utils/routePrefetch";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AppointmentStatusBadge } from "@/components/badge/AppointmentStatusBadge";
import ErrorState from "@/components/notification/ErrorState";
import { usePatientAppointments } from "@/hooks/usePatientPortalApi";

const UPCOMING_STATUSES = new Set(["PENDING", "CONFIRMED"]);

const UpcomingAppointmentsCard: React.FC = () => {
  const { t } = useTranslation();
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
    <Card className="border-slate-200/80 bg-white py-0 shadow-xs dark:border-slate-800 dark:bg-slate-900">
      <CardHeader className="flex flex-row items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 px-6 py-4.5">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <CalendarClock className="h-4.5 w-4.5" />
          </span>
          <div>
            <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100">
              {t("dashboard.upcomingTitle", { defaultValue: "Lịch khám sắp tới" })}
            </CardTitle>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t("dashboard.upcomingSubtitle", { defaultValue: "Các cuộc hẹn đang chờ hoặc đã xác nhận" })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild size="sm" className="h-9 gap-1.5 rounded-xl text-xs font-semibold bg-primary hover:bg-primary/90 text-white shadow-2xs">
            <Link
              to="/doctors"
              onMouseEnter={() => prefetchPatientRoute("/doctors")}
              onFocus={() => prefetchPatientRoute("/doctors")}
            >
              <Plus className="h-4 w-4 text-white" />
              <span>{t("dashboard.bookNewAppointment", { defaultValue: "Đặt lịch mới" })}</span>
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 px-6 py-5">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 2 }).map((_, idx) => (
              <Skeleton key={idx} className="h-20 rounded-2xl" />
            ))}
          </div>
        ) : isError ? (
          <ErrorState
            title={t("dashboard.errorTitle", { defaultValue: "Không thể tải lịch khám sắp tới" })}
            description={t("dashboard.errorDesc", { defaultValue: "Đã có lỗi xảy ra khi tải dữ liệu. Vui lòng thử lại." })}
            onRetry={() => refetch()}
          />
        ) : upcoming.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 p-7 text-center">
            <CalendarClock className="mx-auto mb-2.5 h-9 w-9 text-slate-400" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              {t("dashboard.noUpcoming", { defaultValue: "Bạn chưa có lịch khám sắp tới nào" })}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              {t("dashboard.noUpcomingDesc", { defaultValue: "Đặt lịch khám với bác sĩ chuyên khoa hoặc nhận tư vấn trực tuyến bất cứ lúc nào." })}
            </p>
            <Button asChild size="sm" className="mt-3.5 rounded-xl text-xs font-bold bg-primary hover:bg-primary/90 text-white shadow-xs">
              <Link to="/doctors">{t("dashboard.findDoctorAndBook", { defaultValue: "Tìm bác sĩ & đặt lịch ngay" })}</Link>
            </Button>
          </div>
        ) : (
          <>
            {upcoming.map((appointment) => (
              <div
                key={appointment.id}
                className="group flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 transition-all hover:border-primary/40 hover:shadow-sm dark:border-slate-800 dark:bg-slate-900/90 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Stethoscope className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 space-y-1">
                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                      {t("common.dr", { defaultValue: "BS." })} {appointment.doctor.user.fullname ?? t("common.notUpdated", { defaultValue: "Chưa cập nhật" })}
                    </p>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                      <span className="inline-flex items-center gap-1 font-medium text-slate-700 dark:text-slate-200">
                        <CalendarClock className="h-3.5 w-3.5 text-primary" />
                        {appointment.appointment_date}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-slate-400" />
                        {appointment.doctor_schedule.start_time} - {appointment.doctor_schedule.end_time}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                  <AppointmentStatusBadge status={appointment.status} />
                  <Link
                    to="/patient/appointments"
                    onMouseEnter={() => prefetchPatientRoute("/patient/appointments")}
                    onFocus={() => prefetchPatientRoute("/patient/appointments")}
                    className="p-1 text-slate-400 hover:text-primary transition-colors"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            ))}
            <Link
              to="/patient/appointments"
              onMouseEnter={() => prefetchPatientRoute("/patient/appointments")}
              onFocus={() => prefetchPatientRoute("/patient/appointments")}
              className="inline-flex items-center justify-center gap-1 w-full text-center text-xs font-bold text-primary hover:underline pt-1"
            >
              <span>{t("dashboard.viewAllAppointments", { defaultValue: "Xem tất cả danh sách lịch khám" })}</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default UpcomingAppointmentsCard;
