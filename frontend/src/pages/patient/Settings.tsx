import React, { useState } from "react";
import {
  Bell,
  CalendarClock,
  Download,
  Lock,
  MessageSquare,
  Share2,
  ShieldCheck,
  ShieldX,
  Smartphone,
} from "lucide-react";
import { toast } from "react-toastify";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MOCK_SETTINGS } from "@/pages/patient/patientMockData";
import type { PatientSettings } from "@/pages/patient/patientTypes";
import { cn } from "@/lib/utils";

type SettingGroup = {
  key: keyof PatientSettings;
  label: string;
  description: string;
  icon: typeof Bell;
  iconBg: string;
  iconText: string;
};

const settingGroups: SettingGroup[] = [
  {
    key: "emailNotifications",
    label: "Nhận thông báo qua email",
    description: "Cập nhật lịch khám, kết quả khám và thông báo hệ thống.",
    icon: MessageSquare,
    iconBg: "bg-sky-100",
    iconText: "text-sky-600",
  },
  {
    key: "smsNotifications",
    label: "Nhận thông báo qua SMS",
    description: "Nhắc lịch khám và cập nhật quan trọng đến số điện thoại.",
    icon: Smartphone,
    iconBg: "bg-violet-100",
    iconText: "text-violet-600",
  },
  {
    key: "reminderNotifications",
    label: "Nhắc lịch khám tự động",
    description: "Gửi nhắc trước lịch hẹn 24h.",
    icon: CalendarClock,
    iconBg: "bg-amber-100",
    iconText: "text-amber-600",
  },
  {
    key: "shareMedicalData",
    label: "Chia sẻ dữ liệu y tế với bác sĩ phụ trách",
    description: "Cho phép bác sĩ xem lịch sử khám trong hệ thống.",
    icon: Share2,
    iconBg: "bg-emerald-100",
    iconText: "text-emerald-600",
  },
  {
    key: "twoFactorAuth",
    label: "Bật xác thực 2 lớp",
    description: "Tăng bảo mật khi đăng nhập tài khoản.",
    icon: ShieldCheck,
    iconBg: "bg-rose-100",
    iconText: "text-rose-600",
  },
];

const ToggleSwitch: React.FC<{
  checked: boolean;
  onChange: (value: boolean) => void;
}> = ({ checked, onChange }) => (
  <label className="relative inline-flex shrink-0 cursor-pointer items-center">
    <input
      type="checkbox"
      className="peer sr-only"
      checked={checked}
      onChange={(event) => onChange(event.currentTarget.checked)}
    />
    <span
      className={cn(
        "h-6 w-11 rounded-full transition-colors",
        checked ? "bg-primary" : "bg-slate-300",
      )}
    />
    <span
      className={cn(
        "pointer-events-none absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform",
        checked && "translate-x-5",
      )}
    />
  </label>
);

const Settings: React.FC = () => {
  const [settings, setSettings] = useState<PatientSettings>(MOCK_SETTINGS);

  const handleToggle = (key: keyof PatientSettings, value: boolean) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const enabledCount = Object.values(settings).filter(Boolean).length;

  return (
    <div className="space-y-5">
      <Card className="border-slate-200 py-0 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <ShieldCheck className="h-4 w-4" />
            </span>
            <CardTitle className="text-base font-semibold text-slate-900">
              Cài đặt tài khoản
            </CardTitle>
          </div>
          <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
            {enabledCount}/{settingGroups.length} đang bật
          </span>
        </CardHeader>
        <CardContent className="px-5 py-5">
          <div className="space-y-2">
            {settingGroups.map((setting) => (
              <div
                key={setting.key}
                className={cn(
                  "flex items-start justify-between gap-4 rounded-xl border p-4 transition-colors",
                  settings[setting.key]
                    ? "border-primary/30 bg-primary/5"
                    : "border-slate-200 bg-white hover:border-slate-300",
                )}
              >
                <div className="flex flex-1 items-start gap-3">
                  <span
                    className={cn(
                      "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
                      setting.iconBg,
                    )}
                  >
                    <setting.icon
                      className={cn("h-4 w-4", setting.iconText)}
                    />
                  </span>
                  <div className="min-w-0 space-y-1">
                    <p className="text-sm font-semibold text-slate-900">
                      {setting.label}
                    </p>
                    <p className="text-sm text-slate-600">
                      {setting.description}
                    </p>
                  </div>
                </div>
                <ToggleSwitch
                  checked={settings[setting.key]}
                  onChange={(value) => handleToggle(setting.key, value)}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200 py-0 shadow-sm">
        <CardHeader className="flex flex-row items-center gap-2 border-b border-slate-100 px-5 py-4">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
            <Lock className="h-4 w-4" />
          </span>
          <CardTitle className="text-base font-semibold text-slate-900">
            Bảo mật & dữ liệu
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 px-5 py-5 md:grid-cols-3">
          <button
            type="button"
            onClick={() => toast.info("UI demo: Chức năng đổi mật khẩu.")}
            className="group rounded-xl border border-slate-200 bg-white p-4 text-left transition-all hover:border-primary/40 hover:shadow-sm"
          >
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-sky-100 text-sky-600">
              <Lock className="h-5 w-5" />
            </div>
            <p className="text-sm font-semibold text-slate-900 group-hover:text-primary">
              Đổi mật khẩu
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Cập nhật mật khẩu mới để bảo vệ tài khoản.
            </p>
          </button>

          <button
            type="button"
            onClick={() =>
              toast.info("UI demo: Chức năng tải dữ liệu cá nhân.")
            }
            className="group rounded-xl border border-slate-200 bg-white p-4 text-left transition-all hover:border-primary/40 hover:shadow-sm"
          >
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
              <Download className="h-5 w-5" />
            </div>
            <p className="text-sm font-semibold text-slate-900 group-hover:text-primary">
              Tải dữ liệu tài khoản
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Xuất toàn bộ dữ liệu y tế về máy.
            </p>
          </button>

          <button
            type="button"
            onClick={() =>
              toast.warn("UI demo: Chức năng yêu cầu khóa tài khoản.")
            }
            className="group rounded-xl border border-rose-200 bg-rose-50/40 p-4 text-left transition-all hover:border-rose-300 hover:shadow-sm"
          >
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-rose-100 text-rose-600">
              <ShieldX className="h-5 w-5" />
            </div>
            <p className="text-sm font-semibold text-rose-900 group-hover:text-rose-700">
              Khóa tài khoản
            </p>
            <p className="mt-1 text-xs text-rose-700/80">
              Tạm dừng truy cập tài khoản trong trường hợp khẩn cấp.
            </p>
          </button>
        </CardContent>
        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-100 bg-slate-50/50 px-5 py-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => toast.info("UI demo: Lưu thay đổi cài đặt.")}
          >
            <Bell className="h-3.5 w-3.5" />
            Lưu cấu hình thông báo
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default Settings;
