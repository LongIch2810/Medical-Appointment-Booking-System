import { useEffect, useState, type ReactNode } from "react";

import { FormDialog, FormField } from "@/components/app/FormDialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useUpdateRole } from "@/hooks/useRoles";
import { usePermission } from "@/hooks/usePermission";
import { PERMISSIONS } from "@/config/permissions";

import type { RolePermissionMatrixRoleDto } from "@/types/interface/rolePermission.interface";

type Props = {
  trigger: ReactNode;
  role: RolePermissionMatrixRoleDto;
};

export function RoleEditDialog({ trigger, role }: Props) {
  const updateRole = useUpdateRole();
  const { can } = usePermission();
  const canUpdate = can(PERMISSIONS.ROLE_UPDATE, PERMISSIONS.ROLE_MANAGE);
  const [roleName, setRoleName] = useState("");
  const [roleCode, setRoleCode] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setRoleName(role.role_name);
    setRoleCode(String(role.role_code ?? ""));
    setDescription(role.description ?? "");
    setError("");
  }, [role]);

  if (!canUpdate) return null;

  const handleSubmit = async () => {
    setError("");
    const payload: Record<string, string | number> = {};
    const name = (roleName || "").toString().trim();
    const desc = (description || "").toString().trim();
    const codeRaw = (roleCode ?? "").toString().trim();

    if (name && name !== role.role_name) payload.role_name = name;
    if (codeRaw) payload.role_code = Number(codeRaw);
    if (desc && desc !== (role.description ?? "")) payload.description = desc;

    if (!Object.keys(payload).length) {
      setError("Không có thông tin nào được thay đổi");
      throw new Error();
    }

    try {
      await updateRole.mutateAsync({ roleId: role.id, payload });
    } catch (e) {
      if (e instanceof Error) setError(e.message);
      else setError("Có lỗi xảy ra khi cập nhật vai trò");
      throw e;
    }
  };

  return (
    <FormDialog
      trigger={trigger}
      title={`Sửa vai trò: ${role.role_name}`}
      description="Cập nhật thông tin vai trò"
      submitLabel="Lưu thay đổi"
      isSubmitting={updateRole.isPending}
      onSubmit={handleSubmit}
      dialogClassName="max-w-xl"
    >
      <FormField label="Tên vai trò" htmlFor="edit-role-name">
        <Input
          id="edit-role-name"
          value={roleName}
          onChange={(e) => setRoleName(e.target.value)}
        />
      </FormField>
      <FormField label="Mã vai trò" htmlFor="edit-role-code">
        <Input
          id="edit-role-code"
          value={roleCode}
          onChange={(e) => setRoleCode(e.target.value)}
        />
      </FormField>
      <FormField label="Mô tả" htmlFor="edit-role-desc">
        <Textarea
          id="edit-role-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </FormField>
      {error && (
        <span className="text-xs text-rose-500">{error}</span>
      )}
    </FormDialog>
  );
}
