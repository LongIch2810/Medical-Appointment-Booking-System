import {
  AlertCircle,
  BarChart3,
  CheckCircle2,
  Database,
  Download,
  ExternalLink,
  FileDown,
  FileText,
  Sparkles,
} from "lucide-react";
import { ChartConfigRenderer } from "@/components/app/ChartConfigRenderer";
import { GenericList } from "@/components/app/GenericList";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { exportReportCsv } from "@/lib/exportReportCsv";
import { openBackendDocument } from "@/utils/open-backend-document";
import type { AdminReport } from "@/types/interface/adminReport.interface";

export function ReportAssistantPreview({ report }: { report: AdminReport }) {
  const content = report.report;
  const fileName = report.fileName || `bao-cao-hoi-thoai-${report.id}.pdf`;
  const hasRows = Boolean(report.tableRows && report.tableRows.length > 0);
  const hasPdf = Boolean(report.pdfUrl);

  return (
    <div className="mt-4 w-full min-w-0 max-w-full space-y-4 overflow-hidden" aria-label="Bản xem trước báo cáo">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 sm:p-4 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex size-10 sm:size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <FileText className="size-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="truncate font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base">
                {content?.title || "Báo cáo AI"}
              </h3>
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                Đã tạo
              </span>
            </div>
            <p className="truncate text-xs text-slate-500 dark:text-slate-400">
              Kỳ báo cáo: {report.rangeLabel}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8.5 gap-1.5 rounded-lg px-2.5 text-xs font-semibold cursor-pointer shadow-2xs"
            disabled={!hasRows}
            onClick={() =>
              exportReportCsv(
                fileName.replace(/\.pdf$/i, ".csv"),
                report.tableColumns,
                report.tableRows,
              )
            }
          >
            <FileDown aria-hidden="true" className="size-3.5" />
            <span>Xuất CSV</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8.5 gap-1.5 rounded-lg px-2.5 text-xs font-semibold cursor-pointer shadow-2xs"
            disabled={!hasPdf}
            onClick={() => report.pdfUrl && openBackendDocument(report.pdfUrl)}
          >
            <ExternalLink aria-hidden="true" className="size-3.5" />
            <span>Mở PDF</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8.5 gap-1.5 rounded-lg px-2.5 text-xs font-semibold cursor-pointer shadow-2xs"
            disabled={!hasPdf}
            onClick={() => report.pdfUrl && openBackendDocument(report.pdfUrl, true)}
          >
            <Download aria-hidden="true" className="size-3.5" />
            <span>Tải PDF</span>
          </Button>
        </div>
      </div>

      {/* Transparency Note */}
      <div className="flex items-start gap-2.5 rounded-xl border border-slate-200/80 bg-slate-50 p-3 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-400">
        <AlertCircle className="mt-0.5 size-4 shrink-0 text-slate-400" aria-hidden="true" />
        <p className="leading-relaxed">
          <strong className="font-semibold text-slate-700 dark:text-slate-300">
            Lưu ý kiểm soát:
          </strong>{" "}
          Bản phân tích và khuyến nghị được tổng hợp bởi AI dựa trên truy vấn dữ liệu thực tế từ cơ sở dữ liệu. Báo cáo phục vụ công tác quản trị nội bộ, không thay thế báo cáo tài chính đã được kiểm toán chính thức.
        </p>
      </div>

      {/* Analysis & Insights */}
      {content && (
        <Card className="rounded-2xl border-slate-200/80 bg-white shadow-none dark:border-slate-800 dark:bg-slate-900">
          <CardHeader className="border-b border-slate-100 p-4 pb-3 dark:border-slate-800">
            <CardTitle className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-slate-100">
              <Sparkles className="size-4 text-primary" aria-hidden="true" />
              <span>Phân tích & Đánh giá chuyên sâu</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-4 pt-4 sm:p-5">
            {/* Key Insights */}
            {content.insights.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Thông tin nổi bật (Key Insights)
                </h4>
                <ul className="space-y-2">
                  {content.insights.map((item, index) => (
                    <li
                      key={index}
                      className="flex items-start gap-2.5 rounded-xl border border-emerald-200/60 bg-emerald-50/70 p-3 text-xs sm:text-sm leading-relaxed text-emerald-950 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-200"
                    >
                      <CheckCircle2
                        className="mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-400"
                        aria-hidden="true"
                      />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Structured Sections */}
            {content.analysis.map((item, index) => (
              <section key={index} className="space-y-1.5 pt-2">
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
              <section className="space-y-2 pt-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Khuyến nghị hành động
                </h4>
                <ul className="list-disc space-y-1.5 pl-5 text-xs sm:text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                  {content.strategic_recommendations.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </section>
            )}
          </CardContent>
        </Card>
      )}

      {/* Visual Chart */}
      {report.chartConfig && (
        <Card className="rounded-2xl border-slate-200/80 bg-white shadow-none dark:border-slate-800 dark:bg-slate-900">
          <CardHeader className="border-b border-slate-100 p-4 pb-3 dark:border-slate-800">
            <CardTitle className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-slate-100">
              <BarChart3 className="size-4 text-primary" aria-hidden="true" />
              <span>Biểu đồ trực quan</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-4 sm:p-5">
            <ChartConfigRenderer chartConfig={report.chartConfig} />
          </CardContent>
        </Card>
      )}

      {/* Direct System Query Rows */}
      {hasRows && (
        <div className="w-full min-w-0 max-w-full space-y-2 overflow-hidden">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400">
            <Database className="size-4 text-primary" aria-hidden="true" />
            <span>Dữ liệu truy vấn từ hệ thống ({report.tableRows.length} dòng)</span>
          </div>
          <div className="w-full min-w-0 max-w-full overflow-x-auto rounded-2xl">
            <GenericList
              title=""
              description=""
              columns={report.tableColumns.map((column) => ({
                key: column.key,
                label: column.label,
                render: (row: Record<string, string | number>) => row[column.key],
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
      )}
    </div>
  );
}

