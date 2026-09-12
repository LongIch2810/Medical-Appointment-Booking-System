import React, { useMemo, useState } from "react";
import {
  Activity,
  CalendarClock,
  ClipboardList,
  Eye,
  FileSearch,
  FileText,
  Microscope,
  Pill,
  Search,
  Stethoscope,
  UserRound,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import MedicalAiLoading from "@/components/loading/MedicalAiLoading";
import { usePatientExaminationResults } from "@/hooks/usePatientPortalApi";
import { cn } from "@/lib/utils";
import type { ExaminationResult } from "@/types/interface/patient.interface";
import { useTranslation } from "react-i18next";

const getSpecialtyName = (result: ExaminationResult) =>
  result.appointment?.doctor?.specialty?.specialty_name ??
  result.appointment?.doctor?.specialty?.name ??
  "Chưa cập nhật chuyên khoa";

const getDoctorName = (result: ExaminationResult) =>
  result.appointment?.doctor?.user?.fullname ?? "Bác sĩ chưa cập nhật";

const getPatientName = (result: ExaminationResult) =>
  result.appointment?.patient?.fullname ??
  result.appointment?.patient?.user?.fullname ??
  "Bệnh nhân chưa cập nhật";

type Section = {
  key: "symptoms" | "diagnosis" | "treatment" | "prescription";
  label: string;
  icon: React.ElementType;
  iconClass: string;
  surfaceClass: string;
};

const ResultSection: React.FC<{
  section: Section;
  value: string | null | undefined;
  compact?: boolean;
  notUpdatedText: string;
}> = ({ section, value, compact, notUpdatedText }) => {
  const Icon = section.icon;
  const text = value && value.trim().length > 0 ? value : notUpdatedText;
  return (
    <div
      className={cn(
        "rounded-2xl border p-4 transition-all",
        section.surfaceClass,
        compact && "p-3.5",
      )}
    >
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "flex h-7 w-7 items-center justify-center rounded-xl",
            section.iconClass,
          )}
        >
          <Icon className="h-3.5 w-3.5" />
        </span>
        <p className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
          {section.label}
        </p>
      </div>
      <p
        className={cn(
          "mt-2 whitespace-pre-line text-xs sm:text-sm leading-relaxed text-slate-800 dark:text-slate-200 font-medium",
          compact && "line-clamp-2",
        )}
      >
        {text}
      </p>
    </div>
  );
};

const VisitResults: React.FC = () => {
  const { t } = useTranslation();
  const { data, isLoading, isError } = usePatientExaminationResults({
    page: 1,
    limit: 50,
    arrange: "desc",
  });
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<ExaminationResult | null>(null);

  const sections: Section[] = useMemo(
    () => [
      {
        key: "symptoms",
        label: t("visitResults.symptomsLabel"),
        icon: Activity,
        iconClass:
          "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300",
        surfaceClass:
          "border-amber-200/80 bg-amber-50/40 dark:border-amber-900/40 dark:bg-amber-950/20",
      },
      {
        key: "diagnosis",
        label: t("visitResults.diagnosisLabel"),
        icon: Microscope,
        iconClass:
          "bg-sky-100 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300",
        surfaceClass:
          "border-sky-200/80 bg-sky-50/40 dark:border-sky-900/40 dark:bg-sky-950/20",
      },
      {
        key: "treatment",
        label: t("visitResults.treatmentLabel"),
        icon: ClipboardList,
        iconClass:
          "bg-violet-100 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300",
        surfaceClass:
          "border-violet-200/80 bg-violet-50/40 dark:border-violet-900/40 dark:bg-violet-950/20",
      },
      {
        key: "prescription",
        label: t("visitResults.prescriptionLabel"),
        icon: Pill,
        iconClass:
          "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300",
        surfaceClass:
          "border-emerald-200/80 bg-emerald-50/40 dark:border-emerald-900/40 dark:bg-emerald-950/20",
      },
    ],
    [t],
  );

  const visitResults = useMemo<ExaminationResult[]>(
    () => data?.data.examination_results ?? [],
    [data],
  );

  const filteredResults = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return visitResults;
    return visitResults.filter((result) => {
      return [
        getDoctorName(result),
        getPatientName(result),
        getSpecialtyName(result),
        result.symptoms,
        result.diagnosis,
        result.treatment,
        result.prescription,
      ]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(keyword));
    });
  }, [search, visitResults]);

  return (
    <Card className="overflow-hidden border-slate-200/80 bg-white dark:border-slate-800/80 dark:bg-slate-900 py-0 shadow-xs">
      <CardHeader className="space-y-4 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-primary/5 via-white to-sky-50/30 dark:from-primary/10 dark:via-slate-900 dark:to-slate-900 px-6 py-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3.5">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <FileText className="h-5.5 w-5.5" />
            </div>
            <div className="space-y-0.5">
              <CardTitle className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                {t("visitResults.pageTitle")}
              </CardTitle>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t("visitResults.pageSubtitle")}
              </p>
            </div>
          </div>
          <Badge
            variant="outline"
            className="self-start rounded-full border-primary/30 bg-primary/5 px-3 py-1 text-xs font-bold text-primary"
          >
            {t("visitResults.badgeCount", { count: visitResults.length })}
          </Badge>
        </div>

        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("visitResults.searchPlaceholder")}
            className="h-10.5 rounded-2xl border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-100 pl-10 text-xs sm:text-sm shadow-2xs focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20"
          />
        </div>
      </CardHeader>

      <CardContent className="space-y-4 px-6 py-5">
        {isLoading ? (
          <MedicalAiLoading
            label={t("common.loading")}
            description="Syncing medical records and prescriptions"
            minHeight="min-h-56"
          />
        ) : isError ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50/60 dark:border-rose-900/50 dark:bg-rose-950/40 p-5 text-sm text-rose-600 dark:text-rose-300 font-medium">
            {t("common.error")}
          </div>
        ) : visitResults.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40 px-6 py-12 text-center">
            <FileSearch className="mx-auto mb-3 h-10 w-10 text-slate-400" />
            <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
              {t("visitResults.emptyList")}
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              {t("visitResults.emptyListDesc")}
            </p>
          </div>
        ) : filteredResults.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40 px-6 py-10 text-center">
            <Search className="mx-auto mb-3 h-8 w-8 text-slate-400" />
            <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
              {t("visitResults.emptySearch")}
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {t("visitResults.emptySearchDesc")}
            </p>
          </div>
        ) : (
          filteredResults.map((result) => {
            const doctorName = getDoctorName(result);
            const patientName = getPatientName(result);
            const specialty = getSpecialtyName(result);
            const startTime = result.appointment?.doctor_schedule?.start_time;
            const endTime = result.appointment?.doctor_schedule?.end_time;
            const appointmentDate = result.appointment?.appointment_date;

            return (
              <div
                key={result.id}
                className="group rounded-3xl border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900/60 p-5 shadow-2xs transition-all hover:border-primary/40 dark:hover:border-slate-700 hover:shadow-md"
              >
                <div className="flex flex-col gap-3 border-b border-slate-100 dark:border-slate-800 pb-4 md:flex-row md:items-start md:justify-between">
                  <div className="flex flex-1 gap-3.5 min-w-0">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <Stethoscope className="h-5.5 w-5.5" />
                    </div>
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 truncate">
                          {t("appointments.doctorPrefix")} {doctorName}
                        </p>
                        <Badge
                          variant="secondary"
                          className="rounded-full bg-sky-100 dark:bg-sky-950/60 dark:text-sky-300 px-2.5 py-0.5 text-[11px] font-bold text-sky-700 border-none"
                        >
                          {specialty}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                        <span className="inline-flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
                          <CalendarClock className="h-3.5 w-3.5 text-primary" />
                          {appointmentDate ?? result.created_at}
                        </span>
                        {startTime && endTime ? (
                          <span className="inline-flex items-center gap-1">
                            {startTime} - {endTime}
                          </span>
                        ) : null}
                        <span className="inline-flex items-center gap-1">
                          <UserRound className="h-3.5 w-3.5 text-slate-400" />
                          {t("appointments.patientLabel")} <strong className="text-slate-700 dark:text-slate-200">{patientName}</strong>
                        </span>
                      </div>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-9 shrink-0 gap-1.5 self-start rounded-xl border-slate-200 dark:border-slate-700 dark:bg-slate-800 px-3.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:border-primary/40 hover:bg-primary/5 hover:text-primary dark:hover:bg-slate-700 md:self-center cursor-pointer"
                    onClick={() => setSelected(result)}
                  >
                    <Eye className="h-3.5 w-3.5" />
                    {t("visitResults.viewDetailBtn")}
                  </Button>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {sections.map((section) => (
                    <ResultSection
                      key={section.key}
                      section={section}
                      value={result[section.key] as string}
                      compact
                      notUpdatedText={t("common.notUpdated")}
                    />
                  ))}
                </div>
              </div>
            );
          })
        )}
      </CardContent>

      <Dialog
        open={!!selected}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      >
        <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden rounded-2xl sm:rounded-3xl">
          <div className="shrink-0 p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 pr-12">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-slate-100">
                <FileText className="h-5 w-5 text-primary" />
                {t("visitResults.modalTitle")}
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 dark:text-slate-400">
                {selected
                  ? `${t("appointments.doctorPrefix")} ${getDoctorName(selected)} • ${getSpecialtyName(selected)}`
                  : null}
              </DialogDescription>
            </DialogHeader>
          </div>

          {selected ? (
            <div className="flex-1 min-h-0 min-w-0 overflow-y-auto overscroll-contain p-5 sm:p-6 space-y-4 scrollbar-soft">
              <div className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-3.5 sm:grid-cols-3 dark:border-slate-800 dark:bg-slate-950/50">
                <div className="space-y-0.5">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    {t("appointments.appointmentDate")}
                  </p>
                  <p className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                    <CalendarClock className="h-3.5 w-3.5 text-primary" />
                    {selected.appointment?.appointment_date ?? selected.created_at}
                  </p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    {t("common.patient")}
                  </p>
                  <p className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                    <UserRound className="h-3.5 w-3.5 text-primary" />
                    {getPatientName(selected)}
                  </p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    {t("appointments.doctorInCharge")}
                  </p>
                  <p className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                    <Stethoscope className="h-3.5 w-3.5 text-primary" />
                    {t("appointments.doctorPrefix")} {getDoctorName(selected)}
                  </p>
                </div>
              </div>

              <div className="grid gap-3.5 sm:grid-cols-2">
                {sections.map((section) => (
                  <ResultSection
                    key={section.key}
                    section={section}
                    value={selected[section.key] as string}
                    notUpdatedText={t("common.notUpdated")}
                  />
                ))}
              </div>
            </div>
          ) : null}

          <div className="shrink-0 p-4 sm:p-5 bg-slate-50/80 dark:bg-slate-950/80 border-t border-slate-100 dark:border-slate-800 flex justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setSelected(null)}
              className="rounded-xl font-medium"
            >
              {t("common.close")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default VisitResults;
