import { useMemo, useState } from "react";
import { Camera, KeyRound, ShieldCheck, UserRound } from "lucide-react";

import { PageHeader } from "@/components/app/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useAuthStore } from "@/store/useAuthStore";

type DoctorSettings = {
  emailNotifications: boolean;
  smsNotifications: boolean;
  reminderNotifications: boolean;
  shareClinicalData: boolean;
  twoFactorAuth: boolean;
};

type DoctorProfileForm = {
  displayName: string;
  email: string;
  phone: string;
  department: string;
  title: string;
  clinicAddress: string;
  bio: string;
};

const settingGroups: Array<{
  key: keyof DoctorSettings;
  label: string;
  description: string;
}> = [
  {
    key: "emailNotifications",
    label: "Nhận thông báo qua email",
    description: "Cập nhật lịch khám, hồ sơ bệnh án và thông báo vận hành.",
  },
  {
    key: "smsNotifications",
    label: "Nhận thông báo qua SMS",
    description: "Nhắc lịch khám và cảnh báo cần phản hồi gấp.",
  },
  {
    key: "reminderNotifications",
    label: "Nhắc lịch khám tự động",
    description: "Nhận nhắc trước các ca sắp diễn ra trong 24 giờ.",
  },
  {
    key: "shareClinicalData",
    label: "Chia sẻ dữ liệu lâm sàng trong hệ thống",
    description: "Cho phép các module nội bộ truy xuất hồ sơ để hỗ trợ chăm sóc.",
  },
  {
    key: "twoFactorAuth",
    label: "Bật xác thực 2 lớp",
    description: "Tăng bảo mật khi truy cập dashboard bác sĩ.",
  },
];

export function DoctorSettingsPage() {
  const currentUser = useAuthStore((state) => state.currentUser);

  const initialProfile = useMemo<DoctorProfileForm>(
    () => ({
      displayName: currentUser?.displayName ?? "",
      email: currentUser?.email ?? "",
      phone: "0909 888 112",
      department: currentUser?.department ?? "",
      title: currentUser?.title ?? "",
      clinicAddress: "Phòng khám LifeHealth - Quận 1, TP.HCM",
      bio: "Bác sĩ nội tổng quát, ưu tiên tư vấn tiêu hóa và theo dõi sau điều trị.",
    }),
    [currentUser]
  );

  const [profile, setProfile] = useState<DoctorProfileForm>(initialProfile);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [settings, setSettings] = useState<DoctorSettings>({
    emailNotifications: true,
    smsNotifications: false,
    reminderNotifications: true,
    shareClinicalData: true,
    twoFactorAuth: true,
  });

  if (!currentUser) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Doctor workspace"
        title="Settings"
        description="Trang cài đặt cho bác sĩ, bám theo tinh thần phần patient portal: chỉnh thông tin cá nhân, đổi mật khẩu và cấu hình thông báo/bảo mật."
        actions={["Lưu thay đổi", "Tải dữ liệu", "Xem lịch sử truy cập"]}
      />

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserRound className="size-5 text-primary" />
              Thông tin cá nhân
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-center gap-4">
              <div className="relative flex size-20 items-center justify-center overflow-hidden rounded-full border-4 border-primary/15 bg-primary/10">
                <img
                  src={currentUser.avatar}
                  alt={currentUser.displayName}
                  className="size-full object-cover"
                />
              </div>
              <Button variant="outline" className="gap-2">
                <Camera className="size-4" />
                Đổi ảnh đại diện
              </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <InputField
                label="Họ và tên"
                value={profile.displayName}
                onChange={(value) =>
                  setProfile((prev) => ({ ...prev, displayName: value }))
                }
              />
              <InputField
                label="Email"
                value={profile.email}
                onChange={(value) =>
                  setProfile((prev) => ({ ...prev, email: value }))
                }
              />
              <InputField
                label="Số điện thoại"
                value={profile.phone}
                onChange={(value) =>
                  setProfile((prev) => ({ ...prev, phone: value }))
                }
              />
              <InputField
                label="Chuyên khoa"
                value={profile.department}
                onChange={(value) =>
                  setProfile((prev) => ({ ...prev, department: value }))
                }
              />
              <InputField
                label="Vai trò hiển thị"
                value={profile.title}
                onChange={(value) =>
                  setProfile((prev) => ({ ...prev, title: value }))
                }
              />
              <InputField
                label="Cơ sở làm việc"
                value={profile.clinicAddress}
                onChange={(value) =>
                  setProfile((prev) => ({ ...prev, clinicAddress: value }))
                }
              />
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-semibold text-slate-900">Giới thiệu</label>
                <Textarea
                  value={profile.bio}
                  onChange={(event) =>
                    setProfile((prev) => ({ ...prev, bio: event.target.value }))
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <KeyRound className="size-5 text-primary" />
                Đổi mật khẩu
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <InputField
                label="Mật khẩu hiện tại"
                type="password"
                value={passwordForm.currentPassword}
                onChange={(value) =>
                  setPasswordForm((prev) => ({ ...prev, currentPassword: value }))
                }
              />
              <InputField
                label="Mật khẩu mới"
                type="password"
                value={passwordForm.newPassword}
                onChange={(value) =>
                  setPasswordForm((prev) => ({ ...prev, newPassword: value }))
                }
              />
              <InputField
                label="Xác nhận mật khẩu mới"
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(value) =>
                  setPasswordForm((prev) => ({ ...prev, confirmPassword: value }))
                }
              />
              <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">
                UI đã chuẩn bị sẵn cho flow backend `users/change-password`.
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="size-5 text-primary" />
                Cài đặt tài khoản
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {settingGroups.map((setting, index) => (
                <div key={setting.key}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {setting.label}
                      </p>
                      <p className="text-sm text-slate-600">
                        {setting.description}
                      </p>
                    </div>
                    <label className="relative inline-flex cursor-pointer items-center">
                      <input
                        type="checkbox"
                        className="peer sr-only"
                        checked={settings[setting.key]}
                        onChange={(event) =>
                          setSettings((prev) => ({
                            ...prev,
                            [setting.key]: event.currentTarget.checked,
                          }))
                        }
                      />
                      <span className="h-6 w-11 rounded-full bg-slate-300 transition-colors peer-checked:bg-primary" />
                      <span className="pointer-events-none absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform peer-checked:translate-x-5" />
                    </label>
                  </div>
                  {index < settingGroups.length - 1 ? (
                    <Separator className="mt-4" />
                  ) : null}
                </div>
              ))}

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      Trạng thái bảo mật
                    </p>
                    <p className="text-sm text-slate-500">
                      Bác sĩ đang bật 2FA và nhận nhắc lịch quan trọng.
                    </p>
                  </div>
                  <Badge variant="success">Secure</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function InputField({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-semibold text-slate-900">{label}</label>
      <Input value={value} type={type} onChange={(event) => onChange(event.target.value)} />
    </div>
  );
}
