import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  CheckCircle2,
  Clock,
  Download,
  ExternalLink,
  Eye,
  FileDown,
  FileText,
  Filter,
  Sparkles,
  Trash2,
  User,
} from "lucide-react";
import { toast } from "react-toastify";

import { deleteAdminReport, getAdminReportHistory } from "@/api/adminReportApi";
import { openBackendDocument } from "@/utils/open-backend-document";
import { ConfirmDialog } from "@/components/app/ConfirmDialog";
import { DetailDialog } from "@/components/app/DetailDialog";
import { EmptyState } from "@/components/app/EmptyState";
import { ErrorState } from "@/components/app/ErrorState";
import { LoadingState } from "@/components/app/LoadingState";
import { Pagination } from "@/components/app/Pagination";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type {
  AdminReport,
  AdminReportType,
} from "@/types/interface/adminReport.interface";

const REPORT_TYPE_LABELS: Record<AdminReportType, string> = {
  CONVERSATIONAL: "Báo cáo hội thoại",
  BOOKING_CANCELLATION_NOSHOW: "Đặt lịch & hủy/no-show",
  PATIENT_FLOW_BY_TIMESLOT: "Lưu lượng theo khung giờ",
  APPOINTMENTS_BY_SPECIALTY: "Lịch hẹn theo chuyên khoa",
  DOCTOR_FILL_RATE: "Tỷ lệ lấp đầy lịch bác sĩ",
  NEW_USER_REGISTRATIONS: "Đăng ký người dùng mới",
  USER_DEMOGRAPHICS: "Nhân khẩu học người dùng",
  AI_COACH_ACTIVITY: "Hoạt động AI Coach",
  HEALTH_TRENDS: "Xu hướng sức khỏe tổng hợp",
};

const ALL_REPORT_TYPES: { value: AdminReportType; label: string }[] = [
  { value: "CONVERSATIONAL", label: "Báo cáo hội thoại" },
  {
    value: "BOOKING_CANCELLATION_NOSHOW",
    label: "Thống kê đặt lịch & hủy/no-show",
  },
  {
    value: "PATIENT_FLOW_BY_TIMESLOT",
    label: "Lưu lượng bệnh nhân theo khung giờ",
  },
  {
    value: "APPOINTMENTS_BY_SPECIALTY",
    label: "Lịch hẹn theo chuyên khoa",
  },
  {
    value: "DOCTOR_FILL_RATE",
    label: "Tỷ lệ lấp đầy lịch bác sĩ",
  },
  {
    value: "NEW_USER_REGISTRATIONS",
    label: "Đăng ký người dùng mới",
  },
  {
    value: "USER_DEMOGRAPHICS",
    label: "Nhân khẩu học người dùng",
  },
  {
    value: "AI_COACH_ACTIVITY",
    label: "Hoạt động AI Coach",
  },
  {
    value: "HEALTH_TRENDS",
    label: "Xu hướng sức khỏe tổng hợp",
  },
];

function formatViDateTime(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${hours}:${minutes} · ${day}/${month}/${year}`;
  } catch {
    return dateStr;
  }
}

function openOrDownload(path: string, download: boolean) {
  openBackendDocument(path, download);
}

function ReportDetailView({ report }: { report: AdminReport }) {
  const content = report.report;
  return (
    <div className="space-y-4 pt-1">
      {/* Overview Metadata Grid */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5 dark:border-slate-800 dark:bg-slate-950/60">
          <span className="mono-label text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Loại báo cáo
          </span>
          <p className="mt-1 text-xs font-semibold text-slate-900 dark:text-slate-100">
            {REPORT_TYPE_LABELS[report.reportType] || report.reportType}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5 dark:border-slate-800 dark:bg-slate-950/60">
          <span className="mono-label text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Khoảng thời gian
          </span>
          <p className="mt-1 text-xs font-semibold text-slate-900 dark:text-slate-100">
            {report.rangeLabel}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5 dark:border-slate-800 dark:bg-slate-950/60">
          <span className="mono-label text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Người tạo
          </span>
          <p className="mt-1 text-xs font-semibold text-slate-900 dark:text-slate-100">
            {report.createdBy?.fullname || "Quản trị viên"}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5 dark:border-slate-800 dark:bg-slate-950/60">
          <span className="mono-label text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Thời điểm lưu
          </span>
          <p className="mt-1 text-xs font-semibold text-slate-900 dark:text-slate-100">
            {formatViDateTime(report.createdAt)}
          </p>
        </div>
      </div>

      {/* Analysis sections */}
      {content?.analysis && content.analysis.length > 0 && (
        <div className="space-y-2 pt-1">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Phân tích chi tiết AI
          </h4>
          <div className="space-y-2">
            {content.analysis.map((sec, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-slate-100 bg-slate-50/50 p-3.5 dark:border-slate-800 dark:bg-slate-900/50"
              >
                <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  {sec.section_title}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                  {sec.content}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Insights */}
      {content?.insights && content.insights.length > 0 && (
        <div className="space-y-1.5 rounded-2xl border border-slate-100 bg-slate-50/60 p-3.5 dark:border-slate-800 dark:bg-slate-900/50">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Thông tin phát hiện nổi bật (Insights)
          </h4>
          <ul className="list-disc space-y-1 pl-4 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
            {content.insights.map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Strategic recommendations */}
      {content?.strategic_recommendations &&
        content.strategic_recommendations.length > 0 && (
          <div className="space-y-1.5 rounded-2xl border border-emerald-100 bg-emerald-50/50 p-3.5 dark:border-emerald-950/40 dark:bg-emerald-950/20">
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-900 dark:text-emerald-300">
              Khuyến nghị chiến lược
            </h4>
            <ul className="list-disc space-y-1 pl-4 text-xs leading-relaxed text-emerald-800/90 dark:text-emerald-300/90">
              {content.strategic_recommendations.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </div>
        )}

      {/* Direct PDF actions */}
      {report.pdfUrl && (
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="gap-1.5 rounded-xl text-xs font-semibold"
            onClick={() =>
              void openOrDownload(
                report.pdfUrl!,
                false,
              )
            }
          >
            <ExternalLink className="size-3.5 text-primary" />
            Mở PDF toàn màn hình
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="gap-1.5 rounded-xl text-xs font-semibold"
            onClick={() =>
              void openOrDownload(
                report.pdfUrl!,
                true,
              )
            }
          >
            <Download className="size-3.5 text-slate-600 dark:text-slate-400" />
            Tải PDF về máy
          </Button>
        </div>
      )}
    </div>
  );
}

export function AiReportHistory({
  reportType: initialReportType,
}: {
  reportType?: AdminReportType;
}) {
  const [selectedFilterType, setSelectedFilterType] = useState<string>(
    initialReportType || "",
  );
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (initialReportType) {
      setSelectedFilterType(initialReportType);
      setPage(1);
    }
  }, [initialReportType]);

  const query = useQuery({
    queryKey: ["admin-report-history", selectedFilterType, page],
    queryFn: () =>
      getAdminReportHistory(page, 10, selectedFilterType || undefined),
  });

  const remove = useMutation({
    mutationFn: deleteAdminReport,
    onSuccess: () => {
      toast.success("Đã xóa tài liệu báo cáo.");
      void queryClient.invalidateQueries({
        queryKey: ["admin-report-history"],
      });
    },
    onError: () => toast.error("Không thể xóa tài liệu này."),
  });

  const reports = query.data?.data.reports ?? [];
  const total = query.data?.data.total ?? 0;
  const limit = query.data?.data.limit ?? 10;

  const handleFilterChange = (newType: string) => {
    setSelectedFilterType(newType);
    setPage(1);
  };

  return (
    <Card className="overflow-hidden rounded-[28px] border border-slate-200/80 bg-white shadow-none dark:border-slate-800 dark:bg-slate-900">
      <CardHeader className="border-b border-slate-100 bg-slate-50/70 p-5 sm:p-6 dark:border-slate-800 dark:bg-slate-950/35">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
              <FileText className="size-5 text-primary" />
              <span>Lịch sử tài liệu báo cáo AI</span>
            </CardTitle>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Các báo cáo AI đã khởi tạo được lưu trữ an toàn để tra cứu, đọc lại và tải xuống định dạng PDF.
            </p>
          </div>

          {/* Report Type Filter */}
          <div className="flex items-center gap-2 self-start rounded-2xl border border-slate-200/80 bg-white p-2 sm:self-center dark:border-slate-800 dark:bg-slate-900">
            <Filter className="size-3.5 text-slate-400 shrink-0" />
            <label htmlFor="admin-report-type-filter" className="sr-only">
              Lọc theo loại báo cáo
            </label>
            <select
              id="admin-report-type-filter"
              value={selectedFilterType}
              onChange={(e) => handleFilterChange(e.target.value)}
              className="min-h-11 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-800 shadow-none outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
            >
              <option value="">Tất cả loại báo cáo</option>
              {ALL_REPORT_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-6 space-y-4">
        {/* Loading State */}
        {query.isLoading ? (
          <LoadingState size="sm" minHeight="min-h-40" label="Đang tải lịch sử báo cáo AI..." />
        ) : null}

        {/* Error State */}
        {query.isError ? (
          <ErrorState
            description="Không thể tải danh sách tài liệu báo cáo. Vui lòng kiểm tra kết nối và thử lại."
            onRetry={() => void query.refetch()}
          />
        ) : null}

        {/* Empty State */}
        {!query.isLoading && !query.isError && reports.length === 0 ? (
          <EmptyState
            title="Chưa có tài liệu báo cáo"
            description={
              selectedFilterType
                ? "Không tìm thấy báo cáo nào thuộc loại này. Vui lòng chọn loại khác hoặc tạo báo cáo mới."
                : "Báo cáo AI sau khi tạo thành công sẽ tự động hiển thị tại đây để bạn tra cứu và tải về."
            }
          />
        ) : null}

        {/* Data List */}
        {!query.isLoading && !query.isError && reports.length > 0 && (
          <div className="space-y-3">
            {reports.map((item, index) => {
              const isNewest = page === 1 && index === 0;
              const typeLabel =
                REPORT_TYPE_LABELS[item.reportType] || item.reportType;

              return (
                <div
                  key={item.id}
                  className="group relative flex flex-col gap-4 rounded-2xl border border-slate-200/80 border-l-4 border-l-slate-300 bg-white p-4 transition-colors hover:border-slate-300 hover:border-l-primary lg:flex-row lg:items-center lg:justify-between dark:border-slate-800 dark:border-l-slate-700 dark:bg-slate-950/40 dark:hover:border-slate-700 dark:hover:border-l-primary"
                >
                  {/* Left Column: Report Info */}
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="secondary" className="font-semibold text-[11px]">
                        {typeLabel}
                      </Badge>
                      <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                        {item.rangeLabel}
                      </span>
                      {isNewest ? (
                        <Badge
                          variant="default"
                          className="text-[10px] font-bold px-2 py-0.5 bg-primary/90"
                        >
                          <Sparkles className="size-2.5 mr-1" />
                          Mới nhất
                        </Badge>
                      ) : null}
                    </div>

                    {item.report?.title ? (
                      <p className="text-xs text-slate-600 dark:text-slate-300 font-medium truncate max-w-xl">
                        {item.report.title}
                      </p>
                    ) : null}

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1">
                        <Clock className="size-3 text-slate-400" />
                        {formatViDateTime(item.createdAt)}
                      </span>
                      <span className="flex items-center gap-1">
                        <User className="size-3 text-slate-400" />
                        {item.createdBy?.fullname || "Quản trị viên"}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Badge
                          variant={item.pdfUrl ? "success" : "warning"}
                          className="text-[10px] font-semibold gap-1 px-2 py-0"
                        >
                          {item.pdfUrl ? (
                            <>
                              <CheckCircle2 className="size-3 text-emerald-600 dark:text-emerald-400" />
                              <span>Sẵn sàng</span>
                            </>
                          ) : (
                            <span>Bản nháp</span>
                          )}
                        </Badge>
                      </span>
                    </div>
                  </div>

                  {/* Right Column: Actions */}
                  <div className="flex shrink-0 flex-wrap items-center gap-2 rounded-2xl border border-slate-100 bg-slate-50/70 p-2 dark:border-slate-800/80 dark:bg-slate-900/60">
                    {/* View Details Dialog */}
                    <DetailDialog
                      trigger={
                        <Button
                          variant="outline"
                          size="sm"
                          className="min-h-10 gap-1.5 rounded-xl text-xs font-semibold transition-colors hover:border-primary hover:text-primary"
                          aria-label={`Xem chi tiết báo cáo #${item.id}`}
                        >
                          <Eye className="size-3.5" />
                          <span>Chi tiết</span>
                        </Button>
                      }
                      title={item.report?.title || `Báo cáo AI #${item.id}`}
                      description={`Tổng hợp thông tin chi tiết báo cáo lưu trữ ngày ${formatViDateTime(item.createdAt)}`}
                      rows={[]}
                      body={<ReportDetailView report={item} />}
                    />

                    {/* View PDF */}
                    {item.pdfUrl ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="min-h-10 gap-1.5 rounded-xl text-xs font-semibold transition-colors hover:border-primary hover:text-primary"
                        onClick={() =>
                          void openOrDownload(
                            item.pdfUrl!,
                            false,
                          )
                        }
                        aria-label={`Mở xem file PDF báo cáo #${item.id}`}
                      >
                        <FileText className="size-3.5" />
                        <span>Xem PDF</span>
                      </Button>
                    ) : null}

                    {/* Download PDF */}
                    {item.pdfUrl ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="min-h-10 gap-1.5 rounded-xl text-xs font-semibold transition-colors"
                        onClick={() =>
                          void openOrDownload(
                            item.pdfUrl!,
                            true,
                          )
                        }
                        aria-label={`Tải xuống file PDF báo cáo #${item.id}`}
                      >
                        <FileDown className="size-3.5" />
                        <span>Tải PDF</span>
                      </Button>
                    ) : null}

                    {/* Delete Confirmation Dialog */}
                    <ConfirmDialog
                      trigger={
                        <Button
                          variant="ghost"
                          size="sm"
                          className="min-h-10 gap-1.5 rounded-xl text-xs font-semibold text-slate-500 transition-colors hover:bg-rose-50 hover:text-rose-600 dark:text-slate-400 dark:hover:bg-rose-950/40 dark:hover:text-rose-400"
                          disabled={remove.isPending}
                          aria-label={`Xóa tài liệu báo cáo #${item.id}`}
                        >
                          <Trash2 className="size-3.5 text-rose-500" />
                          <span>Xóa</span>
                        </Button>
                      }
                      title="Xóa tài liệu báo cáo AI"
                      description={`Bạn có chắc chắn muốn xóa báo cáo #${item.id} (${typeLabel} - ${item.rangeLabel})? Tài liệu cùng tệp PDF đã lưu sẽ bị xóa vĩnh viễn khỏi hệ thống.`}
                      confirmLabel="Xóa tài liệu"
                      cancelLabel="Hủy"
                      destructive={true}
                      isSubmitting={remove.isPending}
                      onConfirm={async () => {
                        await remove.mutateAsync(item.id);
                      }}
                    />
                  </div>
                </div>
              );
            })}

            {/* Pagination */}
            {total > limit ? (
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                <Pagination
                  page={page}
                  total={total}
                  limit={limit}
                  onPageChange={setPage}
                />
              </div>
            ) : null}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
