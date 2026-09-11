import { useMemo, useState, type ReactNode } from "react";

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
  "flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 shadow-2xs outline-none transition-all placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100";

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
  const rawRoles = useMemo(
    () => rolesQuery.data?.data?.roles ?? [],
    [rolesQuery.data?.data?.roles],
  );
  const roles = useMemo(() => {
    return rawRoles.filter((r) => r.role_name?.toUpperCase() !== "PATIENT");
  }, [rawRoles]);

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
      description="Tạo tài khoản quản trị hoặc bác sĩ với vai trò tùy chỉnh theo chuẩn hệ thống"
      submitLabel="Tạo tài khoản"
      isSubmitting={createUser.isPending}
      onSubmit={handleSubmit}
      dialogClassName="max-w-3xl"
    >
      <div className="flex flex-col gap-1">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          1. Thông tin đăng nhập
        </span>
        <Separator className="bg-slate-100 dark:bg-slate-800" />
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-3">
        <FormField label="Tên đăng nhập (Username)" htmlFor="create-username" required>
          <Input
            id="create-username"
            value={form.username}
            onChange={(e) => update("username", e.target.value)}
            placeholder="vd: doctor.an"
          />
        </FormField>
        <FormField label="Email" htmlFor="create-email" required>
          <Input
            id="create-email"
            type="email"
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
            placeholder="doctor.an@lifehealth.vn"
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

      <div className="flex flex-col gap-1 pt-2">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          2. Thông tin cá nhân
        </span>
        <Separator className="bg-slate-100 dark:bg-slate-800" />
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-3">
        <FormField label="Họ và tên" htmlFor="create-fullname" required>
          <Input
            id="create-fullname"
            value={form.fullname}
            onChange={(e) => update("fullname", e.target.value)}
            placeholder="BS. Nguyễn Văn An"
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
          <div className="flex gap-5 h-10 items-center">
            <label className="flex items-center gap-2 text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200 cursor-pointer">
              <input
                type="radio"
                name="create-gender"
                value="male"
                checked={form.gender === "male"}
                onChange={() => update("gender", "male")}
                className="accent-primary"
              />
              Nam
            </label>
            <label className="flex items-center gap-2 text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200 cursor-pointer">
              <input
                type="radio"
                name="create-gender"
                value="female"
                checked={form.gender === "female"}
                onChange={() => update("gender", "female")}
                className="accent-primary"
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
              placeholder="Quận 1, TP. Hồ Chí Minh"
            />
          </FormField>
        </div>
      </div>

      <div className="flex flex-col gap-1 pt-2">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          3. Trạng thái &amp; Vai trò (RBAC)
        </span>
        <Separator className="bg-slate-100 dark:border-slate-800" />
      </div>
      <div className="flex items-center gap-6">
        <label className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 cursor-pointer">
          <input
            type="checkbox"
            checked={form.is_active}
            onChange={(e) => update("is_active", e.target.checked)}
            className="accent-primary size-4"
          />
          Kích hoạt ngay
        </label>
        <label className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 cursor-pointer">
          <input
            type="checkbox"
            checked={form.is_locking}
            onChange={(e) => update("is_locking", e.target.checked)}
            className="accent-rose-600 size-4"
          />
          Khóa tài khoản
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
              className={`inline-flex cursor-pointer items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition-all ${
                selected
                  ? "!bg-primary !text-primary-foreground !border-primary shadow-xs"
                  : "border-slate-200 bg-white text-slate-600 hover:border-primary/40 hover:text-primary dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
              }`}
            >
              {role.role_name}
            </button>
          );
        })}
      </div>
      {selectedRoleNames.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedRoleNames.map((name) => (
            <Badge key={name} variant="outline" className="text-[10px] font-bold">
              {name}
            </Badge>
          ))}
        </div>
      )}

      {hasDoctorRole && (
        <>
          <div className="flex flex-col gap-1 pt-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              4. Thông tin chuyên môn bác sĩ
            </span>
            <Separator className="bg-slate-100 dark:bg-slate-800" />
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-3">
            <FormField label="Chuyên khoa" htmlFor="create-doctor-specialty" required>
              <select
                id="create-doctor-specialty"
                value={form.doctor_specialty_id}
                onChange={(e) => update("doctor_specialty_id", e.target.value)}
                className={inputClass}
              >
                <option value="">-- Chọn chuyên khoa --</option>
                {specialties.map((spec) => (
                  <option key={spec.id} value={spec.id}>
                    {spec.name}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="Cấp bậc / Danh hiệu" htmlFor="create-doctor-level" required>
              <select
                id="create-doctor-level"
                value={form.doctor_level}
                onChange={(e) => update("doctor_level", e.target.value)}
                className={inputClass}
              >
                <option value="">-- Chọn danh hiệu --</option>
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
                placeholder="vd: 10"
              />
            </FormField>
            <FormField label="Nơi công tác" htmlFor="create-doctor-workplace" required>
              <Input
                id="create-doctor-workplace"
                value={form.doctor_workplace}
                onChange={(e) => update("doctor_workplace", e.target.value)}
                placeholder="Bệnh viện Chợ Rẫy / Phòng khám LifeHealth"
              />
            </FormField>
            <div className="col-span-2">
              <FormField label="Giới thiệu chuyên môn" htmlFor="create-doctor-about">
                <Textarea
                  id="create-doctor-about"
                  value={form.doctor_about_me}
                  onChange={(e) => update("doctor_about_me", e.target.value)}
                  placeholder="Mô tả quá trình đào tạo và chuyên môn lâm sàng..."
                  className="rounded-xl border-slate-200 dark:border-slate-800"
                />
              </FormField>
            </div>
          </div>
        </>
      )}

      {hasError && (
        <span className="text-xs font-semibold text-rose-500">
          ⚠️ Có lỗi xảy ra khi tạo người dùng. Vui lòng kiểm tra lại.
        </span>
      )}
    </FormDialog>
  );
}
