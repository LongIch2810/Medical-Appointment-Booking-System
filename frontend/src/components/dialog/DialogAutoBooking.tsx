import { useState } from "react";
import { Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "../ui/button";
import Loading from "../loading/Loading";
import CalendarComponent from "../calendar/CalendarComponent";
import { useBookingAppointmentStore } from "@/store/bookingAppointmentStore";
import {
  usePatientRelatives,
  useRelationships,
} from "@/hooks/usePatientPortalApi";
import { useGetSpecialtiesInfinite } from "@/hooks/useGetSpecialtiesInfinite";
import { useAutoBooking } from "@/hooks/useAutoBooking";
import { formatDateYYYYMMDD, getVietnamTimeHHmm } from "@/utils/formatDate";
import type { Specialty } from "@/types/interface/specialty.interface";

// Sentinel cho lựa chọn "Thêm người thân mới" trong select — khác 0 (giá trị
// placeholder "Chọn người thân") và khác mọi relative_id thật (luôn dương).
const NEW_RELATIVE_OPTION_VALUE = -1;

const defaultNewRelativeForm = {
  fullname: "",
  relationship_code: "",
  dob: "",
  gender: "true" as "true" | "false",
  phone: "",
};

const DialogAutoBooking = ({ className = "" }: { className?: string }) => {
  const [open, setOpen] = useState(false);
  const [selectedRelativeId, setSelectedRelativeId] = useState(0);
  const [selectedSpecialtyId, setSelectedSpecialtyId] = useState(0);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [newRelativeForm, setNewRelativeForm] = useState(
    defaultNewRelativeForm
  );

  const { selectedDate, reset } = useBookingAppointmentStore();

  const { data: relativesResponse, isLoading: isLoadingRelatives } =
    usePatientRelatives({ page: 1, limit: 100, arrange: "asc" });
  const relatives = relativesResponse?.data.relatives ?? [];

  const { data: relationshipsResponse } = useRelationships({
    page: 1,
    limit: 50,
  });
  const relationships = relationshipsResponse?.data.relationships ?? [];

  const { data: specialtiesResponse, isLoading: isLoadingSpecialties } =
    useGetSpecialtiesInfinite();
  const specialties: Specialty[] =
    specialtiesResponse?.pages.flatMap((page) => page.data.specialties) ?? [];

  const { isPending, handleAutoBooking } = useAutoBooking();

  const isAddingNewRelative = selectedRelativeId === NEW_RELATIVE_OPTION_VALUE;
  const isSelectedDateToday =
    !!selectedDate &&
    formatDateYYYYMMDD(selectedDate) === formatDateYYYYMMDD(new Date());

  const closeAndReset = () => {
    setOpen(false);
    setSelectedRelativeId(0);
    setSelectedSpecialtyId(0);
    setStartTime("");
    setEndTime("");
    setNewRelativeForm(defaultNewRelativeForm);
    reset();
  };

  const handleNewRelativeFieldChange = (
    field: keyof typeof defaultNewRelativeForm,
    value: string
  ) => {
    setNewRelativeForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    const trimmedPhone = newRelativeForm.phone.trim();
    handleAutoBooking(
      {
        appointment_date: formatDateYYYYMMDD(selectedDate),
        specialty_id: selectedSpecialtyId,
        start_time: startTime,
        end_time: endTime || undefined,
        ...(isAddingNewRelative
          ? {
              new_relative_profile: {
                fullname: newRelativeForm.fullname,
                relationship_code: newRelativeForm.relationship_code,
                gender: newRelativeForm.gender === "true",
                // dob tùy chọn — chỉ gửi khi có giá trị, không gửi chuỗi
                // rỗng (backend chỉ bỏ qua validate khi field vắng mặt hẳn).
                ...(newRelativeForm.dob ? { dob: newRelativeForm.dob } : {}),
                ...(trimmedPhone ? { phone: trimmedPhone } : {}),
              },
            }
          : { relative_id: selectedRelativeId }),
      },
      { onSuccess: closeAndReset }
    );
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        setOpen(isOpen);
        if (!isOpen) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={`gap-2 rounded-full border-primary/40 text-primary hover:bg-primary/5 ${className}`}
        >
          <Sparkles className="h-4 w-4" />
          Đặt lịch nhanh
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg p-0 gap-0 border border-slate-200/80 shadow-2xl rounded-2xl sm:rounded-3xl bg-white dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
        <div className="shrink-0 p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 pr-12">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100">
              Đặt lịch nhanh
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Hệ thống tự động tìm kiếm ca khám phù hợp với tiêu chí của bạn
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="flex-1 min-h-0 min-w-0 overflow-y-auto overscroll-contain p-5 sm:p-6 space-y-4 scrollbar-soft">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
            Đặt lịch khám cho
            <select
              value={selectedRelativeId}
              disabled={isLoadingRelatives || isPending}
              onChange={(e) => setSelectedRelativeId(Number(e.target.value))}
              className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:bg-gray-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
            >
              <option value={0}>
                {isLoadingRelatives ? "Đang tải người thân..." : "Chọn người thân"}
              </option>
              {relatives.map((relative) => (
                <option key={relative.id} value={relative.id}>
                  {relative.fullname || "Chưa có tên"} -{" "}
                  {relative.relationship?.relationship_name}
                </option>
              ))}
              <option value={NEW_RELATIVE_OPTION_VALUE}>
                + Thêm người thân mới
              </option>
            </select>
          </label>

          {isAddingNewRelative && (
            <div className="space-y-3 rounded-md border border-dashed border-primary/40 bg-primary/5 p-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                Họ và tên
                <input
                  type="text"
                  required
                  value={newRelativeForm.fullname}
                  disabled={isPending}
                  onChange={(e) =>
                    handleNewRelativeFieldChange("fullname", e.target.value)
                  }
                  className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:bg-gray-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                />
              </label>

              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                Mối quan hệ
                <select
                  value={newRelativeForm.relationship_code}
                  disabled={isPending}
                  onChange={(e) =>
                    handleNewRelativeFieldChange(
                      "relationship_code",
                      e.target.value
                    )
                  }
                  className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:bg-gray-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                >
                  <option value="">Chọn mối quan hệ</option>
                  {relationships.map((relationship) => (
                    <option
                      key={relationship.relationship_code}
                      value={relationship.relationship_code}
                    >
                      {relationship.relationship_name}
                    </option>
                  ))}
                </select>
              </label>

              <div className="flex gap-4">
                <label className="flex-1 text-sm font-medium text-gray-700 dark:text-gray-200">
                  Ngày sinh (tùy chọn)
                  <input
                    type="date"
                    value={newRelativeForm.dob}
                    disabled={isPending}
                    onChange={(e) =>
                      handleNewRelativeFieldChange("dob", e.target.value)
                    }
                    className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:bg-gray-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                  />
                </label>
                <label className="flex-1 text-sm font-medium text-gray-700 dark:text-gray-200">
                  Giới tính
                  <select
                    value={newRelativeForm.gender}
                    disabled={isPending}
                    onChange={(e) =>
                      handleNewRelativeFieldChange("gender", e.target.value)
                    }
                    className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:bg-gray-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                  >
                    <option value="true">Nam</option>
                    <option value="false">Nữ</option>
                  </select>
                </label>
              </div>

              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                Số điện thoại (tùy chọn)
                <input
                  type="tel"
                  value={newRelativeForm.phone}
                  disabled={isPending}
                  onChange={(e) =>
                    handleNewRelativeFieldChange("phone", e.target.value)
                  }
                  className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:bg-gray-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                />
              </label>
            </div>
          )}

          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
            Chuyên khoa
            <select
              value={selectedSpecialtyId}
              disabled={isLoadingSpecialties || isPending}
              onChange={(e) => setSelectedSpecialtyId(Number(e.target.value))}
              className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:bg-gray-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
            >
              <option value={0}>
                {isLoadingSpecialties ? "Đang tải chuyên khoa..." : "Chọn chuyên khoa"}
              </option>
              {specialties.map((specialty) => (
                <option key={specialty.id} value={specialty.id}>
                  {specialty.name}
                </option>
              ))}
            </select>
          </label>

          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
              Ngày khám
            </p>
            <div className="flex justify-center">
              <CalendarComponent />
            </div>
          </div>

          <div className="flex gap-4">
            <label className="flex-1 text-sm font-medium text-gray-700 dark:text-gray-200">
              Giờ bắt đầu
              <input
                type="time"
                required
                value={startTime}
                disabled={isPending}
                min={isSelectedDateToday ? getVietnamTimeHHmm(new Date()) : undefined}
                onChange={(e) => setStartTime(e.target.value)}
                className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:bg-gray-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
              />
            </label>
            <label className="flex-1 text-sm font-medium text-gray-700 dark:text-gray-200">
              Giờ kết thúc (tùy chọn)
              <input
                type="time"
                value={endTime}
                disabled={isPending}
                onChange={(e) => setEndTime(e.target.value)}
                className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:bg-gray-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
              />
            </label>
          </div>
        </div>

        <div className="shrink-0 p-4 sm:p-5 bg-slate-50/80 dark:bg-slate-950/80 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2.5">
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            className="rounded-xl"
          >
            Hủy
          </Button>
          <Button
            type="button"
            disabled={isPending}
            onClick={handleSubmit}
            className="rounded-xl font-bold !bg-primary hover:!bg-primary/90 text-white shadow-xs"
          >
            {isPending ? <Loading /> : "Đặt lịch"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DialogAutoBooking;
