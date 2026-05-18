import { useQuery } from "@tanstack/react-query";

import { KpiGrid } from "@/components/app/KpiGrid";
import { PageHeader } from "@/components/app/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { mockApi, queryKeys } from "@/services/mockApi";

export function RolePermissionPage() {
  const { data: module } = useQuery({
    queryKey: queryKeys.module("role-permissions"),
    queryFn: () => mockApi.getModule("role-permissions"),
  });
  const { data } = useQuery({
    queryKey: queryKeys.rolePermission,
    queryFn: () => mockApi.getRolePermissions(),
  });

  if (!module || !data) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Governance"
        title={module.title}
        description={module.description}
        actions={module.quickActions}
      />

      <KpiGrid metrics={module.metrics} />

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Permission groups</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.groups.map((group) => (
              <div key={group.id} className="rounded-lg border border-[#d9d9dd] bg-white p-5">
                <div className="text-sm font-medium text-[#212121]">{group.label}</div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {group.permissions.map((permission) => (
                    <Badge key={permission.code} variant="outline">
                      {permission.label}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Role matrix</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.matrix.map((role) => (
              <div key={role.role} className="rounded-lg border border-[#d9d9dd] bg-white p-5">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-lg font-medium text-[#212121]">
                    {role.label}
                  </div>
                  <Badge variant="info">{role.grants.length} permissions</Badge>
                </div>
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  {role.grants.map((grant) => (
                    <div
                      key={grant}
                      className="rounded-sm border border-[#d9d9dd] bg-[#f7f6f2] px-3 py-2 text-sm text-[#212121]"
                    >
                      {grant}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
