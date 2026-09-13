import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { FileText, Loader2, Trash2 } from "lucide-react";
import { toast } from "react-toastify";

import { deleteAdminReport, getAdminReportHistory } from "@/api/adminReportApi";
import axiosInstance from "@/configs/axios";
import { EmptyState } from "@/components/app/EmptyState";
import { ErrorState } from "@/components/app/ErrorState";
import { LoadingState } from "@/components/app/LoadingState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AdminReportType } from "@/types/interface/adminReport.interface";

async function openOrDownload(path: string, fileName: string, download: boolean) {
  const apiPath = path.replace(/^\/api\/v1/, "");
  const response = await axiosInstance.get<Blob>(apiPath, { params: { download }, responseType: "blob" });
  const url = URL.createObjectURL(response.data);
  if (download) {
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
  } else {
    window.open(url, "_blank", "noopener,noreferrer");
  }
}

export function AiReportHistory({ reportType }: { reportType?: AdminReportType }) {
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ["admin-report-history", reportType, page], queryFn: () => getAdminReportHistory(page, 10, reportType) });
  const remove = useMutation({
    mutationFn: deleteAdminReport,
    onSuccess: () => { toast.success("Đã xóa tài liệu báo cáo."); void queryClient.invalidateQueries({ queryKey: ["admin-report-history"] }); },
    onError: () => toast.error("Không thể xóa tài liệu này.")
  });

  return (
    <Card className="rounded-3xl border-slate-200/80 bg-white shadow-2xs dark:border-slate-800 dark:bg-slate-900">
      <CardHeader className="border-b border-slate-100 dark:border-slate-800">
        <CardTitle className="flex items-center gap-2 text-lg"><FileText className="size-5 text-primary" />Lịch sử tài liệu báo cáo AI</CardTitle>
        <p className="text-sm text-slate-500 dark:text-slate-400">Các báo cáo đã tạo được lưu riêng tư để mở hoặc tải lại.</p>
      </CardHeader>
      <CardContent className="p-4 sm:p-6">
        {query.isLoading ? <LoadingState size="sm" minHeight="min-h-32" label="Đang tải lịch sử..." /> : null}
        {query.isError ? <ErrorState description="Không thể tải lịch sử báo cáo." onRetry={() => void query.refetch()} /> : null}
        {!query.isLoading && !query.isError && (query.data?.data.reports.length ?? 0) === 0 ? <EmptyState title="Chưa có tài liệu báo cáo" description="Báo cáo AI tạo thành công sẽ xuất hiện tại đây." /> : null}
        <div className="space-y-2">
          {query.data?.data.reports.map((item) => (
            <div key={item.id} className="flex flex-col gap-3 rounded-2xl border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
              <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><Badge variant="secondary">{item.reportType}</Badge><span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{item.rangeLabel}</span></div><p className="mt-1 text-xs text-slate-500">{new Date(item.createdAt).toLocaleString("vi-VN")} · {item.createdBy?.fullname || "Người dùng"}</p></div>
              <div className="flex shrink-0 flex-wrap gap-2">
                {item.pdfUrl ? <Button variant="outline" size="sm" className="gap-1.5" onClick={() => void openOrDownload(item.pdfUrl!, `bao-cao-${item.id}.pdf`, false)}><FileText className="size-4" />Xem PDF</Button> : null}
                {item.pdfUrl ? <Button variant="outline" size="sm" className="gap-1.5" onClick={() => void openOrDownload(item.pdfUrl!, `bao-cao-${item.id}.pdf`, true)}><FileText className="size-4" />Tải xuống</Button> : null}
                <Button variant="ghost" size="sm" className="gap-1.5 text-rose-600 hover:text-rose-700" disabled={remove.isPending} onClick={() => { if (window.confirm("Xóa tài liệu báo cáo này?")) remove.mutate(item.id); }}><Trash2 className="size-4" />Xóa</Button>
              </div>
            </div>
          ))}
        </div>
        {(query.data?.data.totalPages ?? 0) > 1 ? <div className="mt-4 flex items-center justify-between"><Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((value) => value - 1)}>Trang trước</Button><span className="text-xs text-slate-500">Trang {page}/{query.data?.data.totalPages}</span><Button variant="outline" size="sm" disabled={page === query.data?.data.totalPages} onClick={() => setPage((value) => value + 1)}>Trang sau</Button></div> : null}
        {remove.isPending ? <p className="mt-3 flex items-center gap-2 text-xs text-slate-500"><Loader2 className="size-3 animate-spin" />Đang xóa tài liệu...</p> : null}
      </CardContent>
    </Card>
  );
}
