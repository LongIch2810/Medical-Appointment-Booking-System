import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/app/ErrorState";
import { LoadingState } from "@/components/app/LoadingState";
import { PageHeader } from "@/components/app/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useRolePermissionMatrix } from "@/hooks/useRolePermission";
import { usePermission } from "@/hooks/usePermission";
import { PERMISSIONS } from "@/config/permissions";

import { RoleCreateDialog } from "@/components/app/RoleCreateDialog";
import { RoleEditDialog } from "@/components/app/RoleEditDialog";
import { RolePermissionsAddDialog } from "@/components/app/RolePermissionsAddDialog";
import { RolePermissionsRemoveDialog } from "@/components/app/RolePermissionsRemoveDialog";

export function RolePermissionPage() {
  const { data, isLoading, isError, refetch } = useRolePermissionMatrix();
  const { can } = usePermission();
  const [search, setSearch] = useState("");

  const matrix = data?.data;

  const permissionsById = useMemo(() => {
    const map = new Map<number, string>();
    matrix?.permissions.forEach((permission) => {
      map.set(permission.id, permission.name);
    });
    return map;
  }, [matrix]);

  const filteredPermissions = useMemo(() => {
    if (!matrix) return [];
    const term = search.trim().toLowerCase();
    if (!term) return matrix.permissions;
    return matrix.permissions.filter((permission) =>
      permission.name.toLowerCase().includes(term),
    );
  }, [matrix, search]);

  const canCreate = can(PERMISSIONS.ROLE_CREATE, PERMISSIONS.ROLE_MANAGE);
  const canEdit = can(PERMISSIONS.ROLE_UPDATE, PERMISSIONS.ROLE_MANAGE);
  const canManagePermissions = can(
    PERMISSIONS.ROLE_PERMISSION_UPDATE,
    PERMISSIONS.ROLE_PERMISSION_MANAGE,
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Governance"
          title="Phân quyền vai trò"
          description="Đang tải ma trận role - permission từ backend."
        />
        <LoadingState />
      </div>
    );
  }

  if (isError || !matrix) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Governance"
          title="Phân quyền vai trò"
          description="Không thể tải ma trận quyền."
        />
        <ErrorState onRetry={() => refetch()} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Governance"
        title="Phân quyền vai trò"
        description="Bảng quyền chuẩn theo backend role-permission/matrix. Hỗ trợ rà soát role hiện tại và quyền cấu hình."
        extra={
          canCreate && (
            <RoleCreateDialog
              trigger={<Button variant="default">+ Tạo vai trò</Button>}
              allPermissions={matrix.permissions}
            />
          )
        }
      />

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <CardHeader className="space-y-3">
            <CardTitle>Permission catalog</CardTitle>
            <Input
              placeholder="Tìm permission theo mã..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </CardHeader>
          <CardContent className="space-y-2">
            {filteredPermissions.length === 0 ? (
              <p className="text-sm text-[#75758a]">
                Không có permission nào khớp từ khóa.
              </p>
            ) : (
              <div className="grid gap-2 md:grid-cols-2">
                {filteredPermissions.map((permission) => (
                  <Badge
                    key={permission.id}
                    variant="outline"
                    className="justify-start"
                  >
                    {permission.name}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Role matrix</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {matrix.roles.length === 0 ? (
              <p className="text-sm text-[#75758a]">
                Hệ thống chưa có vai trò nào.
              </p>
            ) : (
              matrix.roles.map((role) => (
                <div
                  key={role.id}
                  className="rounded-lg border border-[#d9d9dd] bg-white p-5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="text-lg font-medium text-[#212121]">
                        {role.role_name}
                      </div>
                      {role.description ? (
                        <div className="mt-1 text-sm text-[#75758a]">
                          {role.description}
                        </div>
                      ) : null}
                    </div>
                    <Badge variant="info">
                      {role.permission_ids.length} permissions
                    </Badge>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {canEdit && (
                      <RoleEditDialog
                        trigger={
                          <Button variant="outline" size="sm">
                            Sửa thông tin
                          </Button>
                        }
                        role={role}
                      />
                    )}
                    {canManagePermissions && (
                      <RolePermissionsAddDialog
                        trigger={
                          <Button variant="outline" size="sm">
                            + Thêm quyền
                          </Button>
                        }
                        role={role}
                        allPermissions={matrix.permissions}
                      />
                    )}
                    {canManagePermissions && (
                      <RolePermissionsRemoveDialog
                        trigger={
                          <Button variant="outline" size="sm">
                            - Bỏ quyền
                          </Button>
                        }
                        role={role}
                        allPermissions={matrix.permissions}
                      />
                    )}
                  </div>

                  <div className="mt-4 grid gap-2 sm:grid-cols-2">
                    {role.permission_ids.length === 0 ? (
                      <div className="text-sm text-[#75758a]">
                        Vai trò này chưa được gán quyền.
                      </div>
                    ) : (
                      role.permission_ids.map((permissionId) => (
                        <div
                          key={permissionId}
                          className="rounded-sm border border-[#d9d9dd] bg-[#f7f6f2] px-3 py-2 text-sm text-[#212121]"
                        >
                          {permissionsById.get(permissionId) ??
                            `permission#${permissionId}`}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
