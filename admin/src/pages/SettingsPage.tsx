import {
  AlertCircle,
  CalendarClock,
  CheckCircle2,
  Clock,
  History,
  Info,
  Loader2,
  RotateCcw,
  Save,
  ShieldCheck,
  Sliders,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { ErrorState } from "@/components/app/ErrorState";
import { LoadingState } from "@/components/app/LoadingState";
import { PageHeader } from "@/components/app/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  useSystemSettings,
  useUpdateSystemSettings,
} from "@/hooks/useSettings";
import { cn } from "@/lib/utils";
import type { UpdateSystemSettings } from "@/types/interface/settings.interface";

const PRESET_MINUTES = [
  { label: "15 phút", value: 15, desc: "Gấp" },
  { label: "1 giờ", value: 60, desc: "60 phút" },
  { label: "6 giờ", value: 360, desc: "Nửa ngày làm việc" },
  { label: "12 giờ", value: 720, desc: "Nửa ngày" },
  { label: "24 giờ", value: 1440, desc: "Khuyên dùng (1 ngày)" },
  { label: "48 giờ", value: 2880, desc: "2 ngày trước" },
];

export function SettingsPage() {
  const navigate = useNavigate();
  const settingsQuery = useSystemSettings();
  const updateSettings = useUpdateSystemSettings();
  const [form, setForm] = useState<UpdateSystemSettings>({});
  const [initialForm, setInitialForm] = useState<UpdateSystemSettings>({});

  useEffect(() => {
    const settings = settingsQuery.data?.data;
    if (!settings) return;
    const loadedData: UpdateSystemSettings = {
      appointmentRemindersEnabled: settings.appointmentRemindersEnabled,
      appointmentReminderBeforeMinutes:
        settings.appointmentReminderBeforeMinutes,
      appointmentEmailsEnabled: settings.appointmentEmailsEnabled,
      defaultRealtimeToastsEnabled: settings.defaultRealtimeToastsEnabled,
      defaultEmailNotificationsEnabled:
        settings.defaultEmailNotificationsEnabled,
      defaultAppointmentRemindersEnabled:
        settings.defaultAppointmentRemindersEnabled,
    };
    setForm(loadedData);
    setInitialForm(loadedData);
  }, [settingsQuery.data?.data]);

  const hasChanges = useMemo(() => {
    return JSON.stringify(form) !== JSON.stringify(initialForm);
  }, [form, initialForm]);

  if (settingsQuery.isLoading) {
    return <LoadingState label="Đang tải cấu hình hệ thống..." />;
  }

  if (settingsQuery.isError) {
    return (
      <ErrorState
        title="Không thể tải cấu hình hệ thống"
        onRetry={() => settingsQuery.refetch()}
      />
    );
  }

  const toggle = (key: keyof UpdateSystemSettings) => {
    setForm((current) => ({ ...current, [key]: !current[key] }));
  };

  const handleReset = () => {
    setForm(initialForm);
  };

  const minutes = form.appointmentReminderBeforeMinutes ?? 1440;
  const isInvalidMinutes = minutes < 15 || minutes > 10080;

  const humanReadableTime = (min: number) => {
    if (min < 60) return `${min} phút`;
    const hours = (min / 60).toFixed(1).replace(".0", "");
    if (min < 1440) return `${hours} giờ (${min} phút)`;
    const days = (min / 1440).toFixed(1).replace(".0", "");
    return `${days} ngày (~${hours} giờ)`;
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader
          eyebrow="System Configuration"
          title="Cài đặt hệ thống"
          description="Cấu hình động cơ thông báo, nhắc lịch khám tự động và thiết lập mặc định cho toàn bộ bệnh viện."
        />

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            onClick={() =>
              navigate("/admin/audit-logs?entity=system_configs")
            }
            className="rounded-2xl border-slate-200 bg-white font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 cursor-pointer h-10 gap-2"
          >
            <History className="size-4 text-primary" />
            <span>Lịch sử Audit Logs</span>
          </Button>
        </div>
      </div>

      {/* Hero Status Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-teal-700 via-emerald-700 to-cyan-800 p-6 text-white shadow-sm dark:from-slate-900 dark:via-teal-950 dark:to-slate-900 dark:border dark:border-slate-800">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-lg bg-white/20 backdrop-blur-md">
                <Zap className="size-4 text-emerald-200" />
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-100">
                Notification & Dispatch Engine
              </span>
            </div>
            <h2 className="text-xl font-extrabold tracking-tight">
              Trung tâm Điều phối Cấu hình Tự động
            </h2>
            <p className="text-xs text-white/80 max-w-2xl">
              Các thông số tại đây kiểm soát dịch vụ quét lịch hẹn ngầm (Background Cron), thời gian gửi email chẩn đoán và cấu hình thông báo áp dụng mặc định cho tất cả tài khoản mới.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge className="bg-white/20 text-white border-white/20 backdrop-blur-md px-3 py-1 font-semibold text-xs">
              <ShieldCheck className="size-3.5 mr-1 text-emerald-300" />
              Hệ thống vận hành ổn định
            </Badge>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid gap-6 xl:grid-cols-2">
        {/* CARD 1: Cấu hình Nhắc lịch & Email */}
        <Card className="rounded-3xl border-slate-200/80 bg-white shadow-2xs dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
          <CardHeader className="border-b border-slate-100 bg-slate-50/50 p-6 dark:border-slate-800 dark:bg-slate-950/40">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary dark:bg-primary/20">
                <CalendarClock className="size-5" />
              </span>
              <div>
                <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Nhắc lịch & Email Dispatch
                </CardTitle>
                <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
                  Cấu hình dịch vụ quét và gửi thông báo lịch hẹn tự động
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6 space-y-5">
            {/* Global Reminders Toggle */}
            <div
              className={cn(
                "flex items-start justify-between gap-4 rounded-2xl border p-4.5 transition-all",
                form.appointmentRemindersEnabled
                  ? "border-emerald-200 bg-emerald-50/40 dark:border-emerald-900/50 dark:bg-emerald-950/20 shadow-2xs"
                  : "border-slate-200/80 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900",
              )}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    Bật dịch vụ nhắc lịch toàn hệ thống
                  </span>
                  {form.appointmentRemindersEnabled ? (
                    <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300 border-none text-[10px] font-semibold">
                      Đang chạy
                    </Badge>
                  ) : (
                    <Badge className="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-none text-[10px]">
                      Đã tắt
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Tự động gửi thông báo nhắc bệnh nhân trước thời gian hẹn khám đã định.
                </p>
              </div>
              <input
                type="checkbox"
                checked={Boolean(form.appointmentRemindersEnabled)}
                onChange={() => toggle("appointmentRemindersEnabled")}
                className="mt-1 size-5 shrink-0 accent-primary cursor-pointer"
              />
            </div>

            {/* Reminder Timing Selector */}
            <div className="space-y-3 rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4.5 dark:border-slate-800 dark:bg-slate-950/40">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="reminderMinutes"
                  className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5"
                >
                  <Clock className="size-3.5 text-primary" />
                  Thời gian nhắc trước giờ hẹn
                </label>
                <span className="text-xs font-bold text-primary">
                  {humanReadableTime(minutes)}
                </span>
              </div>

              {/* Preset Buttons */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {PRESET_MINUTES.map((preset) => (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() =>
                      setForm((current) => ({
                        ...current,
                        appointmentReminderBeforeMinutes: preset.value,
                      }))
                    }
                    className={cn(
                      "rounded-xl px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer",
                      minutes === preset.value
                        ? "bg-primary text-primary-foreground shadow-2xs font-bold"
                        : "bg-white text-slate-700 border border-slate-200 hover:border-primary/40 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700",
                    )}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              {/* Custom Minutes Input */}
              <div className="pt-2">
                <div className="flex items-center gap-2">
                  <Input
                    id="reminderMinutes"
                    type="number"
                    min={15}
                    max={10080}
                    value={minutes}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        appointmentReminderBeforeMinutes: Number(
                          event.target.value,
                        ),
                      }))
                    }
                    className={cn(
                      "rounded-xl bg-white dark:bg-slate-900 font-semibold",
                      isInvalidMinutes && "border-rose-500 focus:border-rose-500",
                    )}
                  />
                  <span className="text-xs font-bold text-slate-500 shrink-0">
                    phút
                  </span>
                </div>
                {isInvalidMinutes ? (
                  <p className="mt-1 text-xs text-rose-500 font-medium flex items-center gap-1">
                    <AlertCircle className="size-3.5" />
                    Thời gian hợp lệ từ 15 phút (0.25 giờ) đến 10080 phút (7 ngày).
                  </p>
                ) : (
                  <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                    💡 Khuyến nghị: 1440 phút (tương đương 24 giờ trước lịch khám).
                  </p>
                )}
              </div>
            </div>

            {/* Email Dispatch Toggle */}
            <div
              className={cn(
                "flex items-start justify-between gap-4 rounded-2xl border p-4.5 transition-all",
                form.appointmentEmailsEnabled
                  ? "border-sky-200 bg-sky-50/40 dark:border-sky-900/50 dark:bg-sky-950/20 shadow-2xs"
                  : "border-slate-200/80 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900",
              )}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    Gửi email tự động khi có thay đổi lịch khám
                  </span>
                  {form.appointmentEmailsEnabled ? (
                    <Badge className="bg-sky-100 text-sky-800 dark:bg-sky-900/60 dark:text-sky-300 border-none text-[10px] font-semibold">
                      Kích hoạt
                    </Badge>
                  ) : (
                    <Badge className="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-none text-[10px]">
                      Đã tắt
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Gửi thư điện tử xác nhận lịch, thông báo dời lịch, hủy hẹn hoặc cập nhật kết quả khám từ bác sĩ.
                </p>
              </div>
              <input
                type="checkbox"
                checked={Boolean(form.appointmentEmailsEnabled)}
                onChange={() => toggle("appointmentEmailsEnabled")}
                className="mt-1 size-5 shrink-0 accent-primary cursor-pointer"
              />
            </div>
          </CardContent>
        </Card>

        {/* CARD 2: Mặc định cho tài khoản mới */}
        <Card className="rounded-3xl border-slate-200/80 bg-white shadow-2xs dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
          <CardHeader className="border-b border-slate-100 bg-slate-50/50 p-6 dark:border-slate-800 dark:bg-slate-950/40">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-400">
                <Sliders className="size-5" />
              </span>
              <div>
                <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Cài đặt Mặc định cho Tài khoản Mới
                </CardTitle>
                <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
                  Tùy chọn được áp dụng sẵn khi bệnh nhân hoặc nhân viên tạo tài khoản
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6 space-y-4">
            {/* Default Realtime Toasts */}
            <div className="flex items-start justify-between gap-4 rounded-2xl border border-slate-200/80 p-4 hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-700 transition-all">
              <div className="space-y-1">
                <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Bật Toast Realtime mặc định
                </span>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Tài khoản mới đăng ký sẽ tự động nhận toast thông báo nổi góc màn hình khi có cập nhật.
                </p>
              </div>
              <input
                type="checkbox"
                checked={Boolean(form.defaultRealtimeToastsEnabled)}
                onChange={() => toggle("defaultRealtimeToastsEnabled")}
                className="mt-1 size-5 shrink-0 accent-primary cursor-pointer"
              />
            </div>

            {/* Default Email Notifications */}
            <div className="flex items-start justify-between gap-4 rounded-2xl border border-slate-200/80 p-4 hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-700 transition-all">
              <div className="space-y-1">
                <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Bật Thông báo Email mặc định
                </span>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Gửi email chào mừng và thông báo khám bệnh ngay khi kích hoạt tài khoản thành công.
                </p>
              </div>
              <input
                type="checkbox"
                checked={Boolean(form.defaultEmailNotificationsEnabled)}
                onChange={() => toggle("defaultEmailNotificationsEnabled")}
                className="mt-1 size-5 shrink-0 accent-primary cursor-pointer"
              />
            </div>

            {/* Default Appointment Reminders */}
            <div className="flex items-start justify-between gap-4 rounded-2xl border border-slate-200/80 p-4 hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-700 transition-all">
              <div className="space-y-1">
                <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Bật Nhắc lịch khám mặc định
                </span>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Tự động bật chế độ nhắc hẹn cho bệnh nhân khi họ đặt lịch khám đầu tiên trên hệ thống.
                </p>
              </div>
              <input
                type="checkbox"
                checked={Boolean(form.defaultAppointmentRemindersEnabled)}
                onChange={() => toggle("defaultAppointmentRemindersEnabled")}
                className="mt-1 size-5 shrink-0 accent-primary cursor-pointer"
              />
            </div>

            {/* Compliance Note */}
            <div className="flex items-center gap-3 rounded-2xl bg-indigo-50/60 border border-indigo-100 p-4 text-xs text-indigo-900 dark:bg-indigo-950/40 dark:border-indigo-900/60 dark:text-indigo-200">
              <Info className="size-4.5 shrink-0 text-indigo-600 dark:text-indigo-400" />
              <p>
                Người dùng có thể tự do thay đổi tùy chọn cá nhân này bất kỳ lúc nào trong trang Cài đặt tài khoản của họ mà không làm ảnh hưởng đến cấu hình chung.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Save Bar */}
      <Card className="rounded-3xl border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-2.5">
            {hasChanges ? (
              <span className="flex size-3 rounded-full bg-amber-500 animate-ping" />
            ) : (
              <CheckCircle2 className="size-4.5 text-emerald-600 shrink-0" />
            )}
            <p className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300">
              {hasChanges
                ? "Có thay đổi cấu hình chưa được áp dụng."
                : "Cấu hình hệ thống hiện tại đã đồng bộ và đang hoạt động."}
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            {hasChanges && (
              <Button
                variant="outline"
                onClick={handleReset}
                className="rounded-xl border-slate-200 font-bold dark:border-slate-800"
              >
                <RotateCcw className="size-4" />
                Khôi phục
              </Button>
            )}

            <Button
              disabled={updateSettings.isPending || isInvalidMinutes}
              onClick={() =>
                updateSettings.mutate({
                  appointmentRemindersEnabled:
                    form.appointmentRemindersEnabled,
                  appointmentReminderBeforeMinutes:
                    form.appointmentReminderBeforeMinutes,
                  appointmentEmailsEnabled: form.appointmentEmailsEnabled,
                  defaultRealtimeToastsEnabled:
                    form.defaultRealtimeToastsEnabled,
                  defaultEmailNotificationsEnabled:
                    form.defaultEmailNotificationsEnabled,
                  defaultAppointmentRemindersEnabled:
                    form.defaultAppointmentRemindersEnabled,
                })
              }
              className={cn(
                "rounded-xl font-bold shadow-xs px-6 cursor-pointer",
                hasChanges && "ring-2 ring-primary/30 shadow-md",
              )}
            >
              {updateSettings.isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin mr-2" />
                  Đang lưu cấu hình...
                </>
              ) : (
                <>
                  <Save className="size-4 mr-2" />
                  Lưu cấu hình hệ thống
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
