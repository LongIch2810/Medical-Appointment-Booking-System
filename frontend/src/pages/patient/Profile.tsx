import React, { useEffect, useState } from "react";
import { Camera, Loader2, Mail, MapPin, Phone, Save } from "lucide-react";
import { toast } from "react-toastify";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useUpdatePatientProfile } from "@/hooks/usePatientPortalApi";
import { useProfile } from "@/hooks/useProfile";
import type { PatientUser } from "@/types/interface/patient.interface";

interface ProfileFormState {
  fullname: string;
  phone: string;
  email: string;
  date_of_birth: string;
  gender: "true" | "false";
  address: string;
  file: File | null;
}

const toDateInputValue = (value: string | null | undefined) => {
  if (!value) return "";
  const parts = value.split("/");
  if (parts.length === 3) {
    const [day, month, year] = parts;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }
  return value.slice(0, 10);
};

const getInitialForm = (profile?: PatientUser | null): ProfileFormState => ({
  fullname: profile?.fullname ?? "",
  phone: profile?.phone ?? "",
  email: profile?.email ?? "",
  date_of_birth: toDateInputValue(profile?.date_of_birth),
  gender: profile?.gender ? "true" : "false",
  address: profile?.address ?? "",
  file: null,
});

const Profile: React.FC = () => {
  const { data: profileResponse, isLoading, isError } = useProfile();
  const updateProfileMutation = useUpdatePatientProfile();
  const profile = profileResponse?.data as PatientUser | undefined;
  const [form, setForm] = useState<ProfileFormState>(getInitialForm(profile));
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    setForm(getInitialForm(profile));
  }, [profile]);

  useEffect(() => {
    if (!form.file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(form.file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [form.file]);

  const handleChange = (
    key: keyof Omit<ProfileFormState, "file">,
    value: string,
  ) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSave = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData();
    formData.append("fullname", form.fullname);
    formData.append("phone", form.phone);
    formData.append("gender", form.gender);
    formData.append("date_of_birth", form.date_of_birth);
    formData.append("address", form.address);
    if (form.file) {
      formData.append("file", form.file);
    }

    updateProfileMutation.mutate(formData, {
      onSuccess: () => {
        toast.success("Đã cập nhật thông tin cá nhân.");
      },
      onError: () => toast.error("Không thể cập nhật thông tin cá nhân."),
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-44 rounded-2xl" />
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    );
  }

  if (isError) {
    return (
      <Card className="border-red-200 bg-red-50/50 p-5 text-sm text-red-600">
        Không thể tải thông tin cá nhân.
      </Card>
    );
  }

  const initial =
    form.fullname.charAt(0).toUpperCase() ||
    profile?.username?.charAt(0)?.toUpperCase() ||
    "P";
  const displayPicture = previewUrl ?? profile?.picture ?? "";

  return (
    <div className="space-y-5">
      <Card className="overflow-hidden border-slate-200 py-0 shadow-sm">
        <div className="relative bg-gradient-to-br from-primary/15 via-primary/5 to-transparent p-6">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
            <div className="relative">
              <Avatar className="h-24 w-24 border-4 border-white shadow-md ring-2 ring-primary/20 sm:h-28 sm:w-28">
                <AvatarImage src={displayPicture} alt={form.fullname} />
                <AvatarFallback className="bg-primary/10 text-3xl font-bold text-primary">
                  {initial}
                </AvatarFallback>
              </Avatar>
              <label className="absolute bottom-0 right-0 inline-flex cursor-pointer items-center justify-center rounded-full border border-white bg-primary p-2 text-white shadow-md transition-transform hover:scale-105">
                <Camera className="h-4 w-4" />
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      file: event.target.files?.[0] ?? null,
                    }))
                  }
                />
              </label>
            </div>
            <div className="text-center sm:text-left">
              <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">
                {form.fullname || "Chưa cập nhật tên"}
              </h2>
              <div className="mt-1.5 flex flex-wrap justify-center gap-x-3 gap-y-1 text-sm text-slate-600 sm:justify-start">
                <span className="inline-flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5" />
                  {form.email || "—"}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5" />
                  {form.phone || "—"}
                </span>
              </div>
              {form.file && (
                <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700">
                  <Camera className="h-3 w-3" />
                  Sẽ thay ảnh: {form.file.name}
                </p>
              )}
            </div>
          </div>
        </div>
      </Card>

      <Card className="border-slate-200 py-0 shadow-sm">
        <CardHeader className="border-b border-slate-100 px-5 py-4">
          <CardTitle className="text-base font-semibold text-slate-900">
            Thông tin cá nhân
          </CardTitle>
          <p className="text-sm text-slate-500">
            Cập nhật thông tin để hệ thống liên lạc và phục vụ bạn tốt hơn.
          </p>
        </CardHeader>
        <CardContent className="px-5 py-5">
          <form
            className="grid gap-5 md:grid-cols-2"
            onSubmit={handleSave}
            id="profile-form"
          >
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-sm font-semibold">
                Họ và tên
              </Label>
              <Input
                id="fullName"
                value={form.fullname}
                onChange={(event) =>
                  handleChange("fullname", event.target.value)
                }
                placeholder="Nhập họ và tên"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm font-semibold">
                Số điện thoại
              </Label>
              <Input
                id="phone"
                value={form.phone}
                onChange={(event) => handleChange("phone", event.target.value)}
                placeholder="Nhập số điện thoại"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-semibold">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                disabled
                className="bg-slate-50 text-slate-500"
              />
              <p className="text-xs text-slate-400">
                Email không thể thay đổi.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateOfBirth" className="text-sm font-semibold">
                Ngày sinh
              </Label>
              <Input
                id="dateOfBirth"
                type="date"
                value={form.date_of_birth}
                onChange={(event) =>
                  handleChange("date_of_birth", event.target.value)
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gender" className="text-sm font-semibold">
                Giới tính
              </Label>
              <select
                id="gender"
                value={form.gender}
                onChange={(event) => handleChange("gender", event.target.value)}
                className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
              >
                <option value="true">Nam</option>
                <option value="false">Nữ</option>
              </select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="address" className="text-sm font-semibold">
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" />
                  Địa chỉ
                </span>
              </Label>
              <Input
                id="address"
                value={form.address}
                onChange={(event) =>
                  handleChange("address", event.target.value)
                }
                placeholder="Nhập địa chỉ liên hệ"
              />
            </div>
          </form>
        </CardContent>
        <div className="flex items-center justify-end gap-2 border-t border-slate-100 bg-slate-50/50 px-5 py-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => setForm(getInitialForm(profile))}
            disabled={updateProfileMutation.isPending}
          >
            Khôi phục
          </Button>
          <Button
            type="submit"
            form="profile-form"
            disabled={updateProfileMutation.isPending}
            className="gap-2"
          >
            {updateProfileMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Đang lưu...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Lưu thay đổi
              </>
            )}
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default Profile;
