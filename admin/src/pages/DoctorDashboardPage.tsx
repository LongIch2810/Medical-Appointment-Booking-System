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
        actions={["Open today schedule", "View messages", "Review records"]}
      />

      <KpiGrid metrics={data.metrics} />

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="dark-product-field rounded-[22px] border-transparent text-white">
          <CardContent className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="mono-label text-[10px] text-white/50">
                  Focus blocks
                </div>
                <div className="mt-1 text-2xl font-medium">
                  Doctor workbench
                </div>
              </div>
              <BellDot className="size-5 text-white/70" />
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {data.focusCards.map((card, index) => {
                const Icon = icons[index % icons.length];
                return (
                  <div key={card.label} className="rounded-lg border border-white/[0.15] bg-white/[0.1] p-4">
                    <Icon className="size-5 text-white/80" />
                    <div className="mt-4 font-display text-4xl font-medium leading-none">{card.value}</div>
                    <div className="mt-2 text-sm font-medium">{card.label}</div>
                    <div className="mt-2 text-sm text-white/60">{card.hint}</div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Today schedule</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.schedule.map((item) => (
              <div key={item.id} className="flex gap-4 rounded-lg border border-[#d9d9dd] bg-white p-4">
                <div className={`mt-1 size-3 rounded-full ${item.accent}`} />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-[#212121]">
                    {item.title}
                  </div>
                  <div className="mt-1 text-sm text-[#75758a]">{item.time}</div>
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
            <div key={item.id} className="rounded-lg border border-[#d9d9dd] bg-white p-5">
              <Badge variant={item.tone ?? "default"}>{item.time}</Badge>
              <div className="mt-4 text-base font-medium text-[#212121]">
                {item.title}
              </div>
              <div className="mt-2 text-sm leading-6 text-[#75758a]">
                {item.description}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
