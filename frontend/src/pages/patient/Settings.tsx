import React from "react";
import { ShieldCheck } from "lucide-react";
import { toast } from "react-toastify";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { PatientSettings } from "@/pages/patient/patientTypes";
import { usePatientPortal } from "@/pages/patient/usePatientPortal";

const settingGroups: Array<{
  key: keyof PatientSettings;
  label: string;
  description: string;
}> = [
  {
    key: "emailNotifications",
    label: "Nhận thông báo qua email",
    description: "Cập nhật lịch khám, kết quả khám và thông báo hệ thống.",
  },
  {
    key: "smsNotifications",
    label: "Nhận thông báo qua SMS",
    description: "Nhắc lịch khám và cập nhật quan trọng đến số điện thoại.",
  },
  {
    key: "reminderNotifications",
    label: "Nhắc lịch khám tự động",
    description: "Gửi nhắc trước lịch hẹn 24h.",
  },
  {
    key: "shareMedicalData",
    label: "Chia sẻ dữ liệu y tế với bác sĩ phụ trách",
    description: "Cho phép bác sĩ xem lịch sử khám trong hệ thống.",
  },
  {
    key: "twoFactorAuth",
    label: "Bật xác thực 2 lớp",
    description: "Tăng bảo mật khi đăng nhập tài khoản.",
  },
];

const Settings: React.FC = () => {
  const { settings, updateSetting } = usePatientPortal();

  const handleToggle = (key: keyof PatientSettings, value: boolean) => {
    updateSetting(key, value);
  };

  return (
    <Card className="border-primary/15 py-5">
      <CardHeader className="px-5">
        <CardTitle className="flex items-center gap-2 text-lg">
          <ShieldCheck className="h-5 w-5 text-primary" />
          Cài đặt tài khoản
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 px-5">
        {settingGroups.map((setting, index) => (
          <div key={setting.key}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">{setting.label}</p>
                <p className="text-sm text-slate-600">{setting.description}</p>
              </div>
              <label className="relative inline-flex cursor-pointer items-center">
                <input
                  type="checkbox"
                  className="peer sr-only"
                  checked={settings[setting.key]}
                  onChange={(event) =>
                    handleToggle(setting.key, event.currentTarget.checked)
                  }
                />
                <span className="h-6 w-11 rounded-full bg-slate-300 transition-colors peer-checked:bg-primary" />
                <span className="pointer-events-none absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform peer-checked:translate-x-5" />
              </label>
            </div>
            {index < settingGroups.length - 1 && <Separator className="mt-4" />}
          </div>
        ))}

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-semibold text-slate-900">Các thao tác khác</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => toast.info("UI demo: Chức năng đổi mật khẩu.")}
            >
              Đổi mật khẩu
            </Button>
            <Button
              variant="outline"
              onClick={() => toast.info("UI demo: Chức năng tải dữ liệu cá nhân.")}
            >
              Tải dữ liệu tài khoản
            </Button>
            <Button
              variant="destructive"
              onClick={() => toast.warn("UI demo: Chức năng yêu cầu khóa tài khoản.")}
            >
              Khóa tài khoản
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default Settings;
