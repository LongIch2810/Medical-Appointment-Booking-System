import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  CheckCircle2,
  Clock,
  Download,
  Eye,
  FileDown,
  FileImage,
  FileText,
  Loader2,
  Sparkles,
  Trash2,
} from "lucide-react";
import { toast } from "react-toastify";

import {
  deleteMedicalRecordSummary,
  getMedicalRecordSummary,
  getMedicalRecordSummaryHistory,
} from "@/api/medicalRecordApi";
import axiosInstance from "@/configs/axios";
import { ConfirmDialog } from "@/components/app/ConfirmDialog";
import { EmptyState } from "@/components/app/EmptyState";
import { ErrorState } from "@/components/app/ErrorState";
import { LoadingState } from "@/components/app/LoadingState";
import { Pagination } from "@/components/app/Pagination";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { MedicalRecordSummaryData } from "@/types/interface/medicalRecord.interface";

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

function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

async function downloadFile(path: string, fileName: string) {
  if (!path) return;
  const apiPath = path.replace(/^\/api\/v1/, "");
  const response = await axiosInstance.get<Blob>(apiPath, {
    responseType: "blob",
  });
  const url = URL.createObjectURL(response.data);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

export function MedicalRecordSummaryHistory({
  onSelect,
  selectedId,
}: {
  onSelect: (
    data: MedicalRecordSummaryData & {
      id: number;
      createdAt: string;
      inputMode: string;
    },
  ) => void;
  selectedId?: number;
}) {
  const [page, setPage] = useState(1);
  const [loadingSummaryId, setLoadingSummaryId] = useState<number | null>(null);
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["medical-record-summary-history", page],
    queryFn: () => getMedicalRecordSummaryHistory(page, 10),
  });

  const remove = useMutation({
    mutationFn: deleteMedicalRecordSummary,
    onSuccess: () => {
      toast.success("Đã xóa bản tóm tắt và các file liên quan.");
      void queryClient.invalidateQueries({
        queryKey: ["medical-record-summary-history"],
      });
    },
    onError: () => toast.error("Không thể xóa bản tóm tắt này."),
  });

  const summaries = query.data?.data.summaries ?? [];
  const total = query.data?.data.total ?? 0;
  const limit = query.data?.data.limit ?? 10;

  const handleSelectRecord = async (id: number) => {
    try {
      setLoadingSummaryId(id);
      const res = await getMedicalRecordSummary(id);
      onSelect(res.data);
    } catch {
      toast.error("Không thể mở lại nội dung tóm tắt của bản ghi này.");
    } finally {
      setLoadingSummaryId(null);
    }
  };

  return (
    <Card className="overflow-hidden rounded-[28px] border border-slate-200/80 bg-white shadow-none dark:border-slate-800 dark:bg-slate-900">
      <CardHeader className="border-b border-slate-100 bg-slate-50/70 p-5 sm:p-6 dark:border-slate-800 dark:bg-slate-950/35">
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
            <FileText className="size-5 text-primary" />
            <span>Lịch sử tóm tắt bệnh án</span>
          </CardTitle>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Xem lại các bản tóm tắt đã thực hiện trước đây, tải lại file bệnh án nguồn hoặc tải tài liệu PDF tổng hợp.
          </p>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-6 space-y-4">
        {/* Loading State */}
        {query.isLoading ? (
          <LoadingState
            size="sm"
            minHeight="min-h-40"
            label="Đang tải lịch sử tóm tắt bệnh án..."
          />
        ) : null}

        {/* Error State */}
        {query.isError ? (
          <ErrorState
            description="Không thể tải danh sách tóm tắt bệnh án. Vui lòng kiểm tra lại kết nối."
            onRetry={() => void query.refetch()}
          />
        ) : null}

        {/* Empty State */}
        {!query.isLoading && !query.isError && summaries.length === 0 ? (
          <EmptyState
            title="Chưa có bản tóm tắt cũ"
            description="Các bản tóm tắt bệnh án do AI phân tích thành công sẽ được lưu trữ an toàn tại đây."
          />
        ) : null}

        {/* List of Summaries */}
        {!query.isLoading && !query.isError && summaries.length > 0 && (
          <div className="space-y-3">
            {summaries.map((item, index) => {
              const isSelected = selectedId === item.id;
              const isNewest = page === 1 && index === 0;
              const isPdfMode = item.inputMode === "pdf";

              return (
                <div
                  key={item.id}
                  className={`group relative flex flex-col gap-4 rounded-2xl border border-l-4 p-4 transition-colors lg:flex-row lg:items-center lg:justify-between ${
                    isSelected
                      ? "border-primary border-l-primary bg-primary/[0.03] ring-2 ring-primary/20 dark:border-primary dark:bg-primary/[0.05]"
                      : "border-slate-200/80 border-l-slate-300 bg-white hover:border-slate-300 hover:border-l-primary dark:border-slate-800 dark:border-l-slate-700 dark:bg-slate-950/40 dark:hover:border-slate-700 dark:hover:border-l-primary"
                  }`}
                >
                  {/* Left Column: Summary Record Information */}
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                        Bản tóm tắt #{item.id}
                      </span>

                      <Badge
                        variant="secondary"
                        className="gap-1 text-[11px] font-semibold"
                      >
                        {isPdfMode ? (
                          <FileText className="size-3 text-red-500" />
                        ) : (
                          <FileImage className="size-3 text-blue-500" />
                        )}
                        <span>{isPdfMode ? "Tài liệu PDF" : "Tập hình ảnh"}</span>
                      </Badge>

                      <Badge
                        variant="success"
                        className="gap-1 text-[10px] font-semibold px-2 py-0"
                      >
                        <CheckCircle2 className="size-3 text-emerald-600 dark:text-emerald-400" />
                        <span>Đã tóm tắt</span>
                      </Badge>

                      {isSelected ? (
                        <Badge
                          variant="default"
                          className="bg-primary text-[10px] font-bold px-2 py-0.5"
                        >
                          Đang xem
                        </Badge>
                      ) : null}

                      {isNewest && !isSelected ? (
                        <Badge
                          variant="outline"
                          className="border-primary/40 text-primary text-[10px] font-bold px-2 py-0.5"
                        >
                          <Sparkles className="size-2.5 mr-1" />
                          Mới nhất
                        </Badge>
                      ) : null}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1">
                        <Clock className="size-3 text-slate-400" />
                        {formatViDateTime(item.createdAt)}
                      </span>
                      <span>
                        Số tệp nguồn:{" "}
                        <strong className="text-slate-700 dark:text-slate-300">
                          {item.sourceFiles.length} tệp
                        </strong>
                      </span>
                    </div>

                    {/* Source Files Chip List */}
                    {item.sourceFiles && item.sourceFiles.length > 0 ? (
                      <div className="pt-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mr-1">
                            Tệp bệnh án gốc:
                          </span>
                          {item.sourceFiles.map((file, fileIdx) => {
                            const hasUrl = !!file.fileUrl;
                            return (
                              <button
                                key={file.id || fileIdx}
                                type="button"
                                disabled={!hasUrl}
                                onClick={() =>
                                  hasUrl &&
                                  void downloadFile(
                                    file.fileUrl!,
                                    file.fileName,
                                  )
                                }
                                title={
                                  hasUrl
                                    ? `Nhấn để tải tệp gốc: ${file.fileName} (${formatBytes(file.bytes)})`
                                    : file.fileName
                                }
                                aria-label={`Tải tệp nguồn ${file.fileName}`}
                                className={`inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 text-[11px] font-medium transition-colors ${
                                  hasUrl
                                    ? "border-slate-200 bg-slate-50 text-slate-700 hover:border-primary/40 hover:bg-primary/5 hover:text-primary dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-primary/50 cursor-pointer"
                                    : "border-slate-100 bg-slate-50 text-slate-400 dark:border-slate-800 dark:bg-slate-900/50 cursor-not-allowed"
                                }`}
                              >
                                <FileText className="size-3 shrink-0 opacity-70" />
                                <span className="max-w-[130px] sm:max-w-[180px] truncate">
                                  {file.fileName}
                                </span>
                                <span className="text-[10px] text-slate-400 shrink-0">
                                  ({formatBytes(file.bytes)})
                                </span>
                                {hasUrl ? (
                                  <Download className="size-2.5 ml-0.5 opacity-60" />
                                ) : null}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ) : null}
                  </div>

                  {/* Right Column: Actions */}
                  <div className="flex shrink-0 flex-wrap items-center gap-2 rounded-2xl border border-slate-100 bg-slate-50/70 p-2 dark:border-slate-800/80 dark:bg-slate-900/60">
                    {/* View/Reload into active result */}
                    <Button
                      variant={isSelected ? "default" : "outline"}
                      size="sm"
                      disabled={loadingSummaryId === item.id}
                      onClick={() => handleSelectRecord(item.id)}
                      className="min-h-10 gap-1.5 rounded-xl text-xs font-semibold transition-colors"
                      aria-label={`Hiển thị lại bản tóm tắt #${item.id} trên màn hình`}
                    >
                      {loadingSummaryId === item.id ? (
                        <>
                          <Loader2 className="size-3.5 animate-spin" />
                          <span>Đang tải...</span>
                        </>
                      ) : (
                        <>
                          <Eye className="size-3.5" />
                          <span>{isSelected ? "Đang hiển thị" : "Xem lại"}</span>
                        </>
                      )}
                    </Button>

                    {/* Download result PDF */}
                    {item.pdfUrl ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="min-h-10 gap-1.5 rounded-xl text-xs font-semibold transition-colors"
                        onClick={() =>
                          void downloadFile(
                            item.pdfUrl,
                            item.fileName || `tom-tat-benh-an-${item.id}.pdf`,
                          )
                        }
                        aria-label={`Tải tệp PDF kết quả tóm tắt #${item.id}`}
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
                          aria-label={`Xóa bản tóm tắt #${item.id}`}
                        >
                          <Trash2 className="size-3.5 text-rose-500" />
                          <span>Xóa</span>
                        </Button>
                      }
                      title="Xóa bản tóm tắt bệnh án"
                      description={`Bạn có chắc chắn muốn xóa bản tóm tắt bệnh án #${item.id} cùng toàn bộ ${item.sourceFiles.length} tệp nguồn đính kèm? Dữ liệu đã xóa sẽ không thể khôi phục lại.`}
                      confirmLabel="Xóa tóm tắt"
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
