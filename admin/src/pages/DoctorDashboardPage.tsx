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
  COMPLETED: { label: "Hoàn tất", color: "#10b981" },
  CANCELLED: { label: "Đã hủy", color: "#ef4444" },
  ABSENT: { label: "Vắng mặt", color: "#75758a" },
  EXPIRED: { label: "Quá hạn khám", color: "#a16207" },
};

const STATUS_ORDER: AppointmentStatus[] = [
  "PENDING",
  "CONFIRMED",
  "COMPLETED",
  "CANCELLED",
  "ABSENT",
  "EXPIRED",
];

function buildStatusSegments(appointments: Appointment[]): StatusSegment[] {
  const counts = STATUS_ORDER.reduce<Record<AppointmentStatus, number>>(
    (acc, status) => {
      acc[status] = 0;
      return acc;
    },
    {
      PENDING: 0,
      CONFIRMED: 0,
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
      color: "#9b60aa",
    },
    {
      key: "upcoming",
      label: "Lịch sắp tới",
      value: upcomingCount,
      color: "#3b82f6",
    },
    {
      key: "messages",
      label: "Tin nhắn chưa đọc",
      value: stats.totalMessagesUnreadInAllChannelsCount,
      color: "#ff7759",
    },
  ];

  const upcomingPreview = upcomingAppointments.slice(0, 5);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Doctor dashboard"
        title="Workspace dành cho bác sĩ"
        description="Số liệu thời gian thực về lịch hẹn, lịch sắp tới và tin nhắn chưa đọc."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="rounded-lg border-[#d9d9dd]">
          <CardContent className="space-y-4">
            <div className="flex items-start justify-between">
              <p className="text-sm text-[#75758a]">Lịch khám hôm nay</p>
              <CalendarCheck2 className="size-5 text-primary" />
            </div>
            <div className="font-display text-4xl font-medium leading-none text-[#212121]">
              {stats.totalAppointmentsToDayCount}
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-lg border-[#d9d9dd]">
          <CardContent className="space-y-4">
            <div className="flex items-start justify-between">
              <p className="text-sm text-[#75758a]">Lịch sắp tới</p>
              <CalendarClock className="size-5 text-primary" />
            </div>
            <div className="font-display text-4xl font-medium leading-none text-[#212121]">
              {upcomingCount}
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-lg border-[#d9d9dd]">
          <CardContent className="space-y-4">
            <div className="flex items-start justify-between">
              <p className="text-sm text-[#75758a]">Tin nhắn chưa đọc</p>
              <MessageCircleHeart className="size-5 text-primary" />
            </div>
            <div className="font-display text-4xl font-medium leading-none text-[#212121]">
              {stats.totalMessagesUnreadInAllChannelsCount}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="rounded-lg border-[#d9d9dd]">
          <CardHeader>
            <CardTitle className="text-base">Khối lượng công việc</CardTitle>
            <p className="text-xs text-[#75758a]">
              So sánh nhanh các đầu việc cần xử lý hôm nay.
            </p>
          </CardHeader>
          <CardContent>
            <MetricBarChart items={workloadBars} />
          </CardContent>
        </Card>

        <Card className="rounded-lg border-[#d9d9dd]">
          <CardHeader>
            <CardTitle className="text-base">
              Trạng thái lịch hẹn sắp tới
            </CardTitle>
            <p className="text-xs text-[#75758a]">
              Phân bổ trạng thái dựa trên 20 lịch hẹn gần nhất.
            </p>
          </CardHeader>
          <CardContent>
            <SegmentedStatusBar
              segments={statusSegments}
              emptyLabel="Chưa có lịch hẹn để thống kê."
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ca khám sớm nhất hôm nay</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {earlyAppointment ? (
            <div className="flex items-start justify-between gap-4 rounded-lg border border-[#d9d9dd] bg-[#f7f6f2] p-4">
              <div className="space-y-1">
                <div className="text-sm font-medium text-[#212121]">
                  {earlyAppointment.patient?.fullname ??
                    `Lịch hẹn #${earlyAppointment.id}`}
                </div>
                <div className="text-sm text-[#75758a]">
                  Ngày khám: {earlyAppointment.appointment_date}
                </div>
                {earlyAppointment.symptoms ? (
                  <div className="text-sm text-[#75758a]">
                    Triệu chứng: {earlyAppointment.symptoms}
                  </div>
                ) : null}
              </div>
              <Badge variant="info">{earlyAppointment.appointment_status}</Badge>
            </div>
          ) : (
            <p className="text-sm text-[#75758a]">
              Hiện chưa có lịch khám nào trong hôm nay.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lịch hẹn sắp tới</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {upcomingQuery.isLoading ? (
            <LoadingState />
          ) : upcomingPreview.length === 0 ? (
            <p className="text-sm text-[#75758a]">
              Chưa có lịch hẹn nào được lên lịch.
            </p>
          ) : (
            <ul className="space-y-2">
              {upcomingPreview.map((appointment) => {
                const meta = STATUS_META[appointment.appointment_status];
                return (
                  <li
                    key={appointment.id}
                    className="flex items-center justify-between gap-4 rounded-lg border border-[#d9d9dd] bg-white p-3"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="size-2 rounded-full"
                        style={{ backgroundColor: meta?.color ?? "#75758a" }}
                      />
                      <div>
                        <div className="text-sm font-medium text-[#212121]">
                          {appointment.patient?.fullname ??
                            `Lịch hẹn #${appointment.id}`}
                        </div>
                        <div className="text-xs text-[#75758a]">
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
                    <Badge variant="outline">
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
