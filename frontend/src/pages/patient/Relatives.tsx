import React, { useMemo, useState } from "react";
import { Pencil, Trash2, UserPlus } from "lucide-react";
import { toast } from "react-toastify";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { PatientRelatives } from "@/pages/patient/patientTypes";
import { usePatientPortal } from "@/pages/patient/usePatientPortal";

type RelativesFormState = Omit<PatientRelatives, "id"> & { id?: number };

const defaultFormState: RelativesFormState = {
  fullName: "",
  relationship: "",
  dateOfBirth: "",
  gender: "",
  phone: "",
  insuranceNumber: "",
};

const Relatives: React.FC = () => {
  const { dependents, removeDependent, saveDependent } = usePatientPortal();
  const [form, setForm] = useState<RelativesFormState>(defaultFormState);

  const isEditing = useMemo(() => Boolean(form.id), [form.id]);

  const handleChange = (key: keyof RelativesFormState, value: string) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const resetForm = () => {
    setForm(defaultFormState);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.fullName || !form.relationship || !form.phone) {
      toast.error("Vui lòng nhập đầy đủ họ tên, mối quan hệ và số điện thoại.");
      return;
    }
    saveDependent(form);
    toast.success(
      isEditing
        ? "Đã cập nhật thông tin người phụ thuộc."
        : "Đã thêm người phụ thuộc.",
    );
    resetForm();
  };

  const handleEdit = (dependent: PatientRelatives) => {
    setForm(dependent);
  };

  const handleDelete = (dependentId: number) => {
    removeDependent(dependentId);
    toast.info("Đã xóa người phụ thuộc khỏi danh sách.");
    if (form.id === dependentId) {
      resetForm();
    }
  };

  return (
    <div className="grid gap-4 xl:grid-cols-[1.2fr_1fr]">
      <Card className="border-primary/15 py-5">
        <CardHeader className="px-5">
          <CardTitle className="text-lg">Danh sách người phụ thuộc</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 px-5">
          {dependents.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 p-5 text-center text-sm text-slate-500">
              Chưa có người phụ thuộc nào.
            </div>
          ) : (
            dependents.map((dependent) => (
              <div
                key={dependent.id}
                className="rounded-xl border border-slate-200 bg-white p-4"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="space-y-1">
                    <p className="font-semibold text-slate-900">
                      {dependent.fullName}
                    </p>
                    <p className="text-sm text-slate-600">
                      {dependent.relationship} | {dependent.gender}
                    </p>
                    <p className="text-sm text-slate-600">
                      Ngày sinh: {dependent.dateOfBirth}
                    </p>
                    <p className="text-sm text-slate-600">
                      SDT: {dependent.phone} | BHYT: {dependent.insuranceNumber}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={() => handleEdit(dependent)}
                    >
                      <Pencil className="h-4 w-4" />
                      Sửa
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="gap-2"
                      onClick={() => handleDelete(dependent.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                      Xóa
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card className="border-primary/15 py-5">
        <CardHeader className="px-5">
          <CardTitle className="text-lg">
            {isEditing ? "Cập nhật nhân thân" : "Thêm người phụ thuộc"}
          </CardTitle>
        </CardHeader>
        <CardContent className="px-5">
          <form className="space-y-3" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="dependentName">Họ và tên</Label>
              <Input
                id="dependentName"
                value={form.fullName}
                onChange={(event) =>
                  handleChange("fullName", event.target.value)
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dependentRelationship">Mối quan hệ</Label>
              <Input
                id="dependentRelationship"
                value={form.relationship}
                onChange={(event) =>
                  handleChange("relationship", event.target.value)
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dependentDateOfBirth">Ngày sinh</Label>
              <Input
                id="dependentDateOfBirth"
                type="date"
                value={form.dateOfBirth}
                onChange={(event) =>
                  handleChange("dateOfBirth", event.target.value)
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dependentGender">Giới tính</Label>
              <Input
                id="dependentGender"
                value={form.gender}
                onChange={(event) => handleChange("gender", event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dependentPhone">Số điện thoại</Label>
              <Input
                id="dependentPhone"
                value={form.phone}
                onChange={(event) => handleChange("phone", event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dependentInsurance">Số BHYT</Label>
              <Input
                id="dependentInsurance"
                value={form.insuranceNumber}
                onChange={(event) =>
                  handleChange("insuranceNumber", event.target.value)
                }
              />
            </div>

            <div className="flex gap-2">
              <Button type="submit" className="gap-2">
                <UserPlus className="h-4 w-4" />
                {isEditing ? "Lưu cập nhật" : "Thêm mới"}
              </Button>
              <Button type="button" variant="outline" onClick={resetForm}>
                Làm mới
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Relatives;
