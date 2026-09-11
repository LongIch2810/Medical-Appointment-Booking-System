import { useEffect, useMemo, useState } from "react";
import {
  BellRing,
  Camera,
  CheckCircle2,
  Clock,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Mail,
  Moon,
  Phone,
  Save,
  ShieldCheck,
  Smartphone,
  Sun,
  Tv,
  UploadCloud,
  User,
  UserRound,
} from "lucide-react";
import { toast } from "react-toastify";

import { ErrorState } from "@/components/app/ErrorState";
import { LoadingState } from "@/components/app/LoadingState";
import { PageHeader } from "@/components/app/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  useChangePassword,
  useCurrentUser,
  useUpdateCurrentUser,
} from "@/hooks/useUsers";
import { useUpdateUserSettings, useUserSettings } from "@/hooks/useSettings";
import { cn } from "@/lib/utils";
import { useUiStore } from "@/store/useUiStore";
import type {
  UpdateUserSettings,
  UserTheme,
} from "@/types/interface/settings.interface";

type ProfileForm = {
  fullname: string;
  phone: string;
  address: string;
  gender: boolean;
  dateOfBirth: string;
};

type PasswordForm = {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
};

type SettingTab = "profile" | "preferences" | "security";

export function DoctorSettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingTab>("profile");
  const profileQuery = useCurrentUser();
  const settingsQuery = useUserSettings();
  const updateProfile = useUpdateCurrentUser();
  const changePassword = useChangePassword();
  const updateSettings = useUpdateUserSettings();
  const setTheme = useUiStore((state) => state.setTheme);

  const initialProfile = useMemo<ProfileForm>(() => {
    const user = profileQuery.data?.data;
    return {
      fullname: user?.fullname ?? "",
      phone: user?.phone ?? "",
      address: user?.address ?? "",
      gender: Boolean(user?.gender),
      dateOfBirth: user?.date_of_birth ?? "",
    };
  }, [profileQuery.data]);

  const [profile, setProfile] = useState<ProfileForm>(initialProfile);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [passwordForm, setPasswordForm] = useState<PasswordForm>({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [preferences, setPreferences] = useState<UpdateUserSettings>({});

  useEffect(() => {
    setProfile(initialProfile);
    setAvatarFile(null);
    setAvatarPreview(null);
  }, [initialProfile]);

  useEffect(() => {
    const settings = settingsQuery.data?.data;
    if (!settings) return;
    setPreferences({
      realtimeToastsEnabled: settings.realtimeToastsEnabled,
      emailNotificationsEnabled: settings.emailNotificationsEnabled,
      appointmentRemindersEnabled: settings.appointmentRemindersEnabled,
      theme: settings.theme,
    });
  }, [settingsQuery.data?.data]);

  const handleAvatarChange = (file: File | null) => {
    if (!file) {
      setAvatarFile(null);
      setAvatarPreview(null);
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ảnh đại diện không được vượt quá 5MB.");
      return;
    }
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Password strength calculation
  const passwordStrength = useMemo(() => {
    const pwd = passwordForm.newPassword;
    if (!pwd) return 0;
    let score = 0;
    if (pwd.length >= 6) score += 25;
    if (pwd.length >= 8) score += 25;
    if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score += 25;
    if (/[0-9]/.test(pwd) || /[^A-Za-z0-9]/.test(pwd)) score += 25;
    return score;
  }, [passwordForm.newPassword]);

  const getStrengthMeta = (score: number) => {
    if (score === 0) return { label: "Chưa nhập", color: "bg-slate-200", text: "text-slate-400" };
    if (score <= 25) return { label: "Yếu", color: "bg-rose-500", text: "text-rose-600" };
    if (score <= 50) return { label: "Trung bình", color: "bg-amber-500", text: "text-amber-600" };
    if (score <= 75) return { label: "Khá an toàn", color: "bg-sky-500", text: "text-sky-600" };
    return { label: "Rất mạnh", color: "bg-emerald-500", text: "text-emerald-600" };
  };

  const strengthMeta = getStrengthMeta(passwordStrength);

  if (profileQuery.isLoading || settingsQuery.isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Tài khoản"
          title="Cài đặt tài khoản"
          description="Đang tải hồ sơ và tùy chọn cá nhân..."
        />
        <LoadingState label="Đang tải dữ liệu tài khoản..." />
      </div>
    );
  }

  if (
    profileQuery.isError ||
    settingsQuery.isError ||
    !profileQuery.data?.data
  ) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Tài khoản"
          title="Cài đặt tài khoản"
          description="Không thể tải hồ sơ cá nhân."
        />
        <ErrorState
          title="Không thể tải thông tin tài khoản"
          onRetry={() => {
            void profileQuery.refetch();
            void settingsQuery.refetch();
          }}
        />
      </div>
    );
  }

  const currentUser = profileQuery.data.data;
  const currentAvatarSrc = avatarPreview || currentUser.picture;

  const handleProfileSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    updateProfile.mutate(
      {
        payload: {
          fullname: profile.fullname,
          phone: profile.phone,
          address: profile.address,
          gender: profile.gender,
          date_of_birth: profile.dateOfBirth || undefined,
        },
        file: avatarFile ?? undefined,
      },
      {
        onSuccess: () => {
          toast.success("Đã cập nhật hồ sơ cá nhân thành công!");
          setAvatarFile(null);
        },
        onError: () => {
          toast.error("Không thể cập nhật hồ sơ. Vui lòng kiểm tra lại.");
        },
      },
    );
  };

  const handlePasswordSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!passwordForm.oldPassword) {
      toast.warning("Vui lòng nhập mật khẩu hiện tại.");
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      toast.warning("Mật khẩu mới phải có tối thiểu 6 ký tự.");
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("Mật khẩu xác nhận không khớp.");
      return;
    }
    changePassword.mutate(
      {
        old_password: passwordForm.oldPassword,
        new_password: passwordForm.newPassword,
      },
      {
        onSuccess: () => {
          setPasswordForm({
            oldPassword: "",
            newPassword: "",
            confirmPassword: "",
          });
          toast.success("Đã đổi mật khẩu thành công!");
        },
        onError: (err: unknown) => {
          const axiosErr = err as { response?: { data?: { message?: string } } };
          toast.error(
            axiosErr?.response?.data?.message ||
              "Không thể đổi mật khẩu. Vui lòng kiểm tra lại mật khẩu cũ.",
          );
        },
      },
    );
  };

  const savePreferences = (updatedTheme?: UserTheme) => {
    const themeToSave = updatedTheme ?? preferences.theme ?? "SYSTEM";
    updateSettings.mutate(
      {
        realtimeToastsEnabled: preferences.realtimeToastsEnabled,
        emailNotificationsEnabled: preferences.emailNotificationsEnabled,
        appointmentRemindersEnabled: preferences.appointmentRemindersEnabled,
        theme: themeToSave,
      },
      {
        onSuccess: (response) => {
          const theme = response.data.theme.toLowerCase() as
            | "light"
            | "dark"
            | "system";
          setTheme(theme);
        },
      },
    );
  };

  const handleThemeChange = (newTheme: UserTheme) => {
    setPreferences((prev) => ({ ...prev, theme: newTheme }));
    const themeLower = newTheme.toLowerCase() as "light" | "dark" | "system";
    setTheme(themeLower);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader
          eyebrow="Tài khoản cá nhân"
          title="Cài đặt tài khoản"
          description="Quản lý thông tin hồ sơ bác sĩ/quản trị viên, tùy chọn thông báo, giao diện và bảo mật tài khoản."
        />

        <div className="flex items-center gap-2">
          <Badge className="bg-primary/10 text-primary dark:bg-primary/20 border-primary/20 px-3 py-1 font-bold text-xs">
            <UserRound className="size-3.5 mr-1" />
            {currentUser.roles?.[0]?.role_name || "Thành viên hệ thống"}
          </Badge>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200/80 pb-2 dark:border-slate-800">
        <button
          type="button"
          onClick={() => setActiveTab("profile")}
          className={cn(
            "flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs sm:text-sm font-bold transition-all cursor-pointer",
            activeTab === "profile"
              ? "bg-primary text-primary-foreground shadow-2xs"
              : "bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-800 dark:hover:bg-slate-800",
          )}
        >
          <UserRound className="size-4" />
          <span>Hồ sơ cá nhân</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("preferences")}
          className={cn(
            "flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs sm:text-sm font-bold transition-all cursor-pointer",
            activeTab === "preferences"
              ? "bg-primary text-primary-foreground shadow-2xs"
              : "bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-800 dark:hover:bg-slate-800",
          )}
        >
          <BellRing className="size-4" />
          <span>Thông báo & Giao diện</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("security")}
          className={cn(
            "flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs sm:text-sm font-bold transition-all cursor-pointer",
            activeTab === "security"
              ? "bg-primary text-primary-foreground shadow-2xs"
              : "bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-800 dark:hover:bg-slate-800",
          )}
        >
          <KeyRound className="size-4" />
          <span>Bảo mật & Mật khẩu</span>
        </button>
      </div>

      {/* TAB 1: HỒ SƠ CÁ NHÂN */}
      {activeTab === "profile" && (
        <Card className="rounded-3xl border-slate-200/80 bg-white shadow-2xs dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
          <CardHeader className="border-b border-slate-100 bg-slate-50/50 p-6 dark:border-slate-800 dark:bg-slate-950/40">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary dark:bg-primary/20">
                <UserRound className="size-5" />
              </span>
              <div>
                <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Thông tin hồ sơ cá nhân
                </CardTitle>
                <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
                  Cập nhật họ tên, ảnh đại diện, số điện thoại và thông tin liên hệ
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6">
            <form className="space-y-6" onSubmit={handleProfileSubmit}>
              {/* Avatar Upload Banner */}
              <div className="flex flex-col sm:flex-row items-center gap-5 rounded-2xl border border-slate-200/80 bg-slate-50/60 p-5 dark:border-slate-800 dark:bg-slate-950/50">
                <div className="relative group size-20 shrink-0 overflow-hidden rounded-2xl border-2 border-primary/30 bg-white shadow-sm dark:bg-slate-900">
                  {currentAvatarSrc ? (
                    <img
                      src={currentAvatarSrc}
                      alt={currentUser.fullname}
                      className="size-full object-cover"
                    />
                  ) : (
                    <div className="flex size-full items-center justify-center bg-primary/10 text-primary font-bold text-xl">
                      {currentUser.fullname?.charAt(0) || "U"}
                    </div>
                  )}
                  <label className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-[10px] font-semibold">
                    <Camera className="size-4 mb-0.5" />
                    Thay đổi
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(event) =>
                        handleAvatarChange(event.target.files?.[0] ?? null)
                      }
                    />
                  </label>
                </div>

                <div className="flex-1 space-y-1.5 text-center sm:text-left">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      Ảnh đại diện hồ sơ
                    </p>
                    {avatarFile && (
                      <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-none text-[10px]">
                        ✓ Đã chọn file mới: {avatarFile.name}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Định dạng hỗ trợ: PNG, JPG, WEBP. Dung lượng tối đa: 5MB.
                  </p>
                  <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 hover:border-primary/40 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 mt-1">
                    <UploadCloud className="size-3.5 text-primary" />
                    <span>Tải ảnh mới từ máy tính</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(event) =>
                        handleAvatarChange(event.target.files?.[0] ?? null)
                      }
                    />
                  </label>
                </div>
              </div>

              {/* Form Fields */}
              <div className="grid gap-5 md:grid-cols-2">
                <Field
                  label="Họ và tên đầy đủ"
                  icon={User}
                  value={profile.fullname}
                  onChange={(value) =>
                    setProfile((prev) => ({ ...prev, fullname: value }))
                  }
                />
                <Field
                  label="Số điện thoại liên lạc"
                  icon={Phone}
                  value={profile.phone}
                  onChange={(value) =>
                    setProfile((prev) => ({ ...prev, phone: value }))
                  }
                />
                <Field
                  label="Địa chỉ cư trú"
                  value={profile.address}
                  onChange={(value) =>
                    setProfile((prev) => ({ ...prev, address: value }))
                  }
                />
                <Field
                  label="Ngày tháng năm sinh"
                  type="date"
                  value={profile.dateOfBirth}
                  onChange={(value) =>
                    setProfile((prev) => ({ ...prev, dateOfBirth: value }))
                  }
                />
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Giới tính
                  </label>
                  <select
                    className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 shadow-2xs outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                    value={profile.gender ? "true" : "false"}
                    onChange={(event) =>
                      setProfile((prev) => ({
                        ...prev,
                        gender: event.target.value === "true",
                      }))
                    }
                  >
                    <option value="true">Nam</option>
                    <option value="false">Nữ</option>
                  </select>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
                <Button
                  type="submit"
                  disabled={updateProfile.isPending}
                  className="rounded-xl font-bold shadow-xs px-6 cursor-pointer"
                >
                  {updateProfile.isPending ? (
                    <>
                      <Loader2 className="size-4 animate-spin mr-2" />
                      Đang lưu hồ sơ...
                    </>
                  ) : (
                    <>
                      <Save className="size-4 mr-2" />
                      Lưu thay đổi hồ sơ
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* TAB 2: THÔNG BÁO & GIAO DIỆN */}
      {activeTab === "preferences" && (
        <Card className="rounded-3xl border-slate-200/80 bg-white shadow-2xs dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
          <CardHeader className="border-b border-slate-100 bg-slate-50/50 p-6 dark:border-slate-800 dark:bg-slate-950/40">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-400">
                <BellRing className="size-5" />
              </span>
              <div>
                <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Tùy chọn thông báo & Giao diện
                </CardTitle>
                <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
                  Tùy chỉnh kênh nhận thông báo công việc và tông màu làm việc
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6 space-y-6">
            {/* Theme Selector Cards */}
            <div className="space-y-3">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Chế độ hiển thị giao diện
              </label>
              <div className="grid gap-4 sm:grid-cols-3">
                {/* Light */}
                <button
                  type="button"
                  onClick={() => handleThemeChange("LIGHT")}
                  className={cn(
                    "group flex flex-col items-center justify-between rounded-2xl border-2 p-5 text-center transition-all cursor-pointer",
                    preferences.theme === "LIGHT"
                      ? "border-primary bg-primary/5 shadow-md"
                      : "border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900",
                  )}
                >
                  <div className="flex size-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 mb-3 transition-transform group-hover:scale-105">
                    <Sun className="size-6" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      Giao diện Sáng
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Nền trắng tinh tế, sắc nét
                    </p>
                  </div>
                  {preferences.theme === "LIGHT" && (
                    <div className="mt-3 flex items-center gap-1 text-xs font-bold text-primary">
                      <CheckCircle2 className="size-4" /> Đang áp dụng
                    </div>
                  )}
                </button>

                {/* Dark */}
                <button
                  type="button"
                  onClick={() => handleThemeChange("DARK")}
                  className={cn(
                    "group flex flex-col items-center justify-between rounded-2xl border-2 p-5 text-center transition-all cursor-pointer",
                    preferences.theme === "DARK"
                      ? "border-primary bg-primary/5 shadow-md"
                      : "border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900",
                  )}
                >
                  <div className="flex size-12 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600 mb-3 transition-transform group-hover:scale-105 dark:bg-indigo-950 dark:text-indigo-400">
                    <Moon className="size-6" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      Giao diện Tối
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Dịu mắt khi làm việc ban đêm
                    </p>
                  </div>
                  {preferences.theme === "DARK" && (
                    <div className="mt-3 flex items-center gap-1 text-xs font-bold text-primary">
                      <CheckCircle2 className="size-4" /> Đang áp dụng
                    </div>
                  )}
                </button>

                {/* System */}
                <button
                  type="button"
                  onClick={() => handleThemeChange("SYSTEM")}
                  className={cn(
                    "group flex flex-col items-center justify-between rounded-2xl border-2 p-5 text-center transition-all cursor-pointer",
                    preferences.theme === "SYSTEM"
                      ? "border-primary bg-primary/5 shadow-md"
                      : "border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900",
                  )}
                >
                  <div className="flex size-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-700 mb-3 transition-transform group-hover:scale-105 dark:bg-slate-800 dark:text-slate-300">
                    <Tv className="size-6" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      Theo hệ thống
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Đồng bộ theo hệ điều hành
                    </p>
                  </div>
                  {preferences.theme === "SYSTEM" && (
                    <div className="mt-3 flex items-center gap-1 text-xs font-bold text-primary">
                      <CheckCircle2 className="size-4" /> Đang áp dụng
                    </div>
                  )}
                </button>
              </div>
            </div>

            {/* Notification Toggles */}
            <div className="space-y-3">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Kênh nhận thông báo
              </label>
              <div className="grid gap-3.5 lg:grid-cols-3">
                <PreferenceToggle
                  icon={Smartphone}
                  label="Toast realtime"
                  description="Hiện toast ngay khi có bệnh nhân đặt lịch hoặc tin nhắn mới."
                  checked={Boolean(preferences.realtimeToastsEnabled)}
                  onChange={(checked) =>
                    setPreferences((current) => ({
                      ...current,
                      realtimeToastsEnabled: checked,
                    }))
                  }
                />
                <PreferenceToggle
                  icon={Mail}
                  label="Thông báo qua email"
                  description="Nhận email thông báo thay đổi lịch khám và báo cáo quan trọng."
                  checked={Boolean(preferences.emailNotificationsEnabled)}
                  onChange={(checked) =>
                    setPreferences((current) => ({
                      ...current,
                      emailNotificationsEnabled: checked,
                    }))
                  }
                />
                <PreferenceToggle
                  icon={Clock}
                  label="Nhắc lịch hẹn"
                  description={`Nhận thông báo nhắc lịch khám trước ${settingsQuery.data?.data.effectiveAppointmentReminderBeforeMinutes ?? 1440} phút.`}
                  checked={Boolean(preferences.appointmentRemindersEnabled)}
                  onChange={(checked) =>
                    setPreferences((current) => ({
                      ...current,
                      appointmentRemindersEnabled: checked,
                    }))
                  }
                />
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
              <Button
                type="button"
                onClick={() => savePreferences()}
                disabled={updateSettings.isPending}
                className="rounded-xl font-bold shadow-xs px-6 cursor-pointer"
              >
                {updateSettings.isPending ? (
                  <>
                    <Loader2 className="size-4 animate-spin mr-2" />
                    Đang lưu...
                  </>
                ) : (
                  <>
                    <Save className="size-4 mr-2" />
                    Lưu tùy chọn thông báo & giao diện
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* TAB 3: BẢO MẬT & MẬT KHẨU */}
      {activeTab === "security" && (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Password Form Card */}
          <Card className="rounded-3xl border-slate-200/80 bg-white shadow-2xs dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
            <CardHeader className="border-b border-slate-100 bg-slate-50/50 p-6 dark:border-slate-800 dark:bg-slate-950/40">
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400">
                  <KeyRound className="size-5" />
                </span>
                <div>
                  <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100">
                    Đổi mật khẩu tài khoản
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
                    Mật khẩu mới yêu cầu tối thiểu 6 ký tự
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-6">
              <form className="space-y-4.5" onSubmit={handlePasswordSubmit}>
                {/* Old Password */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Mật khẩu hiện tại <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Input
                      type={showOldPassword ? "text" : "password"}
                      value={passwordForm.oldPassword}
                      onChange={(event) =>
                        setPasswordForm((prev) => ({
                          ...prev,
                          oldPassword: event.target.value,
                        }))
                      }
                      placeholder="Nhập mật khẩu hiện tại của bạn"
                      className="rounded-xl pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowOldPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    >
                      {showOldPassword ? (
                        <EyeOff className="size-4" />
                      ) : (
                        <Eye className="size-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Mật khẩu mới <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Input
                      type={showNewPassword ? "text" : "password"}
                      value={passwordForm.newPassword}
                      onChange={(event) =>
                        setPasswordForm((prev) => ({
                          ...prev,
                          newPassword: event.target.value,
                        }))
                      }
                      placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
                      className="rounded-xl pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    >
                      {showNewPassword ? (
                        <EyeOff className="size-4" />
                      ) : (
                        <Eye className="size-4" />
                      )}
                    </button>
                  </div>

                  {/* Password strength meter */}
                  {passwordForm.newPassword.length > 0 && (
                    <div className="space-y-1 pt-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-500">Độ mạnh mật khẩu:</span>
                        <span className={cn("font-bold", strengthMeta.text)}>
                          {strengthMeta.label}
                        </span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                        <div
                          className={cn(
                            "h-full transition-all duration-300",
                            strengthMeta.color,
                          )}
                          style={{ width: `${passwordStrength}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Xác nhận mật khẩu mới <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Input
                      type={showConfirmPassword ? "text" : "password"}
                      value={passwordForm.confirmPassword}
                      onChange={(event) =>
                        setPasswordForm((prev) => ({
                          ...prev,
                          confirmPassword: event.target.value,
                        }))
                      }
                      placeholder="Nhập lại chính xác mật khẩu mới"
                      className="rounded-xl pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="size-4" />
                      ) : (
                        <Eye className="size-4" />
                      )}
                    </button>
                  </div>
                  {passwordForm.newPassword &&
                    passwordForm.confirmPassword &&
                    passwordForm.newPassword !== passwordForm.confirmPassword && (
                      <p className="text-xs font-semibold text-rose-600 dark:text-rose-400">
                        ⚠️ Mật khẩu xác nhận không khớp.
                      </p>
                    )}
                </div>

                <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
                  <Button
                    type="submit"
                    disabled={changePassword.isPending}
                    className="rounded-xl font-bold shadow-xs px-6 cursor-pointer"
                  >
                    {changePassword.isPending ? (
                      <>
                        <Loader2 className="size-4 animate-spin mr-2" />
                        Đang đổi mật khẩu...
                      </>
                    ) : (
                      <>
                        <KeyRound className="size-4 mr-2" />
                        Cập nhật mật khẩu
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Security Recommendations & Session Info */}
          <div className="space-y-5">
            <Card className="rounded-3xl border-slate-200/80 bg-white shadow-2xs dark:border-slate-800 dark:bg-slate-900 p-6 space-y-4">
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                  <ShieldCheck className="size-5" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    Bảo vệ dữ liệu y tế
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Quy chuẩn an toàn thông tin bệnh nhân
                  </p>
                </div>
              </div>

              <div className="space-y-2.5 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                <div className="flex items-start gap-2 rounded-xl bg-slate-50 p-3 dark:bg-slate-950/60 border border-slate-200/60 dark:border-slate-800">
                  <CheckCircle2 className="size-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Không chia sẻ tài khoản quản trị/bác sĩ cho người khác sử dụng.</span>
                </div>
                <div className="flex items-start gap-2 rounded-xl bg-slate-50 p-3 dark:bg-slate-950/60 border border-slate-200/60 dark:border-slate-800">
                  <CheckCircle2 className="size-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Đăng xuất tài khoản khi không sử dụng thiết bị tại phòng khám.</span>
                </div>
                <div className="flex items-start gap-2 rounded-xl bg-slate-50 p-3 dark:bg-slate-950/60 border border-slate-200/60 dark:border-slate-800">
                  <CheckCircle2 className="size-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Đổi mật khẩu định kỳ 90 ngày để tránh rủi ro an ninh mạng.</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

function PreferenceToggle({
  icon: Icon,
  label,
  description,
  checked,
  onChange,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4 rounded-2xl border border-slate-200 p-4.5 hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-700 transition-all">
      <span className="space-y-1">
        <span className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-slate-100">
          <Icon className="size-4 text-primary" />
          {label}
        </span>
        <span className="block text-xs leading-relaxed text-slate-500 dark:text-slate-400">
          {description}
        </span>
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.currentTarget.checked)}
        className="mt-1 size-5 shrink-0 accent-primary cursor-pointer"
      />
    </label>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  icon: Icon,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
        {Icon && <Icon className="size-3.5 text-primary" />}
        {label}
      </label>
      <Input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-xl"
      />
    </div>
  );
}
