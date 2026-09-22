import {
  CalendarRange,
  CheckCircle2,
  Database,
  Eye,
  FileSpreadsheet,
  ListFilter,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ReportAssistantPlan } from "@/types/interface/adminReport.interface";

function formatDate(value: string) {
  if (!value) return "";
  const parts = value.split("-");
  if (parts.length === 3) {
    const [year, month, day] = parts;
    return `${day}/${month}/${year}`;
  }
  return value;
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
  const formattedSourceViews = plan.sourceViews
    .map((view) =>
      view
        .replace(/^chatbot_report_/, "")
        .replace(/_view$/, "")
        .replace(/_/g, " "),
    )
    .join(", ");

  return (
    <section
      className="mt-4 rounded-2xl border-2 border-primary/30 bg-card p-4 sm:p-5 shadow-xs transition-colors dark:border-primary/40"
      aria-labelledby={`report-plan-${messageId}`}
    >
      {/* Header checkpoint */}
      <div className="flex items-start gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Sparkles className="size-4.5" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
              Kế hoạch báo cáo đề xuất
            </span>
            <span className="text-xs text-slate-400">· Cần phê duyệt</span>
          </div>
          <h3
            id={`report-plan-${messageId}`}
            className="mt-1 text-base font-bold text-slate-900 dark:text-slate-100"
          >
            {plan.title}
          </h3>
          <p className="mt-1 text-xs sm:text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            {plan.objective}
          </p>
        </div>
      </div>

      {/* Structured specifications with hairline dividers */}
      <div className="mt-4 divide-y divide-slate-100 border-y border-slate-200/80 dark:divide-slate-800 dark:border-slate-800 text-xs sm:text-sm">
        {/* Row 1: Time range & comparison */}
        <div className="grid gap-2 py-3 sm:grid-cols-3">
          <span className="flex items-center gap-1.5 font-medium text-slate-500 dark:text-slate-400">
            <CalendarRange className="size-4 text-primary shrink-0" aria-hidden="true" />
            Khung thời gian
          </span>
          <div className="sm:col-span-2 text-slate-800 dark:text-slate-200">
            <span className="font-semibold">
              {formatDate(plan.fromDate)} – {formatDate(plan.toDate)}
            </span>
            {plan.comparisonFromDate && plan.comparisonToDate ? (
              <span className="ml-2 text-xs text-slate-500">
                (Kỳ so sánh: {formatDate(plan.comparisonFromDate)} – {formatDate(plan.comparisonToDate)})
              </span>
            ) : null}
          </div>
        </div>

        {/* Row 2: Metrics & Group By */}
        <div className="grid gap-2 py-3 sm:grid-cols-3">
          <span className="flex items-center gap-1.5 font-medium text-slate-500 dark:text-slate-400">
            <ListFilter className="size-4 text-primary shrink-0" aria-hidden="true" />
            Chỉ số & Phân nhóm
          </span>
          <div className="sm:col-span-2 space-y-1.5 text-slate-800 dark:text-slate-200">
            <div>
              <span className="text-slate-500 dark:text-slate-400 text-xs">Chỉ số: </span>
              <span className="font-semibold">
                {plan.metrics.length ? plan.metrics.join(", ") : "Tổng quan"}
              </span>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400 text-xs">Phân nhóm: </span>
              <span className="font-semibold">
                {plan.groupBy.length ? plan.groupBy.join(", ") : "Toàn bộ hệ thống"}
              </span>
            </div>
          </div>
        </div>

        {/* Row 3: Query & Data sources */}
        <div className="grid gap-2 py-3 sm:grid-cols-3">
          <span className="flex items-center gap-1.5 font-medium text-slate-500 dark:text-slate-400">
            <Database className="size-4 text-primary shrink-0" aria-hidden="true" />
            Nguồn dữ liệu
          </span>
          <div className="sm:col-span-2 space-y-1 text-slate-800 dark:text-slate-200">
            <p className="font-medium text-slate-700 dark:text-slate-300">
              {plan.query}
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              Bảng dữ liệu: {formattedSourceViews || "Dữ liệu báo cáo tổng hợp"}
            </p>
          </div>
        </div>

        {/* Row 4: Visual & Detail */}
        {(plan.chartType || plan.detailLevel) && (
          <div className="grid gap-2 py-3 sm:grid-cols-3">
            <span className="flex items-center gap-1.5 font-medium text-slate-500 dark:text-slate-400">
              <Eye className="size-4 text-primary shrink-0" aria-hidden="true" />
              Định dạng báo cáo
            </span>
            <div className="sm:col-span-2 flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
              <span className="rounded bg-slate-100 px-2 py-1 dark:bg-slate-800">
                Biểu đồ: {plan.chartType ?? "AUTO"}
              </span>
              <span className="rounded bg-slate-100 px-2 py-1 dark:bg-slate-800">
                Mức độ chi tiết: {plan.detailLevel ?? "STANDARD"}
              </span>
            </div>
          </div>
        )}

        {/* Row 5: Preferences */}
        {plan.appliedPreferences && Object.keys(plan.appliedPreferences).length > 0 && (
          <div className="grid gap-2 py-3 sm:grid-cols-3">
            <span className="flex items-center gap-1.5 font-medium text-slate-500 dark:text-slate-400">
              <FileSpreadsheet className="size-4 text-primary shrink-0" aria-hidden="true" />
              Tùy chọn đã lưu
            </span>
            <div className="sm:col-span-2 text-xs text-slate-600 dark:text-slate-400">
              {Object.entries(plan.appliedPreferences)
                .filter(
                  ([, value]) =>
                    value !== undefined &&
                    value !== "AUTO" &&
                    value !== "STANDARD" &&
                    value !== "NONE",
                )
                .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(", ") : value}`)
                .join(" · ")}
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Actions */}
      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <Button
          type="button"
          className="min-h-11 w-full sm:w-auto font-bold gap-2 text-primary-foreground shadow-xs cursor-pointer"
          disabled={isPending}
          onClick={() => onConfirm(messageId)}
        >
          <CheckCircle2 className="size-4" aria-hidden="true" />
          {isPending ? "Đang tạo báo cáo…" : "Xác nhận và tạo báo cáo"}
        </Button>
        <span className="text-[11px] text-slate-400 dark:text-slate-500">
          * Nếu muốn thay đổi tham số, bạn có thể nhắn tiếp yêu cầu cho trợ lý.
        </span>
      </div>
    </section>
  );
}

