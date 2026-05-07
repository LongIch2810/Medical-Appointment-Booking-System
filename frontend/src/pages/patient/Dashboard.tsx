import React from "react";
import {
  CalendarCheck2,
  FileSearch,
  HeartPulse,
  MessageSquareMore,
  UsersRound,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { usePatientDashboard } from "@/hooks/usePatientPortalApi";
import { useProfile } from "@/hooks/useProfile";

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

const Dashboard: React.FC = () => {
  const { data: dashboardResponse, isLoading, isError } = usePatientDashboard();
  const { data: profileResponse } = useProfile();

  const dashboard = dashboardResponse?.data;
  const profile = profileResponse?.data;
  const healthProfile = dashboard?.personalHealthProfile;

  const stats = [
    {
      label: "Lịch khám sắp tới",
      value: dashboard?.upcomingAppointmentsCount ?? 0,
      detail: "Đang chờ hoặc đã xác nhận",
      icon: CalendarCheck2,
    },
    {
      label: "Hồ sơ sức khỏe",
      value: dashboard?.healthProfilesCount ?? 0,
      detail: "Hồ sơ trong tài khoản",
      icon: HeartPulse,
    },
    {
      label: "Kết quả khám",
      value: dashboard?.examinationResultsCount ?? 0,
      detail: "Kết quả đã lưu",
      icon: FileSearch,
    },
    {
      label: "Người thân",
      value: dashboard?.relativesCount ?? 0,
      detail: "Bệnh nhân quản lý",
      icon: UsersRound,
    },
  ];

  if (isLoading) {
    return (
      <Card className="border-primary/15 p-5 text-sm text-slate-600">
        Đang tải dashboard...
      </Card>
    );
  }

  if (isError) {
    return (
      <Card className="border-primary/15 p-5 text-sm text-red-600">
        Không thể tải dữ liệu dashboard.
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => (
          <Card key={item.label} className="gap-3 border-primary/15 py-4">
            <CardHeader className="px-4">
              <CardTitle className="flex items-center justify-between text-sm text-slate-600">
                {item.label}
                <item.icon className="h-4 w-4 text-primary" />
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4">
              <p className="text-2xl font-extrabold text-primary">
                {item.value}
              </p>
              <p className="text-xs text-slate-500">{item.detail}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="gap-4 border-primary/15 py-5">
        <CardHeader className="px-5">
          <CardTitle className="text-lg">Hồ sơ sức khỏe cá nhân</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 px-5">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            <div className="rounded-lg border border-slate-200 bg-white p-3">
              <p className="text-xs text-slate-500">Họ và tên</p>
              <p className="text-sm font-semibold text-slate-900">
                {formatValue(profile?.fullname)}
              </p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-3">
              <p className="text-xs text-slate-500">Ngày sinh</p>
              <p className="text-sm font-semibold text-slate-900">
                {formatValue(profile?.date_of_birth)}
              </p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-3">
              <p className="text-xs text-slate-500">Giới tính</p>
              <p className="text-sm font-semibold text-slate-900">
                {profile?.gender === undefined
                  ? "Chưa cập nhật"
                  : profile.gender
                    ? "Nam"
                    : "Nữ"}
              </p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-3">
              <p className="text-xs text-slate-500">Nhóm máu</p>
              <p className="text-sm font-semibold text-slate-900">
                {formatValue(healthProfile?.blood_type)}
              </p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-3">
              <p className="text-xs text-slate-500">Chiều cao</p>
              <p className="text-sm font-semibold text-slate-900">
                {formatValue(healthProfile?.height, " cm")}
              </p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-3">
              <p className="text-xs text-slate-500">Cân nặng</p>
              <p className="text-sm font-semibold text-slate-900">
                {formatValue(healthProfile?.weight, " kg")}
              </p>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-lg border border-slate-200 bg-white p-3">
              <p className="mb-2 text-sm font-semibold text-slate-900">
                Dị ứng
              </p>
              <Badge variant="outline">
                {formatValue(healthProfile?.allergies)}
              </Badge>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-3">
              <p className="mb-2 text-sm font-semibold text-slate-900">
                Bệnh nền
              </p>
              <Badge>{formatValue(healthProfile?.medical_history)}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="gap-4 border-primary/15 py-5">
        <CardHeader className="px-5">
          <CardTitle className="flex items-center gap-2 text-lg">
            <MessageSquareMore className="h-5 w-5 text-primary" />
            Thông tin theo dõi
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 px-5 md:grid-cols-3">
          <div className="rounded-lg border border-slate-200 bg-white p-3">
            <p className="text-xs text-slate-500">Hút thuốc</p>
            <p className="text-sm font-semibold text-slate-900">
              {formatBoolean(healthProfile?.smoking)}
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-3">
            <p className="text-xs text-slate-500">Rượu bia</p>
            <p className="text-sm font-semibold text-slate-900">
              {formatBoolean(healthProfile?.alcohol_consumption)}
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-3">
            <p className="text-xs text-slate-500">Vận động</p>
            <p className="text-sm font-semibold text-slate-900">
              {formatValue(healthProfile?.exercise_frequency)}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
