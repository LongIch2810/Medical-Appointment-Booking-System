import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  Clock,
  MessageCircleReply,
  MessageSquare,
  Plus,
  Send,
  Sparkles,
  XCircle,
} from "lucide-react";
import { useMyComplaints } from "@/hooks/useMyComplaints";
import { useComplaint } from "@/hooks/useComplaint";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type ComplaintStatus = "pending" | "in_progress" | "resolved" | "rejected";

type StatusMeta = {
  label: string;
  badgeClass: string;
  icon: typeof AlertTriangle;
  accentClass: string;
  chipClass: string;
  ringClass: string;
};

const statusMeta: Record<ComplaintStatus, StatusMeta> = {
  pending: {
    label: "Chờ xử lý",
    badgeClass: "bg-amber-100 text-amber-700 border border-amber-200",
    icon: Clock,
    accentClass: "border-amber-200 bg-amber-50/60",
    chipClass: "bg-amber-100 text-amber-700",
    ringClass: "ring-amber-200",
  },
  in_progress: {
    label: "Đang xử lý",
    badgeClass: "bg-sky-100 text-sky-700 border border-sky-200",
    icon: Sparkles,
    accentClass: "border-sky-200 bg-sky-50/60",
    chipClass: "bg-sky-100 text-sky-700",
    ringClass: "ring-sky-200",
  },
  resolved: {
    label: "Đã giải quyết",
    badgeClass: "bg-emerald-100 text-emerald-700 border border-emerald-200",
    icon: CheckCircle2,
    accentClass: "border-emerald-200 bg-emerald-50/60",
    chipClass: "bg-emerald-100 text-emerald-700",
    ringClass: "ring-emerald-200",
  },
  rejected: {
    label: "Từ chối",
    badgeClass: "bg-rose-100 text-rose-700 border border-rose-200",
    icon: XCircle,
    accentClass: "border-rose-200 bg-rose-50/60",
    chipClass: "bg-rose-100 text-rose-700",
    ringClass: "ring-rose-200",
  },
};

const fallbackMeta: StatusMeta = {
  label: "Khác",
  badgeClass: "bg-slate-100 text-slate-700 border border-slate-200",
  icon: AlertTriangle,
  accentClass: "border-slate-200 bg-slate-50/60",
  chipClass: "bg-slate-100 text-slate-700",
  ringClass: "ring-slate-200",
};

const getStatusMeta = (status: string | null | undefined): StatusMeta => {
  if (!status) return fallbackMeta;
  return statusMeta[status as ComplaintStatus] ?? fallbackMeta;
};

const filterTabs: Array<{ key: "ALL" | ComplaintStatus; label: string }> = [
  { key: "ALL", label: "Tất cả" },
  { key: "pending", label: "Chờ xử lý" },
  { key: "in_progress", label: "Đang xử lý" },
  { key: "resolved", label: "Đã giải quyết" },
  { key: "rejected", label: "Từ chối" },
];

const StatusBadge: React.FC<{ status: string | null | undefined }> = ({
  status,
}) => {
  const meta = getStatusMeta(status);
  const Icon = meta.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
        meta.badgeClass,
      )}
    >
      <Icon className="h-3 w-3" />
      {meta.label}
    </span>
  );
};

const MyComplaints = () => {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<ComplaintStatus | undefined>(
    undefined,
  );
  const [selectedComplaint, setSelectedComplaint] =
    useState<Record<string, unknown> | null>(null);
  const [openCreate, setOpenCreate] = useState(false);
  const [form, setForm] = useState({ title: "", description: "" });
  const limit = 10;

  const { data, isLoading } = useMyComplaints({
    page,
    limit,
    status: statusFilter,
  });
  const { mutate: submitComplaint, isPending: isSubmitting } = useComplaint();

  const response = data?.data;
  const complaints = (response?.complaints ?? []) as Record<string, unknown>[];
  const total = response?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  const counts = useMemo(() => {
    const result: Record<ComplaintStatus, number> = {
      pending: 0,
      in_progress: 0,
      resolved: 0,
      rejected: 0,
    };
    complaints.forEach((c) => {
      const key = c.complaint_status as ComplaintStatus;
      if (key in result) result[key] += 1;
    });
    return result;
  }, [complaints]);

  const formatDate = (d: string | null | undefined) => {
    if (!d) return "-";
    return new Date(d).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim()) return;
    submitComplaint(
      { title: form.title.trim(), description: form.description.trim() },
      {
        onSuccess: () => {
          setForm({ title: "", description: "" });
          setOpenCreate(false);
        },
      },
    );
  };

  const selectedStatus =
    (selectedComplaint?.complaint_status as string | undefined) ?? null;
  const selectedMeta = getStatusMeta(selectedStatus);

  return (
    <div className="space-y-5">
      <Card className="overflow-hidden border-primary/15 py-0">
        <CardHeader className="space-y-4 border-b border-slate-100 bg-gradient-to-r from-primary/5 via-white to-amber-50/40 px-5 py-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <CardTitle className="text-lg font-bold text-slate-900">
                  Góp ý & khiếu nại
                </CardTitle>
                <p className="text-xs text-slate-500">
                  Gửi góp ý mới hoặc theo dõi trạng thái các phản hồi đã gửi.
                </p>
              </div>
            </div>
            <Button
              type="button"
              onClick={() => setOpenCreate(true)}
              className="shrink-0 gap-1.5 self-start rounded-full px-4 md:self-center"
            >
              <Plus className="h-4 w-4" />
              Gửi góp ý mới
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {(Object.keys(statusMeta) as ComplaintStatus[]).map((key) => {
              const meta = statusMeta[key];
              const Icon = meta.icon;
              return (
                <div
                  key={key}
                  className={cn(
                    "flex items-center justify-between rounded-xl border bg-white px-3 py-2.5",
                    meta.accentClass,
                  )}
                >
                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                      {meta.label}
                    </p>
                    <p className="mt-0.5 text-xl font-bold text-slate-900">
                      {counts[key]}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-full",
                      meta.chipClass,
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                </div>
              );
            })}
          </div>
        </CardHeader>

        <CardContent className="space-y-4 px-5 py-5">
          <div className="flex flex-wrap items-center gap-2">
            {filterTabs.map((tab) => {
              const active =
                (tab.key === "ALL" && !statusFilter) ||
                tab.key === statusFilter;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => {
                    setStatusFilter(
                      tab.key === "ALL" ? undefined : (tab.key as ComplaintStatus),
                    );
                    setPage(1);
                  }}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all",
                    active
                      ? "border-primary bg-primary text-white shadow-sm"
                      : "border-slate-200 bg-white text-slate-600 hover:border-primary/40 hover:text-primary",
                  )}
                >
                  {tab.label}
                  {tab.key !== "ALL" ? (
                    <span
                      className={cn(
                        "rounded-full px-1.5 text-[10px] font-bold",
                        active
                          ? "bg-white/20 text-white"
                          : "bg-slate-100 text-slate-600",
                      )}
                    >
                      {counts[tab.key as ComplaintStatus] ?? 0}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-32 w-full rounded-2xl" />
              ))}
            </div>
          ) : complaints.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 px-6 py-12 text-center">
              <MessageSquare className="mx-auto mb-3 h-10 w-10 text-slate-400" />
              <p className="text-sm font-semibold text-slate-700">
                Chưa có góp ý nào
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Bấm "Gửi góp ý mới" để gửi phản hồi đầu tiên cho chúng tôi.
              </p>
              <Button
                type="button"
                onClick={() => setOpenCreate(true)}
                className="mt-4 gap-1.5 rounded-full"
              >
                <Plus className="h-4 w-4" />
                Gửi góp ý mới
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {complaints.map((c) => {
                const status = c.complaint_status as string;
                const meta = getStatusMeta(status);
                const Icon = meta.icon;
                const hasResponse = Boolean(c.response);
                return (
                  <div
                    key={c.id as number}
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedComplaint(c)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setSelectedComplaint(c);
                      }
                    }}
                    className="group cursor-pointer rounded-2xl border border-slate-200 bg-white p-4 shadow-sm outline-none transition-all hover:border-primary/30 hover:shadow-md focus-visible:border-primary/40 focus-visible:ring-2 focus-visible:ring-primary/20"
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div className="flex flex-1 gap-3">
                        <span
                          className={cn(
                            "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
                            meta.chipClass,
                          )}
                        >
                          <Icon className="h-5 w-5" />
                        </span>
                        <div className="min-w-0 flex-1 space-y-1.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="line-clamp-1 text-sm font-bold text-slate-900">
                              {c.title as string}
                            </p>
                            <span className="mono-label rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                              #{c.id as number}
                            </span>
                          </div>
                          <p className="line-clamp-2 text-sm text-slate-600">
                            {c.description as string}
                          </p>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-1 text-xs text-slate-500">
                            <span className="inline-flex items-center gap-1">
                              <CalendarClock className="h-3.5 w-3.5" />
                              {formatDate(c.created_at as string | null)}
                            </span>
                            {hasResponse ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                                <MessageCircleReply className="h-3 w-3" />
                                Đã có phản hồi
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-2 self-start md:self-center">
                        <StatusBadge status={status} />
                      </div>
                    </div>
                  </div>
                );
              })}

              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-4 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-slate-600">
                    Trang {page} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={!!selectedComplaint}
        onOpenChange={(open) => {
          if (!open) setSelectedComplaint(null);
        }}
      >
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 pr-6 text-lg font-bold">
              <span
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-xl",
                  selectedMeta.chipClass,
                )}
              >
                <selectedMeta.icon className="h-4 w-4" />
              </span>
              <span className="line-clamp-1">
                {selectedComplaint?.title as string}
              </span>
            </DialogTitle>
            <DialogDescription className="flex flex-wrap items-center gap-2">
              <span className="mono-label rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                #{selectedComplaint?.id as number}
              </span>
              <StatusBadge status={selectedStatus} />
              <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                <CalendarClock className="h-3.5 w-3.5" />
                {formatDate(selectedComplaint?.created_at as string | null)}
              </span>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Nội dung góp ý
              </p>
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-700">
                {selectedComplaint?.description as string}
              </p>
            </div>

            {selectedComplaint?.response ? (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                    <MessageCircleReply className="h-3.5 w-3.5" />
                  </span>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700">
                    Phản hồi từ admin
                  </p>
                </div>
                <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-700">
                  {selectedComplaint?.response as string}
                </p>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-300 bg-white p-4 text-center">
                <MessageCircleReply className="mx-auto mb-2 h-6 w-6 text-slate-400" />
                <p className="text-sm font-medium text-slate-600">
                  Chưa có phản hồi
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  Quản trị viên sẽ phản hồi sớm nhất có thể.
                </p>
              </div>
            )}

            {selectedComplaint?.updated_at &&
            selectedComplaint?.updated_at !== selectedComplaint?.created_at ? (
              <p className="text-right text-xs text-slate-400">
                Cập nhật lần cuối:{" "}
                {formatDate(selectedComplaint?.updated_at as string | null)}
              </p>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={openCreate}
        onOpenChange={(open) => {
          setOpenCreate(open);
          if (!open) setForm({ title: "", description: "" });
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="h-5 w-5 text-primary" />
              Gửi góp ý mới
            </DialogTitle>
            <DialogDescription>
              Chia sẻ góp ý hoặc khiếu nại để chúng tôi cải thiện dịch vụ tốt
              hơn.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="complaint-title">Tiêu đề</Label>
              <Input
                id="complaint-title"
                value={form.title}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, title: e.target.value }))
                }
                placeholder="Tóm tắt ngắn gọn vấn đề..."
                required
                maxLength={150}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="complaint-description">Nội dung</Label>
              <Textarea
                id="complaint-description"
                rows={5}
                value={form.description}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, description: e.target.value }))
                }
                placeholder="Mô tả chi tiết góp ý hoặc khiếu nại của bạn..."
                required
                maxLength={1000}
              />
              <p className="text-right text-xs text-slate-400">
                {form.description.length}/1000
              </p>
            </div>

            <DialogFooter className="gap-2 sm:gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpenCreate(false)}
                disabled={isSubmitting}
              >
                Hủy
              </Button>
              <Button type="submit" disabled={isSubmitting} className="gap-1.5">
                <Send className="h-4 w-4" />
                {isSubmitting ? "Đang gửi..." : "Gửi góp ý"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MyComplaints;
