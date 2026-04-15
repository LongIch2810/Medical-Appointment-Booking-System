import { useQuery } from "@tanstack/react-query";
import { BellDot, Clock3, FileStack, MessageCircleHeart } from "lucide-react";

import { KpiGrid } from "@/components/app/KpiGrid";
import { PageHeader } from "@/components/app/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { mockApi, queryKeys } from "@/services/mockApi";

const icons = [Clock3, MessageCircleHeart, FileStack];

export function DoctorDashboardPage() {
  const { data } = useQuery({
    queryKey: queryKeys.dashboard("doctor"),
    queryFn: () => mockApi.getDashboard("doctor"),
  });

  if (!data) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Doctor dashboard"
        title={data.heroTitle}
        description={data.heroDescription}
        actions={["Mở lịch hôm nay", "Xem messages", "Review records"]}
      />

      <KpiGrid metrics={data.metrics} />

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="border-slate-200 bg-slate-950 text-white">
          <CardContent className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs uppercase tracking-[0.2em] text-white/50">
                  Focus blocks
                </div>
                <div className="mt-1 text-2xl font-semibold">
                  Doctor workbench
                </div>
              </div>
              <BellDot className="size-5 text-white/70" />
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {data.focusCards.map((card, index) => {
                const Icon = icons[index % icons.length];
                return (
                  <div key={card.label} className="rounded-[1.4rem] bg-white/10 p-4">
                    <Icon className="size-5 text-white/80" />
                    <div className="mt-4 text-3xl font-bold">{card.value}</div>
                    <div className="mt-1 text-sm font-semibold">{card.label}</div>
                    <div className="mt-2 text-sm text-white/60">{card.hint}</div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Lịch trong ngày</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.schedule.map((item) => (
              <div key={item.id} className="flex gap-4 rounded-2xl border border-slate-100 bg-white/80 p-4">
                <div className={`mt-1 size-3 rounded-full ${item.accent}`} />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-slate-900">
                    {item.title}
                  </div>
                  <div className="mt-1 text-sm text-slate-500">{item.time}</div>
                </div>
                <Badge variant="outline">{item.status}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent activity</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-3">
          {data.activity.map((item) => (
            <div key={item.id} className="rounded-[1.4rem] border border-slate-100 bg-white/80 p-5">
              <Badge variant={item.tone ?? "default"}>{item.time}</Badge>
              <div className="mt-4 text-base font-semibold text-slate-900">
                {item.title}
              </div>
              <div className="mt-2 text-sm leading-6 text-slate-500">
                {item.description}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
