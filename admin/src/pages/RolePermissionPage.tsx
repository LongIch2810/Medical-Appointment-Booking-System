import { useMemo, useState } from "react";
import {
  Check,
  ChevronDown,
  ChevronUp,
  Grid,
  Layers,
  Lock,
  Minus,
  Search,
  ShieldAlert,
  ShieldCheck,
  SlidersHorizontal,
  Table as TableIcon,
} from "lucide-react";

import { ErrorState } from "@/components/app/ErrorState";
import { LoadingState } from "@/components/app/LoadingState";
import { PageHeader } from "@/components/app/PageHeader";
import { RoleCreateDialog } from "@/components/app/RoleCreateDialog";
import { RoleEditDialog } from "@/components/app/RoleEditDialog";
import { RolePermissionsAddDialog } from "@/components/app/RolePermissionsAddDialog";
import { RolePermissionsRemoveDialog } from "@/components/app/RolePermissionsRemoveDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PERMISSIONS } from "@/config/permissions";
import { usePermission } from "@/hooks/usePermission";
import { useRolePermissionMatrix } from "@/hooks/useRolePermission";
import { groupPermissions } from "@/lib/permission-grouping";

export function RolePermissionPage() {
  const { data, isLoading, isError, refetch } = useRolePermissionMatrix();
  const { can } = usePermission();

  const [activeTab, setActiveTab] = useState<"cards" | "matrix" | "catalog">(
    "cards"
  );
  const [search, setSearch] = useState("");
  const [expandedRoles, setExpandedRoles] = useState<Record<string | number, boolean>>({});

  const matrix = data?.data;

  const permissionsById = useMemo(() => {
    const map = new Map<number, string>();
    matrix?.permissions.forEach((permission) => {
      map.set(permission.id, permission.name);
    });
    return map;
  }, [matrix]);

  const groupedCatalog = useMemo(() => {
    if (!matrix?.permissions) return [];
    return groupPermissions(matrix.permissions);
  }, [matrix?.permissions]);

  const filteredPermissions = useMemo(() => {
    if (!matrix) return [];
    const term = search.trim().toLowerCase();
    if (!term) return matrix.permissions;
    return matrix.permissions.filter((permission) =>
      permission.name.toLowerCase().includes(term)
    );
  }, [matrix, search]);

  const toggleRoleExpand = (roleId: string | number) => {
    setExpandedRoles((prev) => ({
      ...prev,
      [roleId]: !prev[roleId],
    }));
  };

  const canCreate = can(PERMISSIONS.ROLE_CREATE, PERMISSIONS.ROLE_MANAGE);
  const canEdit = can(PERMISSIONS.ROLE_UPDATE, PERMISSIONS.ROLE_MANAGE);
  const canManagePermissions = can(
    PERMISSIONS.ROLE_PERMISSION_UPDATE,
    PERMISSIONS.ROLE_PERMISSION_MANAGE
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

  const totalRoles = matrix.roles.length;
  const totalPermissions = matrix.permissions.length;

  return (
    <div className="space-y-8">
      {/* Header & Main Actions */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <PageHeader
          eyebrow="Governance & Security"
          title="Trung tâm Quản trị Phân quyền (RBAC)"
          description="Rà soát ma trận Vai trò - Quyền hạn chuẩn RBAC backend. Kiểm soát phân quyền và cấp phép chi tiết."
          extra={
            canCreate && (
              <RoleCreateDialog
                trigger={
                  <Button variant="default" className="gap-2 rounded-xl font-bold shadow-xs">
                    + Tạo vai trò mới
                  </Button>
                }
                allPermissions={matrix.permissions}
              />
            )
          }
        />
      </div>

      {/* KPI Stats Bar */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="rounded-3xl border-slate-200/80 bg-white p-5 shadow-2xs transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Tổng Vai trò</p>
              <p className="font-display text-3xl font-extrabold text-slate-900 dark:text-slate-100 mt-1">
                {totalRoles}
              </p>
            </div>
            <span className="rounded-2xl bg-emerald-100 p-2.5 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
              <ShieldCheck className="size-5" />
            </span>
          </div>
          <p className="mt-2 text-[11px] font-medium text-slate-500 dark:text-slate-400">
            {matrix.roles.map((r) => r.role_name).join(", ")}
          </p>
        </Card>

        <Card className="rounded-3xl border-slate-200/80 bg-white p-5 shadow-2xs transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Quyền hệ thống</p>
              <p className="font-display text-3xl font-extrabold text-slate-900 dark:text-slate-100 mt-1">
                {totalPermissions}
              </p>
            </div>
            <span className="rounded-2xl bg-sky-100 p-2.5 text-sky-700 dark:bg-sky-950/60 dark:text-sky-400">
              <Lock className="size-5" />
            </span>
          </div>
          <p className="mt-2 text-[11px] font-medium text-slate-500 dark:text-slate-400">
            Phân loại trong {groupedCatalog.length} nhóm chức năng
          </p>
        </Card>

        <Card className="rounded-3xl border-slate-200/80 bg-white p-5 shadow-2xs transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Mô hình Bảo mật</p>
              <p className="font-display text-xl font-bold text-slate-900 dark:text-slate-100 mt-1">
                RBAC Matrix
              </p>
            </div>
            <span className="rounded-2xl bg-teal-100 p-2.5 text-teal-700 dark:bg-teal-950/60 dark:text-teal-400">
              <ShieldAlert className="size-5" />
            </span>
          </div>
          <p className="mt-2 text-[11px] font-medium text-slate-500 dark:text-slate-400">
            Cấp phép chuẩn theo từng hành động (API Route &amp; Endpoint)
          </p>
        </Card>
      </div>

      {/* Mode Tabs & Search Toolbar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/80 pb-4 dark:border-slate-800">
        <div className="flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
          <button
            onClick={() => setActiveTab("cards")}
            className={`flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
              activeTab === "cards"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
            }`}
          >
            <Grid className="size-3.5" /> Thẻ Vai trò ({totalRoles})
          </button>
          <button
            onClick={() => setActiveTab("matrix")}
            className={`flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
              activeTab === "matrix"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
            }`}
          >
            <TableIcon className="size-3.5" /> Ma trận Đối chiếu
          </button>
          <button
            onClick={() => setActiveTab("catalog")}
            className={`flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
              activeTab === "catalog"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
            }`}
          >
            <Layers className="size-3.5" /> Danh mục ({totalPermissions})
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Tìm theo tên quyền (vd: doctor, user)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-10 rounded-xl"
          />
        </div>
      </div>

      {/* TAB 1: Role Cards & Management View */}
      {activeTab === "cards" && (
        <div className="grid gap-6 items-start md:grid-cols-2">
          {matrix.roles.map((role) => {
            const rolePermissions = role.permission_ids
              .map((id) => ({ id, name: permissionsById.get(id) ?? `perm#${id}` }))
              .filter((p) =>
                search
                  ? p.name.toLowerCase().includes(search.toLowerCase())
                  : true
              );
            const groupedRolePerms = groupPermissions(rolePermissions);
            const isExpanded = expandedRoles[role.id] ?? false;

            return (
              <Card
                key={role.id}
                className="flex flex-col rounded-3xl border-slate-200/80 bg-white shadow-2xs transition-all hover:shadow-md dark:border-slate-800 dark:bg-slate-900 p-6"
              >
                <CardHeader className="space-y-3 p-0 pb-4 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                        {role.role_name}
                      </CardTitle>
                      {role.description ? (
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                          {role.description}
                        </p>
                      ) : null}
                    </div>
                    <Badge variant="info" className="shrink-0 text-xs font-bold">
                      {role.permission_ids.length} quyền
                    </Badge>
                  </div>

                  {/* Actions toolbar for Role */}
                  <div className="flex flex-wrap gap-2 pt-2">
                    {canEdit && (
                      <RoleEditDialog
                        trigger={
                          <Button variant="outline" size="sm" className="h-8 text-xs rounded-xl font-semibold">
                            Sửa tên &amp; mô tả
                          </Button>
                        }
                        role={role}
                      />
                    )}
                    {canManagePermissions && (
                      <RolePermissionsAddDialog
                        trigger={
                          <Button variant="outline" size="sm" className="h-8 text-xs rounded-xl font-semibold text-teal-700 dark:text-teal-400 hover:border-teal-300">
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
                          <Button variant="outline" size="sm" className="h-8 text-xs rounded-xl font-semibold text-rose-600 hover:text-rose-700 hover:border-rose-300">
                            - Bỏ quyền
                          </Button>
                        }
                        role={role}
                        allPermissions={matrix.permissions}
                      />
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-4 p-0 pt-4">
                  {role.permission_ids.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-200 p-4 text-center text-xs text-slate-400 dark:border-slate-800 dark:text-slate-400">
                      Vai trò này hiện chưa được gán quyền hạn nào.
                    </div>
                  ) : (
                    <div className="space-y-3.5">
                      {groupedRolePerms.slice(0, isExpanded ? undefined : 3).map((group) => (
                        <div key={group.name} className="space-y-1.5">
                          <div className="mono-label text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            {group.label} ({group.permissions.length})
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {group.permissions.map((p) => (
                              <Badge
                                key={p.id}
                                variant="outline"
                                className="text-[11px] font-medium border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300"
                              >
                                {p.name}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      ))}

                      {groupedRolePerms.length > 3 ? (
                        <button
                          onClick={() => toggleRoleExpand(role.id)}
                          className="flex items-center gap-1 text-xs font-bold text-primary hover:underline pt-1 cursor-pointer"
                        >
                          {isExpanded ? (
                            <>
                              <ChevronUp className="size-3.5" /> Thu gọn nhóm quyền
                            </>
                          ) : (
                            <>
                              <ChevronDown className="size-3.5" /> Xem thêm {groupedRolePerms.length - 3} nhóm quyền khác...
                            </>
                          )}
                        </button>
                      ) : null}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* TAB 2: Security Matrix Table View */}
      {activeTab === "matrix" && (
        <Card className="rounded-3xl border-slate-200/80 bg-white shadow-2xs dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
          <CardHeader className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800">
            <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <SlidersHorizontal className="size-4.5 text-primary" />
              <span>Bảng Ma trận Đối chiếu Vai trò - Quyền hạn</span>
            </CardTitle>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              So sánh trực quan các quyền được gán giữa các vai trò trong hệ thống.
            </p>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <div className="max-h-[600px] overflow-y-auto scrollbar-soft">
              <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800 text-left">
                <thead className="sticky top-0 z-10 bg-slate-50/90 backdrop-blur-xs dark:bg-slate-950/90">
                  <tr>
                    <th className="mono-label px-4 py-3.5 text-[11px] font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                      Mã Quyền hạn (Permission Name)
                    </th>
                    {matrix.roles.map((role) => (
                      <th
                        key={role.id}
                        className="mono-label px-4 py-3.5 text-center text-[11px] font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider"
                      >
                        {role.role_name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 bg-white dark:bg-slate-900">
                  {filteredPermissions.length === 0 ? (
                    <tr>
                      <td
                        colSpan={matrix.roles.length + 1}
                        className="p-8 text-center text-sm text-slate-500 dark:text-slate-400"
                      >
                        Không có quyền nào khớp từ khóa &quot;{search}&quot;.
                      </td>
                    </tr>
                  ) : (
                    filteredPermissions.map((permission) => (
                      <tr
                        key={permission.id}
                        className="transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/50"
                      >
                        <td className="px-4 py-3 text-xs font-mono font-semibold text-slate-900 dark:text-slate-100">
                          {permission.name}
                        </td>
                        {matrix.roles.map((role) => {
                          const hasPerm = role.permission_ids.includes(
                            permission.id
                          );
                          return (
                            <td
                              key={role.id}
                              className="px-4 py-3 text-center align-middle"
                            >
                              {hasPerm ? (
                                <span className="inline-flex size-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 shadow-2xs">
                                  <Check className="size-3.5 stroke-[2.5]" />
                                </span>
                              ) : (
                                <span className="inline-flex size-6 items-center justify-center text-slate-300 dark:text-slate-700">
                                  <Minus className="size-3.5" />
                                </span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* TAB 3: Permission Catalog View */}
      {activeTab === "catalog" && (
        <div className="space-y-6">
          <div className="grid gap-6 items-start md:grid-cols-2">
            {groupedCatalog.map((group) => {
              const filteredGroupPerms = group.permissions.filter((p) =>
                search ? p.name.toLowerCase().includes(search.toLowerCase()) : true
              );
              if (filteredGroupPerms.length === 0) return null;

              return (
                <Card
                  key={group.name}
                  className="rounded-3xl border-slate-200/80 bg-white p-6 shadow-2xs dark:border-slate-800 dark:bg-slate-900"
                >
                  <CardHeader className="p-0 pb-4 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100">
                        {group.label}
                      </CardTitle>
                      <Badge variant={group.badgeTone} className="text-xs font-bold">
                        {filteredGroupPerms.length} permissions
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0 pt-4 space-y-2">
                    <div className="grid gap-2 sm:grid-cols-2">
                      {filteredGroupPerms.map((permission) => (
                        <div
                          key={permission.id}
                          className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/70 px-3 py-2 text-xs font-mono text-slate-800 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-200"
                        >
                          <span className="truncate">{permission.name}</span>
                          <span className="text-[10px] text-slate-400 dark:text-slate-400 shrink-0 ml-1">#{permission.id}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

