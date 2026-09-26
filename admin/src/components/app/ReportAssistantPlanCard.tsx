import { useState } from "react";
import {
  BarChart3,
  CalendarRange,
  CheckCircle2,
  ChevronDown,
  Database,
  FileCheck,
  Layers,
  ListFilter,
  ShieldCheck,
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

const METRIC_LABELS: Record<string, string> = {
  appointment_count: "Số lượt đặt khám",
  cancellation_count: "Số ca hủy lịch",
  cancellation_rate: "Tỷ lệ hủy lịch",
  completed_count: "Số ca khám hoàn thành",
  noshow_count: "Số ca vắng mặt (no-show)",
  fill_rate: "Tỷ lệ lấp đầy lịch bác sĩ",
  new_users: "Người dùng đăng ký mới",
  active_users: "Người dùng hoạt động",
};

const GROUP_BY_LABELS: Record<string, string> = {
  specialty_name: "Chuyên khoa khám",
  doctor_name: "Bác sĩ phụ trách",
  timeslot: "Khung giờ trong ngày",
  status: "Trạng thái lịch hẹn",
  day: "Theo từng ngày",
  week: "Theo tuần",
  month: "Theo tháng",
};

const CHART_TYPE_LABELS: Record<string, string> = {
  AUTO: "Tự động tối ưu theo dữ liệu",
  BAR: "Biểu đồ cột so sánh",
  LINE: "Biểu đồ đường xu hướng",
  PIE: "Biểu đồ tròn cơ cấu",
  TABLE: "Bảng dữ liệu tổng hợp",
};

const DETAIL_LEVEL_LABELS: Record<string, string> = {
  BRIEF: "Tóm lược chỉ số chính",
  STANDARD: "Tiêu chuẩn (Khuyến nghị)",
  DETAILED: "Chi tiết chuyên sâu",
};

function formatMetricLabel(metric: string): string {
  return METRIC_LABELS[metric] || metric.replace(/_/g, " ");
}

function formatGroupLabel(group: string): string {
  return GROUP_BY_LABELS[group] || group.replace(/_/g, " ");
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
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

  const formattedSourceViews = plan.sourceViews
    .map((view) =>
      view
        .replace(/^chatbot_report_/, "")
        .replace(/_view$/, "")
        .replace(/_/g, " "),
    )
    .join(", ");

  const chartLabel =
    CHART_TYPE_LABELS[plan.chartType ?? "AUTO"] ?? plan.chartType;
  const detailLabel =
    DETAIL_LEVEL_LABELS[plan.detailLevel ?? "STANDARD"] ?? plan.detailLevel;

  return (
    <section
      className="mt-3.5 rounded-2xl border-2 border-emerald-500/30 bg-emerald-50/20 p-4 sm:p-5 shadow-xs transition-colors dark:border-emerald-500/40 dark:bg-emerald-950/15"
      aria-labelledby={`report-plan-${messageId}`}
    >
      {/* Header checkpoint */}
      <div className="flex items-start gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">
          <FileCheck className="size-5" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:border-emerald-500/40 dark:text-emerald-300">
              <FileCheck className="size-3" aria-hidden="true" />
              Kế hoạch báo cáo chờ duyệt
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              Chưa chạy truy vấn cho đến khi bạn xác nhận
            </span>
          </div>
          <h3
            id={`report-plan-${messageId}`}
            className="mt-1.5 text-base font-bold text-slate-900 dark:text-slate-100"
          >
            {plan.title}
          </h3>
          <p className="mt-1 text-xs sm:text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            {plan.objective}
          </p>
        </div>
      </div>

      {/* Specifications grid: Easy to scan, no raw SQL */}
      <div className="mt-4 rounded-xl border border-slate-200/90 bg-white p-3.5 text-xs sm:text-sm divide-y divide-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:divide-slate-800">
        {/* Row 1: Time range & comparison */}
        <div className="grid gap-2 py-2.5 sm:grid-cols-3 first:pt-0">
          <span className="flex items-center gap-1.5 font-semibold text-slate-500 dark:text-slate-400">
            <CalendarRange
              className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0"
              aria-hidden="true"
            />
            Khung thời gian
          </span>
          <div className="sm:col-span-2 text-slate-900 dark:text-slate-100">
            <span className="font-bold text-slate-900 dark:text-slate-100">
              {formatDate(plan.fromDate)} – {formatDate(plan.toDate)}
            </span>
            {plan.comparisonFromDate && plan.comparisonToDate ? (
              <span className="ml-2 inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                So sánh kỳ: {formatDate(plan.comparisonFromDate)} –{" "}
                {formatDate(plan.comparisonToDate)}
              </span>
            ) : null}
          </div>
        </div>

        {/* Row 2: Metrics */}
        <div className="grid gap-2 py-2.5 sm:grid-cols-3">
          <span className="flex items-center gap-1.5 font-semibold text-slate-500 dark:text-slate-400">
            <ListFilter
              className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0"
              aria-hidden="true"
            />
            Chỉ số đo lường
          </span>
          <div className="sm:col-span-2 flex flex-wrap gap-1.5">
            {plan.metrics.length ? (
              plan.metrics.map((metric) => (
                <span
                  key={metric}
                  className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                >
                  {formatMetricLabel(metric)}
                </span>
              ))
            ) : (
              <span className="text-slate-500">Tổng quan toàn diện</span>
            )}
          </div>
        </div>

        {/* Row 3: Group By */}
        <div className="grid gap-2 py-2.5 sm:grid-cols-3">
          <span className="flex items-center gap-1.5 font-semibold text-slate-500 dark:text-slate-400">
            <Layers
              className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0"
              aria-hidden="true"
            />
            Phân nhóm dữ liệu
          </span>
          <div className="sm:col-span-2 flex flex-wrap gap-1.5">
            {plan.groupBy.length ? (
              plan.groupBy.map((group) => (
                <span
                  key={group}
                  className="rounded-md border border-emerald-500/20 bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-950/40 dark:text-emerald-200"
                >
                  {formatGroupLabel(group)}
                </span>
              ))
            ) : (
              <span className="text-slate-500">Toàn bộ hệ thống</span>
            )}
          </div>
        </div>

        {/* Row 4: Chart & Detail format */}
        <div className="grid gap-2 py-2.5 sm:grid-cols-3 last:pb-0">
          <span className="flex items-center gap-1.5 font-semibold text-slate-500 dark:text-slate-400">
            <BarChart3
              className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0"
              aria-hidden="true"
            />
            Định dạng xuất
          </span>
          <div className="sm:col-span-2 flex flex-wrap items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300">
            <span className="rounded bg-slate-100 px-2 py-0.5 dark:bg-slate-800">
              {chartLabel}
            </span>
            <span>·</span>
            <span className="rounded bg-slate-100 px-2 py-0.5 dark:bg-slate-800">
              Mức độ: {detailLabel}
            </span>
          </div>
        </div>
      </div>

      {/* Collapsible Technical Details: Keeps SQL/Internal names out of primary view */}
      <div className="mt-3">
        <button
          type="button"
          onClick={() => setShowTechnicalDetails((prev) => !prev)}
          className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors cursor-pointer"
          aria-expanded={showTechnicalDetails}
        >
          <ChevronDown
            className={`size-3.5 transition-transform duration-200 ${
              showTechnicalDetails ? "rotate-180" : ""
            }`}
            aria-hidden="true"
          />
          <span>
            {showTechnicalDetails
              ? "Ẩn chi tiết kỹ thuật & nguồn dữ liệu"
              : "Xem chi tiết kỹ thuật & nguồn dữ liệu hệ thống"}
          </span>
        </button>

        {showTechnicalDetails && (
          <div className="mt-2.5 space-y-2 rounded-xl border border-slate-200/80 bg-slate-50/80 p-3 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-300">
            <div className="flex items-start gap-2">
              <Database
                className="mt-0.5 size-3.5 text-slate-400 shrink-0"
                aria-hidden="true"
              />
              <div>
                <strong className="font-semibold text-slate-800 dark:text-slate-200">
                  Nguồn dữ liệu trích xuất:{" "}
                </strong>
                <span>
                  {formattedSourceViews || "Dữ liệu tổng hợp vận hành"}
                </span>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <ShieldCheck
                className="mt-0.5 size-3.5 text-emerald-600 dark:text-emerald-400 shrink-0"
                aria-hidden="true"
              />
              <p className="leading-relaxed text-[11px] text-slate-500 dark:text-slate-400">
                Truy vấn được giới hạn an toàn qua các database views được phân
                quyền riêng cho quản trị viên, không để lộ thông tin bệnh án
                nhạy cảm.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Actions */}
      <div className="mt-4 flex flex-col gap-2.5 border-t border-emerald-500/20 pt-3.5 sm:flex-row sm:items-center sm:justify-between dark:border-emerald-500/30">
        <Button
          type="button"
          size="default"
          className="min-h-11 w-full sm:w-auto font-bold gap-2 bg-emerald-600 text-white shadow-xs hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500 cursor-pointer"
          disabled={isPending}
          onClick={() => onConfirm(messageId)}
        >
          <CheckCircle2 className="size-4.5" aria-hidden="true" />
          <span>
            {isPending ? "Đang tạo báo cáo…" : "Xác nhận và tạo báo cáo"}
          </span>
        </Button>
        <p className="text-[11px] text-slate-500 dark:text-slate-400">
          Chỉ tạo báo cáo sau khi xác nhận. Bạn có thể nhắn tin để yêu cầu sửa
          đổi phạm vi.
        </p>
      </div>
    </section>
  );
}
