import { useQuery } from "@tanstack/react-query";

import { DataTable } from "@/components/app/DataTable";
import { KpiGrid } from "@/components/app/KpiGrid";
import { PageHeader } from "@/components/app/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { mockApi, queryKeys } from "@/services/mockApi";

export function GenericModulePage({ moduleId }: { moduleId: string }) {
  const { data } = useQuery({
    queryKey: queryKeys.module(moduleId),
    queryFn: () => mockApi.getModule(moduleId),
  });

  if (!data) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={data.statusLabel}
        title={data.title}
        description={data.description}
        actions={data.quickActions}
      />

      <KpiGrid metrics={data.metrics} />

      <Card className="border-dashed">
        <CardContent className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1">
            <div className="text-xs uppercase tracking-[0.2em] text-slate-400">
              Backend mapping
            </div>
            <div className="text-sm font-semibold text-slate-900">
              {data.backendModule ?? "Pending module mapping"}
            </div>
            <p className="text-sm text-slate-500">{data.integrationNote}</p>
          </div>
          <Badge variant="outline">Mock data / pending integration</Badge>
        </CardContent>
      </Card>

      <DataTable module={data} />
    </div>
  );
}
