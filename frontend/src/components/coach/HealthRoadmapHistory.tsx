import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  Download,
  ExternalLink,
  FileText,
  Filter,
  HeartHandshake,
  Loader2,
  Sparkles,
  Trash2,
} from "lucide-react";
import { toast } from "react-toastify";

import {
  deleteHealthRoadmap,
  getHealthRoadmapHistory,
} from "@/api/healthRoadmapApi";
import { usePatientRelatives } from "@/hooks/usePatientPortalApi";
import axiosInstance, { backendOrigin } from "@/configs/axios";
import ErrorState from "@/components/notification/ErrorState";
import NotFoundResult from "@/components/notification/NotFoundResult";
import StateCard from "@/components/notification/StateCard";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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

export function HealthRoadmapHistory({ relativeId }: { relativeId?: number }) {
  const [selectedRelativeId, setSelectedRelativeId] = useState<
    number | undefined
  >(relativeId);
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  // Sync prop when parent profile changes
  useEffect(() => {
    setSelectedRelativeId(relativeId);
    setPage(1);
  }, [relativeId]);

  // Query relatives list for dropdown filter
  const { data: relativesData } = usePatientRelatives({
    page: 1,
    limit: 50,
  });
  const relatives = relativesData?.data?.relatives ?? [];

  const query = useQuery({
    queryKey: ["health-roadmap-history", selectedRelativeId, page],
    queryFn: () => getHealthRoadmapHistory(page, 10, selectedRelativeId),
  });

  const remove = useMutation({
    mutationFn: deleteHealthRoadmap,
    onSuccess: () => {
      toast.success("Đã xóa lộ trình sức khỏe.");
      void queryClient.invalidateQueries({
        queryKey: ["health-roadmap-history"],
      });
    },
    onError: () => toast.error("Không thể xóa lộ trình này."),
  });

  const download = async (path: string, fileName: string) => {
    try {
      const response = await axiosInstance.get<Blob>(
        path.replace(/^\/api\/v1/, ""),
        { responseType: "blob" },
      );
      const url = URL.createObjectURL(response.data);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Không thể tải tệp PDF.");
    }
  };

  const viewPdf = (path: string) => {
    if (!path) return;
    const fullUrl = path.startsWith("http")
      ? path
      : `${backendOrigin}${path.startsWith("/") ? "" : "/"}${path}`;
    window.open(fullUrl, "_blank", "noopener,noreferrer");
  };

  const roadmaps = query.data?.data.roadmaps ?? [];
  const total = query.data?.data.total ?? 0;
  const totalPages = query.data?.data.totalPages ?? 0;
  const limit = query.data?.data.limit ?? 10;
  const start = total === 0 ? 0 : (page - 1) * limit + 1;
  const end = Math.min(total, page * limit);

  const handleRelativeFilterChange = (value: string) => {
    const parsed = value === "all" ? undefined : Number(value);
    setSelectedRelativeId(parsed);
    setPage(1);
  };

  return (
    <Card className="overflow-hidden rounded-[28px] border border-slate-200/80 bg-white shadow-none dark:border-slate-800/80 dark:bg-slate-900">
      <CardHeader className="border-b border-slate-100 bg-primary/[0.03] p-5 sm:p-6 dark:border-slate-800 dark:bg-primary/[0.06]">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
              <FileText className="size-5 text-primary" />
              <span>Lịch sử lộ trình sức khỏe</span>
            </CardTitle>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Các lộ trình AI đã xây dựng riêng cho tài khoản và hồ sơ người thân.
            </p>
          </div>

          {/* Relative Filter Selector */}
          <div className="flex items-center gap-2 self-start rounded-2xl border border-slate-200/80 bg-white p-2 sm:self-center dark:border-slate-800 dark:bg-slate-900">
            <Filter className="size-3.5 text-slate-400 shrink-0" />
            <label htmlFor="health-roadmap-relative-filter" className="sr-only">
              Lọc theo hồ sơ người thân
            </label>
            <select
              id="health-roadmap-relative-filter"
              value={selectedRelativeId === undefined ? "all" : String(selectedRelativeId)}
              onChange={(e) => handleRelativeFilterChange(e.target.value)}
              className="min-h-11 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-800 shadow-none outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
            >
              <option value="all">Tất cả hồ sơ</option>
              {relatives.map((rel) => {
                const relName = rel.relationship?.relationship_name?.trim();
                return (
                  <option key={rel.id} value={String(rel.id)}>
                    {rel.fullname} {relName ? `(${relName})` : ""}
                  </option>
                );
              })}
            </select>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-6 space-y-4">
        {/* Medical Safety Disclaimer Notice */}
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200/80 bg-amber-50/70 p-4 text-xs text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300">
          <AlertCircle className="size-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
          <p className="leading-relaxed">
            <strong>Lưu ý y khoa:</strong> Lộ trình sức khỏe do AI đề xuất mang tính chất tham khảo, hỗ trợ xây dựng lối sống khoa học và dinh dưỡng cân bằng. Không thay thế chẩn đoán hoặc chỉ định điều trị của bác sĩ chuyên khoa.
          </p>
        </div>

        {/* Loading State */}
        {query.isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((skeletonIndex) => (
              <div
                key={skeletonIndex}
                className="h-24 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800/60"
              />
            ))}
          </div>
        ) : null}

        {/* Error State */}
        {query.isError ? (
          <ErrorState
            title="Không thể tải lịch sử lộ trình"
            description="Đã xảy ra lỗi trong quá trình tải dữ liệu. Vui lòng thử lại."
            onRetry={() => void query.refetch()}
          />
        ) : null}

        {/* Empty State */}
        {!query.isLoading && !query.isError && roadmaps.length === 0 ? (
          selectedRelativeId !== undefined ? (
            <NotFoundResult
              title="Không có lộ trình cho hồ sơ này"
              description="Chưa có lộ trình AI nào được tạo cho hồ sơ được chọn. Bạn có thể chọn hồ sơ khác hoặc tạo mới."
              onReset={() => handleRelativeFilterChange("all")}
            />
          ) : (
            <StateCard
              icon={<FileText className="size-8 text-primary" />}
              title="Chưa có lộ trình cũ"
              description="Các lộ trình chăm sóc sức khỏe tạo thành công sẽ được lưu trữ an toàn tại đây để bạn xem lại bất cứ lúc nào."
            />
          )
        ) : null}

        {/* List of Roadmaps */}
        {!query.isLoading && !query.isError && roadmaps.length > 0 ? (
          <div className="space-y-3">
            {roadmaps.map((item, index) => {
              const isNewest = page === 1 && index === 0;
              const relativeName =
                item.relative?.fullname || "Bản thân / Hồ sơ chính";

              return (
                <div
                  key={item.id}
                  className="group flex flex-col gap-4 rounded-2xl border border-slate-200/80 border-l-4 border-l-slate-300 bg-white p-4 transition-colors hover:border-slate-300 hover:border-l-primary md:flex-row md:items-center md:justify-between dark:border-slate-800 dark:border-l-slate-700 dark:bg-slate-950/40 dark:hover:border-slate-700 dark:hover:border-l-primary"
                >
                  {/* Left Column: Roadmap details */}
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        variant="secondary"
                        className="gap-1 text-[11px] font-semibold bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60"
                      >
                        <HeartHandshake className="size-3 text-emerald-600 dark:text-emerald-400" />
                        <span>{relativeName}</span>
                      </Badge>

                      <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                        {item.title || "Lộ trình chăm sóc sức khỏe AI"}
                      </span>

                      {isNewest ? (
                        <Badge
                          variant="default"
                          className="bg-primary/90 text-[10px] font-bold px-2 py-0.5"
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
                    </div>
                  </div>

                  {/* Right Column: Actions */}
                  <div className="flex shrink-0 flex-wrap items-center gap-2 rounded-2xl border border-slate-100 bg-slate-50/70 p-2 dark:border-slate-800/80 dark:bg-slate-900/60">
                    {/* View PDF */}
                    {item.pdfUrl ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="min-h-10 gap-1.5 rounded-xl text-xs font-semibold transition-colors hover:border-primary hover:text-primary"
                        onClick={() => viewPdf(item.pdfUrl)}
                        aria-label={`Mở xem tệp PDF lộ trình ${item.title}`}
                      >
                        <ExternalLink className="size-3.5" />
                        <span>Xem PDF</span>
                      </Button>
                    ) : null}

                    {/* Download PDF */}
                    {item.pdfUrl ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="min-h-10 gap-1.5 rounded-xl text-xs font-semibold transition-colors"
                        onClick={() =>
                          void download(
                            item.pdfUrl,
                            item.fileName || `lo-trinh-suc-khoe-${item.id}.pdf`,
                          )
                        }
                        aria-label={`Tải xuống file PDF lộ trình ${item.title}`}
                      >
                        <Download className="size-3.5" />
                        <span>Tải PDF</span>
                      </Button>
                    ) : null}

                    {/* Delete with Confirmation Dialog */}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          disabled={remove.isPending}
                          className="min-h-10 gap-1.5 rounded-xl text-xs font-semibold text-slate-500 transition-colors hover:bg-rose-50 hover:text-rose-600 dark:text-slate-400 dark:hover:bg-rose-950/40 dark:hover:text-rose-400"
                          aria-label={`Xóa lộ trình ${item.title}`}
                        >
                          <Trash2 className="size-3.5 text-rose-500" />
                          <span>Xóa</span>
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="max-w-md rounded-2xl">
                        <AlertDialogHeader>
                          <AlertDialogTitle>Xóa lộ trình sức khỏe</AlertDialogTitle>
                          <AlertDialogDescription>
                            Bạn có chắc chắn muốn xóa lộ trình &quot;{item.title}&quot;? File tài liệu đã lưu sẽ không thể khôi phục lại.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="rounded-xl font-semibold">
                            Hủy
                          </AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => remove.mutate(item.id)}
                            className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold transition-colors cursor-pointer"
                          >
                            {remove.isPending ? (
                              <>
                                <Loader2 className="size-3.5 animate-spin mr-1" />
                                Đang xóa...
                              </>
                            ) : (
                              "Xác nhận xóa"
                            )}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              );
            })}

            {/* Pagination Controls */}
            {totalPages > 1 ? (
              <div className="mt-4 flex flex-col gap-3 pt-3 border-t border-slate-100 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Hiển thị{" "}
                  <strong className="text-slate-800 dark:text-slate-200">
                    {start}
                  </strong>{" "}
                  -{" "}
                  <strong className="text-slate-800 dark:text-slate-200">
                    {end}
                  </strong>{" "}
                  trên{" "}
                  <strong className="text-slate-800 dark:text-slate-200">
                    {total}
                  </strong>{" "}
                  lộ trình
                </span>

                <div className="flex items-center gap-1.5 self-end sm:self-auto">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="h-8 gap-1 rounded-xl text-xs font-semibold"
                    aria-label="Trang trước"
                  >
                    <ChevronLeft className="size-3.5" />
                    <span>Trước</span>
                  </Button>

                  <span className="px-2 text-xs font-medium text-slate-600 dark:text-slate-400">
                    Trang {page} / {totalPages}
                  </span>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className="h-8 gap-1 rounded-xl text-xs font-semibold"
                    aria-label="Trang sau"
                  >
                    <span>Sau</span>
                    <ChevronRight className="size-3.5" />
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
