import {
  AlertCircle,
  BarChart3,
  CheckCircle2,
  Database,
  Download,
  ExternalLink,
  FileDown,
  FileText,
  Lightbulb,
  ShieldAlert,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { toast } from "react-toastify";
import { ChartConfigRenderer } from "@/components/app/ChartConfigRenderer";
import { GenericList } from "@/components/app/GenericList";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { exportReportCsv } from "@/lib/exportReportCsv";
import { openAdminReportFile } from "@/utils/open-admin-report-file";
import type { AdminReport } from "@/types/interface/adminReport.interface";

export function ReportAssistantPreview({ report }: { report: AdminReport }) {
  const content = report.report;
  const fileName = report.fileName || `bao-cao-quan-tri-${report.id}.pdf`;
  const hasRows = Boolean(report.tableRows && report.tableRows.length > 0);
  const hasPdf = Boolean(report.pdfUrl);

  return (
    <div
      className="w-full min-w-0 max-w-full space-y-4"
      aria-label="Bản xem trước báo cáo quản trị"
    >
      {/* 1. Header Bar: Title, Range, Badges, and Export Actions */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3 min-w-0">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary dark:bg-primary/20">
              <FileText className="size-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-md bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                  Báo cáo hoàn tất
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Kỳ báo cáo:{" "}
                  <strong className="text-slate-800 dark:text-slate-200">
                    {report.rangeLabel}
                  </strong>
                </span>
              </div>
              <h3 className="mt-1 truncate text-base font-bold text-slate-900 dark:text-slate-100 sm:text-lg">
                {content?.title || "Báo cáo phân tích quản trị"}
              </h3>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8.5 gap-1.5 rounded-lg border-slate-200 px-3 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 cursor-pointer"
              disabled={!hasRows}
              title={
                hasRows
                  ? "Tải xuống bảng dữ liệu định dạng CSV (UTF-8)"
                  : "Không có dữ liệu bảng"
              }
              onClick={() =>
                exportReportCsv(
                  fileName.replace(/\.pdf$/i, ".csv"),
                  report.tableColumns,
                  report.tableRows,
                )
              }
            >
              <FileDown aria-hidden="true" className="size-3.5 text-primary" />
              <span>Xuất CSV</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8.5 gap-1.5 rounded-lg border-slate-200 px-3 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 cursor-pointer"
              disabled={!hasPdf}
              title={
                hasPdf
                  ? "Mở tài liệu PDF trong tab mới"
                  : "Chưa có bản in PDF trên máy chủ"
              }
              onClick={() => {
                if (!report.pdfUrl) return;
                void openAdminReportFile(report.id).catch(() =>
                  toast.error("Không thể mở PDF. Vui lòng thử lại."),
                );
              }}
            >
              <ExternalLink
                aria-hidden="true"
                className="size-3.5 text-slate-500"
              />
              <span>Mở PDF</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8.5 gap-1.5 rounded-lg border-slate-200 px-3 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 cursor-pointer"
              disabled={!hasPdf}
              title={
                hasPdf
                  ? "Tải tài liệu PDF về thiết bị"
                  : "Chưa có bản in PDF trên máy chủ"
              }
              onClick={() => {
                if (!report.pdfUrl) return;
                void openAdminReportFile(report.id, true).catch(() =>
                  toast.error("Không thể tải PDF. Vui lòng thử lại."),
                );
              }}
            >
              <Download
                aria-hidden="true"
                className="size-3.5 text-slate-500"
              />
              <span>Tải PDF</span>
            </Button>
          </div>
        </div>

        {!hasPdf && (
          <div className="mt-2.5 flex items-center gap-1.5 rounded-lg bg-slate-50 px-2.5 py-1.5 text-[11px] text-slate-500 dark:bg-slate-800/50 dark:text-slate-400">
            <AlertCircle
              className="size-3.5 text-amber-500 shrink-0"
              aria-hidden="true"
            />
            <span>
              Bản in PDF chưa khả dụng trên máy chủ lưu trữ. Bạn có thể sử dụng
              nút <strong>Xuất CSV</strong> để lấy bảng số liệu chi tiết.
            </span>
          </div>
        )}
      </div>

      {/* 2. Key Insights (Phát hiện chính) - High priority, placed right after header */}
      {content && content.insights && content.insights.length > 0 && (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-50/40 p-4 dark:border-emerald-500/40 dark:bg-emerald-950/20">
          <div className="flex items-center gap-2">
            <Sparkles
              className="size-4.5 text-emerald-700 dark:text-emerald-300"
              aria-hidden="true"
            />
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-200">
              Phát hiện trọng tâm (Key Insights)
            </h4>
          </div>
          <ul className="mt-3 space-y-2">
            {content.insights.map((item, index) => (
              <li
                key={index}
                className="flex items-start gap-2.5 rounded-xl border border-emerald-200/80 bg-white p-3 text-xs sm:text-sm leading-relaxed text-slate-800 shadow-2xs dark:border-emerald-900/50 dark:bg-slate-900 dark:text-slate-100"
              >
                <CheckCircle2
                  className="mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-400"
                  aria-hidden="true"
                />
                <span className="font-medium">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 3. Visual Chart (Biểu đồ trực quan) */}
      {report.chartConfig && (
        <Card className="rounded-2xl border-slate-200/90 bg-white shadow-none dark:border-slate-800 dark:bg-slate-900">
          <CardHeader className="border-b border-slate-100 p-4 pb-3 dark:border-slate-800">
            <CardTitle className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-slate-100">
              <BarChart3 className="size-4 text-primary" aria-hidden="true" />
              <span>Biểu đồ trực quan hóa số liệu</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-4 sm:p-5">
            <ChartConfigRenderer chartConfig={report.chartConfig} />
          </CardContent>
        </Card>
      )}

      {/* 4. Direct System Query Rows (Bảng dữ liệu thực tế) */}
      {hasRows ? (
        <div className="w-full min-w-0 max-w-full space-y-2 overflow-hidden">
          <div className="flex items-center justify-between gap-2 px-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
              <Database className="size-4 text-primary" aria-hidden="true" />
              <span>
                Dữ liệu thực tế từ hệ thống ({report.tableRows.length} bản ghi)
              </span>
            </div>
            <span className="text-[11px] text-slate-400">
              Cuộn ngang để xem tất cả cột
            </span>
          </div>
          <div className="w-full min-w-0 max-w-full overflow-x-auto rounded-2xl border border-slate-200/90 bg-white shadow-none dark:border-slate-800 dark:bg-slate-900">
            <GenericList
              title=""
              description=""
              columns={report.tableColumns.map((column) => ({
                key: column.key,
                label: column.label,
                render: (row: Record<string, string | number>) => (
                  <span className="text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200">
                    {row[column.key]}
                  </span>
                ),
              }))}
              rows={report.tableRows}
              total={report.tableRows.length}
              page={1}
              limit={report.tableRows.length}
              onPageChange={() => undefined}
              isLoading={false}
              isError={false}
              onRetry={() => undefined}
              rowKey={(row) => JSON.stringify(row)}
            />
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200/90 bg-slate-50/60 p-4 text-center text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-800/40">
          <Database
            className="mx-auto size-5 text-slate-400"
            aria-hidden="true"
          />
          <p className="mt-1 font-medium text-slate-700 dark:text-slate-300">
            Không có bản ghi dữ liệu bảng
          </p>
          <p className="mt-0.5 text-[11px]">
            Báo cáo tổng quan không yêu cầu bảng chi tiết từng dòng.
          </p>
        </div>
      )}

      {/* 5. Deep Analysis & Strategic Recommendations */}
      {content && (
        <Card className="rounded-2xl border-slate-200/90 bg-white shadow-none dark:border-slate-800 dark:bg-slate-900">
          <CardHeader className="border-b border-slate-100 p-4 pb-3 dark:border-slate-800">
            <CardTitle className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-slate-100">
              <TrendingUp className="size-4 text-primary" aria-hidden="true" />
              <span>Đánh giá & Khuyến nghị quản trị</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-4 pt-4 sm:p-5">
            {/* Structured Sections */}
            {content.analysis.map((item, index) => (
              <section
                key={index}
                className="space-y-1 rounded-xl bg-slate-50/70 p-3.5 dark:bg-slate-850/60"
              >
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  {item.section_title}
                </h4>
                <p className="text-xs sm:text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                  {item.content}
                </p>
              </section>
            ))}

            {/* Strategic Recommendations */}
            {content.strategic_recommendations.length > 0 && (
              <section className="space-y-2 pt-1">
                <div className="flex items-center gap-1.5">
                  <Lightbulb
                    className="size-4 text-amber-500"
                    aria-hidden="true"
                  />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                    Khuyến nghị hành động
                  </h4>
                </div>
                <ul className="space-y-2">
                  {content.strategic_recommendations.map((item, index) => (
                    <li
                      key={index}
                      className="flex items-start gap-2 text-xs sm:text-sm leading-relaxed text-slate-700 dark:text-slate-300"
                    >
                      <span
                        className="mt-1 size-1.5 rounded-full bg-primary shrink-0"
                        aria-hidden="true"
                      />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </CardContent>
        </Card>
      )}

      {/* 6. Governance & Compliance Note (Concise, bottom) */}
      <div className="flex items-start gap-2.5 rounded-xl border border-slate-200/80 bg-slate-50/80 p-3 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-400">
        <ShieldAlert
          className="mt-0.5 size-4 shrink-0 text-slate-400"
          aria-hidden="true"
        />
        <p className="leading-relaxed">
          <strong className="font-semibold text-slate-700 dark:text-slate-300">
            Lưu ý kiểm soát:
          </strong>{" "}
          Bản phân tích và khuyến nghị được tổng hợp tự động từ dữ liệu truy vấn
          thực tế của hệ thống LifeHealth. Báo cáo phục vụ công tác quản trị nội
          bộ, không thay thế báo cáo tài chính đã kiểm toán chính thức.
        </p>
      </div>
    </div>
  );
}
