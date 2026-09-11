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
        <Card key={metric.label} className="rounded-2xl border-slate-200/80 bg-white shadow-2xs dark:border-slate-800 dark:bg-slate-900">
          <CardContent className="space-y-4 p-5">
            <div className="flex items-start justify-between">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{metric.label}</p>
              <span className="rounded-full border border-slate-200 p-2 text-slate-400 dark:border-slate-800 dark:text-slate-400">
                <TrendingUp className="size-4" />
              </span>
            </div>
            <div className="space-y-1">
              <div className="font-display text-4xl font-extrabold leading-none text-slate-900 dark:text-slate-100">
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
