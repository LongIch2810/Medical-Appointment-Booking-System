import {
  AlertCircle,
  BarChart3,
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
  LockKeyhole,
  ShieldAlert,
  ShieldCheck,
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
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { exportReportCsv } from "@/lib/exportReportCsv";
import { openAdminReportFile } from "@/utils/open-admin-report-file";
import type { AdminReport } from "@/types/interface/adminReport.interface";

export function ReportAssistantPreview({ report }: { report: AdminReport }) {
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [isCheckingPassword, setIsCheckingPassword] = useState(false);
  const [verifiedQuery, setVerifiedQuery] = useState<string | null>(null);
  const [isQueryVisible, setIsQueryVisible] = useState(false);
  const content = report.report;
  const fileName = report.fileName || `bao-cao-quan-tri-${report.id}.pdf`;
  const hasRows = Boolean(report.tableRows && report.tableRows.length > 0);
  const hasPdf = Boolean(report.pdfUrl);

  const confirmPassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!password || isCheckingPassword) return;
    setIsCheckingPassword(true);
    setPasswordError("");
    try {
      const query = await revealAdminReportQuery(report.id, password);
      setVerifiedQuery(query);
      setIsQueryVisible(true);
      setIsPasswordDialogOpen(false);
      setPassword("");
    } catch {
      setPasswordError("Không thể xác nhận mật khẩu. Vui lòng kiểm tra và thử lại.");
    } finally {
      setIsCheckingPassword(false);
    }
  };

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
                {verifiedQuery ? (
                  <ShieldCheck className="size-4" aria-hidden="true" />
                ) : (
                  <LockKeyhole className="size-4" aria-hidden="true" />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  SQL đã thực thi
                </h4>
                {report.hasExecutedQuery && (
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {verifiedQuery
                      ? "Đã xác nhận cho báo cáo này"
                      : "Cần xác nhận mật khẩu để xem"}
                  </p>
                )}
              </div>
              {report.hasExecutedQuery && (
                <div className="flex flex-wrap items-center gap-2">
                  {verifiedQuery && isQueryVisible && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-9 gap-1.5 rounded-lg bg-white px-3 text-xs font-medium dark:bg-slate-900"
                      onClick={() =>
                        void navigator.clipboard
                          .writeText(verifiedQuery)
                          .then(() => toast.success("Đã sao chép câu SQL."))
                          .catch(() => toast.error("Không thể sao chép câu SQL."))
                      }
                    >
                      <Copy className="size-3.5" aria-hidden="true" />
                      Sao chép SQL
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-9 gap-1.5 rounded-lg border-slate-300 bg-white px-3 text-xs font-semibold dark:border-slate-600 dark:bg-slate-900"
                    onClick={() => {
                      if (verifiedQuery) {
                        setIsQueryVisible((visible) => !visible);
                      } else {
                        setIsPasswordDialogOpen(true);
                      }
                    }}
                    aria-pressed={Boolean(verifiedQuery && isQueryVisible)}
                  >
                    {verifiedQuery && isQueryVisible ? (
                      <EyeOff className="size-4" aria-hidden="true" />
                    ) : (
                      <Eye className="size-4" aria-hidden="true" />
                    )}
                    {verifiedQuery && isQueryVisible ? "Ẩn SQL" : "Xem SQL"}
                  </Button>
                </div>
              )}
            </div>
            {report.hasExecutedQuery ? (
              <div className="bg-slate-950 px-4 py-4 sm:px-5">
                <pre className="max-h-80 overflow-auto whitespace-pre-wrap break-words font-mono text-xs leading-6 text-slate-100 sm:text-[13px]">
                  <code>
                    {verifiedQuery && isQueryVisible ? verifiedQuery : "********"}
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

      <Dialog
        open={isPasswordDialogOpen}
        onOpenChange={(open) => {
          setIsPasswordDialogOpen(open);
          if (!open) {
            setPassword("");
            setPasswordError("");
          }
        }}
      >
        <DialogContent className="max-w-[440px] gap-0 rounded-2xl p-0">
          <DialogHeader className="gap-0 border-0 px-6 pt-6 pb-0 pr-14 sm:px-7 sm:pt-7 sm:pr-14">
            <div className="flex items-start gap-3.5">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                <LockKeyhole className="size-5" aria-hidden="true" />
              </span>
              <div className="min-w-0 pt-0.5">
                <DialogTitle className="text-lg">Xác nhận mật khẩu</DialogTitle>
                <DialogDescription className="mt-1.5">
                  Xem câu SQL đã dùng để tạo báo cáo này.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <form
            onSubmit={(event) => void confirmPassword(event)}
            className="px-6 pt-5 pb-6 sm:px-7 sm:pb-7"
          >
            <div className="mb-5 border-l-2 border-emerald-500 pl-3">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Báo cáo đang xem
              </p>
              <p className="mt-0.5 line-clamp-2 text-sm font-semibold leading-5 text-slate-800 dark:text-slate-100">
                {content?.title || report.sourceRequest || "Báo cáo quản trị"}
              </p>
            </div>
            <div className="space-y-2">
              <label
                htmlFor={`report-query-password-${report.id}`}
                className="text-sm font-semibold text-slate-800 dark:text-slate-100"
              >
                Mật khẩu quản trị
              </label>
              <Input
                id={`report-query-password-${report.id}`}
                type="password"
                autoComplete="current-password"
                autoFocus
                placeholder="Nhập mật khẩu của bạn"
                aria-invalid={Boolean(passwordError)}
                aria-describedby={
                  passwordError
                    ? `report-query-password-error-${report.id}`
                    : undefined
                }
                className="h-11 rounded-lg border-slate-300 dark:border-slate-700"
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  setPasswordError("");
                }}
              />
              {passwordError && (
                <p
                  id={`report-query-password-error-${report.id}`}
                  role="alert"
                  className="text-sm text-red-600 dark:text-red-400"
                >
                  {passwordError}
                </p>
              )}
            </div>
            <p className="mt-3 flex items-center gap-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
              <ShieldCheck
                className="size-3.5 shrink-0 text-emerald-600 dark:text-emerald-400"
                aria-hidden="true"
              />
              Chỉ cần xác nhận một lần cho báo cáo này.
            </p>
            <div className="mt-6 flex items-center justify-end gap-2.5 border-t border-slate-100 pt-5 dark:border-slate-800">
              <DialogClose asChild>
                <Button type="button" variant="ghost" className="h-10 rounded-lg px-4">
                  Hủy
                </Button>
              </DialogClose>
              <Button
                type="submit"
                disabled={!password || isCheckingPassword}
                className="h-10 rounded-lg bg-emerald-600 px-5 font-semibold text-white hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-500 disabled:opacity-100 dark:disabled:bg-slate-800 dark:disabled:text-slate-400"
              >
                {isCheckingPassword ? "Đang xác nhận..." : "Xác nhận và xem SQL"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

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
