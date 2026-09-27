import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Calendar,
  Download,
  ExternalLink,
  Eye,
  FileClock,
  FileText,
  RefreshCw,
  Sparkles,
  User as UserIcon,
} from "lucide-react";
import { toast } from "react-toastify";

import { ActionCell, GenericList } from "@/components/app/GenericList";
import { FilterBar } from "@/components/app/FilterBar";
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
import { useAdminReportHistory } from "@/hooks/useAdminReports";
import type { AdminReport } from "@/types/interface/adminReport.interface";
import { openAdminReportFile } from "@/utils/open-admin-report-file";

const REPORT_TYPE_OPTIONS = [
  { value: "CONVERSATIONAL", label: "Trợ lý AI (Hội thoại)" },
  { value: "", label: "Tất cả loại báo cáo" },
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
        <Sparkles className="mr-1 size-3" aria-hidden="true" />
        Trợ lý AI
      </Badge>
    );
  }

  return (
    <Badge
      variant="outline"
      className="border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
    >
      <FileText className="mr-1 size-3" aria-hidden="true" />
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader
          eyebrow="Quản trị AI & Báo cáo"
          title="Lịch sử báo cáo"
          description="Tra cứu, xem trước số liệu phân tích và tải lại các tệp PDF do Trợ lý AI và hệ thống quản trị tạo."
        />
        <div className="flex shrink-0 items-center gap-2">
          <Button asChild variant="outline" className="gap-2 rounded-xl shadow-2xs">
            <Link to="/admin/ai-report-assistant">
              <Sparkles className="size-4 text-primary" aria-hidden="true" />
              <span>Tạo báo cáo với AI</span>
            </Link>
          </Button>
        </div>
      </div>

      <FilterBar
        hasActiveFilters={reportTypeFilter !== "CONVERSATIONAL"}
        onReset={() => {
          setReportTypeFilter("CONVERSATIONAL");
          setPage(1);
        }}
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
            size="sm"
            onClick={() => void refetch()}
            disabled={isFetching}
            className="h-9 gap-1.5 rounded-xl border-slate-200 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 dark:border-slate-800 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <RefreshCw
              className={`size-3.5 ${isFetching ? "animate-spin text-primary" : ""}`}
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
              <span className="font-mono text-xs font-semibold text-slate-500 dark:text-slate-400">
                #{row.id}
              </span>
            ),
          },
          {
            key: "title",
            label: "Tiêu đề & Yêu cầu",
            render: (row) => (
              <div className="max-w-md space-y-1">
                <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
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
            key: "reportType",
            label: "Loại báo cáo",
            render: (row) => formatReportTypeBadge(row.reportType),
          },
          {
            key: "rangeLabel",
            label: "Kỳ dữ liệu",
            render: (row) => (
              <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300">
                <Calendar className="size-3.5 text-slate-400" aria-hidden="true" />
                <span className="font-medium">{row.rangeLabel}</span>
              </div>
            ),
          },
          {
            key: "createdBy",
            label: "Người tạo",
            render: (row) => (
              <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300">
                <UserIcon className="size-3.5 text-slate-400" aria-hidden="true" />
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
              <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                <FileClock className="size-3.5 text-slate-400" aria-hidden="true" />
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
                  className="h-8 gap-1 rounded-lg border-slate-200 px-2.5 text-xs font-semibold text-slate-700 shadow-2xs hover:border-primary/40 hover:bg-primary/5 hover:text-primary dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                  title="Xem toàn bộ nội dung phân tích, biểu đồ và câu SQL"
                >
                  <Eye className="size-3.5" aria-hidden="true" />
                  <span>Xem chi tiết</span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenPdf(row)}
                  disabled={!row.pdfUrl}
                  className="h-8 gap-1 rounded-lg border-slate-200 px-2.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                  title={
                    row.pdfUrl
                      ? "Mở tệp PDF trong tab mới"
                      : "Chưa có bản in PDF trên máy chủ"
                  }
                >
                  <ExternalLink className="size-3.5 text-slate-500" aria-hidden="true" />
                  <span>Mở PDF</span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownloadPdf(row)}
                  disabled={!row.pdfUrl}
                  className="h-8 gap-1 rounded-lg border-slate-200 px-2.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                  title={
                    row.pdfUrl
                      ? "Tải tệp PDF về máy tính"
                      : "Chưa có bản in PDF trên máy chủ"
                  }
                >
                  <Download className="size-3.5 text-slate-500" aria-hidden="true" />
                  <span>Tải PDF</span>
                </Button>
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
