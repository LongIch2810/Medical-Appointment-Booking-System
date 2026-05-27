import {
  Activity,
  Stethoscope,
  Users,
  UsersRound,
  XCircle,
} from "lucide-react";

import { DonutChart, type DonutSegment } from "@/components/app/DonutChart";
import { ErrorState } from "@/components/app/ErrorState";
import { LoadingState } from "@/components/app/LoadingState";
import {
  MetricBarChart,
  type MetricBarItem,
} from "@/components/app/MetricBarChart";
import { PageHeader } from "@/components/app/PageHeader";
import { Badge } from "@/components/ui/badge";
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
  },
  {
    key: "totalDoctorsActiveCount" as const,
    label: "Bác sĩ đang hoạt động",
    description: "Đã đăng nhập gần đây",
    icon: Stethoscope,
  },
  {
    key: "totalPatientsActiveCount" as const,
    label: "Bệnh nhân đang hoạt động",
    description: "Tài khoản patient hoạt động",
    icon: UsersRound,
  },
  {
    key: "totalAppointmentsToDayCount" as const,
    label: "Lịch hẹn hôm nay",
    description: "Lịch active trong ngày",
    icon: Activity,
  },
  {
    key: "totalAppointmentsToDayCancelled" as const,
    label: "Lịch hủy hôm nay",
    description: "Cần theo dõi",
    icon: XCircle,
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
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin dashboard"
        title="Control tower vận hành y tế"
        description="Số liệu thời gian thực về người dùng, bác sĩ, bệnh nhân và lịch hẹn của ngày hôm nay."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {tiles.map((tile) => {
          const Icon = tile.icon;
          const value = stats[tile.key] ?? 0;
          return (
            <Card key={tile.key} className="rounded-lg border-[#d9d9dd]">
              <CardContent className="space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-[#75758a]">{tile.label}</p>
                    <p className="mt-1 text-xs text-[#a4a4b1]">
                      {tile.description}
                    </p>
                  </div>
                  <span className="rounded-full border border-[#d9d9dd] p-2 text-[#75758a]">
                    <Icon className="size-4" />
                  </span>
                </div>
                <div className="font-display text-4xl font-medium leading-none text-[#212121]">
                  {value}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="rounded-lg border-[#d9d9dd]">
          <CardHeader>
            <CardTitle className="text-base">Cơ cấu người dùng</CardTitle>
            <p className="text-xs text-[#75758a]">
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

        <Card className="rounded-lg border-[#d9d9dd]">
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle className="text-base">Lịch hẹn hôm nay</CardTitle>
                <p className="text-xs text-[#75758a]">
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
            <div className="rounded-lg border border-[#d9d9dd] bg-[#f7f6f2] p-4">
              <div className="flex items-center justify-between text-xs text-[#75758a]">
                <span>Tỷ lệ hủy</span>
                <span className="font-medium text-[#212121]">
                  {cancellationRate}%
                </span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-white">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${Math.min(100, cancellationRate)}%`,
                    backgroundColor: cancellationTone.barColor,
                  }}
                />
              </div>
              <p className="mt-2 text-[11px] text-[#a4a4b1]">
                Mức cảnh báo: dưới 10% tốt · 10–30% cần theo dõi · trên 30% cảnh báo.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
