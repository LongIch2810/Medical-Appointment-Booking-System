import React, { useMemo, useState } from "react";
import {
  CalendarClock,
  Clock,
  Eye,
  FileText,
  Filter,
  MapPin,
  Star,
  Stethoscope,
  UserRound,
  X,
} from "lucide-react";
import { toast } from "react-toastify";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  useCancelPatientAppointment,
  usePatientAppointmentDetail,
  usePatientAppointments,
} from "@/hooks/usePatientPortalApi";
import { useCreateSatisfactionRating } from "@/hooks/useSatisfactionRating";
import { AppointmentStatusBadge as StatusBadge } from "@/components/badge/AppointmentStatusBadge";
import ErrorState from "@/components/notification/ErrorState";
import MedicalAiLoading from "@/components/loading/MedicalAiLoading";
import { cn } from "@/lib/utils";
import type {
  AppointmentStatus,
  PatientAppointment,
} from "@/types/interface/patient.interface";

const bookingModeLabelMap: Record<PatientAppointment["booking_mode"], string> =
  {
    user_select: "Người dùng chọn lịch",
    ai_select: "AI tự động chọn lịch",
  };

const filterTabs: Array<{ key: AppointmentStatus | "ALL"; label: string }> = [
  { key: "ALL", label: "Tất cả" },
  { key: "PENDING", label: "Chờ xác nhận" },
  { key: "CONFIRMED", label: "Đã xác nhận" },
  { key: "COMPLETED", label: "Đã khám" },
  { key: "CANCELLED", label: "Đã hủy" },
  { key: "ABSENT", label: "Vắng mặt" },
  { key: "EXPIRED", label: "Quá hạn khám" },
];

const getSpecialtyName = (appointment: PatientAppointment) =>
  appointment.doctor.specialty.specialty_name ??
  appointment.doctor.specialty.name ??
  "Chưa cập nhật chuyên khoa";

const Appointments: React.FC = () => {
  const [selectedAppointmentId, setSelectedAppointmentId] = useState(0);
  const [openDetail, setOpenDetail] = useState(false);
  const [activeFilter, setActiveFilter] = useState<AppointmentStatus | "ALL">(
    "ALL",
  );

  const [ratingTarget, setRatingTarget] = useState<PatientAppointment | null>(
    null,
  );
  const [ratingScore, setRatingScore] = useState(5);
  const [ratingFeedback, setRatingFeedback] = useState("");
  const [examResultTarget, setExamResultTarget] =
    useState<PatientAppointment | null>(null);

  const { data, isLoading, isError, refetch } = usePatientAppointments({
    page: 1,
    limit: 50,
  });
  const cancelMutation = useCancelPatientAppointment();
  const ratingMutation = useCreateSatisfactionRating();
  const { data: detailResponse, isLoading: isLoadingDetail } =
    usePatientAppointmentDetail(selectedAppointmentId, openDetail);

  const appointments = useMemo(
    () => data?.data.appointments ?? [],
    [data?.data.appointments],
  );
  const appointmentDetail = detailResponse?.data;

  const filteredAppointments = useMemo(() => {
    if (activeFilter === "ALL") return appointments;
    return appointments.filter(
      (appointment) => appointment.status === activeFilter,
    );
  }, [appointments, activeFilter]);

  const counts = useMemo(() => {
    const map: Record<AppointmentStatus | "ALL", number> = {
      ALL: appointments.length,
      PENDING: 0,
      CONFIRMED: 0,
      COMPLETED: 0,
      CANCELLED: 0,
      ABSENT: 0,
      EXPIRED: 0,
    };
    appointments.forEach((appointment) => {
      map[appointment.status] += 1;
    });
    return map;
  }, [appointments]);

  const handleCancel = (appointmentId: number) => {
    cancelMutation.mutate(appointmentId, {
      onSuccess: () => toast.success("Đã hủy lịch khám."),
      onError: () => toast.error("Không thể hủy lịch khám này."),
    });
  };

  const handleOpenDetail = (appointmentId: number) => {
    setSelectedAppointmentId(appointmentId);
    setOpenDetail(true);
  };

  const handleOpenRating = (appointment: PatientAppointment) => {
    setRatingTarget(appointment);
    setRatingScore(5);
    setRatingFeedback("");
  };

  const handleSubmitRating = () => {
    if (!ratingTarget) return;
    if (!ratingFeedback.trim()) {
      toast.error("Vui lòng nhập nội dung đánh giá.");
      return;
    }
    ratingMutation.mutate(
      {
        appointment_id: ratingTarget.id,
        rating_score: ratingScore,
        feedback: ratingFeedback.trim(),
      },
      {
        onSuccess: () => setRatingTarget(null),
      },
    );
  };

  return (
    <>
      <Card className="border-slate-200/80 bg-white py-0 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <CardHeader className="flex flex-col gap-4 border-b border-slate-100 dark:border-slate-800 px-6 py-4.5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <CalendarClock className="h-4.5 w-4.5" />
            </span>
            <div>
              <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100">
                Lịch khám bệnh của bạn
              </CardTitle>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Theo dõi tiến độ, chi tiết và kết quả các lần khám đã đăng ký
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <Filter className="h-4 w-4 text-primary" />
            <span>Tổng cộng: {appointments.length} cuộc hẹn</span>
          </div>
        </CardHeader>
        <CardContent className="space-y-5 px-6 py-5">
          {/* Status Filter Tabs */}
          <div className="flex flex-wrap gap-2">
            {filterTabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveFilter(tab.key)}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer",
                  activeFilter === tab.key
                    ? "border-primary bg-primary text-white shadow-xs"
                    : "border-slate-200 bg-white text-slate-600 hover:border-primary/40 hover:text-primary dark:border-slate-800 dark:bg-slate-800/70 dark:text-slate-300 dark:hover:bg-slate-800",
                )}
              >
                {tab.label}
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.2 text-[10px] font-extrabold",
                    activeFilter === tab.key
                      ? "bg-white/25 text-white"
                      : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
                  )}
                >
                  {counts[tab.key]}
                </span>
              </button>
            ))}
          </div>

          {isLoading ? (
            <MedicalAiLoading
              label="Đang tải danh sách lịch khám..."
              description="Hệ thống đang truy xuất dữ liệu các cuộc hẹn của bạn"
              minHeight="min-h-56"
            />
          ) : isError ? (
            <ErrorState
              title="Không thể tải lịch khám"
              description="Đã có lỗi xảy ra khi tải dữ liệu. Vui lòng thử lại."
              onRetry={() => refetch()}
            />
          ) : filteredAppointments.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 p-10 text-center">
              <CalendarClock className="mx-auto mb-3 h-10 w-10 text-slate-400" />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                {activeFilter === "ALL"
                  ? "Bạn chưa có lịch khám nào trong hệ thống."
                  : "Không có lịch khám nào trong trạng thái đã chọn."}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Khám phá danh sách bác sĩ chuyên khoa và đăng ký lịch khám mới dễ dàng.
              </p>
            </div>
          ) : (
            <div className="space-y-3.5">
              {filteredAppointments.map((appointment) => {
                const canCancel = appointment.status === "PENDING";
                const isCompleted = appointment.status === "COMPLETED";
                const hasExamResult = !!appointment.examination_result;
                const hasRating = !!appointment.satisfaction_rating;
                const canRate = isCompleted && hasExamResult && !hasRating;

                return (
                  <div
                    key={appointment.id}
                    className="group rounded-2xl border border-slate-200/80 bg-white p-5 transition-all hover:border-primary/40 hover:shadow-md dark:border-slate-800 dark:bg-slate-900/90 dark:hover:border-slate-700"
                  >
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div className="flex flex-1 gap-4 min-w-0">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-2xs">
                          <Stethoscope className="h-6 w-6" />
                        </div>
                        <div className="min-w-0 space-y-1.5 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 truncate">
                              BS. {appointment.doctor.user.fullname ?? "Chưa cập nhật"}
                            </p>
                            <StatusBadge status={appointment.status} />
                            {hasRating ? (
                              <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/40 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-300">
                                <Star className="h-3 w-3 fill-current" />
                                {appointment.satisfaction_rating?.rating_score}/5
                              </span>
                            ) : null}
                          </div>
                          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                            <span className="font-semibold text-primary">{getSpecialtyName(appointment)}</span> • {appointment.doctor.workplace}
                          </p>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-500 dark:text-slate-400 pt-0.5">
                            <span className="inline-flex items-center gap-1 font-medium text-slate-700 dark:text-slate-200">
                              <CalendarClock className="h-3.5 w-3.5 text-primary" />
                              {appointment.appointment_date}
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5 text-slate-400" />
                              {appointment.doctor_schedule.start_time} - {appointment.doctor_schedule.end_time}
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <UserRound className="h-3.5 w-3.5 text-slate-400" />
                              Bệnh nhân: <strong className="text-slate-700 dark:text-slate-200">{appointment.patient.fullname}</strong>
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex shrink-0 flex-wrap items-center gap-2 self-end md:self-center">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8.5 justify-center gap-1.5 rounded-xl border-slate-200 px-3 text-xs font-bold text-slate-700 hover:border-primary/40 hover:bg-primary/5 hover:text-primary dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                          onClick={() => handleOpenDetail(appointment.id)}
                        >
                          <Eye className="h-3.5 w-3.5" />
                          Chi tiết
                        </Button>
                        {hasExamResult ? (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="h-8.5 justify-center gap-1.5 rounded-xl border-sky-200 bg-sky-50 px-3 text-xs font-bold text-sky-700 hover:bg-sky-100 dark:border-sky-800/60 dark:bg-sky-950/40 dark:text-sky-300 dark:hover:bg-sky-900/50"
                            onClick={() => setExamResultTarget(appointment)}
                          >
                            <FileText className="h-3.5 w-3.5" />
                            Kết quả khám
                          </Button>
                        ) : null}
                        {canRate ? (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="h-8.5 justify-center gap-1.5 rounded-xl border-amber-200 bg-amber-50 px-3 text-xs font-bold text-amber-700 hover:bg-amber-100 dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-300 dark:hover:bg-amber-900/50"
                            onClick={() => handleOpenRating(appointment)}
                          >
                            <Star className="h-3.5 w-3.5" />
                            Đánh giá
                          </Button>
                        ) : null}
                        {canCancel ? (
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            className="h-8.5 justify-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 text-xs font-bold text-rose-600 transition-colors hover:bg-rose-100 hover:text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-400 dark:hover:bg-rose-900/50"
                            disabled={cancelMutation.isPending}
                            onClick={() => handleCancel(appointment.id)}
                            title="Hủy lịch khám"
                          >
                            <X className="h-3.5 w-3.5" />
                            Hủy lịch
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal Đánh giá sự hài lòng */}
      <Dialog
        open={!!ratingTarget}
        onOpenChange={(open) => {
          if (!open) setRatingTarget(null);
        }}
      >
        <DialogContent className="max-w-md p-0 gap-0 overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
          <div className="shrink-0 p-5 pb-3 border-b border-slate-100 dark:border-slate-800 pr-12">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base font-bold text-slate-900 dark:text-slate-100">
                <Star className="h-5 w-5 text-amber-500 fill-current" />
                Đánh giá dịch vụ khám bệnh
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 dark:text-slate-400">
                Chia sẻ trải nghiệm khám bệnh của bạn để giúp nâng cao chất lượng dịch vụ.
              </DialogDescription>
            </DialogHeader>
          </div>

          <DialogBody className="space-y-4 p-5">
            <div className="flex flex-col items-center gap-2.5">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Mức độ hài lòng của bạn
              </p>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((score) => (
                  <button
                    key={score}
                    type="button"
                    onClick={() => setRatingScore(score)}
                    className="transition-transform hover:scale-115 active:scale-95 cursor-pointer p-1"
                  >
                    <Star
                      className={cn(
                        "h-8 w-8",
                        score <= ratingScore
                          ? "fill-amber-400 text-amber-400"
                          : "text-slate-200 dark:text-slate-700",
                      )}
                    />
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wide text-slate-600 dark:text-slate-300">
                Cảm nhận chi tiết
              </label>
              <Textarea
                rows={4}
                maxLength={500}
                value={ratingFeedback}
                onChange={(e) => setRatingFeedback(e.target.value)}
                placeholder="Nhập cảm nhận của bạn về bác sĩ, cơ sở vật chất và thời gian tiếp đón..."
                className="rounded-xl resize-none"
              />
              <p className="text-right text-[11px] text-slate-400">
                {ratingFeedback.length}/500 ký tự
              </p>
            </div>
          </DialogBody>

          <DialogFooter className="p-4 bg-slate-50/80 dark:bg-slate-950/80 border-t border-slate-100 dark:border-slate-800 gap-2 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setRatingTarget(null)}
              disabled={ratingMutation.isPending}
              className="rounded-xl"
            >
              Hủy bỏ
            </Button>
            <Button
              type="button"
              onClick={handleSubmitRating}
              disabled={ratingMutation.isPending}
              className="rounded-xl !bg-primary hover:!bg-primary/90 !text-white font-bold shadow-xs cursor-pointer"
            >
              {ratingMutation.isPending ? "Đang gửi..." : "Gửi đánh giá"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Kết quả khám nhanh */}
      <Dialog
        open={!!examResultTarget}
        onOpenChange={(open) => {
          if (!open) setExamResultTarget(null);
        }}
      >
        <DialogContent className="max-w-lg p-0 gap-0 overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
          <div className="shrink-0 p-5 pb-3 border-b border-slate-100 dark:border-slate-800 pr-12">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base font-bold text-slate-900 dark:text-slate-100">
                <FileText className="h-5 w-5 text-sky-600" />
                Kết quả chẩn đoán y khoa
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 dark:text-slate-400">
                Lịch khám #{examResultTarget?.id} • BS. {examResultTarget?.doctor.user.fullname ?? "—"}
              </DialogDescription>
            </DialogHeader>
          </div>

          <DialogBody className="p-5">
            {examResultTarget?.examination_result ? (
              <div className="space-y-3.5">
                <div className="rounded-2xl border border-slate-200/80 bg-slate-50/60 p-3.5 dark:border-slate-800 dark:bg-slate-950/50">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Triệu chứng ghi nhận
                  </p>
                  <p className="mt-1 whitespace-pre-line text-sm text-slate-800 dark:text-slate-200">
                    {examResultTarget.examination_result.symptoms ?? "—"}
                  </p>
                </div>
                <div className="rounded-2xl border border-sky-200/80 bg-sky-50/40 p-3.5 dark:border-sky-800/80 dark:bg-sky-950/40">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-sky-700 dark:text-sky-300">
                    Kết luận chẩn đoán
                  </p>
                  <p className="mt-1 whitespace-pre-line text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {examResultTarget.examination_result.diagnosis ?? "—"}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200/80 bg-slate-50/60 p-3.5 dark:border-slate-800 dark:bg-slate-950/50">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Phác đồ &amp; Hướng điều trị
                  </p>
                  <p className="mt-1 whitespace-pre-line text-sm text-slate-800 dark:text-slate-200">
                    {examResultTarget.examination_result.treatment ?? "—"}
                  </p>
                </div>
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-3.5 dark:border-emerald-800 dark:bg-emerald-950/40">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                    Đơn thuốc kê khai
                  </p>
                  <p className="mt-1 whitespace-pre-line text-sm text-slate-800 dark:text-slate-200 font-medium">
                    {examResultTarget.examination_result.prescription ?? "—"}
                  </p>
                </div>
              </div>
            ) : null}
          </DialogBody>

          <div className="shrink-0 p-4 bg-slate-50/80 dark:bg-slate-950/80 border-t border-slate-100 dark:border-slate-800 flex justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setExamResultTarget(null)}
              className="rounded-xl"
            >
              Đóng
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Chi tiết Lịch khám */}
      <Dialog open={openDetail} onOpenChange={setOpenDetail}>
        <DialogContent className="max-w-xl p-0 gap-0 overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
          <div className="shrink-0 p-5 pb-3 border-b border-slate-100 dark:border-slate-800 pr-12">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Chi tiết lịch khám bệnh
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 dark:text-slate-400">
                Toàn bộ thông tin đăng ký khám và thời gian tiếp đón.
              </DialogDescription>
            </DialogHeader>
          </div>

          <DialogBody className="p-5">
            {isLoadingDetail ? (
              <div className="space-y-3">
                <Skeleton className="h-16 rounded-2xl" />
                <Skeleton className="h-32 rounded-2xl" />
                <Skeleton className="h-20 rounded-2xl" />
              </div>
            ) : appointmentDetail ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950/50">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Mã phiếu khám
                    </p>
                    <p className="text-lg font-extrabold text-slate-900 dark:text-slate-100">
                      #{appointmentDetail.id}
                    </p>
                  </div>
                  <StatusBadge status={appointmentDetail.status} />
                </div>

                <div className="grid gap-3.5 sm:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200/80 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                    <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                      <Stethoscope className="h-4 w-4 text-primary" />
                      Bác sĩ phụ trách
                    </div>
                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      BS. {appointmentDetail.doctor.user.fullname ?? "Chưa cập nhật"}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {getSpecialtyName(appointmentDetail)}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200/80 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                    <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                      <UserRound className="h-4 w-4 text-primary" />
                      Bệnh nhân khám
                    </div>
                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      {appointmentDetail.patient.fullname ?? "Chưa cập nhật"}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Quan hệ: {appointmentDetail.patient.relationship?.relationship_name || "Bản thân"}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200/80 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                    <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                      <CalendarClock className="h-4 w-4 text-primary" />
                      Ngày khám bệnh
                    </div>
                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      {appointmentDetail.appointment_date}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200/80 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                    <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                      <Clock className="h-4 w-4 text-primary" />
                      Khung giờ khám
                    </div>
                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      {appointmentDetail.doctor_schedule.start_time} - {appointmentDetail.doctor_schedule.end_time}
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200/80 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                  <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                    <MapPin className="h-4 w-4 text-primary" />
                    Cơ sở phòng khám / Nơi làm việc
                  </div>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    {appointmentDetail.doctor.workplace || "Chưa cập nhật"}
                  </p>
                </div>

                <div className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-xs sm:grid-cols-2 dark:border-slate-800 dark:bg-slate-950/50">
                  <div>
                    <p className="font-bold uppercase tracking-wide text-slate-500">
                      Phương thức đặt lịch
                    </p>
                    <p className="font-semibold text-slate-800 dark:text-slate-200 mt-1">
                      {bookingModeLabelMap[appointmentDetail.booking_mode]}
                    </p>
                  </div>
                  <div>
                    <p className="font-bold uppercase tracking-wide text-slate-500">
                      Thời điểm tạo phiếu
                    </p>
                    <p className="font-semibold text-slate-800 dark:text-slate-200 mt-1">
                      {appointmentDetail.created_at}
                    </p>
                  </div>
                </div>

                {appointmentDetail.status === "PENDING" && (
                  <Badge
                    variant="outline"
                    className="w-full justify-center border-amber-300 bg-amber-50 py-2.5 text-xs font-semibold text-amber-800 rounded-xl dark:border-amber-700 dark:bg-amber-950/50 dark:text-amber-300"
                  >
                    Lịch khám đang chờ bác sĩ xác nhận. Bạn có thể hủy nếu cần thay đổi lịch trình.
                  </Badge>
                )}
              </div>
            ) : (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-600 dark:border-red-900/50 dark:bg-red-950/40">
                Không thể tải thông tin chi tiết lịch khám.
              </div>
            )}
          </DialogBody>

          <div className="shrink-0 p-4 bg-slate-50/80 dark:bg-slate-950/80 border-t border-slate-100 dark:border-slate-800 flex justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpenDetail(false)}
              className="rounded-xl"
            >
              Đóng
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Appointments;
