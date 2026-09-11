import { useState, type ReactNode } from "react";

import { FormDialog, FormField } from "@/components/app/FormDialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useUpdateUser } from "@/hooks/useUsers";
import type { UpdateUserFieldsPayload, User } from "@/types/interface/user.interface";

type FormState = {
  fullname: string;
  phone: string;
  gender: boolean;
  date_of_birth: string;
  address: string;
};

function toFormState(user: User): FormState {
  return {
    fullname: user.fullname,
    phone: user.phone ?? "",
    gender: user.gender,
    date_of_birth: user.date_of_birth?.slice(0, 10) ?? "",
    address: user.address ?? "",
  };
}

export function UserEditDialog({
  trigger,
  user,
}: {
  trigger: ReactNode;
  user: User;
}) {
  const updateUser = useUpdateUser();
  const [form, setForm] = useState<FormState>(() => toFormState(user));

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = () => {
    const payload: UpdateUserFieldsPayload = {
      fullname: form.fullname.trim(),
      phone: form.phone.trim() || undefined,
      gender: form.gender,
      date_of_birth: form.date_of_birth || undefined,
      address: form.address.trim() || undefined,
    };

    return updateUser.mutateAsync({ userId: user.id, payload });
  };

  return (
    <FormDialog
      trigger={trigger}
      title={`Chỉnh sửa người dùng #${user.id}`}
      description="Cập nhật thông tin định danh cá nhân của tài khoản (Username & Email không thể thay đổi)."
      isSubmitting={updateUser.isPending}
      onOpen={() => setForm(toFormState(user))}
      onSubmit={handleSubmit}
      submitLabel="Lưu cập nhật"
    >
      <FormField label="Tên đăng nhập (Username)" htmlFor={`user-${user.id}-username`}>
        <Input id={`user-${user.id}-username`} value={user.username} disabled className="bg-slate-50 dark:bg-slate-800/60 opacity-80 cursor-not-allowed" />
      </FormField>
      <FormField label="Email" htmlFor={`user-${user.id}-email`}>
        <Input id={`user-${user.id}-email`} value={user.email} disabled className="bg-slate-50 dark:bg-slate-800/60 opacity-80 cursor-not-allowed" />
      </FormField>
      <FormField label="Họ và tên" htmlFor={`user-${user.id}-fullname`} required>
        <Input
          id={`user-${user.id}-fullname`}
          value={form.fullname}
          onChange={(event) => update("fullname", event.target.value)}
          required
        />
      </FormField>
      <FormField label="Số điện thoại" htmlFor={`user-${user.id}-phone`}>
        <Input
          id={`user-${user.id}-phone`}
          value={form.phone}
          onChange={(event) => update("phone", event.target.value)}
        />
      </FormField>
      <FormField label="Ngày sinh" htmlFor={`user-${user.id}-date-of-birth`}>
        <Input
          id={`user-${user.id}-date-of-birth`}
          type="date"
          value={form.date_of_birth}
          onChange={(event) => update("date_of_birth", event.target.value)}
        />
      </FormField>
      <FormField label="Giới tính" htmlFor={`user-${user.id}-gender`}>
        <select
          id={`user-${user.id}-gender`}
          className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 shadow-2xs outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
          value={String(form.gender)}
          onChange={(event) => update("gender", event.target.value === "true")}
        >
          <option value="true">Nam</option>
          <option value="false">Nữ</option>
        </select>
      </FormField>
      <FormField label="Địa chỉ cư trú" htmlFor={`user-${user.id}-address`}>
        <Textarea
          id={`user-${user.id}-address`}
          value={form.address}
          onChange={(event) => update("address", event.target.value)}
          className="rounded-xl border-slate-200 dark:border-slate-800"
        />
      </FormField>
    </FormDialog>
  );
}

