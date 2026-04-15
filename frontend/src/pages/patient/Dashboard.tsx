import React from "react";
import {
  CalendarCheck2,
  FileSearch,
  HeartPulse,
  MessageSquareMore,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { usePatientPortal } from "@/pages/patient/usePatientPortal";

const Dashboard: React.FC = () => {
  const { appointments, conversations, visitResults, healthRecord, profile } =
    usePatientPortal();

  const upcomingCount = appointments.filter(
    (appointment) =>
      appointment.status === "confirmed" || appointment.status === "pending",
  ).length;
  const unreadCount = conversations.reduce(
    (total, conversation) => total + conversation.unread,
    0,
  );

  const stats = [
    {
      label: "Lịch khám sắp tới",
      value: upcomingCount,
      detail: "Cần theo dõi",
      icon: CalendarCheck2,
    },
    {
      label: "Chỉ số sức khỏe",
      value: healthRecord.metrics.length,
      detail: "Đang được lưu",
      icon: HeartPulse,
    },
    {
      label: "Kết quả khám",
      value: visitResults.length,
      detail: "Lần khám gần đây",
      icon: FileSearch,
    },
    {
      label: "Tin nhắn chưa đọc",
      value: unreadCount,
      detail: "Từ bác sĩ",
      icon: MessageSquareMore,
    },
  ];

  const todoItems = [
    "Sau khi đăng ký tài khoản và đăng nhập lần đầu, hãy cập nhật hồ sơ sức khỏe cá nhân.",
    "Cập nhật thông tin cá nhân nếu có thay đổi số điện thoại hoặc địa chỉ.",
    "Tải lên kết quả xét nghiệm mới nhất vào hồ sơ sức khỏe.",
    "Xác nhận lịch khám đã đặt trong tuần này.",
  ];

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
                {profile.fullName}
              </p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-3">
              <p className="text-xs text-slate-500">Ngày sinh</p>
              <p className="text-sm font-semibold text-slate-900">
                {profile.dateOfBirth}
              </p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-3">
              <p className="text-xs text-slate-500">Giới tính</p>
              <p className="text-sm font-semibold text-slate-900">
                {profile.gender}
              </p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-3">
              <p className="text-xs text-slate-500">Nhóm máu</p>
              <p className="text-sm font-semibold text-slate-900">
                {healthRecord.bloodType}
              </p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-3">
              <p className="text-xs text-slate-500">Chiều cao</p>
              <p className="text-sm font-semibold text-slate-900">
                {healthRecord.height}
              </p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-3">
              <p className="text-xs text-slate-500">Cân nặng</p>
              <p className="text-sm font-semibold text-slate-900">
                {healthRecord.weight}
              </p>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-lg border border-slate-200 bg-white p-3">
              <p className="mb-2 text-sm font-semibold text-slate-900">
                Dị ứng
              </p>
              <div className="flex flex-wrap gap-2">
                {healthRecord.allergies.map((allergy) => (
                  <Badge key={allergy} variant="outline">
                    {allergy}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-3">
              <p className="mb-2 text-sm font-semibold text-slate-900">
                Bệnh nền/mạn tính
              </p>
              <div className="flex flex-wrap gap-2">
                {healthRecord.chronicConditions.map((condition) => (
                  <Badge key={condition}>{condition}</Badge>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="gap-4 border-primary/15 py-5">
        <CardHeader className="px-5">
          <CardTitle className="text-lg">Việc cần làm</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 px-5">
          {todoItems.map((todo, index) => (
            <div
              key={todo}
              className="flex items-start justify-between gap-3 rounded-lg border border-slate-200 bg-white p-3"
            >
              <p className="text-sm text-slate-700">{todo}</p>
              <Badge variant={index === 0 ? "default" : "secondary"}>
                {index === 0 ? "Bắt buộc" : "Ưu tiên"}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
