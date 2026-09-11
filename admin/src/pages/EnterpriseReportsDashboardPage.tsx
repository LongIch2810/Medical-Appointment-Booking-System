import { EmptyState } from "@/components/app/EmptyState";
import { ErrorState } from "@/components/app/ErrorState";
import { LoadingState } from "@/components/app/LoadingState";
import { PageHeader } from "@/components/app/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEnterpriseReportGroups } from "@/hooks/useEnterpriseReports";

export function EnterpriseReportsDashboardPage() {
  const { data, isLoading, isError, refetch } = useEnterpriseReportGroups();

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Admin reports"
        title="Báo cáo Doanh nghiệp"
        description="Danh mục các nhóm báo cáo quản trị toàn diện cho mô hình phòng khám — vận hành đặt lịch, hiệu suất bác sĩ, người dùng/hồ sơ sức khỏe và tài chính."
      />

      {isLoading ? (
        <LoadingState label="Đang tải danh mục báo cáo..." />
      ) : isError ? (
        <ErrorState
          title="Không thể tải danh mục báo cáo"
          onRetry={() => refetch()}
        />
      ) : !data || data.length === 0 ? (
        <EmptyState
          title="Chưa có nhóm báo cáo nào"
          description="Danh mục báo cáo doanh nghiệp hiện chưa được cấu hình."
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {data.map((group) => {
            const GroupIcon = group.icon;
            return (
              <Card key={group.id} className="rounded-3xl border-slate-200/80 bg-white p-6 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
                <CardHeader className="p-0 pb-4 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-start gap-3.5">
                    <span className="rounded-2xl bg-primary/10 p-2.5 text-primary dark:bg-emerald-950/60 dark:text-emerald-400 shrink-0">
                      <GroupIcon className="size-5" />
                    </span>
                    <div>
                      <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100">{group.title}</CardTitle>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                        {group.description}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0 pt-4 space-y-3">
                  {group.items.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 transition-all hover:bg-slate-100/70 hover:border-slate-200 dark:border-slate-800/80 dark:bg-slate-950/60 dark:hover:bg-slate-800/60"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                          {item.title}
                        </p>
                        <Badge variant="info" className="text-xs font-bold">{item.quickStat.value}</Badge>
                      </div>
                      <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                        {item.description}
                      </p>
                      <p className="mt-2 text-[11px] font-semibold text-slate-400 dark:text-slate-400">
                        {item.quickStat.label}
                      </p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

