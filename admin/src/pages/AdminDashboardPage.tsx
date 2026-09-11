import {
  Activity,
  ArrowUpRight,
  Clock,
  MessageSquareHeart,
  ShieldCheck,
  Stethoscope,
  UserPlus,
  Users,
  UsersRound,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bar, Line } from "react-chartjs-2";

import { DonutChart, type DonutSegment } from "@/components/app/DonutChart";
import { EmptyState } from "@/components/app/EmptyState";
import { ErrorState } from "@/components/app/ErrorState";
import { LoadingState } from "@/components/app/LoadingState";
import {
  MetricBarChart,
  type MetricBarItem,
} from "@/components/app/MetricBarChart";
import { PageHeader } from "@/components/app/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAdminAppointments } from "@/hooks/useAppointments";
import { useAdminDashboard } from "@/hooks/useDashboard";
import { useDoctors } from "@/hooks/useDoctors";
import "@/lib/chartSetup";
import type { Appointment } from "@/types/interface/appointment.interface";
import type { Doctor } from "@/types/interface/doctor.interface";

const tiles = [
  {
    key: "totalUsersCount" as const,
    label: "Tổng người dùng",
    description: "Tất cả tài khoản trong hệ thống",
    icon: Users,
    trend: "+8% tháng này",
    gradient: "from-teal-500/10 via-teal-500/5 to-transparent dark:from-teal-500/20",
    iconColor: "text-teal-600 dark:text-teal-400",
    iconBg: "bg-teal-100 dark:bg-teal-950/60",
  },
  {
    key: "totalDoctorsActiveCount" as const,
    label: "Bác sĩ đang hoạt động",
    description: "Bác sĩ đã đăng nhập gần đây",
    icon: Stethoscope,
    trend: "+2 hôm nay",
    gradient: "from-sky-500/10 via-sky-500/5 to-transparent dark:from-sky-500/20",
    iconColor: "text-sky-600 dark:text-sky-400",
    iconBg: "bg-sky-100 dark:bg-sky-950/60",
  },
  {
    key: "totalPatientsActiveCount" as const,
    label: "Bệnh nhân hoạt động",
    description: "Tài khoản bệnh nhân kích hoạt",
    icon: UsersRound,
    trend: "Tăng trưởng đều",
    gradient: "from-emerald-500/10 via-emerald-500/5 to-transparent dark:from-emerald-500/20",
    iconColor: "text-emerald-600 dark:text-emerald-400",
    iconBg: "bg-emerald-100 dark:bg-emerald-950/60",
  },
  {
    key: "totalAppointmentsToDayCount" as const,
    label: "Lịch hẹn hôm nay",
    description: "Lịch active trong ngày",
    icon: Activity,
    trend: "Đang diễn ra",
    gradient: "from-primary/10 via-primary/5 to-transparent dark:from-primary/20",
    iconColor: "text-primary dark:text-emerald-400",
    iconBg: "bg-primary/10 dark:bg-emerald-950/60",
  },
  {
    key: "totalAppointmentsToDayCancelled" as const,
    label: "Lịch hủy hôm nay",
    description: "Cần giám sát tỷ lệ hủy",
    icon: XCircle,
    trend: "Thấp",
    gradient: "from-rose-500/10 via-rose-500/5 to-transparent dark:from-rose-500/20",
    iconColor: "text-rose-600 dark:text-rose-400",
    iconBg: "bg-rose-100 dark:bg-rose-950/60",
  },
];

function getCancellationTone(rate: number) {
  if (rate <= 10) {
    return {
      label: "Tỷ lệ hủy ổn định",
      tone: "success" as const,
      barColor: "#10b981",
    };
  }
  if (rate <= 30) {
    return {
      label: "Cần theo dõi",
      tone: "warning" as const,
      barColor: "#f59e0b",
    };
  }
  return {
    label: "Cảnh báo cao",
    tone: "danger" as const,
    barColor: "#ef4444",
  };
}

function parseAppointmentDate(dateStr?: string): Date | null {
  if (!dateStr) return null;
  const match = /^(\d{2})[/-](\d{2})[/-](\d{4})$/.exec(dateStr.trim());
  if (!match) return null;
  const [, day, month, year] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  return Number.isNaN(date.getTime()) ? null : date;
}

function buildAppointmentsByDayData(appointments: Appointment[]) {
  const counts = new Map<string, number>();
  for (const appointment of appointments) {
    const date = parseAppointmentDate(appointment.appointment_date);
    if (!date) continue;
    const key = date.toISOString().slice(0, 10);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const sortedKeys = Array.from(counts.keys()).sort();
  return {
    labels: sortedKeys.map((key) => {
      const [, month, day] = key.split("-");
      return `${day}/${month}`;
    }),
    values: sortedKeys.map((key) => counts.get(key) ?? 0),
  };
}

const TOP_DOCTORS_LIMIT = 8;

function buildDoctorCompletedData(doctors: Doctor[]) {
  const ranked = doctors
    .filter((doctor) => doctor.appointments_completed > 0)
    .sort((a, b) => b.appointments_completed - a.appointments_completed)
    .slice(0, TOP_DOCTORS_LIMIT);
  return {
    labels: ranked.map((doctor) => doctor.fullname),
    values: ranked.map((doctor) => doctor.appointments_completed),
  };
}

export function AdminDashboardPage() {
  const { data, isLoading, isError, refetch } = useAdminDashboard();
  const [timeFilter, setTimeFilter] = useState<"today" | "7d" | "30d">("today");
  const navigate = useNavigate();

  const appointmentsQuery = useAdminAppointments({ page: 1, limit: 200 });
  const doctorsQuery = useDoctors({ page: 1, limit: 100 });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Admin dashboard"
          title="Tổng quan hệ thống"
          description="Đang đồng bộ dữ liệu vận hành từ backend."
        />
        <LoadingState />
      </div>
    );
  }

  if (isError || !data?.data) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Admin dashboard"
          title="Tổng quan hệ thống"
          description="Không thể tải dữ liệu dashboard."
        />
        <ErrorState onRetry={() => refetch()} />
      </div>
    );
  }

  const stats = data.data;

  const otherUsers = Math.max(
    0,
    stats.totalUsersCount -
      stats.totalDoctorsActiveCount -
      stats.totalPatientsActiveCount,
  );

  const userSegments: DonutSegment[] = [
    {
      key: "doctors",
      label: "Bác sĩ active",
      value: stats.totalDoctorsActiveCount,
      color: "#0ea5e9",
    },
    {
      key: "patients",
      label: "Bệnh nhân active",
      value: stats.totalPatientsActiveCount,
      color: "#10b981",
    },
    {
      key: "others",
      label: "Khác / chưa active",
      value: otherUsers,
      color: "#64748b",
    },
  ];

  const todayAppointments = stats.totalAppointmentsToDayCount;
  const cancelledAppointments = stats.totalAppointmentsToDayCancelled;
  const totalToday = todayAppointments + cancelledAppointments;
  const cancellationRate = totalToday
    ? Math.round((cancelledAppointments / totalToday) * 100)
    : 0;
  const cancellationTone = getCancellationTone(cancellationRate);

  const todayBars: MetricBarItem[] = [
    {
      key: "active",
      label: "Lịch active hôm nay",
      value: todayAppointments,
      color: "#10b981",
    },
    {
      key: "cancelled",
      label: "Lịch hủy hôm nay",
      value: cancelledAppointments,
      color: "#ef4444",
    },
  ];

  const appointmentsByDay = buildAppointmentsByDayData(
    appointmentsQuery.data?.data.appointments ?? [],
  );
  const doctorCompleted = buildDoctorCompletedData(
    doctorsQuery.data?.data.doctors ?? [],
  );

  const appointmentsByDayChartData = {
    labels: appointmentsByDay.labels,
    datasets: [
      {
        label: "Số lịch hẹn",
        data: appointmentsByDay.values,
        borderColor: "#007664",
        backgroundColor: "rgba(0, 118, 100, 0.12)",
        tension: 0.35,
        fill: true,
        pointRadius: 4,
        pointBackgroundColor: "#007664",
      },
    ],
  };

  const doctorCompletedChartData = {
    labels: doctorCompleted.labels,
    datasets: [
      {
        label: "Lượt khám hoàn thành",
        data: doctorCompleted.values,
        backgroundColor: "#0284c7",
        borderRadius: 8,
      },
    ],
  };

  const chartOptionsBase = {
    maintainAspectRatio: false,
    responsive: true,
    plugins: { legend: { display: false } },
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <PageHeader
          eyebrow="Admin dashboard"
          title="Control tower vận hành y tế"
          description="Số liệu thời gian thực về người dùng, bác sĩ, bệnh nhân và lịch hẹn khám."
        />
        <div className="flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-2xs dark:border-slate-800 dark:bg-slate-900 shrink-0">
          <button
            onClick={() => setTimeFilter("today")}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
              timeFilter === "today"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
            }`}
          >
            <Clock className="size-3.5" /> Hôm nay
          </button>
          <button
            onClick={() => setTimeFilter("7d")}
            className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
              timeFilter === "7d"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
            }`}
          >
            7 ngày qua
          </button>
          <button
            onClick={() => setTimeFilter("30d")}
            className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
              timeFilter === "30d"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
            }`}
          >
            30 ngày qua
          </button>
        </div>
      </div>

      {/* Quick Actions Shortcuts */}
      <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        <Button
          variant="outline"
          className="justify-between rounded-2xl border-slate-200/80 p-4 h-auto hover:border-primary/40 hover:bg-slate-50/80 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800 shadow-2xs group"
          onClick={() => navigate("/admin/users")}
        >
          <div className="flex items-center gap-3">
            <span className="rounded-xl bg-sky-100 p-2.5 text-sky-700 dark:bg-sky-950 dark:text-sky-400 group-hover:scale-105 transition-transform">
              <UserPlus className="size-4.5" />
            </span>
            <div className="text-left min-w-0">
              <div className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">Tạo người dùng</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">Thêm tài khoản mới</div>
            </div>
          </div>
          <ArrowUpRight className="size-4 text-slate-400 group-hover:text-primary transition-colors shrink-0" />
        </Button>

        <Button
          variant="outline"
          className="justify-between rounded-2xl border-slate-200/80 p-4 h-auto hover:border-primary/40 hover:bg-slate-50/80 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800 shadow-2xs group"
          onClick={() => navigate("/admin/doctors")}
        >
          <div className="flex items-center gap-3">
            <span className="rounded-xl bg-teal-100 p-2.5 text-teal-700 dark:bg-teal-950 dark:text-teal-400 group-hover:scale-105 transition-transform">
              <Stethoscope className="size-4.5" />
            </span>
            <div className="text-left min-w-0">
              <div className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">Quản lý bác sĩ</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">Danh sách &amp; lịch trực</div>
            </div>
          </div>
          <ArrowUpRight className="size-4 text-slate-400 group-hover:text-primary transition-colors shrink-0" />
        </Button>

        <Button
          variant="outline"
          className="justify-between rounded-2xl border-slate-200/80 p-4 h-auto hover:border-primary/40 hover:bg-slate-50/80 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800 shadow-2xs group"
          onClick={() => navigate("/admin/role-permissions")}
        >
          <div className="flex items-center gap-3">
            <span className="rounded-xl bg-emerald-100 p-2.5 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 group-hover:scale-105 transition-transform">
              <ShieldCheck className="size-4.5" />
            </span>
            <div className="text-left min-w-0">
              <div className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">Phân quyền vai trò</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">Ma trận quyền hạn RBAC</div>
            </div>
          </div>
          <ArrowUpRight className="size-4 text-slate-400 group-hover:text-primary transition-colors shrink-0" />
        </Button>

        <Button
          variant="outline"
          className="justify-between rounded-2xl border-slate-200/80 p-4 h-auto hover:border-primary/40 hover:bg-slate-50/80 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800 shadow-2xs group"
          onClick={() => navigate("/admin/complaints")}
        >
          <div className="flex items-center gap-3">
            <span className="rounded-xl bg-amber-100 p-2.5 text-amber-700 dark:bg-amber-950 dark:text-amber-400 group-hover:scale-105 transition-transform">
              <MessageSquareHeart className="size-4.5" />
            </span>
            <div className="text-left min-w-0">
              <div className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">Xem góp ý &amp; khiếu nại</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">Phản hồi từ bệnh nhân</div>
            </div>
          </div>
          <ArrowUpRight className="size-4 text-slate-400 group-hover:text-primary transition-colors shrink-0" />
        </Button>
      </div>

      {/* 5 KPI Metric Cards */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {tiles.map((tile) => {
          const Icon = tile.icon;
          const value = stats[tile.key] ?? 0;
          return (
            <Card
              key={tile.key}
              className="rounded-3xl border-slate-200/80 bg-white shadow-2xs transition-all hover:shadow-md hover:border-primary/40 dark:border-slate-800 dark:bg-slate-900 overflow-hidden relative"
            >
              <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl ${tile.gradient} rounded-bl-full pointer-events-none`} />
              <CardContent className="space-y-4 pt-6 p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{tile.label}</p>
                    <p className="text-[11px] text-slate-400 dark:text-slate-400">
                      {tile.description}
                    </p>
                  </div>
                  <span className={cn("rounded-2xl p-2.5 shadow-2xs shrink-0", tile.iconBg, tile.iconColor)}>
                    <Icon className="size-5" />
                  </span>
                </div>
                <div className="flex items-baseline justify-between pt-1">
                  <div className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
                    {value}
                  </div>
                  <Badge variant="outline" className="border-slate-200 bg-slate-50 text-[10px] font-bold text-slate-600 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300">
                    {tile.trend}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Donut Chart & Today Metric Chart */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="rounded-3xl border-slate-200/80 dark:border-slate-800 dark:bg-slate-900 p-6">
          <CardHeader className="p-0 pb-4 border-b border-slate-100 dark:border-slate-800">
            <CardTitle className="text-base font-bold dark:text-slate-100">Cơ cấu tài khoản người dùng</CardTitle>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Tỷ lệ tài khoản theo vai trò (Bác sĩ / Bệnh nhân / Quản trị viên) trong hệ thống.
            </p>
          </CardHeader>
          <CardContent className="p-0 pt-4">
            <DonutChart
              segments={userSegments}
              centerSubtitle="Tổng người dùng"
            />
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-slate-200/80 dark:border-slate-800 dark:bg-slate-900 p-6">
          <CardHeader className="p-0 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle className="text-base font-bold dark:text-slate-100">Tình trạng lịch hẹn hôm nay</CardTitle>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Tỷ lệ so sánh giữa các ca khám active và ca đã bị hủy trong ngày.
                </p>
              </div>
              <Badge variant={cancellationTone.tone} className="text-xs font-bold">
                {cancellationTone.label}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0 pt-4 space-y-5">
            <MetricBarChart items={todayBars} />
            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-950">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span className="font-semibold">Tỷ lệ hủy lịch hôm nay</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">
                  {cancellationRate}%
                </span>
              </div>
              <div className="mt-2.5 h-2.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(100, cancellationRate)}%`,
                    backgroundColor: cancellationTone.barColor,
                  }}
                />
              </div>
              <p className="mt-2 text-[11px] text-slate-400 dark:text-slate-400">
                Tiêu chuẩn vận hành: dưới 10% (Tốt) • 10–30% (Cần theo dõi) • trên 30% (Báo động).
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Appointment Trends Line Chart & Top Doctors Bar Chart */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="rounded-3xl border-slate-200/80 dark:border-slate-800 dark:bg-slate-900 p-6">
          <CardHeader className="p-0 pb-4 border-b border-slate-100 dark:border-slate-800">
            <CardTitle className="text-base font-bold dark:text-slate-100">
              Xu hướng số lượng lịch hẹn theo ngày
            </CardTitle>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Thống kê số lượng ca khám ghi nhận theo từng ngày dựa trên dữ liệu hệ thống.
            </p>
          </CardHeader>
          <CardContent className="p-0 pt-4">
            {appointmentsQuery.isLoading ? (
              <LoadingState />
            ) : appointmentsQuery.isError ? (
              <ErrorState onRetry={() => appointmentsQuery.refetch()} />
            ) : appointmentsByDay.labels.length === 0 ? (
              <EmptyState
                title="Chưa có dữ liệu"
                description="Chưa có đủ dữ liệu lịch hẹn để hiển thị biểu đồ theo ngày."
              />
            ) : (
              <div className="h-72 w-full">
                <Line
                  data={appointmentsByDayChartData}
                  options={chartOptionsBase}
                />
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-slate-200/80 dark:border-slate-800 dark:bg-slate-900 p-6">
          <CardHeader className="p-0 pb-4 border-b border-slate-100 dark:border-slate-800">
            <CardTitle className="text-base font-bold dark:text-slate-100">
              Top bác sĩ hoàn thành nhiều ca khám nhất
            </CardTitle>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Xếp hạng hiệu suất các bác sĩ có số lượt khám hoàn tất cao nhất.
            </p>
          </CardHeader>
          <CardContent className="p-0 pt-4">
            {doctorsQuery.isLoading ? (
              <LoadingState />
            ) : doctorsQuery.isError ? (
              <ErrorState onRetry={() => doctorsQuery.refetch()} />
            ) : doctorCompleted.labels.length === 0 ? (
              <EmptyState
                title="Chưa có dữ liệu"
                description="Chưa có dữ liệu lượt khám hoàn thành theo bác sĩ."
              />
            ) : (
              <div className="h-72 w-full">
                <Bar
                  data={doctorCompletedChartData}
                  options={chartOptionsBase}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


