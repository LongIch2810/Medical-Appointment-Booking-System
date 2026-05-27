import { useState, type ReactNode } from "react";

import { FormDialog, FormField } from "@/components/app/FormDialog";
import { useUpdateRolePermissions } from "@/hooks/useRoles";
import { usePermission } from "@/hooks/usePermission";
import { PERMISSIONS } from "@/config/permissions";

import { PermissionGroupedPicker } from "./PermissionGroupedPicker";

import type { RolePermissionMatrixRoleDto } from "@/types/interface/rolePermission.interface";

type Props = {
  trigger: ReactNode;
  role: RolePermissionMatrixRoleDto;
  allPermissions: { id: number; name: string }[];
};

export function RolePermissionsAddDialog({ trigger, role, allPermissions }: Props) {
  const updatePermissions = useUpdateRolePermissions();
  const { can } = usePermission();
  const canUpdate = can(PERMISSIONS.ROLE_PERMISSION_UPDATE, PERMISSIONS.ROLE_PERMISSION_MANAGE);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [error, setError] = useState("");

  if (!canUpdate) return null;

  const existingIds = new Set(role.permission_ids);

  const resetForm = () => {
    setSelectedIds(new Set());
    setError("");
  };

  const handleSubmit = async () => {
    setError("");
    const ids = Array.from(selectedIds);
    if (ids.length === 0) {
      setError("Vui lòng chọn ít nhất một quyền để thêm");
      throw new Error();
    }

    try {
      await updatePermissions.mutateAsync({
        roleId: role.id,
        payload: { permission_ids: ids },
      });
    } catch (e) {
      if (e instanceof Error) setError(e.message);
      else setError("Có lỗi xảy ra khi thêm quyền");
      throw e;
    }
  };

  return (
    <FormDialog
      trigger={trigger}
      title={`Thêm quyền: ${role.role_name}`}
      description="Chọn quyền muốn thêm cho vai trò này"
      submitLabel="Thêm quyền"
      isSubmitting={updatePermissions.isPending}
      onSubmit={handleSubmit}
      onOpen={resetForm}
      dialogClassName="max-w-3xl"
    >
      <FormField label="Danh sách quyền" required>
        <PermissionGroupedPicker
          permissions={allPermissions}
          value={selectedIds}
          onChange={setSelectedIds}
          excludeIds={existingIds}
        />
      </FormField>
      {error && (
        <span className="text-xs text-rose-500">{error}</span>
      )}
    </FormDialog>
  );
}
