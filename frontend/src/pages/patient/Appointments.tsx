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

import { useTranslation } from "react-i18next";
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
import { useNavigate } from "react-router-dom";
import { useCreateSatisfactionRating } from "@/hooks/useSatisfactionRating";
import { AppointmentStatusBadge as StatusBadge } from "@/components/badge/AppointmentStatusBadge";
import ErrorState from "@/components/notification/ErrorState";
import StateCard from "@/components/notification/StateCard";
import { cn } from "@/lib/utils";
import type {
  AppointmentStatus,
  PatientAppointment,
} from "@/types/interface/patient.interface";

const getSpecialtyName = (appointment: PatientAppointment) =>
  appointment.doctor.specialty.specialty_name ??
  appointment.doctor.specialty.name ??
  "Chưa cập nhật chuyên khoa";

const Appointments: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const bookingModeLabelMap: Record<PatientAppointment["booking_mode"], string> =
    useMemo(
      () => ({
        user_select: t("appointments.userSelect", { defaultValue: "Người dùng chọn lịch" }),
        ai_select: t("appointments.aiSelect", { defaultValue: "AI tự động chọn lịch" }),
      }),
      [t],
    );

  const filterTabs: Array<{ key: AppointmentStatus | "ALL"; label: string }> =
    useMemo(
      () => [
        { key: "ALL", label: t("common.all", { defaultValue: "Tất cả" }) },
        { key: "PENDING", label: t("status.appointment.PENDING", { defaultValue: "Chờ xác nhận" }) },
        { key: "CONFIRMED", label: t("status.appointment.CONFIRMED", { defaultValue: "Đã xác nhận" }) },
        { key: "IN_PROGRESS", label: t("status.appointment.IN_PROGRESS", { defaultValue: "Đang khám" }) },
        { key: "COMPLETED", label: t("status.appointment.COMPLETED", { defaultValue: "Đã khám" }) },
        { key: "CANCELLED", label: t("status.appointment.CANCELLED", { defaultValue: "Đã hủy" }) },
        { key: "ABSENT", label: t("status.appointment.ABSENT", { defaultValue: "Vắng mặt" }) },
        { key: "EXPIRED", label: t("status.appointment.EXPIRED", { defaultValue: "Quá hạn khám" }) },
      ],
      [t],
    );

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
      IN_PROGRESS: 0,
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
      onSuccess: () => toast.success(t("appointments.cancelSuccess", { defaultValue: "Đã hủy lịch khám." })),
      onError: () => toast.error(t("appointments.cancelError", { defaultValue: "Không thể hủy lịch khám này." })),
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
      toast.error(t("appointments.enterRatingFeedback", { defaultValue: "Vui lòng nhập nội dung đánh giá." }));
      return;
    }
    ratingMutation.mutate(
      {
        appointment_id: ratingTarget.id,
        rating_score: ratingScore,
        feedback: ratingFeedback.trim(),
      },
      {
        onSuccess: () => {
          toast.success(t("appointments.ratingSuccess", { defaultValue: "Cảm ơn bạn đã gửi đánh giá dịch vụ!" }));
          setRatingTarget(null);
        },
      },
    );
  };

  return (
    <>
      <Card className="border-slate-200/80 bg-white py-0 shadow-xs dark:border-[#293548] dark:bg-[#172033]">
        <CardHeader className="flex flex-col gap-4 border-b border-slate-100 dark:border-[#293548] px-6 py-4.5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <CalendarClock className="h-4.5 w-4.5" />
            </span>
            <div>
              <CardTitle className="text-base font-bold text-slate-900 dark:text-[#F1F5F9]">
                {t("appointments.title", { defaultValue: "Lịch khám bệnh của bạn" })}
              </CardTitle>
              <p className="text-xs text-slate-500 dark:text-[#94A3B8]">
                {t("appointments.subtitle", { defaultValue: "Theo dõi tiến độ, chi tiết và kết quả các lần khám đã đăng ký" })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-[#94A3B8]">
            <Filter className="h-4 w-4 text-primary" />
            <span>{t("appointments.totalAppointments", { count: appointments.length, defaultValue: `Tổng cộng: ${appointments.length} cuộc hẹn` })}</span>
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
                    ? "border-primary bg-primary text-primary-foreground shadow-xs"
                    : "border-slate-200 bg-white text-slate-600 hover:border-primary/40 hover:text-primary dark:border-[#293548] dark:bg-[#1E293B] dark:text-[#CBD5E1] dark:hover:bg-[#293548]",
                )}
              >
                {tab.label}
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.2 text-[10px] font-extrabold",
                    activeFilter === tab.key
                      ? "bg-black/15 text-primary-foreground"
                      : "bg-slate-100 text-slate-600 dark:bg-[#293548] dark:text-[#CBD5E1]",
                  )}
                >
                  {counts[tab.key]}
                </span>
              </button>
            ))}
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-28 rounded-2xl" />
              ))}
            </div>
          ) : isError ? (
            <ErrorState
              title={t("appointments.errorTitle", { defaultValue: "Không thể tải lịch khám" })}
              description={t("appointments.errorDesc", { defaultValue: "Đã có lỗi xảy ra khi tải dữ liệu. Vui lòng thử lại." })}
              onRetry={() => refetch()}
            />
          ) : filteredAppointments.length === 0 ? (
            <StateCard
              title={
                activeFilter === "ALL"
                  ? t("appointments.noAppointmentsYet", { defaultValue: "Chưa có lịch khám nào" })
                  : t("appointments.noFilterAppointments", { defaultValue: "Không có lịch khám nào theo bộ lọc này" })
              }
              description={
                activeFilter === "ALL"
                  ? t("appointments.noAppointmentsDesc", { defaultValue: "Khi bạn đặt lịch khám với bác sĩ, toàn bộ thông tin sẽ được cập nhật và hiển thị chi tiết tại đây." })
                  : t("appointments.tryAnotherFilter", { defaultValue: "Hãy chọn tab bộ lọc khác để xem các lịch hẹn tương ứng." })
              }
              actionLabel={activeFilter === "ALL" ? t("appointments.bookDoctorNow", { defaultValue: "Đặt lịch khám ngay" }) : undefined}
              onAction={activeFilter === "ALL" ? () => navigate("/doctors") : undefined}
              icon={<CalendarClock className="h-7 w-7 text-primary" />}
            />
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
                    className="group rounded-2xl border border-slate-200/80 bg-white p-5 transition-all hover:border-primary/40 hover:shadow-md dark:border-[#293548] dark:bg-[#1E293B]/70 dark:hover:border-[#38BDF8]/40"
                  >
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div className="flex flex-1 gap-4 min-w-0">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-2xs">
                          <Stethoscope className="h-6 w-6" />
                        </div>
                        <div className="min-w-0 space-y-1.5 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm sm:text-base font-bold text-slate-900 dark:text-[#F1F5F9] truncate">
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
                          <p className="text-xs sm:text-sm text-slate-600 dark:text-[#94A3B8]">
                            <span className="font-semibold text-primary">{getSpecialtyName(appointment)}</span> • {appointment.doctor.workplace}
                          </p>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-500 dark:text-[#94A3B8] pt-0.5">
                            <span className="inline-flex items-center gap-1 font-medium text-slate-700 dark:text-[#CBD5E1]">
                              <CalendarClock className="h-3.5 w-3.5 text-primary" />
                              {appointment.appointment_date}
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5 text-slate-400" />
                              {appointment.doctor_schedule.start_time} - {appointment.doctor_schedule.end_time}
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <UserRound className="h-3.5 w-3.5 text-slate-400" />
                              Bệnh nhân: <strong className="text-slate-700 dark:text-[#CBD5E1]">{appointment.patient.fullname}</strong>
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex shrink-0 flex-wrap items-center gap-2 self-end md:self-center">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8.5 justify-center gap-1.5 rounded-xl border-slate-200 px-3 text-xs font-bold text-slate-700 hover:border-primary/40 hover:bg-primary/5 hover:text-primary dark:border-[#293548] dark:text-[#CBD5E1] dark:hover:bg-[#293548]"
                          onClick={() => handleOpenDetail(appointment.id)}
                        >
                          <Eye className="h-3.5 w-3.5" />
                          {t("appointments.details", { defaultValue: "Chi tiết" })}
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
                            {t("appointments.examResult", { defaultValue: "Kết quả khám" })}
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
                            {t("appointments.rate", { defaultValue: "Đánh giá" })}
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
                            title={t("appointments.cancel", { defaultValue: "Hủy lịch" })}
                          >
                            <X className="h-3.5 w-3.5" />
                            {t("appointments.cancel", { defaultValue: "Hủy lịch" })}
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
        <DialogContent className="max-w-md p-0 gap-0 overflow-hidden rounded-2xl bg-white dark:bg-[#172033] border border-slate-200/80 dark:border-[#293548]">
          <div className="shrink-0 p-5 pb-3 border-b border-slate-100 dark:border-[#293548] pr-12">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base font-bold text-slate-900 dark:text-[#F1F5F9]">
                <Star className="h-5 w-5 text-amber-500 fill-current" />
                {t("appointments.ratingDialogTitle", { defaultValue: "Đánh giá dịch vụ khám bệnh" })}
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 dark:text-[#94A3B8]">
                {t("appointments.ratingDialogDesc", { defaultValue: "Chia sẻ trải nghiệm khám bệnh của bạn để giúp nâng cao chất lượng dịch vụ." })}
              </DialogDescription>
            </DialogHeader>
          </div>

          <DialogBody className="space-y-4 p-5">
            <div className="flex flex-col items-center gap-2.5">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-[#94A3B8]">
                {t("appointments.satisfactionLevel", { defaultValue: "Mức độ hài lòng của bạn" })}
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
              <label className="text-xs font-bold uppercase tracking-wide text-slate-600 dark:text-[#CBD5E1]">
                {t("appointments.feedbackLabel", { defaultValue: "Cảm nhận chi tiết" })}
              </label>
              <Textarea
                rows={4}
                maxLength={500}
                value={ratingFeedback}
                onChange={(e) => setRatingFeedback(e.target.value)}
                placeholder={t("appointments.feedbackPlaceholder", { defaultValue: "Nhập cảm nhận của bạn về bác sĩ, cơ sở vật chất và thời gian tiếp đón..." })}
                className="rounded-xl resize-none"
              />
              <p className="text-right text-[11px] text-slate-400">
                {ratingFeedback.length}/500 {t("appointments.characters", { defaultValue: "ký tự" })}
              </p>
            </div>
          </DialogBody>

          <DialogFooter className="p-4 bg-slate-50/80 dark:bg-[#111827] border-t border-slate-100 dark:border-[#293548] gap-2 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setRatingTarget(null)}
              disabled={ratingMutation.isPending}
              className="rounded-xl"
            >
              {t("common.cancel", { defaultValue: "Hủy bỏ" })}
            </Button>
            <Button
              type="button"
              onClick={handleSubmitRating}
              disabled={ratingMutation.isPending}
              className="rounded-xl !bg-primary hover:!bg-primary/90 !text-primary-foreground font-bold shadow-xs cursor-pointer"
            >
              {ratingMutation.isPending ? t("common.sending", { defaultValue: "Đang gửi..." }) : t("appointments.submitRating", { defaultValue: "Gửi đánh giá" })}
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
        <DialogContent className="max-w-lg p-0 gap-0 overflow-hidden rounded-2xl bg-white dark:bg-[#172033] border border-slate-200/80 dark:border-[#293548]">
          <div className="shrink-0 p-5 pb-3 border-b border-slate-100 dark:border-[#293548] pr-12">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base font-bold text-slate-900 dark:text-[#F1F5F9]">
                <FileText className="h-5 w-5 text-sky-600 dark:text-sky-400" />
                {t("appointments.examResultDialogTitle", { defaultValue: "Kết quả chẩn đoán y khoa" })}
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 dark:text-[#94A3B8]">
                {t("appointments.examResultDialogDesc", {
                  id: examResultTarget?.id,
                  doctor: examResultTarget?.doctor.user.fullname ?? "—",
                  defaultValue: `Lịch khám #${examResultTarget?.id} • BS. ${examResultTarget?.doctor.user.fullname ?? "—"}`
                })}
              </DialogDescription>
            </DialogHeader>
          </div>

          <DialogBody className="p-5">
            {examResultTarget?.examination_result ? (
              <div className="space-y-3.5">
                <div className="rounded-2xl border border-slate-200/80 bg-slate-50/60 p-3.5 dark:border-[#293548] dark:bg-[#1E293B]">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-[#94A3B8]">
                    {t("appointments.symptomsLabel", { defaultValue: "Triệu chứng ghi nhận" })}
                  </p>
                  <p className="mt-1 whitespace-pre-line text-sm text-slate-800 dark:text-[#CBD5E1]">
                    {examResultTarget.examination_result.symptoms ?? "—"}
                  </p>
                </div>
                <div className="rounded-2xl border border-sky-200/80 bg-sky-50/40 p-3.5 dark:border-sky-800/80 dark:bg-sky-950/40">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-sky-700 dark:text-sky-300">
                    {t("appointments.diagnosisLabel", { defaultValue: "Kết luận chẩn đoán" })}
                  </p>
                  <p className="mt-1 whitespace-pre-line text-sm font-semibold text-slate-900 dark:text-[#F1F5F9]">
                    {examResultTarget.examination_result.diagnosis ?? "—"}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200/80 bg-slate-50/60 p-3.5 dark:border-[#293548] dark:bg-[#1E293B]">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-[#94A3B8]">
                    {t("appointments.treatmentLabel", { defaultValue: "Phác đồ & Hướng điều trị" })}
                  </p>
                  <p className="mt-1 whitespace-pre-line text-sm text-slate-800 dark:text-[#CBD5E1]">
                    {examResultTarget.examination_result.treatment ?? "—"}
                  </p>
                </div>
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-3.5 dark:border-emerald-800 dark:bg-emerald-950/40">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                    {t("appointments.prescriptionLabel", { defaultValue: "Đơn thuốc kê khai" })}
                  </p>
                  <p className="mt-1 whitespace-pre-line text-sm text-slate-800 dark:text-[#CBD5E1] font-medium">
                    {examResultTarget.examination_result.prescription ?? "—"}
                  </p>
                </div>
              </div>
            ) : null}
          </DialogBody>

          <div className="shrink-0 p-4 bg-slate-50/80 dark:bg-[#111827] border-t border-slate-100 dark:border-[#293548] flex justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setExamResultTarget(null)}
              className="rounded-xl"
            >
              {t("common.close", { defaultValue: "Đóng" })}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Chi tiết Lịch khám */}
      <Dialog open={openDetail} onOpenChange={setOpenDetail}>
        <DialogContent className="max-w-xl p-0 gap-0 overflow-hidden rounded-2xl bg-white dark:bg-[#172033] border border-slate-200/80 dark:border-[#293548]">
          <div className="shrink-0 p-5 pb-3 border-b border-slate-100 dark:border-[#293548] pr-12">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-slate-900 dark:text-[#F1F5F9]">
                {t("appointments.detailDialogTitle", { defaultValue: "Chi tiết lịch khám bệnh" })}
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 dark:text-[#94A3B8]">
                {t("appointments.detailDialogDesc", { defaultValue: "Toàn bộ thông tin đăng ký khám và thời gian tiếp đón." })}
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
                <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-[#293548] dark:bg-[#1E293B]">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-[#94A3B8]">
                      {t("appointments.appointmentCode", { defaultValue: "Mã phiếu khám" })}
                    </p>
                    <p className="text-lg font-extrabold text-slate-900 dark:text-[#F1F5F9]">
                      #{appointmentDetail.id}
                    </p>
                  </div>
                  <StatusBadge status={appointmentDetail.status} />
                </div>

                <div className="grid gap-3.5 sm:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200/80 bg-white p-4 dark:border-[#293548] dark:bg-[#1E293B]">
                    <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-[#94A3B8]">
                      <Stethoscope className="h-4 w-4 text-primary" />
                      {t("appointments.doctorInCharge", { defaultValue: "Bác sĩ phụ trách" })}
                    </div>
                    <p className="text-sm font-bold text-slate-900 dark:text-[#F1F5F9]">
                      {t("common.dr", { defaultValue: "BS." })} {appointmentDetail.doctor.user.fullname ?? t("common.notUpdated", { defaultValue: "Chưa cập nhật" })}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-[#94A3B8] mt-0.5">
                      {getSpecialtyName(appointmentDetail)}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200/80 bg-white p-4 dark:border-[#293548] dark:bg-[#1E293B]">
                    <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-[#94A3B8]">
                      <UserRound className="h-4 w-4 text-primary" />
                      {t("appointments.patientInAppointment", { defaultValue: "Bệnh nhân khám" })}
                    </div>
                    <p className="text-sm font-bold text-slate-900 dark:text-[#F1F5F9]">
                      {appointmentDetail.patient.fullname ?? t("common.notUpdated", { defaultValue: "Chưa cập nhật" })}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-[#94A3B8] mt-0.5">
                      {t("relatives.relationship", { defaultValue: "Quan hệ" })}: {appointmentDetail.patient.relationship?.relationship_name || t("relatives.self", { defaultValue: "Bản thân" })}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200/80 bg-white p-4 dark:border-[#293548] dark:bg-[#1E293B]">
                    <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-[#94A3B8]">
                      <CalendarClock className="h-4 w-4 text-primary" />
                      {t("appointments.appointmentDate", { defaultValue: "Ngày khám bệnh" })}
                    </div>
                    <p className="text-sm font-bold text-slate-900 dark:text-[#F1F5F9]">
                      {appointmentDetail.appointment_date}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200/80 bg-white p-4 dark:border-[#293548] dark:bg-[#1E293B]">
                    <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-[#94A3B8]">
                      <Clock className="h-4 w-4 text-primary" />
                      {t("appointments.timeSlot", { defaultValue: "Khung giờ khám" })}
                    </div>
                    <p className="text-sm font-bold text-slate-900 dark:text-[#F1F5F9]">
                      {appointmentDetail.doctor_schedule.start_time} - {appointmentDetail.doctor_schedule.end_time}
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200/80 bg-white p-4 dark:border-[#293548] dark:bg-[#1E293B]">
                  <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-[#94A3B8]">
                    <MapPin className="h-4 w-4 text-primary" />
                    {t("appointments.workplaceLocation", { defaultValue: "Cơ sở phòng khám / Nơi làm việc" })}
                  </div>
                  <p className="text-sm font-semibold text-slate-800 dark:text-[#CBD5E1]">
                    {appointmentDetail.doctor.workplace || t("common.notUpdated", { defaultValue: "Chưa cập nhật" })}
                  </p>
                </div>

                <div className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-xs sm:grid-cols-2 dark:border-[#293548] dark:bg-[#1E293B]">
                  <div>
                    <p className="font-bold uppercase tracking-wide text-slate-500 dark:text-[#94A3B8]">
                      {t("appointments.bookingMode", { defaultValue: "Phương thức đặt lịch" })}
                    </p>
                    <p className="font-semibold text-slate-800 dark:text-[#CBD5E1] mt-1">
                      {bookingModeLabelMap[appointmentDetail.booking_mode]}
                    </p>
                  </div>
                  <div>
                    <p className="font-bold uppercase tracking-wide text-slate-500 dark:text-[#94A3B8]">
                      {t("appointments.createdAt", { defaultValue: "Thời điểm tạo phiếu" })}
                    </p>
                    <p className="font-semibold text-slate-800 dark:text-[#CBD5E1] mt-1">
                      {appointmentDetail.created_at}
                    </p>
                  </div>
                </div>

                {appointmentDetail.status === "PENDING" && (
                  <Badge
                    variant="outline"
                    className="w-full justify-center border-amber-300 bg-amber-50 py-2.5 text-xs font-semibold text-amber-800 rounded-xl dark:border-amber-700 dark:bg-amber-950/50 dark:text-amber-300"
                  >
                    {t("appointments.pendingNotice", { defaultValue: "Lịch khám đang chờ bác sĩ xác nhận. Bạn có thể hủy nếu cần thay đổi lịch trình." })}
                  </Badge>
                )}
              </div>
            ) : (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-600 dark:border-red-900/50 dark:bg-red-950/40">
                {t("appointments.loadDetailError", { defaultValue: "Không thể tải thông tin chi tiết lịch khám." })}
              </div>
            )}
          </DialogBody>

          <div className="shrink-0 p-4 bg-slate-50/80 dark:bg-[#111827] border-t border-slate-100 dark:border-[#293548] flex justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpenDetail(false)}
              className="rounded-xl"
            >
              {t("common.close", { defaultValue: "Đóng" })}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Appointments;
