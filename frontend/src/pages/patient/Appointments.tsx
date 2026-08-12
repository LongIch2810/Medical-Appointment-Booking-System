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
import { cn } from "@/lib/utils";
import type {
  AppointmentStatus,
  PatientAppointment,
} from "@/types/interface/patient.interface";

const bookingModeLabelMap: Record<PatientAppointment["booking_mode"], string> =
  {
    user_select: "Người dùng chọn lịch",
    ai_select: "AI chọn lịch",
  };

const filterTabs: Array<{ key: AppointmentStatus | "ALL"; label: string }> = [
  { key: "ALL", label: "Tất cả" },
  { key: "PENDING", label: "Chờ xác nhận" },
  { key: "CONFIRMED", label: "Đã xác nhận" },
  { key: "COMPLETED", label: "Đã khám" },
  { key: "CANCELLED", label: "Đã hủy" },
];

const getSpecialtyName = (appointment: PatientAppointment) =>
  appointment.doctor.specialty.specialty_name ??
  appointment.doctor.specialty.name ??
  "Chưa cập nhật chuyên khoa";

const Appointments: React.FC = () => {
  const [selectedAppointmentId, setSelectedAppointmentId] = useState(0);
  const [openDetail, setOpenDetail] = useState(false);
  const [activeFilter, setActiveFilter] = useState<
    AppointmentStatus | "ALL"
  >("ALL");

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

  const appointments = data?.data.appointments ?? [];
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
      <Card className="border-slate-200 py-0 shadow-sm">
        <CardHeader className="flex flex-col gap-4 border-b border-slate-100 px-5 py-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <CalendarClock className="h-4 w-4" />
            </span>
            <CardTitle className="text-base font-semibold text-slate-900">
              Lịch khám đã đặt
            </CardTitle>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Filter className="h-4 w-4" />
            <span>{appointments.length} lịch khám</span>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 px-5 py-5">
          <div className="flex flex-wrap gap-2">
            {filterTabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveFilter(tab.key)}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all",
                  activeFilter === tab.key
                    ? "border-primary bg-primary text-white shadow-sm"
                    : "border-slate-200 bg-white text-slate-600 hover:border-primary/40 hover:text-primary",
                )}
              >
                {tab.label}
                <span
                  className={cn(
                    "rounded-full px-1.5 text-[10px] font-bold",
                    activeFilter === tab.key
                      ? "bg-white/20 text-white"
                      : "bg-slate-100 text-slate-600",
                  )}
                >
                  {counts[tab.key]}
                </span>
              </button>
            ))}
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, idx) => (
                <Skeleton key={idx} className="h-28 rounded-xl" />
              ))}
            </div>
          ) : isError ? (
            <ErrorState
              title="Không thể tải lịch khám"
              description="Đã có lỗi xảy ra khi tải dữ liệu. Vui lòng thử lại."
              onRetry={() => refetch()}
            />
          ) : filteredAppointments.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/50 p-8 text-center">
              <CalendarClock className="mx-auto mb-2 h-8 w-8 text-slate-400" />
              <p className="text-sm font-medium text-slate-600">
                {activeFilter === "ALL"
                  ? "Bạn chưa có lịch khám nào."
                  : "Không có lịch khám trong trạng thái này."}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredAppointments.map((appointment) => {
                const canCancel = appointment.status === "PENDING";
                const isCompleted = appointment.status === "COMPLETED";
                const hasExamResult = !!appointment.examination_result;
                const hasRating = !!appointment.satisfaction_rating;
                const canRate = isCompleted && hasExamResult && !hasRating;

                return (
                  <div
                    key={appointment.id}
                    className="group rounded-xl border border-slate-200 bg-white p-4 transition-all hover:border-primary/30 hover:shadow-sm"
                  >
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div className="flex flex-1 gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                          <Stethoscope className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 space-y-1.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-bold text-slate-900">
                              BS. {appointment.doctor.user.fullname ??
                                "Chưa cập nhật"}
                            </p>
                            <StatusBadge status={appointment.status} />
                            {hasRating ? (
                              <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                                <Star className="h-3 w-3 fill-current" />
                                {appointment.satisfaction_rating?.rating_score}/5
                              </span>
                            ) : null}
                          </div>
                          <p className="text-sm text-slate-600">
                            {getSpecialtyName(appointment)} •{" "}
                            {appointment.doctor.workplace}
                          </p>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                            <span className="inline-flex items-center gap-1">
                              <CalendarClock className="h-3.5 w-3.5" />
                              {appointment.appointment_date}
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5" />
                              {appointment.doctor_schedule.start_time} -{" "}
                              {appointment.doctor_schedule.end_time}
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <UserRound className="h-3.5 w-3.5" />
                              {appointment.patient.fullname}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex shrink-0 flex-wrap items-center gap-2 self-end md:self-center">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-9 justify-center gap-1.5 rounded-lg border-slate-200 px-3 text-xs font-semibold text-slate-700 hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
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
                            className="h-9 justify-center gap-1.5 rounded-lg border-sky-200 bg-sky-50 px-3 text-xs font-semibold text-sky-700 hover:bg-sky-100"
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
                            className="h-9 justify-center gap-1.5 rounded-lg border-amber-200 bg-amber-50 px-3 text-xs font-semibold text-amber-700 hover:bg-amber-100"
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
                            className="h-9 justify-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 text-xs font-semibold text-rose-600 transition-colors hover:bg-rose-100 hover:text-rose-700"
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

      <Dialog
        open={!!ratingTarget}
        onOpenChange={(open) => {
          if (!open) setRatingTarget(null);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-amber-500" />
              Đánh giá lịch khám
            </DialogTitle>
            <DialogDescription>
              Chia sẻ trải nghiệm của bạn với bác sĩ và phòng khám.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex flex-col items-center gap-2">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Số sao
              </p>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((score) => (
                  <button
                    key={score}
                    type="button"
                    onClick={() => setRatingScore(score)}
                    className="transition-transform hover:scale-110"
                  >
                    <Star
                      className={cn(
                        "h-8 w-8",
                        score <= ratingScore
                          ? "fill-amber-400 text-amber-400"
                          : "text-slate-300",
                      )}
                    />
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Cảm nhận của bạn
              </p>
              <Textarea
                rows={4}
                maxLength={500}
                value={ratingFeedback}
                onChange={(e) => setRatingFeedback(e.target.value)}
                placeholder="Chia sẻ trải nghiệm khám bệnh của bạn..."
              />
              <p className="text-right text-xs text-slate-400">
                {ratingFeedback.length}/500
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setRatingTarget(null)}
              disabled={ratingMutation.isPending}
            >
              Hủy
            </Button>
            <Button
              type="button"
              onClick={handleSubmitRating}
              disabled={ratingMutation.isPending}
            >
              {ratingMutation.isPending ? "Đang gửi..." : "Gửi đánh giá"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!examResultTarget}
        onOpenChange={(open) => {
          if (!open) setExamResultTarget(null);
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-sky-600" />
              Kết quả khám
            </DialogTitle>
            <DialogDescription>
              Lịch khám #{examResultTarget?.id} - BS.{" "}
              {examResultTarget?.doctor.user.fullname ?? "—"}
            </DialogDescription>
          </DialogHeader>

          {examResultTarget?.examination_result ? (
            <div className="space-y-3">
              <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-3">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Triệu chứng
                </p>
                <p className="mt-1 whitespace-pre-line text-sm text-slate-700">
                  {examResultTarget.examination_result.symptoms ?? "—"}
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-3">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Chẩn đoán
                </p>
                <p className="mt-1 whitespace-pre-line text-sm text-slate-700">
                  {examResultTarget.examination_result.diagnosis ?? "—"}
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-3">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Phác đồ điều trị
                </p>
                <p className="mt-1 whitespace-pre-line text-sm text-slate-700">
                  {examResultTarget.examination_result.treatment ?? "—"}
                </p>
              </div>
              <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-3">
                <p className="text-xs font-medium uppercase tracking-wide text-emerald-700">
                  Đơn thuốc
                </p>
                <p className="mt-1 whitespace-pre-line text-sm text-slate-700">
                  {examResultTarget.examination_result.prescription ?? "—"}
                </p>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={openDetail} onOpenChange={setOpenDetail}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">
              Chi tiết lịch khám
            </DialogTitle>
            <DialogDescription>
              Thông tin đầy đủ của lịch khám đã đặt.
            </DialogDescription>
          </DialogHeader>

          {isLoadingDetail ? (
            <div className="space-y-3">
              <Skeleton className="h-16 rounded-lg" />
              <Skeleton className="h-32 rounded-lg" />
              <Skeleton className="h-20 rounded-lg" />
            </div>
          ) : appointmentDetail ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/60 p-4">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Mã lịch khám
                  </p>
                  <p className="text-lg font-bold text-slate-900">
                    #{appointmentDetail.id}
                  </p>
                </div>
                <StatusBadge status={appointmentDetail.status} />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-900">
                    <Stethoscope className="h-4 w-4 text-primary" />
                    Bác sĩ
                  </div>
                  <p className="text-sm font-medium text-slate-800">
                    BS. {appointmentDetail.doctor.user.fullname ??
                      "Chưa cập nhật"}
                  </p>
                  <p className="text-xs text-slate-500">
                    {getSpecialtyName(appointmentDetail)}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-900">
                    <UserRound className="h-4 w-4 text-primary" />
                    Bệnh nhân
                  </div>
                  <p className="text-sm font-medium text-slate-800">
                    {appointmentDetail.patient.fullname ?? "Chưa cập nhật"}
                  </p>
                  <p className="text-xs text-slate-500">
                    {appointmentDetail.patient.relationship?.relationship_name}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-900">
                    <CalendarClock className="h-4 w-4 text-primary" />
                    Ngày khám
                  </div>
                  <p className="text-sm font-medium text-slate-800">
                    {appointmentDetail.appointment_date}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-900">
                    <Clock className="h-4 w-4 text-primary" />
                    Ca khám
                  </div>
                  <p className="text-sm font-medium text-slate-800">
                    {appointmentDetail.doctor_schedule.start_time} -{" "}
                    {appointmentDetail.doctor_schedule.end_time}
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <MapPin className="h-4 w-4 text-primary" />
                  Địa điểm khám
                </div>
                <p className="text-sm text-slate-700">
                  {appointmentDetail.doctor.workplace || "Chưa cập nhật"}
                </p>
              </div>

              <div className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50/60 p-4 text-sm sm:grid-cols-2">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Hình thức đặt
                  </p>
                  <p className="font-semibold text-slate-800">
                    {bookingModeLabelMap[appointmentDetail.booking_mode]}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Ngày tạo
                  </p>
                  <p className="font-semibold text-slate-800">
                    {appointmentDetail.created_at}
                  </p>
                </div>
              </div>

              {appointmentDetail.status === "PENDING" && (
                <Badge
                  variant="outline"
                  className="w-full justify-center border-amber-300 bg-amber-50 py-2 text-xs font-medium text-amber-700"
                >
                  Lịch khám đang chờ bác sĩ xác nhận. Bạn có thể hủy nếu cần.
                </Badge>
              )}
            </div>
          ) : (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
              Không thể tải chi tiết lịch khám.
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Appointments;
