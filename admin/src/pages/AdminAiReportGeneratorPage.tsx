import { useState } from "react";
import { FileDown, FileText, Sparkles } from "lucide-react";

import { AiReportLoadingOverlay } from "@/components/app/AiReportLoadingOverlay";
import { ChartConfigRenderer } from "@/components/app/ChartConfigRenderer";
import { EmptyState } from "@/components/app/EmptyState";
import { ErrorState } from "@/components/app/ErrorState";
import { GenericList } from "@/components/app/GenericList";
import { PageHeader } from "@/components/app/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useGenerateAdminReport } from "@/hooks/useAdminReport";
import { exportReportCsv } from "@/lib/exportReportCsv";
import type {
  AdminReportRangePreset,
  AdminReportType,
  GenerateAdminReportPayload,
} from "@/types/interface/adminReport.interface";

const REPORT_TYPE_GROUPS: {
  groupLabel: string;
  options: { value: AdminReportType; label: string }[];
}[] = [
  {
    groupLabel: "Vận hành Đặt lịch",
    options: [
      {
        value: "BOOKING_CANCELLATION_NOSHOW",
        label: "Thống kê đặt lịch & tỷ lệ hủy/no-show",
      },
      {
        value: "PATIENT_FLOW_BY_TIMESLOT",
        label: "Lưu lượng bệnh nhân theo khung giờ",
      },
    ],
  },
  {
    groupLabel: "Hiệu suất Bác sĩ & Chuyên khoa",
    options: [
      {
        value: "APPOINTMENTS_BY_SPECIALTY",
        label: "Lịch hẹn theo chuyên khoa",
      },
      { value: "DOCTOR_FILL_RATE", label: "Tỷ lệ lấp đầy lịch bác sĩ" },
    ],
  },
  {
    groupLabel: "Người dùng & Hồ sơ",
    options: [
      { value: "NEW_USER_REGISTRATIONS", label: "Đăng ký người dùng mới" },
      { value: "USER_DEMOGRAPHICS", label: "Nhân khẩu học người dùng" },
      { value: "AI_COACH_ACTIVITY", label: "Hoạt động AI Coach" },
      { value: "HEALTH_GOAL_SUMMARY", label: "Tóm tắt mục tiêu sức khỏe" },
      { value: "HEALTH_TRENDS", label: "Xu hướng sức khỏe tổng hợp" },
    ],
  },
];

const RANGE_PRESET_OPTIONS: { value: AdminReportRangePreset; label: string }[] =
  [
    { value: "TODAY", label: "Ngày hôm nay" },
    { value: "THIS_WEEK", label: "Tuần này" },
    { value: "THIS_MONTH", label: "Tháng này" },
    { value: "THIS_YEAR", label: "Năm nay" },
    { value: "CUSTOM", label: "Tùy chọn khoảng ngày" },
  ];

const filterInputClass =
  "h-10 rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 shadow-2xs outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100";

export function AdminAiReportGeneratorPage() {
  const [reportType, setReportType] = useState<AdminReportType>(
    "NEW_USER_REGISTRATIONS",
  );
  const [rangePreset, setRangePreset] =
    useState<AdminReportRangePreset>("TODAY");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [rangeError, setRangeError] = useState("");

  const mutation = useGenerateAdminReport();
  const report = mutation.data?.data;

  const handleGenerate = () => {
    setRangeError("");

    if (rangePreset === "CUSTOM") {
      if (!fromDate || !toDate) {
        setRangeError("Vui lòng chọn đủ khoảng ngày.");
        return;
      }
      if (fromDate > toDate) {
        setRangeError("Ngày bắt đầu phải trước ngày kết thúc.");
        return;
      }
    }

    const payload: GenerateAdminReportPayload = {
      reportType,
      rangePreset,
      ...(rangePreset === "CUSTOM" ? { fromDate, toDate } : {}),
    };
    mutation.mutate(payload);
  };

  const handleExportCsv = () => {
    if (!report) return;
    exportReportCsv(
      `ai-coach-report-${report.reportType.toLowerCase()}.csv`,
      report.tableColumns,
      report.tableRows,
    );
  };

  return (
    <>
      <AiReportLoadingOverlay isLoading={mutation.isPending} />
      <div className="space-y-8">
        <PageHeader
          eyebrow="Admin reports"
          title="AI Hỗ Trợ Tạo Báo Cáo Doanh Nghiệp"
          description="Chọn loại báo cáo và khoảng thời gian để AI phân tích dữ liệu thật, sinh biểu đồ và báo cáo chuyên sâu."
        />

        <div className="space-y-3">
          <div className="flex flex-wrap items-end gap-3 rounded-3xl border border-slate-200/80 bg-white p-4 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-col gap-1.5 min-w-[240px]">
              <label className="mono-label text-[10px] font-bold text-slate-500 dark:text-slate-400">
                Loại báo cáo
              </label>
              <select
                className={filterInputClass}
                value={reportType}
                onChange={(e) =>
                  setReportType(e.target.value as AdminReportType)
                }
              >
                {REPORT_TYPE_GROUPS.map((group) => (
                  <optgroup key={group.groupLabel} label={group.groupLabel} className="dark:bg-slate-900">
                    {group.options.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5 min-w-[180px]">
              <label className="mono-label text-[10px] font-bold text-slate-500 dark:text-slate-400">
                Khoảng thời gian
              </label>
              <select
                className={filterInputClass}
                value={rangePreset}
                onChange={(e) =>
                  setRangePreset(e.target.value as AdminReportRangePreset)
                }
              >
                {RANGE_PRESET_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {rangePreset === "CUSTOM" ? (
              <>
                <div className="flex flex-col gap-1.5">
                  <label className="mono-label text-[10px] font-bold text-slate-500 dark:text-slate-400">
                    Từ ngày
                  </label>
                  <input
                    type="date"
                    className={filterInputClass}
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="mono-label text-[10px] font-bold text-slate-500 dark:text-slate-400">
                    Đến ngày
                  </label>
                  <input
                    type="date"
                    className={filterInputClass}
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                  />
                </div>
              </>
            ) : null}

            <Button
              className="gap-2 rounded-xl shadow-xs"
              onClick={handleGenerate}
              disabled={mutation.isPending}
            >
              <Sparkles className="size-4" />
              {mutation.isPending ? "Đang tạo báo cáo..." : "Tạo Báo cáo AI"}
            </Button>
          </div>

          {rangeError ? (
            <p className="text-sm font-semibold text-rose-600">{rangeError}</p>
          ) : null}
          <p className="text-xs text-slate-400 dark:text-slate-400">
            Mỗi lượt tạo báo cáo có thể mất 15 giây đến vài phút do AI phân tích
            dữ liệu, sinh biểu đồ và xuất PDF tuần tự.
          </p>
        </div>

        {mutation.isError ? (
          <ErrorState
            title="Không thể tạo báo cáo"
            description="Đã xảy ra lỗi khi gọi AI Coach để tạo báo cáo. Vui lòng thử lại."
            onRetry={handleGenerate}
          />
        ) : null}

        {!report && !mutation.isPending && !mutation.isError ? (
          <EmptyState
            title="Chưa có báo cáo nào"
            description="Chọn loại báo cáo và khoảng thời gian ở trên, sau đó nhấn 'Tạo Báo cáo AI' để hệ thống phân tích dữ liệu thật và tạo báo cáo trực quan."
          />
        ) : null}

        {report && !mutation.isPending ? (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Badge variant="info" className="text-xs font-bold px-3 py-1">{report.rangeLabel}</Badge>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 rounded-xl font-semibold"
                  onClick={handleExportCsv}
                  disabled={report.tableRows.length === 0}
                >
                  <FileDown className="size-4" />
                  Xuất CSV
                </Button>
                {report.pdfUrl ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 rounded-xl font-semibold"
                    asChild
                  >
                    <a
                      href={report.pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <FileText className="size-4" />
                      Mở PDF
                    </a>
                  </Button>
                ) : null}
              </div>
            </div>

            {report.report ? (
              <Card className="rounded-3xl border-slate-200/80 bg-white p-6 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
                <CardHeader className="p-0 pb-4 border-b border-slate-100 dark:border-slate-800">
                  <CardTitle className="text-lg font-bold text-slate-900 dark:text-slate-100">
                    {report.report.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0 pt-4 space-y-6">
                  {report.report.insights.length > 0 ? (
                    <div className="grid gap-3 md:grid-cols-3">
                      {report.report.insights.map((insight, index) => (
                        <div
                          key={index}
                          className="rounded-2xl border border-teal-100 bg-teal-50/50 p-4 text-xs sm:text-sm font-medium text-slate-800 dark:border-teal-950 dark:bg-teal-950/30 dark:text-teal-200 leading-relaxed"
                        >
                          {insight}
                        </div>
                      ))}
                    </div>
                  ) : null}

                  {report.report.analysis.map((item, index) => (
                    <div key={index} className="space-y-1.5">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                        {item.section_title}
                      </h4>
                      <p className="text-xs sm:text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                        {item.content}
                      </p>
                    </div>
                  ))}

                  {report.report.strategic_recommendations.length > 0 ? (
                    <div className="space-y-2 rounded-2xl border border-slate-100 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950/60">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                        Khuyến nghị chiến lược
                      </h4>
                      <ul className="list-disc space-y-1.5 pl-5 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                        {report.report.strategic_recommendations.map(
                          (rec, index) => (
                            <li key={index}>{rec}</li>
                          ),
                        )}
                      </ul>
                    </div>
                  ) : null}

                  {report.report.economic_context ? (
                    <p className="text-xs sm:text-sm leading-relaxed text-slate-500 dark:text-slate-400 italic">
                      {report.report.economic_context}
                    </p>
                  ) : null}

                  {report.report.footer ? (
                    <p className="border-t border-slate-100 pt-3 text-xs text-slate-400 dark:border-slate-800 dark:text-slate-400">
                      {report.report.footer}
                    </p>
                  ) : null}
                </CardContent>
              </Card>
            ) : null}

            {report.chartConfig ? (
              <Card className="rounded-3xl border-slate-200/80 bg-white p-6 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
                <CardHeader className="p-0 pb-4 border-b border-slate-100 dark:border-slate-800">
                  <CardTitle className="text-base font-bold dark:text-slate-100">Biểu đồ trực quan</CardTitle>
                </CardHeader>
                <CardContent className="p-0 pt-4">
                  <ChartConfigRenderer chartConfig={report.chartConfig} />
                </CardContent>
              </Card>
            ) : null}

            {report.tableRows.length > 0 ? (
              <GenericList
                title="Dữ liệu chi tiết"
                description="Kết quả truy vấn thực tế từ cơ sở dữ liệu."
                columns={report.tableColumns.map((col) => ({
                  key: col.key,
                  label: col.label,
                  render: (row: Record<string, string | number>) =>
                    row[col.key],
                }))}
                rows={report.tableRows}
                total={report.tableRows.length}
                page={1}
                limit={report.tableRows.length}
                onPageChange={() => {}}
                isLoading={false}
                isError={false}
                onRetry={() => {}}
                rowKey={(row) => JSON.stringify(row)}
              />
            ) : null}
          </div>
        ) : null}
      </div>
    </>
  );
}
