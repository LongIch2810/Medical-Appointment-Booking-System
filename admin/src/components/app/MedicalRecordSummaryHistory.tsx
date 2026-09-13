import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Download, FileText, Trash2 } from "lucide-react";
import { toast } from "react-toastify";

import { deleteMedicalRecordSummary, getMedicalRecordSummary, getMedicalRecordSummaryHistory } from "@/api/medicalRecordApi";
import axiosInstance from "@/configs/axios";
import { EmptyState } from "@/components/app/EmptyState";
import { ErrorState } from "@/components/app/ErrorState";
import { LoadingState } from "@/components/app/LoadingState";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { MedicalRecordSummaryData } from "@/types/interface/medicalRecord.interface";

async function downloadFile(path: string, fileName: string) {
  const response = await axiosInstance.get<Blob>(path.replace(/^\/api\/v1/, ""), { responseType: "blob" });
  const url = URL.createObjectURL(response.data);
  const link = document.createElement("a"); link.href = url; link.download = fileName; link.click(); URL.revokeObjectURL(url);
}

export function MedicalRecordSummaryHistory({ onSelect }: { onSelect: (data: MedicalRecordSummaryData & { id: number; createdAt: string; inputMode: string }) => void }) {
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ["medical-record-summary-history", page], queryFn: () => getMedicalRecordSummaryHistory(page, 10) });
  const remove = useMutation({ mutationFn: deleteMedicalRecordSummary, onSuccess: () => { toast.success("Đã xóa bản tóm tắt."); void queryClient.invalidateQueries({ queryKey: ["medical-record-summary-history"] }); }, onError: () => toast.error("Không thể xóa bản tóm tắt.") });

  return <Card className="rounded-3xl border-slate-200/80 bg-white shadow-2xs dark:border-slate-800 dark:bg-slate-900">
    <CardHeader className="border-b border-slate-100 dark:border-slate-800"><CardTitle className="flex items-center gap-2 text-lg"><FileText className="size-5 text-primary" />Lịch sử tài liệu</CardTitle><p className="text-sm text-slate-500">Chọn bản cũ để hiển thị lại Markdown và tải file nguồn.</p></CardHeader>
    <CardContent className="space-y-2 p-4 sm:p-6">
      {query.isLoading ? <LoadingState size="sm" minHeight="min-h-32" label="Đang tải lịch sử..." /> : null}
      {query.isError ? <ErrorState description="Không thể tải lịch sử tóm tắt." onRetry={() => void query.refetch()} /> : null}
      {!query.isLoading && !query.isError && (query.data?.data.summaries.length ?? 0) === 0 ? <EmptyState title="Chưa có bản tóm tắt cũ" description="Bản tóm tắt tạo thành công sẽ được lưu tại đây." /> : null}
      {query.data?.data.summaries.map((item) => <div key={item.id} className="flex flex-col gap-3 rounded-2xl border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800"><div><p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{new Date(item.createdAt).toLocaleString("vi-VN")}</p><p className="text-xs text-slate-500">Nguồn: {item.sourceFiles.length} tệp · {item.inputMode === "pdf" ? "PDF" : "hình ảnh"}</p></div><div className="flex flex-wrap gap-2"><Button size="sm" variant="outline" onClick={async () => { try { onSelect((await getMedicalRecordSummary(item.id)).data); } catch { toast.error("Không thể mở bản tóm tắt."); } }}>Xem lại</Button><Button size="sm" variant="outline" className="gap-1.5" onClick={() => void downloadFile(item.pdfUrl, `tom-tat-benh-an-${item.id}.pdf`)}><Download className="size-4" />PDF</Button><Button size="sm" variant="ghost" className="gap-1.5 text-rose-600" onClick={() => { if (window.confirm("Xóa bản tóm tắt và các file nguồn?")) remove.mutate(item.id); }}><Trash2 className="size-4" />Xóa</Button></div></div>)}
      {(query.data?.data.totalPages ?? 0) > 1 ? <div className="mt-4 flex items-center justify-between"><Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((value) => value - 1)}>Trang trước</Button><span className="text-xs text-slate-500">Trang {page}/{query.data?.data.totalPages}</span><Button variant="outline" size="sm" disabled={page === query.data?.data.totalPages} onClick={() => setPage((value) => value + 1)}>Trang sau</Button></div> : null}
    </CardContent>
  </Card>;
}
