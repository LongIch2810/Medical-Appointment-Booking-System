import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  ExternalLink,
  Eye,
  FileClock,
  FileText,
  Plus,
  RefreshCw,
  Trash2,
  User as UserIcon,
} from "lucide-react";
import { toast } from "react-toastify";

import { ConfirmDialog } from "@/components/app/ConfirmDialog";
import { FilterBar } from "@/components/app/FilterBar";
import { ActionCell, GenericList } from "@/components/app/GenericList";
import { PageHeader } from "@/components/app/PageHeader";
import { ReportAssistantPreview } from "@/components/app/ReportAssistantPreview";
import { SelectFilter } from "@/components/app/SelectFilter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  useAdminReportHistory,
  useDeleteAdminReport,
} from "@/hooks/useAdminReports";
import type { AdminReport } from "@/types/interface/adminReport.interface";
import { openAdminReportFile } from "@/utils/open-admin-report-file";

const REPORT_TYPE_OPTIONS = [
  { value: "CONVERSATIONAL", label: "Trợ lý AI (Hội thoại)" },
  { value: "NEW_USER_REGISTRATIONS", label: "Người dùng mới đăng ký" },
  { value: "AI_COACH_ACTIVITY", label: "Hoạt động AI Coach" },
  { value: "HEALTH_TRENDS", label: "Xu hướng sức khỏe" },
  { value: "BOOKING_CANCELLATION_NOSHOW", label: "Tỷ lệ hủy & vắng mặt" },
  { value: "PATIENT_FLOW_BY_TIMESLOT", label: "Lưu lượng theo khung giờ" },
  { value: "APPOINTMENTS_BY_SPECIALTY", label: "Lịch hẹn theo chuyên khoa" },
  { value: "DOCTOR_FILL_RATE", label: "Tỷ lệ lấp đầy lịch khám" },
  { value: "USER_DEMOGRAPHICS", label: "Nhân khẩu học người dùng" },
];


function formatReportTypeBadge(type: string) {
  if (type === "CONVERSATIONAL") {
    return (
      <Badge
        variant="outline"
        className="border-emerald-500/30 bg-emerald-50 text-[11px] font-semibold text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-950/40 dark:text-emerald-300"
      >
        <FileText className="mr-1 size-3 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
        Trợ lý AI
      </Badge>
    );
  }

  return (
    <Badge
      variant="outline"
      className="border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
    >
      <FileText className="mr-1 size-3 text-slate-400" aria-hidden="true" />
      {type}
    </Badge>
  );
}

export function AdminReportHistoryPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [reportTypeFilter, setReportTypeFilter] = useState("CONVERSATIONAL");
  const [previewReport, setPreviewReport] = useState<AdminReport | null>(null);

  const queryParams = {
    page,
    limit,
    ...(reportTypeFilter ? { reportType: reportTypeFilter } : {}),
  };

  const { data, isLoading, isError, refetch, isFetching } =
    useAdminReportHistory(queryParams);

  const deleteReportMutation = useDeleteAdminReport();

  const handleOpenPdf = async (report: AdminReport) => {
    if (!report.pdfUrl) {
      toast.info("Bản in PDF chưa sẵn sàng cho báo cáo này.");
      return;
    }
    try {
      await openAdminReportFile(report.id, false);
    } catch {
      toast.error("Không thể mở PDF. Vui lòng thử lại.");
    }
  };

  const handleDownloadPdf = async (report: AdminReport) => {
    if (!report.pdfUrl) {
      toast.info("Bản in PDF chưa sẵn sàng cho báo cáo này.");
      return;
    }
    try {
      await openAdminReportFile(report.id, true);
    } catch {
      toast.error("Không thể tải PDF. Vui lòng thử lại.");
    }
  };

  const reports = data?.data?.reports ?? [];
  const total = data?.data?.total ?? 0;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Quản trị AI & Báo cáo"
        title="Lịch sử báo cáo"
        description="Tra cứu, xem trước số liệu phân tích và tải lại các tệp PDF do Trợ lý AI và hệ thống quản trị tạo."
        extra={
          <Button
            asChild
            className="h-11 min-h-[44px] min-w-[160px] gap-2 rounded-xl px-5 text-sm font-semibold shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            <Link
              to="/admin/ai-report-assistant"
              className="flex items-center justify-center gap-2 text-center"
              aria-label="Tạo báo cáo với AI"
            >
              <Plus className="size-4 shrink-0" aria-hidden="true" />
              <span>Tạo báo cáo với AI</span>
            </Link>
          </Button>
        }
      />


      <FilterBar
        hasActiveFilters={Boolean(reportTypeFilter)}
        activeFilterCount={reportTypeFilter ? 1 : 0}
        onReset={() => {
          setReportTypeFilter("CONVERSATIONAL");
          setPage(1);
        }}
        chips={
          reportTypeFilter
            ? [
                {
                  id: "reportType",
                  label: `Loại: ${
                    REPORT_TYPE_OPTIONS.find(
                      (opt) => opt.value === reportTypeFilter,
                    )?.label || reportTypeFilter
                  }`,
                  onRemove: () => {
                    setReportTypeFilter("");
                    setPage(1);
                  },
                },
              ]
            : []
        }
      >
        <SelectFilter
          id="admin-report-type-filter"
          label="Loại báo cáo"
          value={reportTypeFilter}
          onChange={(value) => {
            setReportTypeFilter(value);
            setPage(1);
          }}
          options={REPORT_TYPE_OPTIONS}
          placeholder="Tất cả loại báo cáo"
        />
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => void refetch()}
            disabled={isFetching}
            className="h-11 min-h-[44px] min-w-[44px] gap-2 rounded-xl border-slate-200 px-4 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:border-slate-800 dark:text-slate-200 dark:hover:bg-slate-800 cursor-pointer"
            aria-label="Làm mới danh sách báo cáo"
          >
            <RefreshCw
              className={`size-4 ${isFetching ? "animate-spin text-primary" : ""}`}
              aria-hidden="true"
            />
            <span>Làm mới</span>
          </Button>
        </div>
      </FilterBar>

      <GenericList
        title="Bản ghi báo cáo"
        description="Danh sách các báo cáo đã tạo theo thứ tự thời gian mới nhất trước"
        rows={reports}
        total={total}
        page={page}
        limit={limit}
        onPageChange={setPage}
        onLimitChange={(newLimit) => {
          setLimit(newLimit);
          setPage(1);
        }}
        isLoading={isLoading}
        isError={isError}
        onRetry={() => void refetch()}
        rowKey={(row) => row.id}
        emptyTitle="Chưa có báo cáo nào"
        emptyDescription={
          reportTypeFilter === "CONVERSATIONAL"
            ? "Chưa có báo cáo nào do Trợ lý AI tạo. Bạn có thể sử dụng màn hình 'Trợ lý báo cáo AI' để bắt đầu tạo báo cáo mới."
            : "Không tìm thấy báo cáo nào trong hệ thống khớp với bộ lọc hiện tại."
        }
        columns={[
          {
            key: "id",
            label: "Mã",
            render: (row) => (
              <span className="font-mono text-xs font-bold text-slate-500 dark:text-slate-400">
                #{row.id}
              </span>
            ),
          },
          {
            key: "title",
            label: "Tên báo cáo & Yêu cầu",
            render: (row) => (
              <div className="min-w-[220px] max-w-sm space-y-1">
                <div className="text-sm font-bold text-slate-900 dark:text-slate-100 line-clamp-2">
                  {row.report?.title ||
                    (row.reportType === "CONVERSATIONAL"
                      ? "Báo cáo phân tích quản trị AI"
                      : "Báo cáo quản trị")}
                </div>
                {row.sourceRequest && (
                  <p
                    className="line-clamp-2 text-xs italic text-slate-500 dark:text-slate-400"
                    title={row.sourceRequest}
                  >
                    &ldquo;{row.sourceRequest}&rdquo;
                  </p>
                )}
              </div>
            ),
          },
          {
            key: "rangeLabel",
            label: "Khoảng thời gian",
            render: (row) => (
              <div className="flex min-w-[130px] items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300">
                <Calendar className="size-3.5 text-slate-400 shrink-0" aria-hidden="true" />
                <span className="font-medium">{row.rangeLabel}</span>
              </div>
            ),
          },
          {
            key: "reportType",
            label: "Loại báo cáo",
            render: (row) => (
              <div className="min-w-[120px]">
                {formatReportTypeBadge(row.reportType)}
              </div>
            ),
          },
          {
            key: "status",
            label: "Trạng thái",
            render: (row) => (
              <div className="min-w-[120px]">
                {row.pdfUrl ? (
                  <Badge
                    variant="success"
                    className="gap-1 border-emerald-200/80 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:border-emerald-800/80 dark:bg-emerald-950/40 dark:text-emerald-300"
                  >
                    <CheckCircle2 className="size-3.5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                    <span>Sẵn sàng PDF</span>
                  </Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className="gap-1 border-dashed border-slate-300 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-400"
                  >
                    <Clock className="size-3.5 text-slate-400" aria-hidden="true" />
                    <span>Chưa có PDF</span>
                  </Badge>
                )}
              </div>
            ),
          },
          {
            key: "createdBy",
            label: "Người tạo",
            render: (row) => (
              <div className="flex min-w-[130px] items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300">
                <UserIcon className="size-3.5 text-slate-400 shrink-0" aria-hidden="true" />
                <span className="font-medium">
                  {row.createdBy?.fullname || "Hệ thống"}
                </span>
              </div>
            ),
          },
          {
            key: "createdAt",
            label: "Thời gian tạo",
            render: (row) => (
              <div className="flex min-w-[130px] items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                <FileClock className="size-3.5 text-slate-400 shrink-0" aria-hidden="true" />
                <span>{row.createdAt}</span>
              </div>
            ),
          },
          {
            key: "actions",
            label: "Thao tác",
            render: (row) => (
              <ActionCell>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPreviewReport(row)}
                  className="h-11 min-h-[44px] min-w-[44px] gap-1.5 rounded-xl border-slate-200 px-3 text-xs font-semibold text-slate-700 shadow-2xs hover:border-primary/40 hover:bg-primary/5 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 cursor-pointer"
                  title="Xem toàn bộ nội dung phân tích, biểu đồ và câu SQL"
                  aria-label={`Xem chi tiết báo cáo #${row.id}`}
                >
                  <Eye className="size-4" aria-hidden="true" />
                  <span>Xem chi tiết</span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenPdf(row)}
                  disabled={!row.pdfUrl}
                  className="h-11 min-h-[44px] min-w-[44px] gap-1.5 rounded-xl border-slate-200 px-3 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 cursor-pointer"
                  title={
                    row.pdfUrl
                      ? "Mở tệp PDF trong tab mới"
                      : "Chưa có bản in PDF trên máy chủ"
                  }
                  aria-label={`Mở PDF báo cáo #${row.id}`}
                >
                  <ExternalLink className="size-4 text-slate-500" aria-hidden="true" />
                  <span>Mở PDF</span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownloadPdf(row)}
                  disabled={!row.pdfUrl}
                  className="h-11 min-h-[44px] min-w-[44px] gap-1.5 rounded-xl border-slate-200 px-3 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 cursor-pointer"
                  title={
                    row.pdfUrl
                      ? "Tải tệp PDF về máy tính"
                      : "Chưa có bản in PDF trên máy chủ"
                  }
                  aria-label={`Tải PDF báo cáo #${row.id}`}
                >
                  <Download className="size-4 text-slate-500" aria-hidden="true" />
                  <span>Tải PDF</span>
                </Button>
                <ConfirmDialog
                  title={`Xóa báo cáo #${row.id}?`}
                  description={`Bạn có chắc chắn muốn xóa vĩnh viễn báo cáo "${row.report?.title || row.rangeLabel}"? Bản ghi và tệp PDF trên máy chủ sẽ bị gỡ bỏ.`}
                  confirmLabel="Xóa báo cáo"
                  cancelLabel="Hủy"
                  destructive
                  isSubmitting={deleteReportMutation.isPending}
                  onConfirm={() => deleteReportMutation.mutateAsync(row.id)}
                  trigger={
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-11 min-h-[44px] min-w-[44px] gap-1.5 rounded-xl border-slate-200 px-3 text-xs font-semibold text-rose-600 shadow-2xs hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2 dark:border-slate-700 dark:text-rose-400 dark:hover:bg-rose-950/40 cursor-pointer"
                      title="Xóa báo cáo này khỏi hệ thống"
                      aria-label={`Xóa báo cáo #${row.id}`}
                    >
                      <Trash2 className="size-4 text-rose-500" aria-hidden="true" />
                      <span>Xóa</span>
                    </Button>
                  }
                />
              </ActionCell>
            ),
          },
        ]}
      />

      {/* Preview modal reusing ReportAssistantPreview */}
      <Dialog
        open={previewReport !== null}
        onOpenChange={(open) => {
          if (!open) setPreviewReport(null);
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto rounded-3xl p-6 sm:p-8 dark:border-slate-800 dark:bg-slate-950">
          <DialogHeader className="border-b border-slate-100 pb-4 dark:border-slate-800">
            <DialogTitle className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-slate-100">
              <FileClock className="size-5 text-primary" aria-hidden="true" />
              <span>Chi tiết báo cáo #{previewReport?.id}</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 dark:text-slate-400">
              Bản xem trước trực quan dữ liệu phân tích, biểu đồ và truy vấn SQL của báo cáo.
            </DialogDescription>
          </DialogHeader>

          {previewReport && (
            <div className="pt-2">
              <ReportAssistantPreview report={previewReport} />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
export default AdminReportHistoryPage;
