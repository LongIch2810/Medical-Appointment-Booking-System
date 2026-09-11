import React, { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Calendar,
  Camera,
  CheckCircle2,
  Info,
  Loader2,
  Lock,
  Mail,
  MapPin,
  Phone,
  RotateCcw,
  Save,
  ShieldCheck,
  User,
  Users,
} from "lucide-react";
import { toast } from "react-toastify";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ErrorState from "@/components/notification/ErrorState";
import MedicalAiLoading from "@/components/loading/MedicalAiLoading";
import { useUpdatePatientProfile } from "@/hooks/usePatientPortalApi";
import { useProfile } from "@/hooks/useProfile";
import {
  profileFormSchema,
  type ProfileFormValues,
} from "@/schemas/profile.schema";
import type { PatientUser } from "@/types/interface/patient.interface";

const toDateInputValue = (value: string | null | undefined): string => {
  if (!value) return "";
  if (/^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 10);
  const separator = value.includes("/") ? "/" : "-";
  const parts = value.split(separator);
  if (parts.length === 3) {
    const [first, second, third] = parts;
    if (third?.length === 4) {
      return `${third}-${second.padStart(2, "0")}-${first.padStart(2, "0")}`;
    }
  }
  return value.slice(0, 10);
};

const getInitialForm = (profile?: PatientUser | null): ProfileFormValues => ({
  fullname: profile?.fullname ?? "",
  phone: profile?.phone ?? "",
  date_of_birth: toDateInputValue(profile?.date_of_birth),
  gender: profile?.gender === undefined || profile?.gender === true ? "true" : "false",
  address: profile?.address ?? "",
});

const Profile: React.FC = () => {
  const { data: profileResponse, isLoading, isError, refetch } = useProfile();
  const updateProfileMutation = useUpdatePatientProfile();
  const profile = profileResponse?.data as PatientUser | undefined;

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: getInitialForm(profile),
  });

  useEffect(() => {
    reset(getInitialForm(profile));
  }, [profile, reset]);

  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(selectedFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [selectedFile]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Kích thước ảnh tối đa là 5MB.");
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleReset = () => {
    reset(getInitialForm(profile));
    setSelectedFile(null);
  };

  const onSubmit = (values: ProfileFormValues) => {
    const formData = new FormData();
    formData.append("fullname", values.fullname.trim());
    formData.append("phone", values.phone.trim());
    formData.append("gender", values.gender);
    formData.append("date_of_birth", values.date_of_birth);
    if (values.address) {
      formData.append("address", values.address.trim());
    }
    if (selectedFile) {
      formData.append("file", selectedFile);
    }

    updateProfileMutation.mutate(formData, {
      onSuccess: () => {
        toast.success("Đã cập nhật thông tin cá nhân thành công.");
        setSelectedFile(null);
      },
      onError: () => toast.error("Không thể cập nhật thông tin cá nhân. Vui lòng thử lại."),
    });
  };

  if (isLoading) {
    return (
      <MedicalAiLoading
        label="Đang tải hồ sơ bệnh nhân..."
        description="Hệ thống đang truy xuất thông tin tài khoản và dữ liệu định danh y tế"
        minHeight="min-h-80"
      />
    );
  }

  if (isError) {
    return (
      <ErrorState
        title="Không thể tải thông tin cá nhân"
        description="Đã xảy ra lỗi khi kết nối tới máy chủ. Vui lòng thử lại."
        onRetry={() => refetch()}
      />
    );
  }

  const initial =
    profile?.fullname?.trim().charAt(0)?.toUpperCase() ||
    profile?.username?.trim().charAt(0)?.toUpperCase() ||
    "P";

  const displayPicture = previewUrl ?? profile?.picture ?? "";
  const isPending = updateProfileMutation.isPending;

  return (
    <div className="space-y-6">
      {/* Profile Header Card */}
      <Card className="overflow-hidden border-slate-200/80 bg-white dark:border-slate-800/80 dark:bg-slate-900 py-0 shadow-sm transition-all">
        <div className="relative border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-emerald-50/60 via-teal-50/30 to-sky-50/20 dark:from-emerald-950/20 dark:via-slate-900 dark:to-slate-900 p-6 md:p-8">
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center">
            {/* Avatar with Camera Trigger */}
            <div className="relative group">
              <Avatar className="h-24 w-24 border-4 border-white dark:border-slate-800 shadow-md ring-2 ring-primary/20 sm:h-28 sm:w-28 transition-transform group-hover:scale-105">
                <AvatarImage
                  src={displayPicture}
                  alt={profile?.fullname ?? "Avatar"}
                  className="object-cover"
                />
                <AvatarFallback className="bg-primary/10 dark:bg-primary/20 text-3xl font-bold text-primary dark:text-sky-300">
                  {initial}
                </AvatarFallback>
              </Avatar>
              <label
                htmlFor="avatar-upload"
                className="absolute bottom-0 right-0 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border-2 border-white dark:border-slate-800 bg-primary text-white shadow-md transition-all hover:bg-primary/90 hover:scale-110 active:scale-95"
                title="Thay đổi ảnh đại diện"
              >
                <Camera className="h-4 w-4" />
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/jpg"
                  className="sr-only"
                  onChange={handleFileChange}
                  disabled={isPending}
                />
              </label>
            </div>

            {/* Profile Identity Details */}
            <div className="text-center sm:text-left flex-1 min-w-0">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 sm:text-2xl truncate">
                  {profile?.fullname || "Chưa cập nhật họ tên"}
                </h2>
                <Badge
                  variant="outline"
                  className="border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-300 gap-1 text-xs font-semibold"
                >
                  <ShieldCheck className="h-3 w-3" />
                  Bệnh nhân chính
                </Badge>
              </div>

              <div className="mt-2 flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-1.5 text-sm text-slate-600 dark:text-slate-400">
                <span className="inline-flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-slate-400" />
                  {profile?.email || "Chưa cập nhật email"}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 text-slate-400" />
                  {profile?.phone || "Chưa cập nhật SĐT"}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5 text-slate-400" />
                  {profile?.gender === undefined
                    ? "Chưa rõ"
                    : profile.gender
                      ? "Nam"
                      : "Nữ"}
                </span>
              </div>

              {selectedFile && (
                <div className="mt-3 inline-flex items-center gap-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60 px-3 py-1.5 text-xs font-medium text-emerald-800 dark:text-emerald-300">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Ảnh mới đã chọn: <strong className="font-semibold">{selectedFile.name}</strong></span>
                  <button
                    type="button"
                    onClick={() => setSelectedFile(null)}
                    className="ml-1 text-slate-400 hover:text-red-500 underline text-[11px]"
                  >
                    Hủy ảnh
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Main Profile Form */}
      <Card className="border-slate-200/80 bg-white dark:border-slate-800/80 dark:bg-slate-900 py-0 shadow-sm">
        <CardHeader className="border-b border-slate-100 dark:border-slate-800 px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <User className="h-4 w-4" />
                </span>
                <CardTitle className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  Hồ sơ thông tin cá nhân
                </CardTitle>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 pl-10">
                Thông tin dùng để quản lý lịch khám, liên hệ trực tuyến và xuất hồ sơ bệnh án.
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 md:p-8">
          <form id="profile-form" onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* Section 1: Thông tin định danh */}
            <div className="space-y-4">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-2">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300">
                    1
                  </span>
                  Thông tin định danh cơ bản
                </h3>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                {/* Họ và tên */}
                <div className="space-y-2">
                  <Label htmlFor="fullname" className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    Họ và tên <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    id="fullname"
                    placeholder="Nguyễn Văn A"
                    error={errors.fullname?.message}
                    {...register("fullname")}
                    className="rounded-xl"
                  />
                  {errors.fullname && (
                    <p className="text-xs text-rose-500">{errors.fullname.message}</p>
                  )}
                </div>

                {/* Ngày sinh */}
                <div className="space-y-2">
                  <Label htmlFor="date_of_birth" className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                    Ngày sinh <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    id="date_of_birth"
                    type="date"
                    error={errors.date_of_birth?.message}
                    {...register("date_of_birth")}
                    className="rounded-xl"
                  />
                  {errors.date_of_birth && (
                    <p className="text-xs text-rose-500">{errors.date_of_birth.message}</p>
                  )}
                </div>

                {/* Giới tính */}
                <div className="space-y-2">
                  <Label htmlFor="gender" className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5 text-slate-400" />
                    Giới tính <span className="text-rose-500">*</span>
                  </Label>
                  <Controller
                    name="gender"
                    control={control}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger id="gender" className="rounded-xl w-full">
                          <SelectValue placeholder="Chọn giới tính" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                          <SelectItem value="true">Nam</SelectItem>
                          <SelectItem value="false">Nữ</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.gender && (
                    <p className="text-xs text-rose-500">{errors.gender.message}</p>
                  )}
                </div>

                {/* Tên đăng nhập (Read-only) */}
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-sm font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                    <Lock className="h-3.5 w-3.5 text-slate-400" />
                    Tên đăng nhập (Username)
                  </Label>
                  <Input
                    id="username"
                    value={profile?.username ?? ""}
                    disabled
                    className="rounded-xl bg-slate-50/80 dark:bg-slate-950/50 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800 cursor-not-allowed"
                  />
                  <p className="text-[11px] text-slate-400">
                    Tên đăng nhập được dùng khi tạo tài khoản và không thể sửa đổi.
                  </p>
                </div>
              </div>
            </div>

            {/* Section 2: Thông tin liên lạc */}
            <div className="space-y-4">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-2">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300">
                    2
                  </span>
                  Thông tin liên lạc & Địa chỉ
                </h3>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                {/* Email (Read-only / Security) */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 text-slate-400" />
                    Địa chỉ Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={profile?.email ?? ""}
                    disabled
                    className="rounded-xl bg-slate-50/80 dark:bg-slate-950/50 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800 cursor-not-allowed"
                  />
                  <p className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Info className="h-3 w-3 inline shrink-0" />
                    Email liên kết bảo mật tài khoản.
                  </p>
                </div>

                {/* Số điện thoại */}
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 text-slate-400" />
                    Số điện thoại liên hệ <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    id="phone"
                    placeholder="0912345678"
                    error={errors.phone?.message}
                    {...register("phone")}
                    className="rounded-xl"
                  />
                  {errors.phone && (
                    <p className="text-xs text-rose-500">{errors.phone.message}</p>
                  )}
                </div>

                {/* Địa chỉ */}
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="address" className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-slate-400" />
                    Địa chỉ thường trú
                  </Label>
                  <Input
                    id="address"
                    placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành phố"
                    error={errors.address?.message}
                    {...register("address")}
                    className="rounded-xl"
                  />
                  {errors.address && (
                    <p className="text-xs text-rose-500">{errors.address.message}</p>
                  )}
                </div>
              </div>
            </div>
          </form>
        </CardContent>

        {/* Footer Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 px-6 py-4 rounded-b-2xl">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {isDirty || selectedFile ? (
              <span className="text-amber-600 dark:text-amber-400 font-medium">● Có thay đổi chưa được lưu</span>
            ) : (
              <span>Dữ liệu hồ sơ đã được đồng bộ</span>
            )}
          </p>
          <div className="flex items-center gap-2.5">
            <Button
              type="button"
              variant="outline"
              onClick={handleReset}
              disabled={isPending || (!isDirty && !selectedFile)}
              className="gap-1.5 rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 dark:border-slate-700 dark:bg-slate-800"
            >
              <RotateCcw className="h-4 w-4" />
              Khôi phục
            </Button>
            <Button
              type="submit"
              form="profile-form"
              disabled={isPending}
              className="gap-2 rounded-xl !bg-primary hover:!bg-primary/90 px-5 font-semibold !text-white hover:!text-white shadow-sm cursor-pointer"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                  <span className="text-white">Đang lưu...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 text-white" />
                  <span className="text-white">Lưu thay đổi</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Profile;
