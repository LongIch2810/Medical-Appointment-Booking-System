import { CalendarRange, CheckCircle2, ListFilter, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ReportAssistantPlan } from "@/types/interface/adminReport.interface";

function formatDate(value: string) {
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}

export function ReportAssistantPlanCard({
  plan,
  messageId,
  isPending,
  onConfirm,
}: {
  plan: ReportAssistantPlan;
  messageId: number;
  isPending: boolean;
  onConfirm: (messageId: number) => void;
}) {
  return (
    <section className="mt-3 rounded-2xl border border-primary/25 bg-primary/5 p-4 dark:bg-primary/10" aria-labelledby={`report-plan-${messageId}`}>
      <div className="flex items-start gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Sparkles className="size-4" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 id={`report-plan-${messageId}`} className="font-semibold text-slate-900 dark:text-slate-100">{plan.title}</h3>
          <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{plan.objective}</p>
        </div>
      </div>
      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
        <div className="flex gap-2 rounded-xl bg-white/70 p-3 dark:bg-slate-950/40">
          <CalendarRange className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
          <div>
            <dt className="font-medium text-slate-800 dark:text-slate-200">Thời gian</dt>
            <dd className="mt-0.5 text-slate-600 dark:text-slate-400">{formatDate(plan.fromDate)} – {formatDate(plan.toDate)}</dd>
            {plan.comparisonFromDate && plan.comparisonToDate ? (
              <dd className="mt-1 text-xs text-slate-500 dark:text-slate-500">
                So sánh: {formatDate(plan.comparisonFromDate)} – {formatDate(plan.comparisonToDate)}
              </dd>
            ) : null}
          </div>
        </div>
        <div className="flex gap-2 rounded-xl bg-white/70 p-3 dark:bg-slate-950/40">
          <ListFilter className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
          <div><dt className="font-medium text-slate-800 dark:text-slate-200">Phân nhóm</dt><dd className="mt-0.5 text-slate-600 dark:text-slate-400">{plan.groupBy.length ? plan.groupBy.join(", ") : "Tổng hợp"}</dd></div>
        </div>
      </dl>
      {plan.metrics.length ? <p className="mt-3 text-sm text-slate-600 dark:text-slate-400"><span className="font-medium text-slate-800 dark:text-slate-200">Chỉ số:</span> {plan.metrics.join(", ")}</p> : null}
      <div className="mt-3 space-y-2 text-sm">
        <p className="text-slate-600 dark:text-slate-400">
          <span className="font-medium text-slate-800 dark:text-slate-200">Câu hỏi dữ liệu:</span> {plan.query}
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-500">
          Nguồn dự kiến: {plan.sourceViews.map((view) => view.replace(/^chatbot_report_/, "").replace(/_view$/, "").replace(/_/g, " ")).join(", ")}
        </p>
      </div>
      {plan.chartType || plan.detailLevel ? (
        <p className="mt-3 text-xs text-muted-foreground">
          Trình bày: {plan.chartType ?? "AUTO"} · {plan.detailLevel ?? "STANDARD"}
        </p>
      ) : null}
      {plan.appliedPreferences && Object.keys(plan.appliedPreferences).length > 0 ? (
        <p className="mt-3 rounded-lg border border-border/70 px-3 py-2 text-xs text-muted-foreground">
          Sở thích đã áp dụng: {Object.entries(plan.appliedPreferences)
            .filter(([, value]) => value !== undefined && value !== "AUTO" && value !== "STANDARD" && value !== "NONE")
            .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(", ") : value}`)
            .join(" · ")}
        </p>
      ) : null}
      <Button
        type="button"
        className="mt-4 min-h-11 w-full sm:w-auto"
        disabled={isPending}
        onClick={() => onConfirm(messageId)}
      >
        <CheckCircle2 className="size-4" aria-hidden="true" />
        {isPending ? "Đang tạo báo cáo…" : "Xác nhận và tạo báo cáo"}
      </Button>
    </section>
  );
}
