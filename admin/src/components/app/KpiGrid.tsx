import { TrendingUp } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { KpiMetric } from "@/types/app";

const toneMap = {
  default: "default",
  success: "success",
  warning: "warning",
  danger: "danger",
  info: "info",
} as const;

export function KpiGrid({ metrics }: { metrics: KpiMetric[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {metrics.map((metric) => (
        <Card key={metric.label} className="rounded-lg border-[#d9d9dd]">
          <CardContent className="space-y-4">
            <div className="flex items-start justify-between">
              <p className="text-sm text-[#75758a]">{metric.label}</p>
              <span className="rounded-full border border-[#d9d9dd] p-2 text-[#75758a]">
                <TrendingUp className="size-4" />
              </span>
            </div>
            <div className="space-y-1">
              <div className="font-display text-4xl font-medium leading-none text-[#212121]">
                {metric.value}
              </div>
              <Badge variant={toneMap[metric.tone ?? "default"]}>
                {metric.delta}
              </Badge>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
