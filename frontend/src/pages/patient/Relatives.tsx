import React, { useMemo, useState } from "react";
import { Pencil, Trash2, UserPlus } from "lucide-react";
import { toast } from "react-toastify";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  useCreatePatientRelative,
  useDeletePatientRelative,
  usePatientRelatives,
  useRelationships,
  useUpdatePatientRelative,
} from "@/hooks/usePatientPortalApi";
import type { Relative } from "@/types/interface/patient.interface";

interface RelativesFormState {
  id?: number;
  fullname: string;
  relationship_code: string;
  dob: string;
  gender: "true" | "false";
  phone: string;
}

const defaultFormState: RelativesFormState = {
  fullname: "",
  relationship_code: "",
  dob: "",
  gender: "true",
  phone: "",
};

const toDateInputValue = (value: string | null | undefined) => {
  if (!value) return "";
  const parts = value.split("/");
  if (parts.length === 3) {
    const [day, month, year] = parts;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }
  return value.slice(0, 10);
};

const Relatives: React.FC = () => {
  const { data: relativesResponse, isLoading, isError } = usePatientRelatives({
    page: 1,
    limit: 50,
  });
  const { data: relationshipsResponse } = useRelationships({
    page: 1,
    limit: 50,
  });
  const createMutation = useCreatePatientRelative();
  const updateMutation = useUpdatePatientRelative();
  const deleteMutation = useDeletePatientRelative();
  const [form, setForm] = useState<RelativesFormState>(defaultFormState);

  const relatives = relativesResponse?.data.relatives ?? [];
  const relationships = relationshipsResponse?.data.relationships ?? [];
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
    if (!form.fullname || !form.relationship_code || !form.phone || !form.dob) {
      toast.error("Vui lòng nhập đầy đủ họ tên, quan hệ, ngày sinh và số điện thoại.");
      return;
    }

    const payload = {
      fullname: form.fullname,
      relationship_code: form.relationship_code,
      phone: form.phone,
      dob: form.dob,
      gender: form.gender === "true",
    };

    if (form.id) {
      updateMutation.mutate(
        { relativeId: form.id, data: payload },
        {
          onSuccess: () => {
            toast.success("Đã cập nhật thông tin người thân.");
            resetForm();
          },
          onError: () => toast.error("Không thể cập nhật người thân."),
        },
      );
      return;
    }

    createMutation.mutate(payload, {
      onSuccess: () => {
        toast.success("Đã thêm người thân.");
        resetForm();
      },
      onError: () => toast.error("Không thể thêm người thân."),
    });
  };

  const handleEdit = (relative: Relative) => {
    setForm({
      id: relative.id,
      fullname: relative.fullname ?? "",
      relationship_code: relative.relationship.relationship_code,
      dob: toDateInputValue(relative.dob),
      gender: relative.gender ? "true" : "false",
      phone: relative.phone ?? "",
    });
  };

  const handleDelete = (relativeId: number) => {
    deleteMutation.mutate(relativeId, {
      onSuccess: () => {
        toast.info("Đã xóa người thân khỏi danh sách.");
        if (form.id === relativeId) resetForm();
      },
      onError: () => toast.error("Không thể xóa người thân."),
    });
  };

  return (
    <div className="grid gap-4 xl:grid-cols-[1.2fr_1fr]">
      <Card className="border-primary/15 py-5">
        <CardHeader className="px-5">
          <CardTitle className="text-lg">Danh sách người thân</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 px-5">
          {isLoading ? (
            <div className="rounded-xl border border-slate-200 p-5 text-sm text-slate-600">
              Đang tải danh sách người thân...
            </div>
          ) : isError ? (
            <div className="rounded-xl border border-red-200 p-5 text-sm text-red-600">
              Không thể tải danh sách người thân.
            </div>
          ) : relatives.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 p-5 text-center text-sm text-slate-500">
              Chưa có người thân nào.
            </div>
          ) : (
            relatives.map((relative) => (
              <div
                key={relative.id}
                className="rounded-xl border border-slate-200 bg-white p-4"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="space-y-1">
                    <p className="font-semibold text-slate-900">
                      {relative.fullname}
                    </p>
                    <p className="text-sm text-slate-600">
                      {relative.relationship.relationship_name} |{" "}
                      {relative.gender ? "Nam" : "Nữ"}
                    </p>
                    <p className="text-sm text-slate-600">
                      Ngày sinh: {relative.dob}
                    </p>
                    <p className="text-sm text-slate-600">
                      SĐT: {relative.phone}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={() => handleEdit(relative)}
                    >
                      <Pencil className="h-4 w-4" />
                      Sửa
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="gap-2"
                      disabled={deleteMutation.isPending}
                      onClick={() => handleDelete(relative.id)}
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
            {isEditing ? "Cập nhật người thân" : "Thêm người thân"}
          </CardTitle>
        </CardHeader>
        <CardContent className="px-5">
          <form className="space-y-3" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="dependentName">Họ và tên</Label>
              <Input
                id="dependentName"
                value={form.fullname}
                onChange={(event) =>
                  handleChange("fullname", event.target.value)
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dependentRelationship">Mối quan hệ</Label>
              <select
                id="dependentRelationship"
                value={form.relationship_code}
                onChange={(event) =>
                  handleChange("relationship_code", event.target.value)
                }
                className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
              >
                <option value="">Chọn mối quan hệ</option>
                {relationships.map((relationship) => (
                  <option
                    key={relationship.relationship_code}
                    value={relationship.relationship_code}
                  >
                    {relationship.relationship_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dependentDateOfBirth">Ngày sinh</Label>
              <Input
                id="dependentDateOfBirth"
                type="date"
                value={form.dob}
                onChange={(event) => handleChange("dob", event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dependentGender">Giới tính</Label>
              <select
                id="dependentGender"
                value={form.gender}
                onChange={(event) => handleChange("gender", event.target.value)}
                className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
              >
                <option value="true">Nam</option>
                <option value="false">Nữ</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dependentPhone">Số điện thoại</Label>
              <Input
                id="dependentPhone"
                value={form.phone}
                onChange={(event) => handleChange("phone", event.target.value)}
              />
            </div>

            <div className="flex gap-2">
              <Button
                type="submit"
                className="gap-2"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
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
