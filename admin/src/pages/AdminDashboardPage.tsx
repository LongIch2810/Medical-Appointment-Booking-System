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

import { DonutChart, type DonutSegment } from "@/components/app/DonutChart";
import { ErrorState } from "@/components/app/ErrorState";
import { LoadingState } from "@/components/app/LoadingState";
import {
  MetricBarChart,
  type MetricBarItem,
} from "@/components/app/MetricBarChart";
import { PageHeader } from "@/components/app/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAdminDashboard } from "@/hooks/useDashboard";

const tiles = [
  {
    key: "totalUsersCount" as const,
    label: "Tổng người dùng",
    description: "Tất cả tài khoản trong hệ thống",
    icon: Users,
    trend: "+8% tháng này",
  },
  {
    key: "totalDoctorsActiveCount" as const,
    label: "Bác sĩ đang hoạt động",
    description: "Đã đăng nhập gần đây",
    icon: Stethoscope,
    trend: "+2 hôm nay",
  },
  {
    key: "totalPatientsActiveCount" as const,
    label: "Bệnh nhân đang hoạt động",
    description: "Tài khoản patient hoạt động",
    icon: UsersRound,
    trend: "Tăng trưởng đều",
  },
  {
    key: "totalAppointmentsToDayCount" as const,
    label: "Lịch hẹn hôm nay",
    description: "Lịch active trong ngày",
    icon: Activity,
    trend: "Đang diễn ra",
  },
  {
    key: "totalAppointmentsToDayCancelled" as const,
    label: "Lịch hủy hôm nay",
    description: "Cần theo dõi",
    icon: XCircle,
    trend: "Thấp",
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

export function AdminDashboardPage() {
  const { data, isLoading, isError, refetch } = useAdminDashboard();
  const [timeFilter, setTimeFilter] = useState<"today" | "7d" | "30d">("today");
  const navigate = useNavigate();

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
      color: "#9b60aa",
    },
    {
      key: "patients",
      label: "Bệnh nhân active",
      value: stats.totalPatientsActiveCount,
      color: "#ff7759",
    },
    {
      key: "others",
      label: "Khác / chưa active",
      value: otherUsers,
      color: "#212121",
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

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <PageHeader
          eyebrow="Admin dashboard"
          title="Control tower vận hành y tế"
          description="Số liệu thời gian thực về người dùng, bác sĩ, bệnh nhân và lịch hẹn khám."
        />
        <div className="flex items-center gap-1 rounded-full border border-[#d9d9dd] bg-[#f7f6f2] p-1 dark:border-slate-800 dark:bg-slate-900">
          <button
            onClick={() => setTimeFilter("today")}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition ${
              timeFilter === "today"
                ? "bg-[#17171c] text-white shadow-xs dark:bg-slate-800"
                : "text-[#75758a] hover:text-[#212121] dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            <Clock className="size-3" /> Hôm nay
          </button>
          <button
            onClick={() => setTimeFilter("7d")}
            className={`rounded-full px-3 py-1 text-xs font-medium transition ${
              timeFilter === "7d"
                ? "bg-[#17171c] text-white shadow-xs dark:bg-slate-800"
                : "text-[#75758a] hover:text-[#212121] dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            7 ngày qua
          </button>
          <button
            onClick={() => setTimeFilter("30d")}
            className={`rounded-full px-3 py-1 text-xs font-medium transition ${
              timeFilter === "30d"
                ? "bg-[#17171c] text-white shadow-xs dark:bg-slate-800"
                : "text-[#75758a] hover:text-[#212121] dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            30 ngày qua
          </button>
        </div>
      </div>

      {/* Quick Actions Shortcuts */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Button
          variant="outline"
          className="justify-between rounded-lg border-[#d9d9dd] p-4 h-auto hover:bg-[#f7f6f2] dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800"
          onClick={() => navigate("/admin/users")}
        >
          <div className="flex items-center gap-3">
            <span className="rounded-md bg-sky-100 p-2 text-sky-700 dark:bg-sky-950 dark:text-sky-400">
              <UserPlus className="size-4" />
            </span>
            <div className="text-left">
              <div className="text-xs font-semibold text-[#212121] dark:text-slate-100">Tạo người dùng</div>
              <div className="text-[11px] text-[#75758a] dark:text-slate-400">Thêm tk mới</div>
            </div>
          </div>
          <ArrowUpRight className="size-4 text-[#75758a]" />
        </Button>

        <Button
          variant="outline"
          className="justify-between rounded-lg border-[#d9d9dd] p-4 h-auto hover:bg-[#f7f6f2] dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800"
          onClick={() => navigate("/admin/doctors")}
        >
          <div className="flex items-center gap-3">
            <span className="rounded-md bg-purple-100 p-2 text-purple-700 dark:bg-purple-950 dark:text-purple-400">
              <Stethoscope className="size-4" />
            </span>
            <div className="text-left">
              <div className="text-xs font-semibold text-[#212121] dark:text-slate-100">Quản lý bác sĩ</div>
              <div className="text-[11px] text-[#75758a] dark:text-slate-400">Danh sách & chứng chỉ</div>
            </div>
          </div>
          <ArrowUpRight className="size-4 text-[#75758a]" />
        </Button>

        <Button
          variant="outline"
          className="justify-between rounded-lg border-[#d9d9dd] p-4 h-auto hover:bg-[#f7f6f2] dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800"
          onClick={() => navigate("/admin/role-permissions")}
        >
          <div className="flex items-center gap-3">
            <span className="rounded-md bg-emerald-100 p-2 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
              <ShieldCheck className="size-4" />
            </span>
            <div className="text-left">
              <div className="text-xs font-semibold text-[#212121] dark:text-slate-100">Phân quyền vai trò</div>
              <div className="text-[11px] text-[#75758a] dark:text-slate-400">Ma trận quyền hạn</div>
            </div>
          </div>
          <ArrowUpRight className="size-4 text-[#75758a]" />
        </Button>

        <Button
          variant="outline"
          className="justify-between rounded-lg border-[#d9d9dd] p-4 h-auto hover:bg-[#f7f6f2] dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800"
          onClick={() => navigate("/admin/complaints")}
        >
          <div className="flex items-center gap-3">
            <span className="rounded-md bg-amber-100 p-2 text-amber-700 dark:bg-amber-950 dark:text-amber-400">
              <MessageSquareHeart className="size-4" />
            </span>
            <div className="text-left">
              <div className="text-xs font-semibold text-[#212121] dark:text-slate-100">Xem phản hồi</div>
              <div className="text-[11px] text-[#75758a] dark:text-slate-400">Đóng góp ý kiến</div>
            </div>
          </div>
          <ArrowUpRight className="size-4 text-[#75758a]" />
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {tiles.map((tile) => {
          const Icon = tile.icon;
          const value = stats[tile.key] ?? 0;
          return (
            <Card key={tile.key} className="rounded-lg border-[#d9d9dd] transition-all hover:shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <CardContent className="space-y-4 pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-[#75758a] dark:text-slate-400">{tile.label}</p>
                    <p className="mt-1 text-xs text-[#a4a4b1] dark:text-slate-500">
                      {tile.description}
                    </p>
                  </div>
                  <span className="rounded-full border border-[#d9d9dd] p-2 text-[#75758a] dark:border-slate-800 dark:text-slate-400">
                    <Icon className="size-4" />
                  </span>
                </div>
                <div className="flex items-baseline justify-between">
                  <div className="font-display text-4xl font-medium leading-none text-[#212121] dark:text-slate-100">
                    {value}
                  </div>
                  <span className="rounded bg-[#f7f6f2] px-2 py-0.5 text-[11px] text-[#75758a] dark:bg-slate-800 dark:text-slate-400">
                    {tile.trend}
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="rounded-lg border-[#d9d9dd] dark:border-slate-800 dark:bg-slate-900">
          <CardHeader>
            <CardTitle className="text-base dark:text-slate-100">Cơ cấu người dùng</CardTitle>
            <p className="text-xs text-[#75758a] dark:text-slate-400">
              Tỷ lệ tài khoản theo vai trò trong hệ thống.
            </p>
          </CardHeader>
          <CardContent>
            <DonutChart
              segments={userSegments}
              centerSubtitle="Tổng người dùng"
            />
          </CardContent>
        </Card>

        <Card className="rounded-lg border-[#d9d9dd] dark:border-slate-800 dark:bg-slate-900">
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle className="text-base dark:text-slate-100">Lịch hẹn hôm nay</CardTitle>
                <p className="text-xs text-[#75758a] dark:text-slate-400">
                  So sánh giữa lịch active và lịch đã hủy.
                </p>
              </div>
              <Badge variant={cancellationTone.tone}>
                {cancellationTone.label}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <MetricBarChart items={todayBars} />
            <div className="rounded-lg border border-[#d9d9dd] bg-[#f7f6f2] p-4 dark:border-slate-800 dark:bg-slate-950">
              <div className="flex items-center justify-between text-xs text-[#75758a] dark:text-slate-400">
                <span>Tỷ lệ hủy</span>
                <span className="font-medium text-[#212121] dark:text-slate-200">
                  {cancellationRate}%
                </span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-white dark:bg-slate-800">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${Math.min(100, cancellationRate)}%`,
                    backgroundColor: cancellationTone.barColor,
                  }}
                />
              </div>
              <p className="mt-2 text-[11px] text-[#a4a4b1] dark:text-slate-500">
                Mức cảnh báo: dưới 10% tốt · 10–30% cần theo dõi · trên 30% cảnh báo.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

