import { useState, type ReactNode } from "react";

import { FormDialog, FormField } from "@/components/app/FormDialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useCreateUser } from "@/hooks/useUsers";
import { useRoles } from "@/hooks/useRoles";
import { useSpecialties } from "@/hooks/useSpecialties";
import type { DoctorLevel } from "@/types/interface/api.interface";

const DOCTOR_LEVEL_OPTIONS: { value: DoctorLevel; label: string }[] = [
  { value: "Bác sĩ đa khoa", label: "Bác sĩ đa khoa" },
  { value: "Bác sĩ chuyên khoa I", label: "Bác sĩ chuyên khoa I" },
  { value: "Bác sĩ chuyên khoa II", label: "Bác sĩ chuyên khoa II" },
  { value: "Thạc sĩ", label: "Thạc sĩ" },
  { value: "Tiến sĩ", label: "Tiến sĩ" },
  { value: "Phó Giáo sư", label: "Phó Giáo sư" },
  { value: "Giáo sư", label: "Giáo sư" },
];

const inputClass =
  "flex h-10 w-full rounded-sm border border-border bg-white px-3 py-2 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus-visible:border-[#9b60aa] focus-visible:ring-2 focus-visible:ring-[#9b60aa]/20";

type FormState = {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  fullname: string;
  phone: string;
  gender: string;
  date_of_birth: string;
  address: string;
  is_active: boolean;
  is_locking: boolean;
  selectedRoleIds: Set<number>;
  doctor_specialty_id: string;
  doctor_experience: string;
  doctor_workplace: string;
  doctor_level: string;
  doctor_about_me: string;
};

const initialState: FormState = {
  username: "",
  email: "",
  password: "",
  confirmPassword: "",
  fullname: "",
  phone: "",
  gender: "male",
  date_of_birth: "",
  address: "",
  is_active: true,
  is_locking: false,
  selectedRoleIds: new Set(),
  doctor_specialty_id: "",
  doctor_experience: "",
  doctor_workplace: "",
  doctor_level: "",
  doctor_about_me: "",
};

export function UserCreateDialog({ trigger }: { trigger: ReactNode }) {
  const [form, setForm] = useState<FormState>(initialState);
  const createUser = useCreateUser();

  const rolesQuery = useRoles({
    page: 1,
    limit: 100,
    search: "",
    arrange: "asc",
  });
  const roles = rolesQuery.data?.data?.roles ?? [];

  const specialtiesQuery = useSpecialties({
    page: 1,
    limit: 100,
    search: "",
    arrange: "asc",
  });
  const specialties = specialtiesQuery.data?.data?.specialties ?? [];

  const selectedRoleNames = roles
    .filter((r) => form.selectedRoleIds.has(r.id))
    .map((r) => r.role_name);

  const hasDoctorRole = selectedRoleNames.includes("DOCTOR");

  const toggleRole = (roleId: number) => {
    setForm((prev) => {
      const next = new Set(prev.selectedRoleIds);
      if (next.has(roleId)) {
        next.delete(roleId);
      } else {
        next.add(roleId);
      }
      return { ...prev, selectedRoleIds: next };
    });
  };

  const update = <K extends keyof FormState>(
    key: K,
    value: FormState[K],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    if (!form.selectedRoleIds.size) {
      throw new Error("Vui lòng chọn ít nhất một vai trò");
    }
    if (form.password !== form.confirmPassword) {
      throw new Error("Mật khẩu xác nhận không khớp");
    }

    const payload: Parameters<typeof createUser.mutateAsync>[0] = {
      username: form.username.trim(),
      email: form.email.trim(),
      password: form.password,
      fullname: form.fullname.trim(),
      is_active: form.is_active,
      is_locking: form.is_locking,
      role_ids: Array.from(form.selectedRoleIds),
    };
    if (form.phone.trim()) payload.phone = form.phone.trim();
    if (form.gender) payload.gender = form.gender === "male";
    if (form.date_of_birth) payload.date_of_birth = form.date_of_birth;
    if (form.address.trim()) payload.address = form.address.trim();

    if (hasDoctorRole) {
      if (
        !form.doctor_specialty_id ||
        !form.doctor_experience ||
        !form.doctor_workplace.trim() ||
        !form.doctor_level
      ) {
        throw new Error(
          "Vui lòng nhập đầy đủ thông tin bác sĩ (chuyên khoa, kinh nghiệm, nơi công tác, cấp bậc)",
        );
      }
      payload.doctor = {
        specialty_id: Number(form.doctor_specialty_id),
        experience: Number(form.doctor_experience),
        workplace: form.doctor_workplace.trim(),
        doctor_level: form.doctor_level as DoctorLevel,
        about_me: form.doctor_about_me.trim() || " ",
      };
    }

    await createUser.mutateAsync(payload);
  };

  const hasError = createUser.isError;

  return (
    <FormDialog
      trigger={trigger}
      title="Tạo người dùng mới"
      description="Tạo tài khoản với vai trò tùy chỉnh"
      submitLabel="Tạo người dùng"
      isSubmitting={createUser.isPending}
      onSubmit={handleSubmit}
      dialogClassName="max-w-3xl"
    >
      <div className="flex flex-col gap-1">
        <span className="text-xs font-medium text-[#212121]">
          Thông tin tài khoản
        </span>
        <Separator />
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-2">
        <FormField label="Username" htmlFor="create-username" required>
          <Input
            id="create-username"
            value={form.username}
            onChange={(e) => update("username", e.target.value)}
            placeholder="username"
          />
        </FormField>
        <FormField label="Email" htmlFor="create-email" required>
          <Input
            id="create-email"
            type="email"
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
            placeholder="email@example.com"
          />
        </FormField>
        <FormField label="Mật khẩu" htmlFor="create-password" required>
          <Input
            id="create-password"
            type="password"
            value={form.password}
            onChange={(e) => update("password", e.target.value)}
            placeholder="••••••••"
          />
        </FormField>
        <FormField label="Xác nhận mật khẩu" htmlFor="create-confirm-password" required>
          <Input
            id="create-confirm-password"
            type="password"
            value={form.confirmPassword}
            onChange={(e) => update("confirmPassword", e.target.value)}
            placeholder="••••••••"
          />
        </FormField>
      </div>

      <div className="flex flex-col gap-1 pt-1">
        <span className="text-xs font-medium text-[#212121]">
          Thông tin cá nhân
        </span>
        <Separator />
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-2">
        <FormField label="Họ tên" htmlFor="create-fullname" required>
          <Input
            id="create-fullname"
            value={form.fullname}
            onChange={(e) => update("fullname", e.target.value)}
            placeholder="Nguyễn Văn A"
          />
        </FormField>
        <FormField label="Số điện thoại" htmlFor="create-phone">
          <Input
            id="create-phone"
            value={form.phone}
            onChange={(e) => update("phone", e.target.value)}
            placeholder="0912345678"
          />
        </FormField>
        <FormField label="Giới tính">
          <div className="flex gap-4 h-10 items-center">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="create-gender"
                value="male"
                checked={form.gender === "male"}
                onChange={() => update("gender", "male")}
                className="accent-[#9b60aa]"
              />
              Nam
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="create-gender"
                value="female"
                checked={form.gender === "female"}
                onChange={() => update("gender", "female")}
                className="accent-[#9b60aa]"
              />
              Nữ
            </label>
          </div>
        </FormField>
        <FormField label="Ngày sinh" htmlFor="create-dob">
          <input
            id="create-dob"
            type="date"
            value={form.date_of_birth}
            onChange={(e) => update("date_of_birth", e.target.value)}
            className={inputClass}
          />
        </FormField>
        <div className="col-span-2">
          <FormField label="Địa chỉ" htmlFor="create-address">
            <Input
              id="create-address"
              value={form.address}
              onChange={(e) => update("address", e.target.value)}
              placeholder="Địa chỉ"
            />
          </FormField>
        </div>
      </div>

      <div className="flex flex-col gap-1 pt-1">
        <span className="text-xs font-medium text-[#212121]">
          Trạng thái & Vai trò
        </span>
        <Separator />
      </div>
      <div className="flex items-center gap-6">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.is_active}
            onChange={(e) => update("is_active", e.target.checked)}
            className="accent-[#9b60aa]"
          />
          Kích hoạt
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.is_locking}
            onChange={(e) => update("is_locking", e.target.checked)}
            className="accent-[#9b60aa]"
          />
          Khóa
        </label>
      </div>
      <div className="flex flex-wrap gap-2">
        {roles.map((role) => {
          const selected = form.selectedRoleIds.has(role.id);
          return (
            <button
              key={role.id}
              type="button"
              onClick={() => toggleRole(role.id)}
              className={`inline-flex cursor-pointer items-center gap-1.5 rounded-sm border px-3 py-1.5 text-xs font-medium transition-colors ${
                selected
                  ? "border-[#9b60aa] bg-[#9b60aa] text-white"
                  : "border-[#d9d9dd] bg-white text-[#75758a] hover:border-[#9b60aa] hover:text-[#9b60aa]"
              }`}
            >
              {role.role_name}
            </button>
          );
        })}
      </div>
      {selectedRoleNames.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selectedRoleNames.map((name) => (
            <Badge key={name} variant="outline" className="text-[10px]">
              {name}
            </Badge>
          ))}
        </div>
      )}

      {hasDoctorRole && (
        <>
          <div className="flex flex-col gap-1 pt-1">
            <span className="text-xs font-medium text-[#212121]">
              Thông tin bác sĩ
            </span>
            <Separator />
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2">
            <FormField label="Chuyên khoa" htmlFor="create-doctor-specialty" required>
              <select
                id="create-doctor-specialty"
                value={form.doctor_specialty_id}
                onChange={(e) => update("doctor_specialty_id", e.target.value)}
                className={inputClass}
              >
                <option value="">-- Chọn --</option>
                {specialties.map((spec) => (
                  <option key={spec.id} value={spec.id}>
                    {spec.name}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="Cấp bậc" htmlFor="create-doctor-level" required>
              <select
                id="create-doctor-level"
                value={form.doctor_level}
                onChange={(e) => update("doctor_level", e.target.value)}
                className={inputClass}
              >
                <option value="">-- Chọn --</option>
                {DOCTOR_LEVEL_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="Kinh nghiệm (năm)" htmlFor="create-doctor-exp">
              <Input
                id="create-doctor-exp"
                type="number"
                min={0}
                value={form.doctor_experience}
                onChange={(e) => update("doctor_experience", e.target.value)}
                placeholder="0"
              />
            </FormField>
            <FormField label="Nơi công tác" htmlFor="create-doctor-workplace" required>
              <Input
                id="create-doctor-workplace"
                value={form.doctor_workplace}
                onChange={(e) => update("doctor_workplace", e.target.value)}
                placeholder="Bệnh viện / Phòng khám"
              />
            </FormField>
            <div className="col-span-2">
              <FormField label="Giới thiệu" htmlFor="create-doctor-about">
                <Textarea
                  id="create-doctor-about"
                  value={form.doctor_about_me}
                  onChange={(e) => update("doctor_about_me", e.target.value)}
                  placeholder="Thông tin giới thiệu về bác sĩ"
                />
              </FormField>
            </div>
          </div>
        </>
      )}

      {hasError && (
        <span className="text-xs text-rose-500">
          Có lỗi xảy ra khi tạo người dùng
        </span>
      )}
    </FormDialog>
  );
}
