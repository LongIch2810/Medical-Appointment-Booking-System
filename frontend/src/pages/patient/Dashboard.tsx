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
  Ruler,
  Scale,
  ScrollText,
  Sparkles,
  Stethoscope,
  Users,
  UsersRound,
  Wine,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ErrorState from "@/components/notification/ErrorState";
import MedicalAiLoading from "@/components/loading/MedicalAiLoading";
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
  <div className="rounded-2xl border border-slate-200/80 bg-white p-4 transition-all hover:border-primary/40 hover:shadow-2xs dark:border-slate-800 dark:bg-slate-900">
    <div className="flex items-center justify-between gap-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {label}
      </p>
      {icon}
    </div>
    <p className="mt-2 text-base font-bold text-slate-900 dark:text-slate-100">{value}</p>
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
      accent: "from-sky-500/10 via-sky-500/5 to-transparent",
      iconBg: "bg-sky-100 dark:bg-sky-950/50",
      iconText: "text-sky-600 dark:text-sky-400",
    },
    {
      label: "Hồ sơ sức khỏe",
      value: dashboard?.healthProfilesCount ?? 0,
      detail: "Hồ sơ trong tài khoản",
      icon: HeartPulse,
      accent: "from-rose-500/10 via-rose-500/5 to-transparent",
      iconBg: "bg-rose-100 dark:bg-rose-950/50",
      iconText: "text-rose-600 dark:text-rose-400",
    },
    {
      label: "Kết quả khám",
      value: dashboard?.examinationResultsCount ?? 0,
      detail: "Bệnh án & Đơn thuốc đã lưu",
      icon: FileSearch,
      accent: "from-emerald-500/10 via-emerald-500/5 to-transparent",
      iconBg: "bg-emerald-100 dark:bg-emerald-950/50",
      iconText: "text-emerald-600 dark:text-emerald-400",
    },
    {
      label: "Người thân liên kết",
      value: dashboard?.relativesCount ?? 0,
      detail: "Thành viên gia đình quản lý",
      icon: UsersRound,
      accent: "from-violet-500/10 via-violet-500/5 to-transparent",
      iconBg: "bg-violet-100 dark:bg-violet-950/50",
      iconText: "text-violet-600 dark:text-violet-400",
    },
  ];

  if (isLoading) {
    return (
      <MedicalAiLoading
        label="Đang tải dữ liệu tổng quan y tế..."
        description="Hệ thống đang đồng bộ chỉ số sức khỏe và lịch khám của bạn"
        minHeight="min-h-80"
      />
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
    <div className="space-y-6">
      {/* 4 Stat Cards */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => (
          <Card
            key={item.label}
            className="relative overflow-hidden border-slate-200/80 bg-white py-0 shadow-xs transition-all hover:shadow-md hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
          >
            <div
              className={cn(
                "absolute inset-0 bg-gradient-to-br",
                item.accent,
              )}
            />
            <div className="relative flex flex-col gap-3 p-5">
              <div className="flex items-center justify-between">
                <p className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">
                  {item.label}
                </p>
                <span
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-xl shadow-2xs",
                    item.iconBg,
                  )}
                >
                  <item.icon className={cn("h-5 w-5", item.iconText)} />
                </span>
              </div>
              <p className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
                {item.value}
              </p>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{item.detail}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Upcoming Appointments Card */}
      <UpcomingAppointmentsCard />

      {/* Personal Health Profile Card */}
      <Card className="border-slate-200/80 bg-white py-0 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <CardHeader className="flex flex-row items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 px-6 py-4.5">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <ScrollText className="h-4.5 w-4.5" />
            </span>
            <div>
              <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100">
                Hồ sơ sức khỏe cá nhân
              </CardTitle>
              <p className="text-xs text-slate-500 dark:text-slate-400">Chỉ số sinh trắc học và tiền sử y tế cơ bản</p>
            </div>
          </div>
          <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-300 text-xs font-semibold gap-1">
            <Sparkles className="h-3 w-3" />
            Chủ tài khoản
          </Badge>
        </CardHeader>
        <CardContent className="space-y-4 px-6 py-5">
          <div className="grid gap-3.5 md:grid-cols-2 xl:grid-cols-3">
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
              icon={<Droplet className="h-4 w-4 text-rose-500" />}
            />
            <InfoTile
              label="Chiều cao"
              value={formatValue(healthProfile?.height, " cm")}
              icon={<Ruler className="h-4 w-4 text-sky-500" />}
            />
            <InfoTile
              label="Cân nặng"
              value={formatValue(healthProfile?.weight, " kg")}
              icon={<Scale className="h-4 w-4 text-emerald-500" />}
            />
          </div>

          <div className="grid gap-3.5 md:grid-cols-2 pt-1">
            <div className="rounded-2xl border border-amber-200 bg-amber-50/70 dark:border-amber-900/50 dark:bg-amber-950/30 p-4.5">
              <div className="mb-2 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                <p className="text-sm font-bold text-amber-900 dark:text-amber-300">Dị ứng ghi nhận</p>
              </div>
              <Badge
                variant="outline"
                className="border-amber-300 bg-white text-amber-800 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-300 font-medium"
              >
                {formatValue(healthProfile?.allergies)}
              </Badge>
            </div>
            <div className="rounded-2xl border border-rose-200 bg-rose-50/70 dark:border-rose-900/50 dark:bg-rose-950/30 p-4.5">
              <div className="mb-2 flex items-center gap-2">
                <ClipboardList className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                <p className="text-sm font-bold text-rose-900 dark:text-rose-300">Bệnh nền & Tiền sử</p>
              </div>
              <Badge className="bg-rose-600 hover:bg-rose-700 dark:bg-rose-700 text-white font-medium">
                {formatValue(healthProfile?.medical_history)}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lifestyle Tracking Card */}
      <Card className="border-slate-200/80 bg-white py-0 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <CardHeader className="flex flex-row items-center gap-2.5 border-b border-slate-100 dark:border-slate-800 px-6 py-4.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Activity className="h-4.5 w-4.5" />
          </span>
          <div>
            <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100">
              Lối sống &amp; Thói quen vận động
            </CardTitle>
            <p className="text-xs text-slate-500 dark:text-slate-400">Các yếu tố ảnh hưởng trực tiếp đến thể trạng sức khỏe</p>
          </div>
        </CardHeader>
        <CardContent className="grid gap-3.5 px-6 py-5 md:grid-cols-3">
          <InfoTile
            label="Hút thuốc lá"
            value={formatBoolean(healthProfile?.smoking)}
            icon={<CigaretteOff className="h-4 w-4 text-slate-400" />}
          />
          <InfoTile
            label="Rượu bia / Chất có cồn"
            value={formatBoolean(healthProfile?.alcohol_consumption)}
            icon={<Wine className="h-4 w-4 text-slate-400" />}
          />
          <InfoTile
            label="Tần suất thể dục"
            value={formatValue(healthProfile?.exercise_frequency)}
            icon={<Activity className="h-4 w-4 text-emerald-500" />}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
