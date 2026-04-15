import React, { useEffect, useState } from "react";
import { Camera } from "lucide-react";
import { toast } from "react-toastify";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { PatientProfile } from "@/pages/patient/patientTypes";
import { usePatientPortal } from "@/pages/patient/usePatientPortal";

const Profile: React.FC = () => {
  const { profile, updateProfile } = usePatientPortal();
  const [form, setForm] = useState<PatientProfile>(profile);

  useEffect(() => {
    setForm(profile);
  }, [profile]);

  const handleChange = (key: keyof PatientProfile, value: string) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSave = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    updateProfile(form);
    toast.success("Đã cập nhật thông tin cá nhân (dữ liệu tạm).");
  };

  return (
    <Card className="border-primary/15 py-5">
      <CardHeader className="px-5">
        <CardTitle className="text-lg">Thông tin cá nhân</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5 px-5">
        <div className="flex items-center gap-4">
          <div className="relative h-20 w-20 rounded-full border-4 border-primary/20 bg-primary/10">
            <div className="absolute inset-0 flex items-center justify-center text-2xl font-bold text-primary">
              {form.fullName.charAt(0).toUpperCase()}
            </div>
          </div>
          <Button type="button" variant="outline" className="gap-2">
            <Camera className="h-4 w-4" />
            Đổi ảnh đại diện
          </Button>
        </div>

        <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSave}>
          <div className="space-y-2">
            <Label htmlFor="fullName">Họ và tên</Label>
            <Input
              id="fullName"
              value={form.fullName}
              onChange={(event) => handleChange("fullName", event.target.value)}
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
            <Input
              id="email"
              type="email"
              value={form.email}
              onChange={(event) => handleChange("email", event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dateOfBirth">Ngày sinh</Label>
            <Input
              id="dateOfBirth"
              type="date"
              value={form.dateOfBirth}
              onChange={(event) => handleChange("dateOfBirth", event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="gender">Giới tính</Label>
            <Input
              id="gender"
              value={form.gender}
              onChange={(event) => handleChange("gender", event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="insuranceNumber">Số BHYT</Label>
            <Input
              id="insuranceNumber"
              value={form.insuranceNumber}
              onChange={(event) =>
                handleChange("insuranceNumber", event.target.value)
              }
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="address">Địa chỉ</Label>
            <Input
              id="address"
              value={form.address}
              onChange={(event) => handleChange("address", event.target.value)}
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="emergencyContact">Liên hệ khẩn cấp</Label>
            <Input
              id="emergencyContact"
              value={form.emergencyContact}
              onChange={(event) =>
                handleChange("emergencyContact", event.target.value)
              }
            />
          </div>

          <div className="md:col-span-2">
            <Button type="submit">Lưu thay đổi</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default Profile;
