import { useMemo } from "react";
import {
  CalendarCheck2,
  CalendarClock,
  MessageCircleHeart,
} from "lucide-react";

import { ErrorState } from "@/components/app/ErrorState";
import { LoadingState } from "@/components/app/LoadingState";
import {
  MetricBarChart,
  type MetricBarItem,
} from "@/components/app/MetricBarChart";
import { PageHeader } from "@/components/app/PageHeader";
import {
  SegmentedStatusBar,
  type StatusSegment,
} from "@/components/app/SegmentedStatusBar";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAdminAppointments } from "@/hooks/useAppointments";
import { useCurrentDoctor } from "@/hooks/useCurrentDoctor";
import { useDoctorDashboard } from "@/hooks/useDashboard";
import type {
  Appointment,
} from "@/types/interface/appointment.interface";
import type { AppointmentStatus } from "@/types/interface/api.interface";

const STATUS_META: Record<
  AppointmentStatus,
  { label: string; color: string }
> = {
  PENDING: { label: "Chờ xác nhận", color: "#f59e0b" },
  CONFIRMED: { label: "Đã xác nhận", color: "#3b82f6" },
  IN_PROGRESS: { label: "Đang khám", color: "#8b5cf6" },
  COMPLETED: { label: "Hoàn tất", color: "#10b981" },
  CANCELLED: { label: "Đã hủy", color: "#ef4444" },
  ABSENT: { label: "Vắng mặt", color: "#64748b" },
  EXPIRED: { label: "Quá hạn khám", color: "#a16207" },
};

const STATUS_ORDER: AppointmentStatus[] = [
  "PENDING",
  "CONFIRMED",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
  "ABSENT",
  "EXPIRED",
];

function parseAppointmentDate(dateStr?: string): Date | null {
  if (!dateStr) return null;
  const match = /^(\d{2})[/-](\d{2})[/-](\d{4})$/.exec(dateStr.trim());
  if (!match) return null;
  const [, day, month, year] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  return Number.isNaN(date.getTime()) ? null : date;
}

function isUpcomingAppointment(appointment: Appointment): boolean {
  if (
    appointment.appointment_status !== "PENDING" &&
    appointment.appointment_status !== "CONFIRMED"
  ) {
    return false;
  }
  const date = parseAppointmentDate(appointment.appointment_date);
  if (!date) return false;
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  return date >= startOfToday;
}

function buildStatusSegments(appointments: Appointment[]): StatusSegment[] {
  const counts = STATUS_ORDER.reduce<Record<AppointmentStatus, number>>(
    (acc, status) => {
      acc[status] = 0;
      return acc;
    },
    {
      PENDING: 0,
      CONFIRMED: 0,
      IN_PROGRESS: 0,
      COMPLETED: 0,
      CANCELLED: 0,
      ABSENT: 0,
      EXPIRED: 0,
    },
  );

  appointments.forEach((appointment) => {
    const status = appointment.appointment_status;
    if (status && status in counts) {
      counts[status] += 1;
    }
  });

  return STATUS_ORDER.map((status) => ({
    key: status,
    label: STATUS_META[status].label,
    color: STATUS_META[status].color,
    value: counts[status],
  }));
}

export function DoctorDashboardPage() {
  const dashboardQuery = useDoctorDashboard();
  // Backend `/appointments/doctor/appointments` hiện đang lỗi service-side
  // (truy cập user.doctor.id mà không nạp relation). Tạm dùng endpoint admin
  // kèm filter doctorId để bác sĩ vẫn thấy lịch hẹn của mình.
  const currentDoctorQuery = useCurrentDoctor();
  const doctorId = currentDoctorQuery.data?.id;
  const upcomingQuery = useAdminAppointments(
    { page: 1, limit: 20, doctorId },
    Boolean(doctorId),
  );

  const upcomingAppointments = useMemo(
    () => upcomingQuery.data?.data?.appointments ?? [],
    [upcomingQuery.data?.data?.appointments],
  );
  const statusSegments = useMemo(
    () => buildStatusSegments(upcomingAppointments),
    [upcomingAppointments],
  );

  if (dashboardQuery.isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Doctor dashboard"
          title="Tổng quan công việc bác sĩ"
          description="Đang đồng bộ dữ liệu lịch hẹn và tin nhắn."
        />
        <LoadingState />
      </div>
    );
  }

  if (dashboardQuery.isError || !dashboardQuery.data?.data) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Doctor dashboard"
          title="Tổng quan công việc bác sĩ"
          description="Không thể tải dữ liệu dashboard."
        />
        <ErrorState onRetry={() => dashboardQuery.refetch()} />
      </div>
    );
  }

  const stats = dashboardQuery.data.data;
  const earlyAppointment = stats.appointmentToDayEarly;
  const fallbackUpcomingTotal =
    upcomingQuery.data?.data?.total ?? upcomingAppointments.length;
  const upcomingCount =
    stats.upcomingAppointmentsCount > 0
      ? stats.upcomingAppointmentsCount
      : fallbackUpcomingTotal;

  const workloadBars: MetricBarItem[] = [
    {
      key: "today",
      label: "Lịch khám hôm nay",
      value: stats.totalAppointmentsToDayCount,
      color: "#007664",
    },
    {
      key: "upcoming",
      label: "Lịch sắp tới",
      value: upcomingCount,
      color: "#0284c7",
    },
    {
      key: "messages",
      label: "Tin nhắn chưa đọc",
      value: stats.totalMessagesUnreadInAllChannelsCount,
      color: "#f59e0b",
    },
  ];

  const upcomingPreview = upcomingAppointments
    .filter(isUpcomingAppointment)
    .sort((a, b) => {
      const dateA = parseAppointmentDate(a.appointment_date)?.getTime() ?? 0;
      const dateB = parseAppointmentDate(b.appointment_date)?.getTime() ?? 0;
      if (dateA !== dateB) return dateA - dateB;
      return (a.start_time ?? "").localeCompare(b.start_time ?? "");
    })
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Doctor workspace"
        title="Tổng quan công việc bác sĩ"
        description="Số liệu thời gian thực về lịch hẹn khám trong ngày, danh sách sắp tới và tin nhắn cần phản hồi."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="rounded-3xl border-slate-200/80 bg-white p-6 shadow-2xs dark:border-slate-800 dark:bg-slate-900 overflow-hidden relative group hover:border-primary/40 transition-all">
          <div className="absolute top-0 right-0 w-28 h-28 bg-gradient-to-bl from-teal-500/10 via-teal-500/5 to-transparent rounded-bl-full pointer-events-none" />
          <CardContent className="space-y-4 p-0">
            <div className="flex items-start justify-between">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Lịch khám hôm nay</p>
              <span className="rounded-2xl bg-teal-50 p-2.5 text-teal-600 dark:bg-teal-950/60 dark:text-teal-400">
                <CalendarCheck2 className="size-5" />
              </span>
            </div>
            <div className="font-display text-4xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
              {stats.totalAppointmentsToDayCount}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-slate-200/80 bg-white p-6 shadow-2xs dark:border-slate-800 dark:bg-slate-900 overflow-hidden relative group hover:border-primary/40 transition-all">
          <div className="absolute top-0 right-0 w-28 h-28 bg-gradient-to-bl from-sky-500/10 via-sky-500/5 to-transparent rounded-bl-full pointer-events-none" />
          <CardContent className="space-y-4 p-0">
            <div className="flex items-start justify-between">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Lịch khám sắp tới</p>
              <span className="rounded-2xl bg-sky-50 p-2.5 text-sky-600 dark:bg-sky-950/60 dark:text-sky-400">
                <CalendarClock className="size-5" />
              </span>
            </div>
            <div className="font-display text-4xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
              {upcomingCount}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-slate-200/80 bg-white p-6 shadow-2xs dark:border-slate-800 dark:bg-slate-900 overflow-hidden relative group hover:border-primary/40 transition-all">
          <div className="absolute top-0 right-0 w-28 h-28 bg-gradient-to-bl from-amber-500/10 via-amber-500/5 to-transparent rounded-bl-full pointer-events-none" />
          <CardContent className="space-y-4 p-0">
            <div className="flex items-start justify-between">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Tin nhắn chưa đọc</p>
              <span className="rounded-2xl bg-amber-50 p-2.5 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
                <MessageCircleHeart className="size-5" />
              </span>
            </div>
            <div className="font-display text-4xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
              {stats.totalMessagesUnreadInAllChannelsCount}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="rounded-3xl border-slate-200/80 dark:border-slate-800 dark:bg-slate-900 p-6">
          <CardHeader className="p-0 pb-4 border-b border-slate-100 dark:border-slate-800">
            <CardTitle className="text-base font-bold dark:text-slate-100">Khối lượng công việc hôm nay</CardTitle>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              So sánh nhanh các đầu việc cần xử lý trong phiên làm việc.
            </p>
          </CardHeader>
          <CardContent className="p-0 pt-4">
            <MetricBarChart items={workloadBars} />
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-slate-200/80 dark:border-slate-800 dark:bg-slate-900 p-6">
          <CardHeader className="p-0 pb-4 border-b border-slate-100 dark:border-slate-800">
            <CardTitle className="text-base font-bold dark:text-slate-100">
              Phân bổ trạng thái lịch hẹn
            </CardTitle>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Tỷ lệ các ca khám theo trạng thái (chờ xác nhận, hoàn tất, hủy).
            </p>
          </CardHeader>
          <CardContent className="p-0 pt-4">
            <SegmentedStatusBar
              segments={statusSegments}
              emptyLabel="Chưa có lịch hẹn để thống kê."
            />
          </CardContent>
        </Card>
      </div>

      {/* Early Appointment Alert */}
      <Card className="rounded-3xl border-slate-200/80 dark:border-slate-800 dark:bg-slate-900 p-6">
        <CardHeader className="p-0 pb-4 border-b border-slate-100 dark:border-slate-800">
          <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <span>Ca khám sớm nhất hôm nay</span>
            {earlyAppointment ? <Badge variant="success" className="text-[10px] font-bold">Ưu tiên</Badge> : null}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 pt-4 space-y-4">
          {earlyAppointment ? (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl border border-teal-200/60 bg-teal-50/50 p-4.5 dark:border-teal-950 dark:bg-teal-950/30">
              <div className="space-y-1.5">
                <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  {earlyAppointment.patient?.fullname ??
                    `Lịch hẹn #${earlyAppointment.id}`}
                </div>
                <div className="text-xs font-medium text-slate-600 dark:text-slate-400">
                  📅 Ngày khám: <span className="font-semibold text-slate-900 dark:text-slate-200">{earlyAppointment.appointment_date}</span>
                </div>
                {earlyAppointment.symptoms ? (
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    🩺 Triệu chứng: <span className="italic">{earlyAppointment.symptoms}</span>
                  </div>
                ) : null}
              </div>
              <Badge variant="info" className="text-xs font-bold px-3 py-1 self-start sm:self-center">{earlyAppointment.appointment_status}</Badge>
            </div>
          ) : (
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 italic">
              Hiện chưa có ca khám nào được đặt trước trong ngày hôm nay.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Upcoming Appointments List */}
      <Card className="rounded-3xl border-slate-200/80 dark:border-slate-800 dark:bg-slate-900 p-6">
        <CardHeader className="p-0 pb-4 border-b border-slate-100 dark:border-slate-800">
          <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100">
            Danh sách lịch hẹn sắp tới (Top 5)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 pt-4 space-y-3">
          {upcomingQuery.isLoading ? (
            <LoadingState />
          ) : upcomingPreview.length === 0 ? (
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 italic">
              Chưa có lịch hẹn nào được lên lịch trong thời gian tới.
            </p>
          ) : (
            <ul className="space-y-2.5">
              {upcomingPreview.map((appointment) => {
                const meta = STATUS_META[appointment.appointment_status];
                return (
                  <li
                    key={appointment.id}
                    className="flex items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5 transition-all hover:bg-slate-100/70 hover:border-slate-200 dark:border-slate-800/80 dark:bg-slate-950/60 dark:hover:bg-slate-800/60"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className="size-2.5 rounded-full shrink-0 shadow-2xs"
                        style={{ backgroundColor: meta?.color ?? "#64748b" }}
                      />
                      <div className="min-w-0">
                        <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                          {appointment.patient?.fullname ??
                            `Lịch hẹn #${appointment.id}`}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          {appointment.appointment_date}
                          {appointment.start_time
                            ? ` · ${appointment.start_time}`
                            : ""}
                          {appointment.end_time
                            ? ` - ${appointment.end_time}`
                            : ""}
                        </div>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs font-semibold shrink-0">
                      {meta?.label ?? appointment.appointment_status}
                    </Badge>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
