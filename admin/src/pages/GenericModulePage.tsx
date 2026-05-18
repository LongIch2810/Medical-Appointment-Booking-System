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

      <Card className="rounded-lg border-dashed border-[#d9d9dd] bg-[#f7f6f2]">
        <CardContent className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1">
            <div className="mono-label text-[10px] text-[#75758a]">
              Backend mapping
            </div>
            <div className="text-sm font-medium text-[#212121]">
              {data.backendModule ?? "Pending module mapping"}
            </div>
            <p className="text-sm text-[#75758a]">{data.integrationNote}</p>
          </div>
          <Badge variant="outline">Mock data / pending integration</Badge>
        </CardContent>
      </Card>

      <DataTable module={data} />
    </div>
  );
}
