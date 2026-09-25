import {
  AlertCircle,
  BarChart3,
  Check,
  CheckCircle2,
  ChevronDown,
  Copy,
  Database,
  Download,
  Eye,
  EyeOff,
  ExternalLink,
  FileDown,
  FileText,
  Lightbulb,
  Loader2,
  ShieldAlert,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { useState } from "react";
import { toast } from "react-toastify";
import { revealAdminReportQuery } from "@/api/adminReportApi";
import { ChartConfigRenderer } from "@/components/app/ChartConfigRenderer";
import { GenericList } from "@/components/app/GenericList";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { exportReportCsv } from "@/lib/exportReportCsv";
import { openAdminReportFile } from "@/utils/open-admin-report-file";
import type { AdminReport } from "@/types/interface/adminReport.interface";

export function ReportAssistantPreview({ report }: { report: AdminReport }) {
  const [executedQuery, setExecutedQuery] = useState<string | null>(null);
  const [isLoadingQuery, setIsLoadingQuery] = useState(false);
  const [isQueryVisible, setIsQueryVisible] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const content = report.report;
  const fileName = report.fileName || `bao-cao-quan-tri-${report.id}.pdf`;
  const hasRows = Boolean(report.tableRows && report.tableRows.length > 0);
  const hasPdf = Boolean(report.pdfUrl);

  const handleToggleSql = async () => {
    if (executedQuery) {
      setIsQueryVisible((visible) => !visible);
      return;
    }
    if (isLoadingQuery) return;
    setIsLoadingQuery(true);
    try {
      const query = await revealAdminReportQuery(report.id);
      setExecutedQuery(query);
      setIsQueryVisible(true);
    } catch {
      toast.error("Không thể tải câu SQL. Vui lòng thử lại.");
    } finally {
      setIsLoadingQuery(false);
    }
  };

  const handleCopySql = () => {
    if (!executedQuery || !isQueryVisible) return;
    void navigator.clipboard
      .writeText(executedQuery)
      .then(() => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
        toast.success("Đã sao chép câu SQL.");
      })
      .catch(() => toast.error("Không thể sao chép câu SQL."));
  };

  return (
    <div
      className="w-full min-w-0 max-w-full space-y-4"
      aria-label="Bản xem trước báo cáo quản trị"
    >
      {/* 1. Header Bar: Title, Range, Badges, and Export Actions */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-3.5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3 min-w-0">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary dark:bg-primary/20">
              <FileText className="size-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                  <span className="size-1.5 rounded-full bg-emerald-500" />
                  Báo cáo hoàn tất
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Kỳ báo cáo:{" "}
                  <strong className="text-slate-800 dark:text-slate-200 font-semibold">
                    {report.rangeLabel}
                  </strong>
                </span>
              </div>
              <h3 className="mt-1 truncate text-base font-bold text-slate-900 dark:text-slate-100 sm:text-lg">
                {content?.title || "Báo cáo phân tích quản trị"}
              </h3>
            </div>
          </div>

          {/* Quick Actions Toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8.5 gap-1.5 rounded-lg border-primary/30 bg-primary/5 px-3 text-xs font-semibold text-primary shadow-2xs hover:bg-primary/10 hover:border-primary/50 dark:border-primary/40 dark:bg-primary/15 dark:text-teal-300 cursor-pointer"
              disabled={!hasRows}
              title={
                hasRows
                  ? "Tải xuống bảng dữ liệu định dạng CSV (UTF-8)"
                  : "Không có dữ liệu bảng để xuất"
              }
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
              className="h-8.5 gap-1.5 rounded-lg border-slate-200 px-3 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 cursor-pointer disabled:opacity-50"
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
              className="h-8.5 gap-1.5 rounded-lg border-slate-200 px-3 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 cursor-pointer disabled:opacity-50"
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
          <div className="mt-3 flex items-center gap-2 rounded-xl bg-amber-500/10 border border-amber-500/20 px-3 py-2 text-xs text-amber-800 dark:bg-amber-950/20 dark:border-amber-500/30 dark:text-amber-300">
            <AlertCircle
              className="size-4 text-amber-600 dark:text-amber-400 shrink-0"
              aria-hidden="true"
            />
            <span>
              Bản in PDF chưa sẵn sàng trên máy chủ lưu trữ. Bạn có thể sử dụng nút{" "}
              <strong>Xuất CSV</strong> ở trên để lấy toàn bộ dữ liệu bảng chi tiết.
            </span>
          </div>
        )}
      </div>

      {/* SQL reveal details section */}
      <details className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3.5 text-slate-800 transition-colors hover:bg-slate-50 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary dark:text-slate-100 dark:hover:bg-slate-800/60 [&::-webkit-details-marker]:hidden">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            <Database className="size-4" aria-hidden="true" />
          </span>
          <span className="min-w-0 flex-1 text-sm font-semibold">
            Câu SQL và yêu cầu dùng để tạo báo cáo
          </span>
          <ChevronDown
            className="size-4 shrink-0 text-slate-400 transition-transform group-open:rotate-180"
            aria-hidden="true"
          />
        </summary>
        <div className="space-y-4 border-t border-slate-100 p-4 dark:border-slate-800 sm:p-5">
          {report.sourceRequest && (
            <div className="space-y-1.5">
              <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Yêu cầu báo cáo
              </h4>
              <p className="whitespace-pre-wrap text-sm leading-6 text-slate-800 dark:text-slate-200">
                {report.sourceRequest}
              </p>
            </div>
          )}
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50/80 dark:border-slate-700 dark:bg-slate-950/40">
            <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 px-4 py-3 dark:border-slate-700 sm:px-5">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white text-slate-600 shadow-xs dark:bg-slate-800 dark:text-slate-300">
              <Eye className="size-4 text-slate-500" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    SQL đã thực thi
                  </h4>
                </div>
                {report.hasExecutedQuery && (
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {executedQuery && isQueryVisible
                      ? "Câu SQL của báo cáo này đang hiển thị"
                      : "Bấm biểu tượng con mắt để xem câu SQL"}
                  </p>
                )}
              </div>
              {report.hasExecutedQuery && (
                <div className="flex flex-wrap items-center gap-2">
                  {executedQuery && isQueryVisible && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-9 gap-1.5 rounded-lg border-slate-300 bg-white px-3 text-xs font-semibold dark:border-slate-700 dark:bg-slate-900 cursor-pointer shadow-2xs"
                      onClick={handleCopySql}
                    >
                      {isCopied ? (
                        <Check className="size-3.5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                      ) : (
                        <Copy className="size-3.5" aria-hidden="true" />
                      )}
                      <span>Sao chép SQL</span>
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-9 gap-1.5 rounded-lg border-slate-300 bg-white px-3 text-xs font-semibold dark:border-slate-600 dark:bg-slate-900 cursor-pointer shadow-2xs"
                    onClick={handleToggleSql}
                    disabled={isLoadingQuery}
                    aria-label={executedQuery && isQueryVisible ? "Ẩn SQL" : "Xem SQL"}
                    aria-pressed={Boolean(executedQuery && isQueryVisible)}
                  >
                    {isLoadingQuery ? (
                      <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                    ) : executedQuery && isQueryVisible ? (
                      <EyeOff className="size-4" aria-hidden="true" />
                    ) : (
                      <Eye className="size-4" aria-hidden="true" />
                    )}
                    <span>{isLoadingQuery ? "Đang tải SQL" : executedQuery && isQueryVisible ? "Ẩn SQL" : "Xem SQL"}</span>
                  </Button>
                </div>
              )}
            </div>
            {report.hasExecutedQuery ? (
              <div className="bg-slate-950 px-4 py-4 sm:px-5">
                {executedQuery && isQueryVisible && (
                  <div className="mb-2.5 flex items-center justify-between border-b border-slate-800/80 pb-2 text-[10px] font-mono text-slate-400">
                    <span className="flex items-center gap-1.5 text-emerald-400">
                      <span className="size-1.5 rounded-full bg-emerald-400" />
                      Truy vấn an toàn (Chỉ SELECT trên các view phân quyền)
                    </span>
                    <span>PostgreSQL 17</span>
                  </div>
                )}
                <pre className="max-h-80 overflow-auto whitespace-pre-wrap break-words font-mono text-xs leading-6 text-slate-100 sm:text-[13px]">
                  <code>
                    {executedQuery && isQueryVisible
                      ? executedQuery
                      : "********"}
                  </code>
                </pre>
              </div>
            ) : (
              <p className="px-4 py-4 text-sm text-slate-500 dark:text-slate-400 sm:px-5">
                Báo cáo này chưa lưu câu SQL đã chạy.
              </p>
            )}
          </div>
        </div>
      </details>

      {/* 2. Key Insights */}
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

      {/* 3. Visual Chart */}
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

      {/* 4. Direct System Query Rows */}
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
                className="space-y-1 rounded-xl bg-slate-50/70 p-3.5 dark:bg-slate-950/60"
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
                        className="mt-1.5 size-1.5 rounded-full bg-primary shrink-0"
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

      {/* 6. Governance & Compliance Note */}
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
