import React, { useEffect, useState } from "react";
import { Camera } from "lucide-react";
import { toast } from "react-toastify";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

  useEffect(() => {
    setForm(getInitialForm(profile));
  }, [profile]);

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
      <Card className="border-primary/15 p-5 text-sm text-slate-600">
        Đang tải thông tin cá nhân...
      </Card>
    );
  }

  if (isError) {
    return (
      <Card className="border-primary/15 p-5 text-sm text-red-600">
        Không thể tải thông tin cá nhân.
      </Card>
    );
  }

  return (
    <Card className="border-primary/15 py-5">
      <CardHeader className="px-5">
        <CardTitle className="text-lg">Thông tin cá nhân</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5 px-5">
        <div className="flex items-center gap-4">
          <div className="relative h-20 w-20 overflow-hidden rounded-full border-4 border-primary/20 bg-primary/10">
            {profile?.picture ? (
              <img
                src={profile.picture}
                alt={profile.fullname ?? "Avatar"}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-2xl font-bold text-primary">
                {form.fullname.charAt(0).toUpperCase() || "P"}
              </div>
            )}
          </div>
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border bg-background px-4 py-2 text-sm font-medium shadow-xs hover:bg-accent hover:text-accent-foreground">
            <Camera className="h-4 w-4" />
            Đổi ảnh đại diện
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
          {form.file && (
            <span className="text-sm text-slate-500">{form.file.name}</span>
          )}
        </div>

        <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSave}>
          <div className="space-y-2">
            <Label htmlFor="fullName">Họ và tên</Label>
            <Input
              id="fullName"
              value={form.fullname}
              onChange={(event) => handleChange("fullname", event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Số điện thoại</Label>
            <Input
              id="phone"
              value={form.phone}
              onChange={(event) => handleChange("phone", event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={form.email} disabled />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dateOfBirth">Ngày sinh</Label>
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
            <Label htmlFor="gender">Giới tính</Label>
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
            <Label htmlFor="address">Địa chỉ</Label>
            <Input
              id="address"
              value={form.address}
              onChange={(event) => handleChange("address", event.target.value)}
            />
          </div>

          <div className="md:col-span-2">
            <Button type="submit" disabled={updateProfileMutation.isPending}>
              Lưu thay đổi
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default Profile;
