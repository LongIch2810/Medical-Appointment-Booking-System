import React from "react";
import {
  Activity,
  AlertTriangle,
  Cake,
  CalendarCheck2,
  CigaretteOff,
  ClipboardList,
  Droplet,
  FileSearch,
  HeartPulse,
  MessageSquareMore,
  Ruler,
  Scale,
  ScrollText,
  Stethoscope,
  Users,
  UsersRound,
  Wine,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import ErrorState from "@/components/notification/ErrorState";
import UpcomingAppointmentsCard from "@/components/dashboard/UpcomingAppointmentsCard";
import { usePatientDashboard } from "@/hooks/usePatientPortalApi";
import { useProfile } from "@/hooks/useProfile";
import type { PatientUser } from "@/types/interface/patient.interface";
import { cn } from "@/lib/utils";

const formatBoolean = (value: boolean | null | undefined) => {
  if (value === null || value === undefined) return "Chưa cập nhật";
  return value ? "Có" : "Không";
};

const formatValue = (
  value: string | number | null | undefined,
  suffix: string = "",
) => {
  if (value === null || value === undefined || value === "") {
    return "Chưa cập nhật";
  }
  return `${value}${suffix}`;
};

type StatItem = {
  label: string;
  value: number;
  detail: string;
  icon: typeof CalendarCheck2;
  accent: string;
  iconBg: string;
  iconText: string;
};

const InfoTile: React.FC<{
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
}> = ({ label, value, icon }) => (
  <div className="rounded-xl border border-slate-200 bg-white p-4 transition-shadow hover:shadow-sm">
    <div className="flex items-center justify-between gap-2">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>
      {icon}
    </div>
    <p className="mt-1.5 text-base font-semibold text-slate-900">{value}</p>
  </div>
);

const Dashboard: React.FC = () => {
  const {
    data: dashboardResponse,
    isLoading: isDashboardLoading,
    isError,
    refetch,
  } = usePatientDashboard();
  const { data: profileResponse, isLoading: isProfileLoading } = useProfile();
  const isLoading = isDashboardLoading || isProfileLoading;

  const dashboard = dashboardResponse?.data;
  const profile = profileResponse?.data as PatientUser | undefined;
  const healthProfile = dashboard?.personalHealthProfile;

  const stats: StatItem[] = [
    {
      label: "Lịch khám sắp tới",
      value: dashboard?.upcomingAppointmentsCount ?? 0,
      detail: "Đang chờ hoặc đã xác nhận",
      icon: CalendarCheck2,
      accent: "from-sky-500/10 to-sky-500/0",
      iconBg: "bg-sky-100",
      iconText: "text-sky-600",
    },
    {
      label: "Hồ sơ sức khỏe",
      value: dashboard?.healthProfilesCount ?? 0,
      detail: "Hồ sơ trong tài khoản",
      icon: HeartPulse,
      accent: "from-rose-500/10 to-rose-500/0",
      iconBg: "bg-rose-100",
      iconText: "text-rose-600",
    },
    {
      label: "Kết quả khám",
      value: dashboard?.examinationResultsCount ?? 0,
      detail: "Kết quả đã lưu",
      icon: FileSearch,
      accent: "from-emerald-500/10 to-emerald-500/0",
      iconBg: "bg-emerald-100",
      iconText: "text-emerald-600",
    },
    {
      label: "Người thân",
      value: dashboard?.relativesCount ?? 0,
      detail: "Bệnh nhân quản lý",
      icon: UsersRound,
      accent: "from-violet-500/10 to-violet-500/0",
      iconBg: "bg-violet-100",
      iconText: "text-violet-600",
    },
  ];

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, idx) => (
            <Skeleton key={idx} className="h-28 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-56 rounded-2xl" />
        <Skeleton className="h-32 rounded-2xl" />
      </div>
    );
  }

  if (isError) {
    return (
      <ErrorState
        title="Không thể tải dữ liệu dashboard"
        description="Đã có lỗi xảy ra khi tải dữ liệu. Vui lòng thử lại."
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => (
          <Card
            key={item.label}
            className={cn(
              "relative overflow-hidden border-slate-200 py-0 shadow-sm transition-shadow hover:shadow-md",
            )}
          >
            <div
              className={cn(
                "absolute inset-0 bg-gradient-to-br",
                item.accent,
              )}
            />
            <div className="relative flex flex-col gap-3 p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-700">
                  {item.label}
                </p>
                <span
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-xl",
                    item.iconBg,
                  )}
                >
                  <item.icon className={cn("h-4 w-4", item.iconText)} />
                </span>
              </div>
              <p className="text-3xl font-extrabold tracking-tight text-slate-900">
                {item.value}
              </p>
              <p className="text-xs text-slate-500">{item.detail}</p>
            </div>
          </Card>
        ))}
      </div>

      <UpcomingAppointmentsCard />

      <Card className="border-slate-200 py-0 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <ScrollText className="h-4 w-4" />
            </span>
            <CardTitle className="text-base font-semibold text-slate-900">
              Hồ sơ sức khỏe cá nhân
            </CardTitle>
          </div>
          <Badge variant="outline" className="text-xs font-medium">
            Cá nhân
          </Badge>
        </CardHeader>
        <CardContent className="space-y-4 px-5 py-5">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            <InfoTile
              label="Họ và tên"
              value={formatValue(profile?.fullname)}
              icon={<Stethoscope className="h-4 w-4 text-slate-400" />}
            />
            <InfoTile
              label="Ngày sinh"
              value={formatValue(profile?.date_of_birth)}
              icon={<Cake className="h-4 w-4 text-pink-400" />}
            />
            <InfoTile
              label="Giới tính"
              value={
                profile?.gender === undefined
                  ? "Chưa cập nhật"
                  : profile.gender
                    ? "Nam"
                    : "Nữ"
              }
              icon={<Users className="h-4 w-4 text-indigo-400" />}
            />
            <InfoTile
              label="Nhóm máu"
              value={formatValue(healthProfile?.blood_type)}
              icon={<Droplet className="h-4 w-4 text-rose-400" />}
            />
            <InfoTile
              label="Chiều cao"
              value={formatValue(healthProfile?.height, " cm")}
              icon={<Ruler className="h-4 w-4 text-sky-400" />}
            />
            <InfoTile
              label="Cân nặng"
              value={formatValue(healthProfile?.weight, " kg")}
              icon={<Scale className="h-4 w-4 text-emerald-400" />}
            />
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4">
              <div className="mb-2 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <p className="text-sm font-semibold text-amber-900">Dị ứng</p>
              </div>
              <Badge
                variant="outline"
                className="border-amber-300 bg-white text-amber-800"
              >
                {formatValue(healthProfile?.allergies)}
              </Badge>
            </div>
            <div className="rounded-xl border border-rose-200 bg-rose-50/60 p-4">
              <div className="mb-2 flex items-center gap-2">
                <ClipboardList className="h-4 w-4 text-rose-600" />
                <p className="text-sm font-semibold text-rose-900">Bệnh nền</p>
              </div>
              <Badge className="bg-rose-600 hover:bg-rose-600">
                {formatValue(healthProfile?.medical_history)}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200 py-0 shadow-sm">
        <CardHeader className="flex flex-row items-center gap-2 border-b border-slate-100 px-5 py-4">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <MessageSquareMore className="h-4 w-4" />
          </span>
          <CardTitle className="text-base font-semibold text-slate-900">
            Thông tin theo dõi
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 px-5 py-5 md:grid-cols-3">
          <InfoTile
            label="Hút thuốc"
            value={formatBoolean(healthProfile?.smoking)}
            icon={<CigaretteOff className="h-4 w-4 text-slate-400" />}
          />
          <InfoTile
            label="Rượu bia"
            value={formatBoolean(healthProfile?.alcohol_consumption)}
            icon={<Wine className="h-4 w-4 text-slate-400" />}
          />
          <InfoTile
            label="Vận động"
            value={formatValue(healthProfile?.exercise_frequency)}
            icon={<Activity className="h-4 w-4 text-slate-400" />}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
