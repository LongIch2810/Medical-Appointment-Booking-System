import React, { useMemo, useState } from "react";
import {
  Cake,
  HeartHandshake,
  Loader2,
  Pencil,
  Phone,
  Trash2,
  UserPlus,
  UsersRound,
  X,
} from "lucide-react";
import { toast } from "react-toastify";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useCreatePatientRelative,
  useDeletePatientRelative,
  usePatientRelatives,
  useRelationships,
  useUpdatePatientRelative,
} from "@/hooks/usePatientPortalApi";
import { cn } from "@/lib/utils";
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

const getInitial = (name?: string | null) =>
  (name ?? "").trim().charAt(0).toUpperCase() || "?";

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
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

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
    if (!form.fullname || !form.relationship_code || !form.dob) {
      toast.error("Vui lòng nhập họ tên, mối quan hệ và ngày sinh.");
      return;
    }

    const trimmedPhone = form.phone.trim();
    const payload = {
      fullname: form.fullname,
      relationship_code: form.relationship_code,
      dob: form.dob,
      gender: form.gender === "true",
      ...(trimmedPhone ? { phone: trimmedPhone } : {}),
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
    <div className="grid gap-4 xl:grid-cols-[1.3fr_1fr]">
      <Card className="border-slate-200 py-0 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <UsersRound className="h-4 w-4" />
            </span>
            <CardTitle className="text-base font-semibold text-slate-900">
              Danh sách người thân
            </CardTitle>
          </div>
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
            {relatives.length} người
          </span>
        </CardHeader>
        <CardContent className="space-y-3 px-5 py-5">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, idx) => (
                <Skeleton key={idx} className="h-24 rounded-xl" />
              ))}
            </div>
          ) : isError ? (
            <div className="rounded-xl border border-red-200 bg-red-50/50 p-5 text-sm text-red-600">
              Không thể tải danh sách người thân.
            </div>
          ) : relatives.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/50 p-8 text-center">
              <UsersRound className="mx-auto mb-2 h-8 w-8 text-slate-400" />
              <p className="text-sm font-medium text-slate-600">
                Chưa có người thân nào.
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Thêm người thân để dễ dàng đặt lịch khám cho họ.
              </p>
            </div>
          ) : (
            relatives.map((relative) => {
              const isActive = form.id === relative.id;
              return (
                <div
                  key={relative.id}
                  className={cn(
                    "rounded-xl border p-4 transition-all",
                    isActive
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-slate-200 bg-white hover:border-primary/30 hover:shadow-sm",
                  )}
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex flex-1 items-center gap-3">
                      <Avatar className="h-12 w-12 border border-slate-200">
                        <AvatarFallback
                          className={cn(
                            "text-sm font-bold",
                            relative.gender
                              ? "bg-sky-100 text-sky-700"
                              : "bg-rose-100 text-rose-700",
                          )}
                        >
                          {getInitial(relative.fullname)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-bold text-slate-900">
                            {relative.fullname}
                          </p>
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold",
                              relative.gender
                                ? "bg-sky-100 text-sky-700"
                                : "bg-rose-100 text-rose-700",
                            )}
                          >
                            {relative.gender ? "Nam" : "Nữ"}
                          </span>
                          <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2 py-0.5 text-[11px] font-semibold text-violet-700">
                            <HeartHandshake className="h-3 w-3" />
                            {relative.relationship.relationship_name}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                          <span className="inline-flex items-center gap-1">
                            <Cake className="h-3.5 w-3.5" />
                            {relative.dob}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Phone className="h-3.5 w-3.5" />
                            {relative.phone}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5"
                        onClick={() => handleEdit(relative)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Sửa
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="gap-1.5"
                        disabled={deleteMutation.isPending}
                        onClick={() => handleDelete(relative.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Xóa
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      <Card className="border-slate-200 py-0 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-xl",
                isEditing
                  ? "bg-amber-100 text-amber-700"
                  : "bg-emerald-100 text-emerald-700",
              )}
            >
              {isEditing ? (
                <Pencil className="h-4 w-4" />
              ) : (
                <UserPlus className="h-4 w-4" />
              )}
            </span>
            <CardTitle className="text-base font-semibold text-slate-900">
              {isEditing ? "Cập nhật người thân" : "Thêm người thân mới"}
            </CardTitle>
          </div>
          {isEditing && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="gap-1.5 text-slate-500 hover:text-slate-900"
              onClick={resetForm}
            >
              <X className="h-3.5 w-3.5" />
              Hủy
            </Button>
          )}
        </CardHeader>
        <CardContent className="px-5 py-5">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="dependentName" className="text-sm font-semibold">
                Họ và tên
              </Label>
              <Input
                id="dependentName"
                value={form.fullname}
                onChange={(event) =>
                  handleChange("fullname", event.target.value)
                }
                placeholder="Nguyễn Văn A"
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="dependentRelationship"
                className="text-sm font-semibold"
              >
                Mối quan hệ
              </Label>
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

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label
                  htmlFor="dependentDateOfBirth"
                  className="text-sm font-semibold"
                >
                  Ngày sinh
                </Label>
                <Input
                  id="dependentDateOfBirth"
                  type="date"
                  value={form.dob}
                  onChange={(event) => handleChange("dob", event.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="dependentGender"
                  className="text-sm font-semibold"
                >
                  Giới tính
                </Label>
                <select
                  id="dependentGender"
                  value={form.gender}
                  onChange={(event) =>
                    handleChange("gender", event.target.value)
                  }
                  className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                >
                  <option value="true">Nam</option>
                  <option value="false">Nữ</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dependentPhone" className="text-sm font-semibold">
                Số điện thoại
              </Label>
              <Input
                id="dependentPhone"
                value={form.phone}
                onChange={(event) => handleChange("phone", event.target.value)}
                placeholder="0901234567"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                type="submit"
                className="flex-1 gap-2"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Đang lưu...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4" />
                    {isEditing ? "Lưu cập nhật" : "Thêm mới"}
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={resetForm}
                disabled={isSubmitting}
              >
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
