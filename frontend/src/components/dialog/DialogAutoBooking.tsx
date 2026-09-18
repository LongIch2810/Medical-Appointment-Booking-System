import React, { useId, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle,
  CalendarClock,
  CalendarDays,
  Clock,
  Info,
  Loader2,
  Sparkles,
  Stethoscope,
  UserPlus,
  UserRound,
  Users,
} from "lucide-react";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import CalendarComponent from "@/components/calendar/CalendarComponent";
import { useBookingAppointmentStore } from "@/store/bookingAppointmentStore";
import { useUserStore } from "@/store/useUserStore";
import {
  usePatientRelatives,
  useRelationships,
} from "@/hooks/usePatientPortalApi";
import { useGetSpecialtiesInfinite } from "@/hooks/useGetSpecialtiesInfinite";
import { useAutoBooking } from "@/hooks/useAutoBooking";
import {
  formatDateYYYYMMDD,
  getVietnamTimeHHmm,
} from "@/utils/formatDate";
import {
  autoBookingSchema,
  isPresetPastForToday,
  TIME_PRESETS,
  type AutoBookingFormValues,
  type TimePresetId,
} from "@/schemas/autoBooking.schema";
import type { Specialty } from "@/types/interface/specialty.interface";
import type { createAutoAppointmentData } from "@/api/appointmentApi";
import { cn } from "@/lib/utils";

const getDefaultValues = (): AutoBookingFormValues => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  return {
    relative_id: 0,
    is_new_relative: false,
    new_relative: {
      fullname: "",
      relationship_code: "",
      gender: "true",
      dob: "",
      phone: "",
    },
    specialty_id: 0,
    appointment_date: tomorrow,
    time_preset: "morning",
    start_time: "08:00",
    end_time: "12:00",
  };
};

const DialogAutoBooking: React.FC<{ className?: string }> = ({
  className = "",
}) => {
  const navigate = useNavigate();
  const { userInfo } = useUserStore();
  const [open, setOpen] = useState(false);

  // Form IDs cho accessibility
  const patientSelectId = useId();
  const specialtySelectId = useId();
  const startTimeInputId = useId();
  const endTimeInputId = useId();
  const newFullnameId = useId();
  const newRelationshipId = useId();
  const newGenderId = useId();
  const newDobId = useId();
  const newPhoneId = useId();

  const { reset: resetCalendarStore } = useBookingAppointmentStore();

  const { data: relativesResponse, isLoading: isLoadingRelatives } =
    usePatientRelatives({ page: 1, limit: 100, arrange: "asc" });
  const relatives = useMemo(
    () => relativesResponse?.data?.relatives ?? [],
    [relativesResponse]
  );

  const { data: relationshipsResponse } = useRelationships({
    page: 1,
    limit: 50,
  });
  const relationships = relationshipsResponse?.data?.relationships ?? [];

  const { data: specialtiesResponse, isLoading: isLoadingSpecialties } =
    useGetSpecialtiesInfinite();
  const specialties: Specialty[] = useMemo(
    () =>
      specialtiesResponse?.pages.flatMap((page) => page.data.specialties) ?? [],
    [specialtiesResponse]
  );

  const {
    isPending,
    apiError,
    clearApiError,
    handleAutoBooking,
  } = useAutoBooking();

  const form = useForm<AutoBookingFormValues>({
    resolver: zodResolver(autoBookingSchema),
    defaultValues: getDefaultValues(),
    mode: "onChange",
  });

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    reset: resetForm,
    formState: { errors, isValid },
  } = form;

  const watchedValues = watch();
  const isNewRelative = watchedValues.is_new_relative;
  const selectedRelativeId = watchedValues.relative_id;
  const selectedSpecialtyId = watchedValues.specialty_id;
  const selectedDate = watchedValues.appointment_date;
  const selectedPreset = watchedValues.time_preset;
  const selectedStartTime = watchedValues.start_time;
  const selectedEndTime = watchedValues.end_time;

  const isSelectedDateToday = useMemo(() => {
    if (!selectedDate) return false;
    return formatDateYYYYMMDD(selectedDate) === formatDateYYYYMMDD(new Date());
  }, [selectedDate]);

  const closeAndReset = () => {
    setOpen(false);
    resetForm(getDefaultValues());
    clearApiError();
    resetCalendarStore();
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      closeAndReset();
    } else {
      setOpen(true);
    }
  };

  // Chọn preset thời gian
  const handleSelectPreset = (presetId: TimePresetId) => {
    clearApiError();
    const preset = TIME_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;

    setValue("time_preset", presetId, { shouldValidate: true });
    if (presetId !== "custom") {
      setValue("start_time", preset.start_time, { shouldValidate: true });
      setValue("end_time", preset.end_time, { shouldValidate: true });
    }
  };

  // Toggle thêm người thân mới
  const handleToggleNewRelative = (isNew: boolean) => {
    setValue("is_new_relative", isNew, { shouldValidate: true });
    if (isNew) {
      setValue("relative_id", 0, { shouldValidate: true });
    }
  };

  // Xử lý submit
  const onSubmit = (values: AutoBookingFormValues) => {
    clearApiError();
    const newRelative = values.new_relative;
    const payload: createAutoAppointmentData = {
      appointment_date: formatDateYYYYMMDD(values.appointment_date),
      specialty_id: values.specialty_id,
      start_time: values.start_time,
      end_time: values.end_time?.trim() ? values.end_time.trim() : undefined,
      ...(values.is_new_relative && newRelative
        ? {
            new_relative_profile: {
              fullname: (newRelative.fullname ?? "").trim(),
              relationship_code: newRelative.relationship_code ?? "",
              gender: newRelative.gender === "true",
              ...(newRelative.dob?.trim()
                ? { dob: newRelative.dob.trim() }
                : {}),
              ...(newRelative.phone?.trim()
                ? { phone: newRelative.phone.trim() }
                : {}),
            },
          }
        : { relative_id: values.relative_id }),
    };

    handleAutoBooking(payload, {
      onSuccess: closeAndReset,
    });
  };

  // Tính toán chuỗi tóm tắt khi các trường cơ bản đã được điền
  const summaryInfo = useMemo(() => {
    const patientName = isNewRelative
      ? watchedValues.new_relative?.fullname?.trim()
      : relatives.find((r) => r.id === selectedRelativeId)?.fullname;

    const specialty = specialties.find((s) => s.id === selectedSpecialtyId);
    const specialtyName = specialty?.name;

    const dateStr = selectedDate
      ? selectedDate.toLocaleDateString("vi-VN", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        })
      : "";

    const timeStr = selectedStartTime
      ? `${selectedStartTime}${selectedEndTime ? ` – ${selectedEndTime}` : ""}`
      : "";

    if (!patientName || !specialtyName || !dateStr || !timeStr) {
      return null;
    }

    return `${patientName} · ${specialtyName} · ${dateStr} · ${timeStr}`;
  }, [
    isNewRelative,
    watchedValues.new_relative?.fullname,
    relatives,
    selectedRelativeId,
    specialties,
    selectedSpecialtyId,
    selectedDate,
    selectedStartTime,
    selectedEndTime,
  ]);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <Button
        type="button"
        variant="outline"
        onClick={() => {
          if (!userInfo) {
            navigate("/sign-in");
            return;
          }
          setOpen(true);
        }}
        className={cn(
          "gap-2 rounded-full border-primary/40 text-primary hover:bg-primary/5 active:scale-[0.98] transition-all cursor-pointer font-bold",
          className
        )}
      >
        <Sparkles className="h-4 w-4" />
        Đặt lịch nhanh
      </Button>

      <DialogContent className="w-full max-w-[calc(100vw-1.5rem)] sm:max-w-[760px] md:max-w-[820px] p-0 gap-0 border border-border shadow-2xl rounded-2xl sm:rounded-3xl bg-card text-card-foreground overflow-hidden">
        {/* Header Dialog */}
        <div className="shrink-0 px-5 py-4 sm:px-6 sm:py-4 border-b border-border bg-card pr-12">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-0.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Sparkles className="h-4 w-4" />
              </div>
              <DialogTitle className="text-base sm:text-lg font-extrabold font-heading text-foreground">
                Đặt lịch nhanh
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs sm:text-xs text-muted-foreground leading-normal">
              Chọn ngày và khoảng thời gian thuận tiện. LifeHealth sẽ tự tìm bác
              sĩ cùng ca khám còn phù hợp.
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Nội dung Form cuộn */}
        <DialogBody className="p-4 sm:p-5 overscroll-contain scrollbar-soft pb-4">
          <form
            id="auto-booking-form"
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-4"
            noValidate
          >
            {/* Grid 2 cột trên Desktop (>= md) và 1 cột trên Mobile */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
              {/* CỘT TRÁI: Người đi khám & Chuyên khoa */}
              <div className="space-y-4">
                {/* 1. Người đi khám */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor={patientSelectId}
                      className="text-xs sm:text-sm font-bold font-heading text-foreground flex items-center gap-1.5"
                    >
                      <UserRound className="w-4 h-4 text-primary shrink-0" />
                      <span>1. Người đi khám</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => handleToggleNewRelative(!isNewRelative)}
                      disabled={isPending}
                      className="text-xs text-primary hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      {isNewRelative ? (
                        <>
                          <Users className="w-3.5 h-3.5" />
                          <span>Chọn người có sẵn</span>
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-3.5 h-3.5" />
                          <span>+ Thêm người mới</span>
                        </>
                      )}
                    </button>
                  </div>

                  {!isNewRelative ? (
                    <div>
                      <Controller
                        control={control}
                        name="relative_id"
                        render={({ field }) => (
                          <select
                            id={patientSelectId}
                            value={field.value}
                            disabled={isLoadingRelatives || isPending}
                            onChange={(e) => {
                              clearApiError();
                              field.onChange(Number(e.target.value));
                            }}
                            aria-invalid={!!errors.relative_id}
                            aria-describedby={
                              errors.relative_id ? "relative-id-error" : undefined
                            }
                            className={cn(
                              "w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-xs sm:text-sm text-foreground outline-none transition-colors focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:bg-muted min-h-[44px]",
                              errors.relative_id && "border-destructive focus-visible:ring-destructive/20"
                            )}
                          >
                            <option value={0}>
                              {isLoadingRelatives
                                ? "Đang tải danh sách người khám..."
                                : "Chọn người đi khám"}
                            </option>
                            {relatives.map((relative) => (
                              <option key={relative.id} value={relative.id}>
                                {relative.fullname || "Chưa có tên"} -{" "}
                                {relative.relationship?.relationship_name}
                              </option>
                            ))}
                          </select>
                        )}
                      />
                      {errors.relative_id && (
                        <p
                          id="relative-id-error"
                          role="alert"
                          className="mt-1 text-xs text-destructive flex items-center gap-1"
                        >
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          {errors.relative_id.message}
                        </p>
                      )}
                    </div>
                  ) : (
                    /* Disclosure form thêm người thân mới */
                    <div className="rounded-xl border border-dashed border-primary/40 bg-primary/5 p-3.5 space-y-3">
                      <div className="flex items-center justify-between text-xs font-bold text-primary">
                        <span className="flex items-center gap-1.5">
                          <UserPlus className="w-4 h-4" />
                          Hồ sơ người thân mới
                        </span>
                        <button
                          type="button"
                          onClick={() => handleToggleNewRelative(false)}
                          aria-label="Quay lại danh sách người thân"
                          className="text-muted-foreground hover:text-foreground text-[11px] font-medium cursor-pointer"
                        >
                          Quay lại
                        </button>
                      </div>

                      <div className="space-y-2.5 text-xs">
                        <div>
                          <label
                            htmlFor={newFullnameId}
                            className="block font-medium text-foreground mb-1"
                          >
                            Họ và tên <span className="text-destructive">*</span>
                          </label>
                          <Controller
                            control={control}
                            name="new_relative.fullname"
                            render={({ field }) => (
                              <input
                                id={newFullnameId}
                                type="text"
                                placeholder="Ví dụ: Nguyễn Văn A"
                                value={field.value}
                                disabled={isPending}
                                onChange={(e) => {
                                  clearApiError();
                                  field.onChange(e.target.value);
                                }}
                                className={cn(
                                  "w-full rounded-lg border border-input bg-background px-3 py-2 text-xs text-foreground outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20 min-h-[38px]",
                                  errors.new_relative?.fullname && "border-destructive"
                                )}
                              />
                            )}
                          />
                          {errors.new_relative?.fullname && (
                            <p className="mt-0.5 text-[11px] text-destructive">
                              {errors.new_relative.fullname.message}
                            </p>
                          )}
                        </div>

                        <div>
                          <label
                            htmlFor={newRelationshipId}
                            className="block font-medium text-foreground mb-1"
                          >
                            Mối quan hệ <span className="text-destructive">*</span>
                          </label>
                          <Controller
                            control={control}
                            name="new_relative.relationship_code"
                            render={({ field }) => (
                              <select
                                id={newRelationshipId}
                                value={field.value}
                                disabled={isPending}
                                onChange={(e) => {
                                  clearApiError();
                                  field.onChange(e.target.value);
                                }}
                                className={cn(
                                  "w-full rounded-lg border border-input bg-background px-3 py-2 text-xs text-foreground outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20 min-h-[38px]",
                                  errors.new_relative?.relationship_code && "border-destructive"
                                )}
                              >
                                <option value="">Chọn mối quan hệ</option>
                                {relationships.map((rel) => (
                                  <option
                                    key={rel.relationship_code}
                                    value={rel.relationship_code}
                                  >
                                    {rel.relationship_name}
                                  </option>
                                ))}
                              </select>
                            )}
                          />
                          {errors.new_relative?.relationship_code && (
                            <p className="mt-0.5 text-[11px] text-destructive">
                              {errors.new_relative.relationship_code.message}
                            </p>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label
                              htmlFor={newGenderId}
                              className="block font-medium text-foreground mb-1"
                            >
                              Giới tính
                            </label>
                            <Controller
                              control={control}
                              name="new_relative.gender"
                              render={({ field }) => (
                                <select
                                  id={newGenderId}
                                  value={field.value}
                                  disabled={isPending}
                                  onChange={field.onChange}
                                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs text-foreground outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20 min-h-[38px]"
                                >
                                  <option value="true">Nam</option>
                                  <option value="false">Nữ</option>
                                </select>
                              )}
                            />
                          </div>

                          <div>
                            <label
                              htmlFor={newDobId}
                              className="block font-medium text-foreground mb-1"
                            >
                              Ngày sinh
                            </label>
                            <Controller
                              control={control}
                              name="new_relative.dob"
                              render={({ field }) => (
                                <input
                                  id={newDobId}
                                  type="date"
                                  value={field.value ?? ""}
                                  disabled={isPending}
                                  onChange={field.onChange}
                                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs text-foreground outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20 min-h-[38px]"
                                />
                              )}
                            />
                          </div>
                        </div>

                        <div>
                          <label
                            htmlFor={newPhoneId}
                            className="block font-medium text-foreground mb-1"
                          >
                            Số điện thoại (tùy chọn)
                          </label>
                          <Controller
                            control={control}
                            name="new_relative.phone"
                            render={({ field }) => (
                              <input
                                id={newPhoneId}
                                type="tel"
                                placeholder="0901234567"
                                value={field.value ?? ""}
                                disabled={isPending}
                                onChange={field.onChange}
                                className={cn(
                                  "w-full rounded-lg border border-input bg-background px-3 py-2 text-xs text-foreground outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20 min-h-[38px]",
                                  errors.new_relative?.phone && "border-destructive"
                                )}
                              />
                            )}
                          />
                          {errors.new_relative?.phone && (
                            <p className="mt-0.5 text-[11px] text-destructive">
                              {errors.new_relative.phone.message}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. Chuyên khoa */}
                <div className="space-y-2">
                  <label
                    htmlFor={specialtySelectId}
                    className="text-xs sm:text-sm font-bold font-heading text-foreground flex items-center gap-1.5"
                  >
                    <Stethoscope className="w-4 h-4 text-primary shrink-0" />
                    <span>2. Chuyên khoa khám</span>
                  </label>
                  <div>
                    <Controller
                      control={control}
                      name="specialty_id"
                      render={({ field }) => (
                        <select
                          id={specialtySelectId}
                          value={field.value}
                          disabled={isLoadingSpecialties || isPending}
                          onChange={(e) => {
                            clearApiError();
                            field.onChange(Number(e.target.value));
                          }}
                          aria-invalid={!!errors.specialty_id}
                          aria-describedby={
                            errors.specialty_id ? "specialty-id-error" : undefined
                          }
                          className={cn(
                            "w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-xs sm:text-sm text-foreground outline-none transition-colors focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:bg-muted min-h-[44px]",
                            errors.specialty_id && "border-destructive focus-visible:ring-destructive/20"
                          )}
                        >
                          <option value={0}>
                            {isLoadingSpecialties
                              ? "Đang tải chuyên khoa..."
                              : "Chọn chuyên khoa cần khám"}
                          </option>
                          {specialties.map((specialty) => (
                            <option key={specialty.id} value={specialty.id}>
                              {specialty.name}
                            </option>
                          ))}
                        </select>
                      )}
                    />
                    {errors.specialty_id && (
                      <p
                        id="specialty-id-error"
                        role="alert"
                        className="mt-1 text-xs text-destructive flex items-center gap-1"
                      >
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        {errors.specialty_id.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Ghi chú minh bạch y tế */}
                <div className="rounded-xl border border-border/80 bg-muted/30 p-3.5 text-xs text-muted-foreground space-y-1">
                  <div className="flex items-center gap-1.5 font-semibold text-foreground">
                    <Info className="w-4 h-4 text-primary shrink-0" />
                    <span>Quy trình tự động xếp ca</span>
                  </div>
                  <p className="leading-relaxed">
                    Hệ thống sẽ đối soát lịch làm việc của tất cả bác sĩ thuộc
                    chuyên khoa đã chọn để sắp xếp ca khám sớm nhất trong khoảng
                    thời gian bạn mong muốn.
                  </p>
                </div>
              </div>

              {/* CỘT PHẢI: Ngày khám & Khoảng thời gian mong muốn */}
              <div className="space-y-3.5">
                {/* 3. Ngày khám */}
                <div className="space-y-2">
                  <span className="text-xs sm:text-sm font-bold font-heading text-foreground flex items-center gap-1.5">
                    <CalendarDays className="w-4 h-4 text-primary shrink-0" />
                    <span>3. Ngày khám</span>
                  </span>
                  <div className="flex justify-center">
                    <Controller
                      control={control}
                      name="appointment_date"
                      render={({ field }) => (
                        <CalendarComponent
                          selectedDate={field.value}
                          onSelect={(date) => {
                            if (date) {
                              clearApiError();
                              field.onChange(date);
                            }
                          }}
                          calendarClassName="border-border bg-background p-1.5 sm:p-2 [--cell-size:--spacing(8)] sm:[--cell-size:--spacing(8)]"
                        />
                      )}
                    />
                  </div>
                  {errors.appointment_date && (
                    <p
                      role="alert"
                      className="text-xs text-destructive flex items-center gap-1"
                    >
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      {errors.appointment_date.message}
                    </p>
                  )}
                </div>

                {/* 4. Khoảng thời gian mong muốn */}
                <div className="space-y-2.5">
                  <div>
                    <span className="text-xs sm:text-sm font-bold font-heading text-foreground flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-primary shrink-0" />
                      <span>4. Khoảng thời gian mong muốn</span>
                    </span>
                    <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5 leading-relaxed">
                      Đây là khoảng thời gian bạn có thể đến khám. Giờ khám chính
                      xác sẽ được xác nhận sau khi hệ thống tìm được ca phù hợp.
                    </p>
                  </div>

                  {/* Nút Preset lựa chọn nhanh */}
                  <div
                    role="radiogroup"
                    aria-label="Lựa chọn khoảng thời gian mong muốn"
                    className="grid grid-cols-2 gap-2"
                  >
                    {TIME_PRESETS.map((preset) => {
                      const isPast =
                        isSelectedDateToday &&
                        preset.id !== "custom" &&
                        isPresetPastForToday(preset.start_time, selectedDate);
                      const isChecked = selectedPreset === preset.id;

                      return (
                        <button
                          key={preset.id}
                          type="button"
                          role="radio"
                          aria-checked={isChecked}
                          disabled={isPast || isPending}
                          onClick={() => handleSelectPreset(preset.id)}
                          className={cn(
                            "flex flex-col items-start justify-center p-2.5 rounded-xl border text-left transition-all min-h-[50px] cursor-pointer active:scale-[0.98]",
                            isChecked
                              ? "border-primary bg-primary/10 text-primary font-bold shadow-2xs"
                              : "border-input bg-background hover:bg-accent hover:text-accent-foreground text-foreground",
                            isPast &&
                              "opacity-40 cursor-not-allowed hover:bg-background border-input/60 text-muted-foreground"
                          )}
                        >
                          <span className="text-xs font-bold flex items-center justify-between w-full">
                            {preset.label}
                            {isPast && (
                              <span className="text-[10px] font-normal text-muted-foreground">
                                (Đã qua)
                              </span>
                            )}
                          </span>
                          <span className="text-[11px] opacity-80 mt-0.5">
                            {preset.timeRange}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Hiển thị 2 trường khi chọn "Tự chọn giờ" */}
                  {selectedPreset === "custom" && (
                    <div className="p-3 rounded-xl border border-primary/20 bg-primary/5 space-y-2.5 animate-in fade-in-50 duration-150">
                      <p className="text-xs font-semibold text-primary">
                        Nhập khung giờ mong muốn:
                      </p>
                      <div className="grid grid-cols-2 gap-2.5">
                        <div>
                          <label
                            htmlFor={startTimeInputId}
                            className="block text-xs font-medium text-foreground mb-1"
                          >
                            Từ khoảng <span className="text-destructive">*</span>
                          </label>
                          <Controller
                            control={control}
                            name="start_time"
                            render={({ field }) => (
                              <input
                                id={startTimeInputId}
                                type="time"
                                required
                                value={field.value}
                                disabled={isPending}
                                min={
                                  isSelectedDateToday
                                    ? getVietnamTimeHHmm(new Date())
                                    : undefined
                                }
                                onChange={(e) => {
                                  clearApiError();
                                  field.onChange(e.target.value);
                                }}
                                className={cn(
                                  "w-full rounded-lg border border-input bg-background px-2.5 py-2 text-xs text-foreground outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20 min-h-[40px]",
                                  errors.start_time && "border-destructive"
                                )}
                              />
                            )}
                          />
                        </div>

                        <div>
                          <label
                            htmlFor={endTimeInputId}
                            className="block text-xs font-medium text-foreground mb-1"
                          >
                            Đến khoảng (tùy chọn)
                          </label>
                          <Controller
                            control={control}
                            name="end_time"
                            render={({ field }) => (
                              <input
                                id={endTimeInputId}
                                type="time"
                                value={field.value ?? ""}
                                disabled={isPending}
                                onChange={(e) => {
                                  clearApiError();
                                  field.onChange(e.target.value);
                                }}
                                className={cn(
                                  "w-full rounded-lg border border-input bg-background px-2.5 py-2 text-xs text-foreground outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20 min-h-[40px]",
                                  errors.end_time && "border-destructive"
                                )}
                              />
                            )}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Lỗi inline cho nhóm thời gian */}
                  {(errors.start_time || errors.end_time) && (
                    <div
                      role="alert"
                      aria-live="polite"
                      className="p-2.5 rounded-lg bg-destructive/10 border border-destructive/20 text-xs text-destructive flex items-center gap-1.5"
                    >
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>
                        {errors.start_time?.message || errors.end_time?.message}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Thông báo lỗi từ API khi không tìm thấy ca phù hợp */}
            {apiError && (
              <div
                role="alert"
                aria-live="assertive"
                className="p-3.5 rounded-xl border border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200 flex items-start gap-2.5 text-xs sm:text-sm shadow-2xs animate-in fade-in-50 duration-200"
              >
                <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="font-bold">Chưa tìm thấy ca phù hợp</p>
                  <p className="leading-relaxed opacity-95">{apiError}</p>
                </div>
              </div>
            )}

            {/* 5. Tóm tắt lựa chọn (Summary bar) */}
            {summaryInfo && (
              <div
                aria-label="Tóm tắt thông tin đặt lịch"
                className="p-3 rounded-xl bg-primary/5 border border-primary/20 text-xs text-primary flex items-center gap-2 flex-wrap"
              >
                <CalendarClock className="w-4 h-4 shrink-0 text-primary" />
                <span className="font-bold">Lựa chọn:</span>
                <span className="font-medium">{summaryInfo}</span>
              </div>
            )}
          </form>
        </DialogBody>

        {/* Footer Dialog */}
        <DialogFooter className="px-5 py-3 sm:px-6 sm:py-3.5 bg-muted/40 border-t border-border flex justify-end gap-2.5">
          <Button
            type="button"
            variant="outline"
            onClick={closeAndReset}
            disabled={isPending}
            className="rounded-xl min-h-[42px] px-5"
          >
            Hủy
          </Button>

          <Button
            type="submit"
            form="auto-booking-form"
            disabled={!isValid || isPending}
            className="rounded-xl font-bold min-w-[190px] min-h-[42px] px-6 bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs active:scale-[0.98] transition-all cursor-pointer disabled:cursor-not-allowed"
          >
            {isPending ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                <span>Đang tìm kiếm...</span>
              </span>
            ) : (
              "Tìm ca khám phù hợp"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DialogAutoBooking;
