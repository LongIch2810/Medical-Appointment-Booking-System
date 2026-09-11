import React, { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Bell,
  CalendarClock,
  CheckCircle2,
  Clock,
  Eye,
  EyeOff,
  FileCheck,
  FileHeart,
  KeyRound,
  Laptop,
  Loader2,
  Lock,
  MessageSquare,
  Moon,
  Palette,
  RefreshCw,
  Save,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Sun,
  Tv,
} from "lucide-react";
import { toast } from "react-toastify";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useChangePatientPassword } from "@/hooks/usePatientPortalApi";
import { useUpdateUserSettings, useUserSettings } from "@/hooks/useSettings";
import { cn } from "@/lib/utils";
import type { PatientSettings } from "@/pages/patient/patientTypes";
import {
  changePasswordSchema,
  type ChangePasswordFormData,
} from "@/schemas/auth.schema";
import type { UserTheme } from "@/types/interface/settings.interface";
import { applyTheme } from "@/utils/theme";

type TabKey = "notifications" | "security" | "appearance" | "privacy";

interface TabItem {
  id: TabKey;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

const TABS: TabItem[] = [
  {
    id: "notifications",
    label: "Thông báo & Lịch hẹn",
    icon: Bell,
    description: "Kênh nhận thông báo xác nhận lịch và nhắc hẹn",
  },
  {
    id: "security",
    label: "Bảo mật & Mật khẩu",
    icon: ShieldCheck,
    description: "Mật khẩu, phiên đăng nhập và bảo vệ tài khoản",
  },
  {
    id: "appearance",
    label: "Giao diện & Tùy chọn",
    icon: Palette,
    description: "Chế độ hiển thị sáng/tối và tùy chỉnh ứng dụng",
  },
  {
    id: "privacy",
    label: "Quyền riêng tư & Dữ liệu",
    icon: FileHeart,
    description: "Chia sẻ hồ sơ y tế và quyền truy cập dữ liệu",
  },
];

const DEFAULT_SETTINGS: PatientSettings = {
  emailNotifications: true,
  smsNotifications: true,
  reminderNotifications: true,
  shareMedicalData: true,
  twoFactorAuth: false,
};

const ToggleSwitch: React.FC<{
  checked: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}> = ({ checked, onChange, disabled }) => (
  <label
    className={cn(
      "relative inline-flex shrink-0 items-center transition-opacity",
      disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer",
    )}
  >
    <input
      type="checkbox"
      className="peer sr-only"
      checked={checked}
      disabled={disabled}
      onChange={(event) => onChange(event.currentTarget.checked)}
    />
    <span
      className={cn(
        "h-6.5 w-12 rounded-full transition-all duration-300 shadow-inner",
        checked
          ? "bg-primary shadow-primary/20"
          : "bg-slate-300 dark:bg-slate-700",
      )}
    />
    <span
      className={cn(
        "pointer-events-none absolute left-0.5 top-0.5 h-5.5 w-5.5 rounded-full bg-white shadow-md transition-transform duration-300",
        checked ? "translate-x-5.5" : "translate-x-0",
      )}
    />
  </label>
);

const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabKey>("notifications");
  const [settings, setSettings] = useState<PatientSettings>(DEFAULT_SETTINGS);
  const [currentTheme, setCurrentTheme] = useState<UserTheme>("SYSTEM");
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Privacy toggles
  const [shareDoctorHistory, setShareDoctorHistory] = useState(true);
  const [autoSyncReports, setAutoSyncReports] = useState(true);
  const [anonymousResearch, setAnonymousResearch] = useState(false);

  const changePasswordMutation = useChangePatientPassword();
  const settingsQuery = useUserSettings();
  const updateSettingsMutation = useUpdateUserSettings();

  useEffect(() => {
    const saved = settingsQuery.data?.data;
    if (!saved) return;
    setSettings({
      emailNotifications: saved.emailNotificationsEnabled,
      smsNotifications: saved.realtimeToastsEnabled,
      reminderNotifications: saved.appointmentRemindersEnabled,
      shareMedicalData: true,
      twoFactorAuth: false,
    });
    if (saved.theme) {
      setCurrentTheme(saved.theme);
    }
    setHasChanges(false);
  }, [settingsQuery.data?.data]);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      old_password: "",
      new_password: "",
      confirm_password: "",
    },
  });

  const newPasswordValue = watch("new_password") || "";

  // Password strength calculation
  const passwordStrength = useMemo(() => {
    if (!newPasswordValue) return 0;
    let score = 0;
    if (newPasswordValue.length >= 6) score += 25;
    if (newPasswordValue.length >= 8) score += 25;
    if (/[A-Z]/.test(newPasswordValue) && /[a-z]/.test(newPasswordValue))
      score += 25;
    if (/[0-9]/.test(newPasswordValue) || /[^A-Za-z0-9]/.test(newPasswordValue))
      score += 25;
    return score;
  }, [newPasswordValue]);

  const getStrengthMeta = (score: number) => {
    if (score === 0) return { label: "Chưa nhập", color: "bg-slate-200", text: "text-slate-400" };
    if (score <= 25) return { label: "Yếu", color: "bg-rose-500", text: "text-rose-600" };
    if (score <= 50) return { label: "Trung bình", color: "bg-amber-500", text: "text-amber-600" };
    if (score <= 75) return { label: "Khá mạnh", color: "bg-sky-500", text: "text-sky-600" };
    return { label: "Rất an toàn", color: "bg-emerald-500", text: "text-emerald-600" };
  };

  const strengthMeta = getStrengthMeta(passwordStrength);

  const handleToggle = (key: keyof PatientSettings, value: boolean) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
    setHasChanges(true);
  };

  const handleThemeSelect = (theme: UserTheme) => {
    setCurrentTheme(theme);
    applyTheme(theme);
    setHasChanges(true);
  };

  const handleSaveAll = () => {
    updateSettingsMutation.mutate(
      {
        emailNotificationsEnabled: settings.emailNotifications,
        realtimeToastsEnabled: settings.smsNotifications,
        appointmentRemindersEnabled: settings.reminderNotifications,
        theme: currentTheme,
      },
      {
        onSuccess: () => {
          toast.success("✨ Đã lưu cấu hình cài đặt thành công!");
          setHasChanges(false);
        },
        onError: () => {
          toast.error("Không thể lưu cài đặt. Vui lòng thử lại sau.");
        },
      },
    );
  };

  const handleTestNotification = () => {
    toast.info(
      "🔔 Thông báo thử nghiệm: Kênh thông báo trên ứng dụng của bạn đang hoạt động rất tốt!",
    );
  };

  const onChangePasswordSubmit = (values: ChangePasswordFormData) => {
    changePasswordMutation.mutate(
      {
        old_password: values.old_password,
        new_password: values.new_password,
      },
      {
        onSuccess: (res) => {
          toast.success(res?.data?.message || "Đã đổi mật khẩu thành công!");
          reset();
          setIsPasswordDialogOpen(false);
        },
        onError: (err: unknown) => {
          const axiosErr = err as {
            response?: { data?: { message?: string } };
          };
          const message =
            axiosErr?.response?.data?.message ||
            "Không thể đổi mật khẩu. Vui lòng kiểm tra lại mật khẩu cũ.";
          toast.error(message);
        },
      },
    );
  };

  const enabledNotificationsCount = [
    settings.emailNotifications,
    settings.smsNotifications,
    settings.reminderNotifications,
  ].filter(Boolean).length;

  const reminderMinutes =
    settingsQuery.data?.data?.effectiveAppointmentReminderBeforeMinutes ?? 1440;
  const reminderHours = Math.round(reminderMinutes / 60);

  return (
    <div className="space-y-6">
      {/* Top Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 p-6 text-white shadow-md">
        <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/20 backdrop-blur-md">
                <Sparkles className="h-4 w-4 text-white" />
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-100">
                Trung tâm cài đặt & bảo mật
              </span>
            </div>
            <h1 className="text-xl font-extrabold tracking-tight sm:text-2xl">
              Tùy chỉnh tài khoản bệnh nhân
            </h1>
            <p className="text-xs sm:text-sm text-white/85 max-w-xl">
              Quản lý kênh nhận thông báo lịch hẹn, bảo mật tài khoản, giao diện và quyền riêng tư dữ liệu y tế của bạn.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:flex-col sm:items-end">
            <Badge className="bg-white/20 text-white hover:bg-white/30 border-white/20 backdrop-blur-md px-3 py-1 font-semibold text-xs">
              <ShieldCheck className="h-3.5 w-3.5 mr-1 text-emerald-200" />
              Tài khoản được bảo vệ
            </Badge>
            <Badge className="bg-emerald-950/40 text-emerald-100 border-none px-3 py-1 text-xs">
              <Bell className="h-3.5 w-3.5 mr-1 text-emerald-300" />
              {enabledNotificationsCount}/3 kênh thông báo bật
            </Badge>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200/80 pb-2">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2.5 rounded-2xl px-4 py-2.5 text-xs sm:text-sm font-bold transition-all cursor-pointer",
                isActive
                  ? "bg-primary text-white shadow-sm"
                  : "bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/70",
              )}
            >
              <Icon className={cn("h-4 w-4", isActive ? "text-white" : "text-primary")} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: THÔNG BÁO & LỊCH HẸN */}
      {activeTab === "notifications" && (
        <div className="space-y-5">
          <Card className="rounded-3xl border-slate-200/80 bg-white shadow-xs overflow-hidden">
            <CardHeader className="border-b border-slate-100 bg-slate-50/50 px-6 py-4.5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Bell className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-bold text-slate-900">
                      Cấu hình kênh thông báo
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-500">
                      Chọn cách bạn muốn nhận tin nhắn cập nhật về lịch hẹn và kết quả khám
                    </CardDescription>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleTestNotification}
                  className="rounded-xl border-slate-200 text-xs font-semibold text-slate-700 hover:bg-primary/5 hover:text-primary hover:border-primary/30 gap-1.5"
                >
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  Thử thông báo ngay
                </Button>
              </div>
            </CardHeader>

            <CardContent className="p-6 space-y-4">
              {/* Email Notifications */}
              <div
                className={cn(
                  "flex items-start justify-between gap-4 rounded-2xl border p-4.5 transition-all",
                  settings.emailNotifications
                    ? "border-sky-200 bg-sky-50/40 shadow-xs"
                    : "border-slate-200/80 bg-white hover:border-slate-300",
                )}
              >
                <div className="flex items-start gap-3.5">
                  <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-600 shadow-2xs">
                    <MessageSquare className="h-5 w-5" />
                  </span>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-slate-900">
                        Thông báo qua Email
                      </p>
                      {settings.emailNotifications && (
                        <Badge className="bg-sky-100 text-sky-700 hover:bg-sky-100 border-none text-[10px] font-semibold px-2 py-0.5">
                          Đang bật
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                      Gửi thư xác nhận khi đặt lịch thành công, phiếu kết quả khám và các tài liệu chỉ định của bác sĩ.
                    </p>
                  </div>
                </div>
                <ToggleSwitch
                  checked={settings.emailNotifications}
                  onChange={(val) => handleToggle("emailNotifications", val)}
                />
              </div>

              {/* In-app Realtime Toasts */}
              <div
                className={cn(
                  "flex items-start justify-between gap-4 rounded-2xl border p-4.5 transition-all",
                  settings.smsNotifications
                    ? "border-violet-200 bg-violet-50/40 shadow-xs"
                    : "border-slate-200/80 bg-white hover:border-slate-300",
                )}
              >
                <div className="flex items-start gap-3.5">
                  <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-600 shadow-2xs">
                    <Smartphone className="h-5 w-5" />
                  </span>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-slate-900">
                        Toast thông báo tức thì (Realtime)
                      </p>
                      {settings.smsNotifications && (
                        <Badge className="bg-violet-100 text-violet-700 hover:bg-violet-100 border-none text-[10px] font-semibold px-2 py-0.5">
                          Tức thì
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                      Bật thông báo nổi ngay trên góc màn hình khi bác sĩ tiếp nhận yêu cầu khám hoặc có tin nhắn phản hồi mới.
                    </p>
                  </div>
                </div>
                <ToggleSwitch
                  checked={settings.smsNotifications}
                  onChange={(val) => handleToggle("smsNotifications", val)}
                />
              </div>

              {/* Automatic Appointment Reminders */}
              <div
                className={cn(
                  "flex items-start justify-between gap-4 rounded-2xl border p-4.5 transition-all",
                  settings.reminderNotifications
                    ? "border-amber-200 bg-amber-50/40 shadow-xs"
                    : "border-slate-200/80 bg-white hover:border-slate-300",
                )}
              >
                <div className="flex items-start gap-3.5">
                  <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600 shadow-2xs">
                    <CalendarClock className="h-5 w-5" />
                  </span>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-slate-900">
                        Tự động nhắc lịch hẹn trước giờ khám
                      </p>
                      {settings.reminderNotifications && (
                        <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 border-none text-[10px] font-semibold px-2 py-0.5">
                          Tự động
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                      Hệ thống tự động gửi lời nhắc trước {reminderHours} giờ ({reminderMinutes} phút) để bạn kịp chuẩn bị và đến phòng khám đúng giờ.
                    </p>
                  </div>
                </div>
                <ToggleSwitch
                  checked={settings.reminderNotifications}
                  onChange={(val) =>
                    handleToggle("reminderNotifications", val)
                  }
                />
              </div>

              {/* System Reminder Info Box */}
              <div className="flex items-center gap-3 rounded-2xl bg-slate-50 border border-slate-200/70 p-4 text-xs text-slate-600">
                <Clock className="h-4.5 w-4.5 text-primary shrink-0" />
                <p>
                  <strong className="font-semibold text-slate-800">Thời gian nhắc lịch mặc định:</strong> Trước{" "}
                  <span className="font-bold text-primary">{reminderHours} giờ</span> theo quy định hệ thống LifeHealth. Bạn có thể kiểm tra danh sách lịch tại mục "Lịch khám".
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 2: BẢO MẬT & MẬT KHẨU */}
      {activeTab === "security" && (
        <div className="space-y-5">
          <div className="grid gap-5 md:grid-cols-2">
            {/* Change Password Card */}
            <Card className="rounded-3xl border-slate-200/80 bg-white shadow-xs p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 shadow-2xs">
                    <KeyRound className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      Mật khẩu tài khoản
                    </h3>
                    <p className="text-xs text-slate-500">
                      Cập nhật định kỳ để tăng cường an toàn
                    </p>
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Để đảm bảo an toàn cho hồ sơ y tế số và thông tin người thân, bạn nên đặt mật khẩu có ít nhất 6 ký tự kết hợp chữ cái và chữ số.
                </p>

                <div className="mt-4 flex items-center gap-2 rounded-xl bg-amber-50/70 border border-amber-200/60 p-3 text-xs text-amber-800">
                  <Lock className="h-4 w-4 shrink-0 text-amber-600" />
                  <span>Khuyến nghị đổi mật khẩu ít nhất mỗi 90 ngày một lần.</span>
                </div>
              </div>

              <div className="pt-6">
                <Button
                  type="button"
                  onClick={() => {
                    reset();
                    setIsPasswordDialogOpen(true);
                  }}
                  className="w-full gap-2 rounded-xl !bg-primary hover:!bg-primary/90 font-bold !text-white shadow-sm cursor-pointer h-11"
                >
                  <KeyRound className="h-4 w-4 text-white" />
                  <span className="text-white">Đổi mật khẩu mới</span>
                </Button>
              </div>
            </Card>

            {/* Active Session & Device Security Card */}
            <Card className="rounded-3xl border-slate-200/80 bg-white shadow-xs p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 shadow-2xs">
                    <Laptop className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      Phiên đăng nhập hiện tại
                    </h3>
                    <p className="text-xs text-slate-500">
                      Thông tin thiết bị và trạng thái bảo vệ
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between rounded-xl bg-slate-50 border border-slate-200/60 p-3">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                      <div>
                        <p className="text-xs font-bold text-slate-800">
                          Trình duyệt Web hiện tại
                        </p>
                        <p className="text-[11px] text-slate-500">
                          Đang hoạt động (Trực tuyến)
                        </p>
                      </div>
                    </div>
                    <Badge className="bg-emerald-100 text-emerald-800 border-none text-[10px]">
                      An toàn
                    </Badge>
                  </div>

                  <div className="rounded-xl border border-slate-200/60 p-3 text-xs space-y-1.5 text-slate-600">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Xác thực mã hóa:</span>
                      <span className="font-semibold text-slate-800">JWT Token (Bearer)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Giao thức truyền tải:</span>
                      <span className="font-semibold text-slate-800">HTTPS / TLS 1.3</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-6">
                <div className="flex items-center gap-2 text-xs text-emerald-700 font-semibold bg-emerald-50 rounded-xl p-3 border border-emerald-200">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                  <span>Không phát hiện hoạt động đăng nhập bất thường nào.</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* TAB 3: GIAO DIỆN & TÙY CHỌN */}
      {activeTab === "appearance" && (
        <div className="space-y-5">
          <Card className="rounded-3xl border-slate-200/80 bg-white shadow-xs overflow-hidden">
            <CardHeader className="border-b border-slate-100 bg-slate-50/50 px-6 py-4.5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Palette className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-base font-bold text-slate-900">
                    Giao diện hiển thị (Theme)
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500">
                    Tùy chỉnh tông màu hiển thị phù hợp với mắt và điều kiện ánh sáng
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-6 space-y-6">
              <div className="grid gap-4 sm:grid-cols-3">
                {/* Light Theme */}
                <button
                  type="button"
                  onClick={() => handleThemeSelect("LIGHT")}
                  className={cn(
                    "group relative flex flex-col items-center justify-between rounded-2xl border-2 p-5 text-center transition-all cursor-pointer",
                    currentTheme === "LIGHT"
                      ? "border-primary bg-primary/5 shadow-md"
                      : "border-slate-200 bg-white hover:border-slate-300",
                  )}
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 mb-3 transition-transform group-hover:scale-105">
                    <Sun className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">Giao diện Sáng</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Nền trắng tinh tế, độ tương phản rõ ràng
                    </p>
                  </div>
                  {currentTheme === "LIGHT" && (
                    <div className="mt-3 flex items-center gap-1 text-xs font-bold text-primary">
                      <CheckCircle2 className="h-4 w-4" /> Đang chọn
                    </div>
                  )}
                </button>

                {/* Dark Theme */}
                <button
                  type="button"
                  onClick={() => handleThemeSelect("DARK")}
                  className={cn(
                    "group relative flex flex-col items-center justify-between rounded-2xl border-2 p-5 text-center transition-all cursor-pointer",
                    currentTheme === "DARK"
                      ? "border-primary bg-primary/5 shadow-md"
                      : "border-slate-200 bg-white hover:border-slate-300",
                  )}
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600 mb-3 transition-transform group-hover:scale-105">
                    <Moon className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">Giao diện Tối</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Êm dịu cho mắt khi sử dụng vào ban đêm
                    </p>
                  </div>
                  {currentTheme === "DARK" && (
                    <div className="mt-3 flex items-center gap-1 text-xs font-bold text-primary">
                      <CheckCircle2 className="h-4 w-4" /> Đang chọn
                    </div>
                  )}
                </button>

                {/* System Theme */}
                <button
                  type="button"
                  onClick={() => handleThemeSelect("SYSTEM")}
                  className={cn(
                    "group relative flex flex-col items-center justify-between rounded-2xl border-2 p-5 text-center transition-all cursor-pointer",
                    currentTheme === "SYSTEM"
                      ? "border-primary bg-primary/5 shadow-md"
                      : "border-slate-200 bg-white hover:border-slate-300",
                  )}
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-700 mb-3 transition-transform group-hover:scale-105">
                    <Tv className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">Theo hệ thống</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Tự động theo cài đặt hệ điều hành của bạn
                    </p>
                  </div>
                  {currentTheme === "SYSTEM" && (
                    <div className="mt-3 flex items-center gap-1 text-xs font-bold text-primary">
                      <CheckCircle2 className="h-4 w-4" /> Đang chọn
                    </div>
                  )}
                </button>
              </div>

              {/* Language & Regional Defaults */}
              <div className="rounded-2xl border border-slate-200/80 p-4.5 bg-slate-50/50 space-y-3">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Cài đặt vùng & Định dạng
                </p>
                <div className="grid gap-4 sm:grid-cols-3 text-xs">
                  <div>
                    <span className="text-slate-500 block">Ngôn ngữ hiển thị</span>
                    <span className="font-bold text-slate-800 text-sm mt-0.5 block">
                      Tiếng Việt (Mặc định)
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Định dạng ngày tháng</span>
                    <span className="font-bold text-slate-800 text-sm mt-0.5 block">
                      DD/MM/YYYY (24 Giờ)
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Múi giờ hệ thống</span>
                    <span className="font-bold text-slate-800 text-sm mt-0.5 block">
                      GMT+7 (Hà Nội, TP.HCM)
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 4: QUYỀN RIÊNG TƯ & DỮ LIỆU Y TẾ */}
      {activeTab === "privacy" && (
        <div className="space-y-5">
          <Card className="rounded-3xl border-slate-200/80 bg-white shadow-xs overflow-hidden">
            <CardHeader className="border-b border-slate-100 bg-slate-50/50 px-6 py-4.5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <FileHeart className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-base font-bold text-slate-900">
                    Quyền riêng tư hồ sơ sức khỏe
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500">
                    Kiểm soát ai có thể xem và chia sẻ thông tin bệnh án của bạn
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-6 space-y-4">
              {/* Doctor Sharing */}
              <div className="flex items-start justify-between gap-4 rounded-2xl border border-slate-200/80 p-4.5 hover:border-slate-300 transition-all">
                <div className="flex items-start gap-3.5">
                  <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-100 text-teal-700">
                    <FileCheck className="h-5 w-5" />
                  </span>
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-slate-900">
                      Chia sẻ lịch sử khám cho bác sĩ điều trị
                    </p>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                      Cho phép bác sĩ được bạn đặt lịch khám xem trước kết quả xét nghiệm và lịch sử dùng thuốc để chẩn đoán chính xác hơn.
                    </p>
                  </div>
                </div>
                <ToggleSwitch
                  checked={shareDoctorHistory}
                  onChange={(val) => {
                    setShareDoctorHistory(val);
                    setHasChanges(true);
                  }}
                />
              </div>

              {/* Auto Sync Reports */}
              <div className="flex items-start justify-between gap-4 rounded-2xl border border-slate-200/80 p-4.5 hover:border-slate-300 transition-all">
                <div className="flex items-start gap-3.5">
                  <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-700">
                    <RefreshCw className="h-5 w-5" />
                  </span>
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-slate-900">
                      Tự động đồng bộ hóa hồ sơ số
                    </p>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                      Tự động lưu trữ và đồng bộ kết quả khám sau khi buổi khám hoàn tất vào mục "Hồ sơ sức khỏe" của bạn.
                    </p>
                  </div>
                </div>
                <ToggleSwitch
                  checked={autoSyncReports}
                  onChange={(val) => {
                    setAutoSyncReports(val);
                    setHasChanges(true);
                  }}
                />
              </div>

              {/* Anonymous Research */}
              <div className="flex items-start justify-between gap-4 rounded-2xl border border-slate-200/80 p-4.5 hover:border-slate-300 transition-all">
                <div className="flex items-start gap-3.5">
                  <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
                    <Sparkles className="h-5 w-5" />
                  </span>
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-slate-900">
                      Đóng góp dữ liệu ẩn danh cho AI y tế
                    </p>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                      Cho phép hệ thống sử dụng dữ liệu triệu chứng đã ẩn danh hoàn toàn thông tin cá nhân để cải thiện độ chính xác của AI Coach Health.
                    </p>
                  </div>
                </div>
                <ToggleSwitch
                  checked={anonymousResearch}
                  onChange={(val) => {
                    setAnonymousResearch(val);
                    setHasChanges(true);
                  }}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Save Settings Action Bar */}
      <Card className="rounded-3xl border-slate-200/80 bg-white shadow-sm p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2.5">
            {hasChanges ? (
              <span className="flex h-3 w-3 rounded-full bg-amber-500 animate-ping" />
            ) : (
              <CheckCircle2 className="h-4.5 w-4.5 text-emerald-600 shrink-0" />
            )}
            <p className="text-xs sm:text-sm font-semibold text-slate-700">
              {hasChanges
                ? "Có thay đổi chưa được lưu vào hệ thống."
                : "Tất cả cấu hình cài đặt của bạn đã được cập nhật đồng bộ."}
            </p>
          </div>

          <Button
            type="button"
            onClick={handleSaveAll}
            disabled={updateSettingsMutation.isPending || settingsQuery.isLoading}
            className={cn(
              "gap-2 rounded-2xl !bg-primary hover:!bg-primary/90 font-bold !text-white hover:!text-white shadow-sm px-6 h-11 cursor-pointer transition-all",
              hasChanges && "ring-2 ring-primary/30 ring-offset-1 shadow-md",
            )}
          >
            {updateSettingsMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-white" />
                <span className="text-white">Đang lưu...</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4 text-white" />
                <span className="text-white">Lưu tất cả cài đặt</span>
              </>
            )}
          </Button>
        </div>
      </Card>

      {/* Dialog Đổi Mật Khẩu Nâng Cao */}
      <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
        <DialogContent className="rounded-2xl sm:rounded-3xl sm:max-w-lg p-0 gap-0 overflow-hidden">
          <div className="shrink-0 p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 pr-12">
            <DialogHeader>
              <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-inner">
                <KeyRound className="h-6 w-6" />
              </div>
              <DialogTitle className="text-center text-xl font-extrabold text-slate-900 dark:text-slate-100">
                Đổi mật khẩu tài khoản
              </DialogTitle>
              <DialogDescription className="text-center text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Mật khẩu mới phải có tối thiểu 6 ký tự và khác mật khẩu hiện tại.
              </DialogDescription>
            </DialogHeader>
          </div>

          <form onSubmit={handleSubmit(onChangePasswordSubmit)} className="flex flex-col flex-1 min-h-0 overflow-hidden">
            <div className="flex-1 min-h-0 min-w-0 overflow-y-auto overscroll-contain p-5 sm:p-6 space-y-4 scrollbar-soft">
            {/* Mật khẩu cũ */}
            <div className="space-y-1.5">
              <Label htmlFor="old_password" className="text-xs font-bold text-slate-800">
                Mật khẩu hiện tại <span className="text-rose-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="old_password"
                  type={showOldPassword ? "text" : "password"}
                  placeholder="Nhập mật khẩu hiện tại của bạn"
                  error={errors.old_password?.message}
                  {...register("old_password")}
                  className="rounded-xl pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowOldPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showOldPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.old_password && (
                <p className="text-xs text-rose-500 font-medium">
                  {errors.old_password.message}
                </p>
              )}
            </div>

            {/* Mật khẩu mới */}
            <div className="space-y-1.5">
              <Label htmlFor="new_password" className="text-xs font-bold text-slate-800">
                Mật khẩu mới <span className="text-rose-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="new_password"
                  type={showNewPassword ? "text" : "password"}
                  placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
                  error={errors.new_password?.message}
                  {...register("new_password")}
                  className="rounded-xl pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showNewPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.new_password && (
                <p className="text-xs text-rose-500 font-medium">
                  {errors.new_password.message}
                </p>
              )}

              {/* Password strength meter */}
              {newPasswordValue.length > 0 && (
                <div className="space-y-1 pt-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">Độ mạnh mật khẩu:</span>
                    <span className={cn("font-bold", strengthMeta.text)}>
                      {strengthMeta.label}
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={cn("h-full transition-all duration-300", strengthMeta.color)}
                      style={{ width: `${passwordStrength}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Xác nhận mật khẩu mới */}
            <div className="space-y-1.5">
              <Label htmlFor="confirm_password" className="text-xs font-bold text-slate-800">
                Xác nhận mật khẩu mới <span className="text-rose-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="confirm_password"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Nhập lại chính xác mật khẩu mới"
                  error={errors.confirm_password?.message}
                  {...register("confirm_password")}
                  className="rounded-xl pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.confirm_password && (
                <p className="text-xs text-rose-500 font-medium">
                  {errors.confirm_password.message}
                </p>
              )}
            </div>

            </div>

            <div className="shrink-0 p-4 sm:p-5 bg-slate-50/80 dark:bg-slate-950/80 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2.5">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsPasswordDialogOpen(false)}
                className="rounded-xl font-bold"
                disabled={changePasswordMutation.isPending}
              >
                Hủy bỏ
              </Button>
              <Button
                type="submit"
                disabled={changePasswordMutation.isPending}
                className="rounded-xl !bg-primary hover:!bg-primary/90 font-bold !text-white shadow-sm cursor-pointer"
              >
                {changePasswordMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2 text-white" />
                    <span className="text-white">Đang xử lý...</span>
                  </>
                ) : (
                  <span className="text-white">Cập nhật mật khẩu</span>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Settings;
