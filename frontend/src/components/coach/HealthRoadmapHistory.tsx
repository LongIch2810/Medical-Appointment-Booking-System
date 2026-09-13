import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Download, FileText, Trash2 } from "lucide-react";
import { toast } from "react-toastify";

import { deleteHealthRoadmap, getHealthRoadmapHistory } from "@/api/healthRoadmapApi";
import axiosInstance from "@/configs/axios";
import ErrorState from "@/components/notification/ErrorState";
import StateCard from "@/components/notification/StateCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function HealthRoadmapHistory({ relativeId }: { relativeId?: number }) {
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ["health-roadmap-history", relativeId, page], queryFn: () => getHealthRoadmapHistory(page, 10, relativeId) });
  const remove = useMutation({ mutationFn: deleteHealthRoadmap, onSuccess: () => { toast.success("Đã xóa lộ trình sức khỏe."); void queryClient.invalidateQueries({ queryKey: ["health-roadmap-history"] }); }, onError: () => toast.error("Không thể xóa lộ trình này.") });
  const download = async (path: string, fileName: string) => {
    const response = await axiosInstance.get<Blob>(path.replace(/^\/api\/v1/, ""), { responseType: "blob" });
    const url = URL.createObjectURL(response.data); const link = document.createElement("a"); link.href = url; link.download = fileName; link.click(); URL.revokeObjectURL(url);
  };

  return <Card className="border-slate-200/80 bg-white shadow-sm dark:border-slate-800/80 dark:bg-slate-900">
    <CardHeader className="border-b border-slate-100 dark:border-slate-800"><CardTitle className="flex items-center gap-2 text-lg"><FileText className="size-5 text-primary" />Lịch sử lộ trình sức khỏe</CardTitle><p className="text-sm text-slate-500 dark:text-slate-400">Các lộ trình AI đã tạo cho tài khoản và hồ sơ được chọn.</p></CardHeader>
    <CardContent className="space-y-2 p-4 sm:p-6">
      {query.isLoading ? <div className="animate-pulse rounded-xl bg-slate-100 py-12 dark:bg-slate-800" aria-label="Đang tải lịch sử" /> : null}
      {query.isError ? <ErrorState description="Không thể tải lịch sử lộ trình." onRetry={() => void query.refetch()} /> : null}
      {!query.isLoading && !query.isError && (query.data?.data.roadmaps.length ?? 0) === 0 ? <StateCard icon={<FileText className="size-7" />} title="Chưa có lộ trình cũ" description="Lộ trình tạo thành công sẽ được lưu và chỉ tài khoản này có thể xem." /> : null}
      {query.data?.data.roadmaps.map((item) => <div key={item.id} className="flex flex-col gap-3 rounded-2xl border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800"><div><div className="flex flex-wrap items-center gap-2"><Badge variant="secondary">{item.relative?.fullname || "Hồ sơ sức khỏe"}</Badge><span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{item.title}</span></div><p className="mt-1 text-xs text-slate-500">{new Date(item.createdAt).toLocaleString("vi-VN")}</p></div><div className="flex flex-wrap gap-2"><Button size="sm" variant="outline" className="gap-1.5" onClick={() => void download(item.pdfUrl, `lo-trinh-suc-khoe-${item.id}.pdf`)}><Download className="size-4" />Tải PDF</Button><Button size="sm" variant="ghost" className="gap-1.5 text-rose-600" onClick={() => { if (window.confirm("Xóa lộ trình này?")) remove.mutate(item.id); }}><Trash2 className="size-4" />Xóa</Button></div></div>)}
      {(query.data?.data.totalPages ?? 0) > 1 ? <div className="mt-4 flex items-center justify-between"><Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((value) => value - 1)}>Trang trước</Button><span className="text-xs text-slate-500">Trang {page}/{query.data?.data.totalPages}</span><Button variant="outline" size="sm" disabled={page === query.data?.data.totalPages} onClick={() => setPage((value) => value + 1)}>Trang sau</Button></div> : null}
    </CardContent>
  </Card>;
}
