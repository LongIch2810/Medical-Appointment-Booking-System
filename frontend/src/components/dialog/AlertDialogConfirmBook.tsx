import { CalendarDays, Stethoscope, User } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";
import { formatDate, formatDateYYYYMMDD } from "@/utils/formatDate";
import Loading from "../loading/Loading";
import { usePatientRelatives } from "@/hooks/usePatientPortalApi";

interface AlertDialogConfirmBookProps {
  doctorId: number;
  doctorScheduleId: number;
  openConfirm: boolean;
  setOpenConfirm: (data: boolean) => void;
  selectedDate: Date;
  tempTime: { start_time: string; end_time: string };
  doctorName: string;
  specialtyName: string;
  isPending: boolean;
  setIsPending?: (data: boolean) => void;
  handleConfirm: (data: {
    appointment_date: string;
    doctor_id: number;
    doctor_schedule_id: number;
    relative_id: number;
  }) => void;
}

const AlertDialogConfirmBook = ({
  doctorId,
  doctorScheduleId,
  openConfirm,
  setOpenConfirm,
  selectedDate,
  tempTime,
  doctorName,
  specialtyName,
  isPending,
  handleConfirm,
}: AlertDialogConfirmBookProps) => {
  const { t, i18n } = useTranslation();
  const [selectedRelativeId, setSelectedRelativeId] = useState(0);
  const { data: relativesResponse, isLoading: isLoadingRelatives } =
    usePatientRelatives({
      page: 1,
      limit: 100,
      arrange: "asc",
    });
  const relatives = relativesResponse?.data.relatives ?? [];

  const handleBook = () => {
    if (!selectedRelativeId) {
      toast.error(t("doctor.selectRelativeToast"));
      return;
    }

    handleConfirm({
      appointment_date: formatDateYYYYMMDD(selectedDate),
      doctor_id: doctorId,
      doctor_schedule_id: doctorScheduleId,
      relative_id: selectedRelativeId,
    });
  };

  return (
    <AlertDialog open={openConfirm} onOpenChange={setOpenConfirm}>
      <AlertDialogContent className="max-w-md p-0 gap-0 rounded-2xl shadow-xl overflow-hidden bg-white dark:bg-[#172033] border border-slate-200/80 dark:border-[#293548]">
        <AlertDialogHeader className="shrink-0 p-5 pb-3 border-b border-slate-100 dark:border-[#293548] text-center bg-white dark:bg-[#111827]">
          <div className="flex items-center justify-center w-11 h-11 mx-auto rounded-full bg-primary/10 text-primary dark:bg-primary/20">
            <CalendarDays size={24} />
          </div>
          <AlertDialogTitle className="text-center text-lg sm:text-xl font-bold mt-2 text-slate-900 dark:text-slate-100">
            {t("doctor.confirmBookingTitle")}
          </AlertDialogTitle>
          <AlertDialogDescription className="sr-only">
            {t("doctor.confirmBookingTitle")}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="flex-1 min-h-0 min-w-0 overflow-y-auto overscroll-contain p-5 space-y-4 text-slate-600 dark:text-slate-300 text-sm scrollbar-soft">
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-3.5 text-center leading-relaxed dark:bg-primary/10 dark:border-primary/30">
            {t("doctor.confirmBookingPrompt", {
              date: formatDate(selectedDate, i18n.language === "vi" ? "vi-VN" : "en-US"),
              time: `${tempTime?.start_time} - ${tempTime?.end_time}`,
            })}
          </div>

          <div className="rounded-xl border border-slate-100 dark:border-[#293548] bg-slate-50/70 dark:bg-[#1E293B] p-3.5 space-y-2 text-xs sm:text-sm">
            <div className="flex items-center gap-2">
              <Stethoscope size={16} className="text-primary shrink-0" />
              <span className="text-slate-500 dark:text-slate-400">{t("doctor.doctorLabel")}</span>
              <strong className="text-slate-800 dark:text-slate-100 font-semibold">{doctorName}</strong>
            </div>
            <div className="flex items-center gap-2">
              <User size={16} className="text-primary shrink-0" />
              <span className="text-slate-500 dark:text-slate-400">{t("doctor.specialtyLabel")}</span>
              <strong className="text-slate-800 dark:text-slate-100 font-semibold">{specialtyName}</strong>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200">
              {t("doctor.patientSelectLabel")}
            </label>
            <select
              value={selectedRelativeId}
              disabled={isLoadingRelatives || isPending}
              onChange={(event) =>
                setSelectedRelativeId(Number(event.target.value))
              }
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:bg-slate-100 dark:border-[#293548] dark:bg-[#1E293B] dark:text-slate-100"
            >
              <option value={0}>
                {isLoadingRelatives
                  ? t("doctor.loadingRelatives")
                  : t("doctor.selectRelativePlaceholder")}
              </option>
              {relatives.map((relative) => (
                <option key={relative.id} value={relative.id}>
                  {relative.fullname || (i18n.language === "vi" ? "Chưa có tên" : "Unnamed")} -{" "}
                  {relative.relationship?.relationship_name}
                </option>
              ))}
            </select>

            {!isLoadingRelatives && relatives.length === 0 && (
              <p className="text-xs text-error mt-1">
                {t("doctor.noRelativesPrompt")}{" "}
                <Link
                  to="/patient/relatives"
                  className="font-medium underline hover:text-primary"
                >
                  {t("doctor.addRelativeLink")}
                </Link>{" "}
                {t("doctor.beforeBookingSuffix")}
              </p>
            )}
          </div>
        </div>

        <AlertDialogFooter className="shrink-0 p-4 border-t border-slate-100 dark:border-[#293548] flex flex-col-reverse sm:flex-row justify-end gap-2.5 bg-slate-50/80 dark:bg-[#111827]">
          <AlertDialogCancel className="w-full sm:w-auto rounded-xl">
            {t("doctor.cancelBtn")}
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={
              isPending ||
              isLoadingRelatives ||
              relatives.length === 0 ||
              !selectedRelativeId
            }
            onClick={handleBook}
            className="w-full sm:w-auto rounded-xl font-bold !bg-primary text-white dark:!text-primary-foreground hover:!bg-primary/90"
          >
            {isPending ? <Loading /> : t("doctor.confirmBtn")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default AlertDialogConfirmBook;
