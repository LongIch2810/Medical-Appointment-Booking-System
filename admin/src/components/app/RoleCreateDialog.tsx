import { useState, type ReactNode } from "react";

import { FormDialog, FormField } from "@/components/app/FormDialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useCreateRole } from "@/hooks/useRoles";
import { usePermission } from "@/hooks/usePermission";
import { PERMISSIONS } from "@/config/permissions";

import { PermissionGroupedPicker } from "./PermissionGroupedPicker";

type Props = {
  trigger: ReactNode;
  allPermissions: { id: number; name: string }[];
};

export function RoleCreateDialog({ trigger, allPermissions }: Props) {
  const createRole = useCreateRole();
  const { can } = usePermission();
  const canCreate = can(PERMISSIONS.ROLE_CREATE, PERMISSIONS.ROLE_MANAGE);
  const [roleName, setRoleName] = useState("");
  const [roleCode, setRoleCode] = useState("");
  const [description, setDescription] = useState("");
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<Set<number>>(new Set());
  const [error, setError] = useState("");

  if (!canCreate) return null;

  const resetForm = () => {
    setRoleName("");
    setRoleCode("");
    setDescription("");
    setSelectedPermissionIds(new Set());
    setError("");
  };

  const handleSubmit = async () => {
    setError("");
    const name = roleName.trim();
    const code = Math.floor(Number(roleCode));
    const desc = description.trim();
    const ids = Array.from(selectedPermissionIds);

    if (!name || name.length < 3) { setError("Tên vai trò phải có ít nhất 3 ký tự"); throw new Error(); }
    if (!/^[a-zA-Z][a-zA-Z_]+$/.test(name)) { setError("Tên vai trò chỉ gồm chữ và dấu gạch dưới, bắt đầu bằng chữ"); throw new Error(); }
    if (!roleCode || isNaN(code)) { setError("Mã vai trò không hợp lệ"); throw new Error(); }
    if (!desc || desc.length < 20) { setError("Mô tả phải có ít nhất 20 ký tự"); throw new Error(); }
    if (ids.length === 0) { setError("Vui lòng chọn ít nhất một quyền"); throw new Error(); }

    try {
      await createRole.mutateAsync({
        role_name: name,
        role_code: code,
        description: desc,
        permission_ids: ids,
      });
    } catch (e) {
      if (e instanceof Error) setError(e.message);
      else setError("Có lỗi xảy ra khi tạo vai trò");
      throw e;
    }
  };

  return (
    <FormDialog
      trigger={trigger}
      title="Tạo vai trò mới"
      description="Tạo vai trò mới với danh sách quyền"
      submitLabel="Tạo vai trò"
      isSubmitting={createRole.isPending}
      onSubmit={handleSubmit}
      onOpen={resetForm}
      dialogClassName="max-w-3xl"
    >
      <div className="grid grid-cols-2 gap-x-4 gap-y-2">
        <FormField label="Tên vai trò" htmlFor="create-role-name" required>
          <Input
            id="create-role-name"
            value={roleName}
            onChange={(e) => setRoleName(e.target.value)}
            placeholder="VD: MANAGER"
          />
        </FormField>
        <FormField label="Mã vai trò" htmlFor="create-role-code" required>
          <Input
            id="create-role-code"
            type="number"
            value={roleCode}
            onChange={(e) => setRoleCode(e.target.value)}
            placeholder="VD: 10004"
          />
        </FormField>
      </div>
      <FormField label="Mô tả" htmlFor="create-role-desc" required>
        <Textarea
          id="create-role-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Mô tả vai trò (ít nhất 20 ký tự)"
        />
      </FormField>
      <FormField label="Danh sách quyền" required>
        <PermissionGroupedPicker
          permissions={allPermissions}
          value={selectedPermissionIds}
          onChange={setSelectedPermissionIds}
        />
      </FormField>
      {error && (
        <span className="text-xs text-rose-500">{error}</span>
      )}
    </FormDialog>
  );
}
