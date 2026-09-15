import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Activity,
  AlertTriangle,
  CalendarCheck2,
  CigaretteOff,
  ClipboardList,
  Dna,
  Droplet,
  Droplets,
  HeartPulse,
  Pill,
  Ruler,
  Scale,
  Stethoscope,
  Syringe,
  Wine,
  FolderHeart,
  Edit3,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import MedicalAiLoading from "@/components/loading/MedicalAiLoading";
import ErrorState from "@/components/notification/ErrorState";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  usePatientHealthProfiles,
  useUpdatePatientHealthProfile,
} from "@/hooks/usePatientPortalApi";
import type {
  HealthProfile,
  HealthProfilePayload,
} from "@/types/interface/patient.interface";
import {
  BLOOD_TYPE_OPTIONS,
  UNSPECIFIED,
  healthProfileFormSchema,
  type HealthProfileFormValues,
} from "@/schemas/healthProfile.schema";
import { useTranslation } from "react-i18next";

const toDateInputValue = (value: string | null | undefined) => {
  if (!value) return "";
  if (/^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 10);

  const separator = value.includes("/") ? "/" : "-";
  const parts = value.split(separator);
  if (parts.length === 3) {
    const [day, month, year] = parts;
    if (year?.length === 4) {
      return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
    }
  }

  return "";
};

const getInitialForm = (
  profile?: HealthProfile | null,
): HealthProfileFormValues => ({
  weight: profile?.weight?.toString() ?? "",
  height: profile?.height?.toString() ?? "",
  blood_type:
    profile?.blood_type &&
    (BLOOD_TYPE_OPTIONS as readonly string[]).includes(profile.blood_type)
      ? profile.blood_type
      : UNSPECIFIED,
  medical_history: profile?.medical_history ?? "",
  allergies: profile?.allergies ?? "",
  heart_rate: profile?.heart_rate?.toString() ?? "",
  blood_pressure: profile?.blood_pressure ?? "",
  glucose_level: profile?.glucose_level?.toString() ?? "",
  cholesterol_level: profile?.cholesterol_level?.toString() ?? "",
  medications: profile?.medications ?? "",
  vaccinations: profile?.vaccinations ?? "",
  smoking:
    profile?.smoking === null || profile?.smoking === undefined
      ? UNSPECIFIED
      : String(profile.smoking),
  alcohol_consumption:
    profile?.alcohol_consumption === null ||
    profile?.alcohol_consumption === undefined
      ? UNSPECIFIED
      : String(profile.alcohol_consumption),
  exercise_frequency: profile?.exercise_frequency ?? "",
  last_checkup_date: toDateInputValue(profile?.last_checkup_date),
});

const optionalNumber = (value: string | undefined) =>
  !value || value.trim() === "" ? undefined : Number(value);

const optionalBoolean = (value: string | undefined) =>
  !value || value === UNSPECIFIED ? undefined : value === "true";

const optionalString = (value: string | undefined) =>
  !value || value.trim() === "" ? undefined : value.trim();

const HealthRecords: React.FC = () => {
  const { t } = useTranslation();
  const { data, isLoading, isError } = usePatientHealthProfiles({
    page: 1,
    limit: 50,
  });
  const updateHealthProfileMutation = useUpdatePatientHealthProfile();
  const healthProfiles = useMemo(
    () => data?.data.healthProfiles ?? [],
    [data?.data.healthProfiles],
  );
  const [selectedRelativeId, setSelectedRelativeId] = useState<number | null>(
    null,
  );
  const [isUpdateOpen, setIsUpdateOpen] = useState(false);
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<HealthProfileFormValues>({
    resolver: zodResolver(healthProfileFormSchema),
    defaultValues: getInitialForm(),
  });

  const formatValue = (
    value: string | number | boolean | null | undefined,
    suffix: string = "",
  ) => {
    if (value === null || value === undefined || value === "") {
      return t("common.notUpdated");
    }
    if (typeof value === "boolean") {
      return value ? t("common.yes") : t("common.no");
    }
    return `${value}${suffix}`;
  };

  useEffect(() => {
    if (!selectedRelativeId && healthProfiles[0]?.patient.id) {
      setSelectedRelativeId(healthProfiles[0].patient.id);
    }
  }, [healthProfiles, selectedRelativeId]);

  const selectedHealthRecord = useMemo(
    () =>
      healthProfiles.find(
        (profile) => profile.patient.id === selectedRelativeId,
      ) ?? null,
    [healthProfiles, selectedRelativeId],
  );

  useEffect(() => {
    reset(getInitialForm(selectedHealthRecord));
  }, [selectedHealthRecord, reset]);

  const handleUpdate = (values: HealthProfileFormValues) => {
    if (!selectedHealthRecord) return;

    const payload: HealthProfilePayload = {
      weight: optionalNumber(values.weight),
      height: optionalNumber(values.height),
      blood_type:
        values.blood_type === UNSPECIFIED ? undefined : values.blood_type,
      medical_history: optionalString(values.medical_history),
      allergies: optionalString(values.allergies),
      heart_rate: optionalNumber(values.heart_rate),
      blood_pressure: optionalString(values.blood_pressure),
      glucose_level: optionalNumber(values.glucose_level),
      cholesterol_level: optionalNumber(values.cholesterol_level),
      medications: optionalString(values.medications),
      vaccinations: optionalString(values.vaccinations),
      smoking: optionalBoolean(values.smoking),
      alcohol_consumption: optionalBoolean(values.alcohol_consumption),
      exercise_frequency: optionalString(values.exercise_frequency),
      last_checkup_date: optionalString(values.last_checkup_date),
    };

    updateHealthProfileMutation.mutate(
      {
        relativeId: selectedHealthRecord.patient.id,
        data: payload,
      },
      {
        onSuccess: () => {
          toast.success(t("healthRecords.updateSuccessToast"));
          setIsUpdateOpen(false);
        },
        onError: () => toast.error(t("healthRecords.updateErrorToast")),
      },
    );
  };

  return (
    <div className="space-y-6">
      {/* Relative Selection Card */}
      <Card className="border-slate-200/80 bg-white py-0 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 dark:border-slate-800 px-6 py-4.5">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <FolderHeart className="h-4.5 w-4.5" />
            </span>
            <div>
              <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100">
                {t("healthRecords.pageTitle")}
              </CardTitle>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t("healthRecords.pageSubtitle")}
              </p>
            </div>
          </div>
          <Badge variant="outline" className="w-fit text-xs font-semibold border-primary/20 text-primary bg-primary/5">
            {t("healthRecords.recordsCount", { count: healthProfiles.length })}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-3 px-6 py-5">
          {isLoading ? (
            <MedicalAiLoading
              label={t("common.loading")}
              description="Syncing biometric and medical data"
              minHeight="min-h-36"
            />
          ) : isError ? (
            <ErrorState
              title={t("common.error")}
              description={t("healthRecords.updateErrorToast")}
            />
          ) : healthProfiles.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 p-8 text-center text-sm text-slate-500">
              {t("healthRecords.emptyRecords")}
            </div>
          ) : (
            <div className="flex flex-wrap gap-2.5">
              {healthProfiles.map((profile) => {
                const isSelected = profile.patient.id === selectedRelativeId;
                return (
                  <button
                    key={profile.id}
                    type="button"
                    onClick={() => setSelectedRelativeId(profile.patient.id)}
                    className={cn(
                      "flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-bold transition-all cursor-pointer",
                      isSelected
                        ? "border-primary bg-primary text-white shadow-xs"
                        : "border-slate-200 bg-white text-slate-700 hover:border-primary/40 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800",
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-6 w-6 items-center justify-center rounded-lg text-[11px] font-extrabold",
                        isSelected
                          ? "bg-white/20 text-white"
                          : "bg-primary/10 text-primary",
                      )}
                    >
                      {profile.patient.fullname?.charAt(0).toUpperCase() || "P"}
                    </span>
                    <span>{profile.patient.fullname ?? "Bệnh nhân"}</span>
                    <span
                      className={cn(
                        "rounded-md px-1.5 py-0.5 text-[10px] font-medium",
                        isSelected
                          ? "bg-white/20 text-white"
                          : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400",
                      )}
                    >
                      {profile.patient.relationship.relationship_name}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {!selectedHealthRecord ? (
        healthProfiles.length > 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 p-10 text-center text-sm text-slate-500">
            {t("healthRecords.selectRecordPrompt")}
          </div>
        ) : null
      ) : (
        <>
          {/* Active Record Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <HeartPulse className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {t("healthRecords.activeRecordLabel")}
                </p>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                    {selectedHealthRecord.patient.fullname ?? "Bệnh nhân"}
                  </h3>
                  <Badge variant="outline" className="border-primary/20 bg-primary/5 text-primary text-xs">
                    {selectedHealthRecord.patient.relationship.relationship_name}
                  </Badge>
                </div>
              </div>
            </div>
            <Button
              type="button"
              onClick={() => setIsUpdateOpen(true)}
              className="gap-2 rounded-xl text-xs font-bold bg-primary hover:bg-primary/90 text-white shadow-xs cursor-pointer"
            >
              <Edit3 className="h-3.5 w-3.5 text-white" />
              <span>{t("healthRecords.updateMetricsBtn")}</span>
            </Button>
          </div>

          {/* 4 Biometric Metric Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                  {t("dashboard.bloodType")}
                </span>
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-500">
                  <Droplet className="h-4.5 w-4.5" />
                </span>
              </div>
              <p className="mt-3 text-2xl font-black text-rose-600 dark:text-rose-400">
                {formatValue(selectedHealthRecord.blood_type)}
              </p>
              <p className="mt-1 text-xs text-slate-400">{t("healthRecords.bloodTypeDesc")}</p>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                  {t("dashboard.height")}
                </span>
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-50 dark:bg-sky-950/50 text-sky-500">
                  <Ruler className="h-4.5 w-4.5" />
                </span>
              </div>
              <p className="mt-3 text-2xl font-black text-sky-600 dark:text-sky-400">
                {formatValue(selectedHealthRecord.height, " cm")}
              </p>
              <p className="mt-1 text-xs text-slate-400">{t("healthRecords.heightDesc")}</p>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                  {t("dashboard.weight")}
                </span>
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-500">
                  <Scale className="h-4.5 w-4.5" />
                </span>
              </div>
              <p className="mt-3 text-2xl font-black text-emerald-600 dark:text-emerald-400">
                {formatValue(selectedHealthRecord.weight, " kg")}
              </p>
              <p className="mt-1 text-xs text-slate-400">{t("healthRecords.weightDesc")}</p>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                  {t("healthRecords.lastCheckup")}
                </span>
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50 dark:bg-violet-950/50 text-violet-500">
                  <CalendarCheck2 className="h-4.5 w-4.5" />
                </span>
              </div>
              <p className="mt-3 text-xl font-black text-violet-600 dark:text-violet-400 truncate">
                {formatValue(selectedHealthRecord.last_checkup_date)}
              </p>
              <p className="mt-1 text-xs text-slate-400">{t("healthRecords.lastCheckupDesc")}</p>
            </div>
          </div>

          {/* Vitals and Medications Section */}
          <div className="grid gap-6 xl:grid-cols-2">
            {/* Vitals */}
            <Card className="border-slate-200/80 bg-white py-0 shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <CardHeader className="flex flex-row items-center gap-2.5 border-b border-slate-100 dark:border-slate-800 px-6 py-4.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600">
                  <Activity className="h-4.5 w-4.5" />
                </span>
                <div>
                  <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100">
                    {t("healthRecords.clinicalVitalsTitle")}
                  </CardTitle>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{t("healthRecords.clinicalVitalsSubtitle")}</p>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 px-6 py-5">
                {[
                  {
                    label: t("healthRecords.bloodPressure"),
                    value: formatValue(selectedHealthRecord.blood_pressure),
                    unit: "mmHg",
                    icon: <HeartPulse className="h-4 w-4 text-rose-500" />,
                    bg: "bg-rose-50/60 dark:bg-rose-950/30",
                  },
                  {
                    label: t("healthRecords.heartRate"),
                    value: formatValue(selectedHealthRecord.heart_rate),
                    unit: "nhịp/phút (bpm)",
                    icon: <Activity className="h-4 w-4 text-pink-500" />,
                    bg: "bg-pink-50/60 dark:bg-pink-950/30",
                  },
                  {
                    label: t("healthRecords.glucose"),
                    value: formatValue(selectedHealthRecord.glucose_level),
                    unit: "mg/dL",
                    icon: <Droplets className="h-4 w-4 text-amber-500" />,
                    bg: "bg-amber-50/60 dark:bg-amber-950/30",
                  },
                  {
                    label: t("healthRecords.cholesterol"),
                    value: formatValue(selectedHealthRecord.cholesterol_level),
                    unit: "mg/dL",
                    icon: <Dna className="h-4 w-4 text-indigo-500" />,
                    bg: "bg-indigo-50/60 dark:bg-indigo-950/30",
                  },
                ].map((metric) => (
                  <div
                    key={metric.label}
                    className="flex items-center justify-between rounded-xl border border-slate-200/70 dark:border-slate-800 bg-white dark:bg-slate-900/80 p-3.5 transition-colors hover:border-primary/40"
                  >
                    <div className="flex items-center gap-3">
                      <span className={cn("flex h-8 w-8 items-center justify-center rounded-lg", metric.bg)}>
                        {metric.icon}
                      </span>
                      <div>
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          {metric.label}
                        </p>
                        <p className="text-[11px] text-slate-400">{metric.unit}</p>
                      </div>
                    </div>
                    <span className="text-sm font-extrabold text-slate-900 dark:text-slate-100 font-mono">
                      {metric.value}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Medications & Vaccines */}
            <Card className="border-slate-200/80 bg-white py-0 shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <CardHeader className="flex flex-row items-center gap-2.5 border-b border-slate-100 dark:border-slate-800 px-6 py-4.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-50 dark:bg-cyan-950/50 text-cyan-600">
                  <Pill className="h-4.5 w-4.5" />
                </span>
                <div>
                  <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100">
                    {t("healthRecords.medicationsAndVaccinesTitle")}
                  </CardTitle>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{t("healthRecords.medicationsAndVaccinesSubtitle")}</p>
                </div>
              </CardHeader>
              <CardContent className="space-y-3.5 px-6 py-5">
                <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/60 p-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-cyan-700 dark:text-cyan-400">
                    <Pill className="h-4 w-4" />
                    {t("healthRecords.currentMedications")}
                  </div>
                  <p className="mt-2 min-h-16 whitespace-pre-line text-xs font-medium text-slate-700 dark:text-slate-300">
                    {formatValue(selectedHealthRecord.medications)}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/60 p-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-teal-700 dark:text-teal-400">
                    <Syringe className="h-4 w-4" />
                    {t("healthRecords.vaccineHistory")}
                  </div>
                  <p className="mt-2 min-h-16 whitespace-pre-line text-xs font-medium text-slate-700 dark:text-slate-300">
                    {formatValue(selectedHealthRecord.vaccinations)}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* History and Lifestyle */}
          <Card className="border-slate-200/80 bg-white py-0 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <CardHeader className="flex flex-row items-center gap-2.5 border-b border-slate-100 dark:border-slate-800 px-6 py-4.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600">
                <ClipboardList className="h-4.5 w-4.5" />
              </span>
              <div>
                <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100">
                  {t("healthRecords.historyAndLifestyleTitle")}
                </CardTitle>
                <p className="text-xs text-slate-500 dark:text-slate-400">{t("healthRecords.historyAndLifestyleSubtitle")}</p>
              </div>
            </CardHeader>
            <CardContent className="grid gap-4 px-6 py-5 md:grid-cols-2">
              <div className="rounded-xl border border-amber-200/80 bg-amber-50/40 dark:border-amber-900/50 dark:bg-amber-950/30 p-4">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-800 dark:text-amber-300">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  {t("healthRecords.allergiesTitle")}
                </div>
                <p className="mt-2 text-xs font-medium text-amber-950 dark:text-amber-200 min-h-12 whitespace-pre-line">
                  {formatValue(selectedHealthRecord.allergies)}
                </p>
              </div>

              <div className="rounded-xl border border-rose-200/80 bg-rose-50/40 dark:border-rose-900/50 dark:bg-rose-950/30 p-4">
                <div className="flex items-center gap-2 text-xs font-bold text-rose-800 dark:text-rose-300">
                  <ClipboardList className="h-4 w-4 text-rose-600" />
                  {t("healthRecords.chronicConditionsTitle")}
                </div>
                <p className="mt-2 text-xs font-medium text-rose-950 dark:text-rose-200 min-h-12 whitespace-pre-line">
                  {formatValue(selectedHealthRecord.medical_history)}
                </p>
              </div>

              <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-900/50 p-4">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                  <CigaretteOff className="h-4 w-4 text-slate-500" />
                  {t("healthRecords.smokingTitle")}
                </div>
                <p className="mt-2 text-xs font-semibold text-slate-900 dark:text-slate-100">
                  {formatValue(selectedHealthRecord.smoking)}
                </p>
              </div>

              <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-900/50 p-4">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                  <Wine className="h-4 w-4 text-purple-500" />
                  {t("healthRecords.alcoholTitle")}
                </div>
                <p className="mt-2 text-xs font-semibold text-slate-900 dark:text-slate-100">
                  {formatValue(selectedHealthRecord.alcohol_consumption)}
                </p>
              </div>

              <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-900/50 p-4 md:col-span-2">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                  <Stethoscope className="h-4 w-4 text-emerald-500" />
                  {t("healthRecords.exerciseTitle")}
                </div>
                <p className="mt-2 text-xs font-medium text-slate-800 dark:text-slate-200 whitespace-pre-line">
                  {formatValue(selectedHealthRecord.exercise_frequency)}
                </p>
              </div>
            </CardContent>
          </Card>

          <Dialog open={isUpdateOpen} onOpenChange={setIsUpdateOpen}>
            <DialogContent className="sm:max-w-3xl p-0 gap-0 overflow-hidden rounded-2xl sm:rounded-3xl dark:bg-[#172033] dark:border-[#293548]">
              <div className="shrink-0 p-5 sm:p-6 border-b border-slate-100 dark:border-[#293548] pr-12">
                <DialogHeader>
                  <DialogTitle className="text-lg font-bold text-slate-900 dark:text-[#F1F5F9]">
                    {t("healthRecords.updateModalTitle", { name: selectedHealthRecord.patient.fullname ?? "" })}
                  </DialogTitle>
                  <DialogDescription className="text-xs text-slate-500 dark:text-[#94A3B8]">
                    {t("healthRecords.updateModalSubtitle")}
                  </DialogDescription>
                </DialogHeader>
              </div>

              <form
                className="flex flex-col flex-1 min-h-0 overflow-hidden"
                onSubmit={handleSubmit(handleUpdate)}
              >
                <div className="flex-1 min-h-0 min-w-0 overflow-y-auto overscroll-contain p-5 sm:p-6 grid gap-4 md:grid-cols-2 scrollbar-soft">
                <div className="space-y-2">
                  <Label htmlFor="bloodType">{t("dashboard.bloodType")}</Label>
                  <Controller
                    name="blood_type"
                    control={control}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger id="bloodType" className="w-full">
                          <SelectValue placeholder={t("dashboard.bloodType")} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={UNSPECIFIED}>{t("common.notUpdated")}</SelectItem>
                          {BLOOD_TYPE_OPTIONS.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastCheckupDate">{t("healthRecords.lastCheckup")}</Label>
                  <Input
                    id="lastCheckupDate"
                    type="date"
                    {...register("last_checkup_date")}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="height">{t("dashboard.height")} (cm)</Label>
                  <Input
                    id="height"
                    type="number"
                    min="0"
                    error={errors.height?.message}
                    {...register("height")}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="weight">{t("dashboard.weight")} (kg)</Label>
                  <Input
                    id="weight"
                    type="number"
                    min="0"
                    error={errors.weight?.message}
                    {...register("weight")}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="heartRate">{t("healthRecords.heartRate")} (bpm)</Label>
                  <Input
                    id="heartRate"
                    type="number"
                    min="0"
                    error={errors.heart_rate?.message}
                    {...register("heart_rate")}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bloodPressure">{t("healthRecords.bloodPressure")}</Label>
                  <Input
                    id="bloodPressure"
                    placeholder="120/80"
                    error={errors.blood_pressure?.message}
                    {...register("blood_pressure")}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="glucoseLevel">{t("healthRecords.glucose")} (mg/dL)</Label>
                  <Input
                    id="glucoseLevel"
                    type="number"
                    min="0"
                    error={errors.glucose_level?.message}
                    {...register("glucose_level")}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cholesterolLevel">{t("healthRecords.cholesterol")} (mg/dL)</Label>
                  <Input
                    id="cholesterolLevel"
                    type="number"
                    min="0"
                    error={errors.cholesterol_level?.message}
                    {...register("cholesterol_level")}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="smoking">{t("healthRecords.smokingTitle")}</Label>
                  <Controller
                    name="smoking"
                    control={control}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger id="smoking" className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={UNSPECIFIED}>{t("common.notUpdated")}</SelectItem>
                          <SelectItem value="true">{t("common.yes")}</SelectItem>
                          <SelectItem value="false">{t("common.no")}</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="alcoholConsumption">{t("healthRecords.alcoholTitle")}</Label>
                  <Controller
                    name="alcohol_consumption"
                    control={control}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger id="alcoholConsumption" className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={UNSPECIFIED}>{t("common.notUpdated")}</SelectItem>
                          <SelectItem value="true">{t("common.yes")}</SelectItem>
                          <SelectItem value="false">{t("common.no")}</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="exerciseFrequency">{t("healthRecords.exerciseTitle")}</Label>
                  <Textarea
                    id="exerciseFrequency"
                    {...register("exercise_frequency")}
                  />
                  {errors.exercise_frequency?.message && (
                    <p className="text-sm text-red-600">
                      {errors.exercise_frequency.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="medicalHistory">{t("healthRecords.chronicConditionsTitle")}</Label>
                  <Textarea id="medicalHistory" {...register("medical_history")} />
                  {errors.medical_history?.message && (
                    <p className="text-sm text-red-600">
                      {errors.medical_history.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="allergies">{t("healthRecords.allergiesTitle")}</Label>
                  <Textarea id="allergies" {...register("allergies")} />
                  {errors.allergies?.message && (
                    <p className="text-sm text-red-600">
                      {errors.allergies.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="medications">{t("healthRecords.currentMedications")}</Label>
                  <Textarea id="medications" {...register("medications")} />
                  {errors.medications?.message && (
                    <p className="text-sm text-red-600">
                      {errors.medications.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="vaccinations">{t("healthRecords.vaccineHistory")}</Label>
                  <Textarea id="vaccinations" {...register("vaccinations")} />
                  {errors.vaccinations?.message && (
                    <p className="text-sm text-red-600">
                      {errors.vaccinations.message}
                    </p>
                  )}
                </div>

                </div>

                <div className="shrink-0 p-4 sm:p-5 bg-slate-50/80 dark:bg-[#111827] border-t border-slate-100 dark:border-[#293548] flex justify-end gap-2.5">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsUpdateOpen(false)}
                    className="rounded-xl"
                  >
                    {t("common.cancel")}
                  </Button>
                  <Button
                    type="submit"
                    disabled={updateHealthProfileMutation.isPending}
                    className="rounded-xl font-bold !bg-primary hover:!bg-primary/90 !text-primary-foreground"
                  >
                    {updateHealthProfileMutation.isPending
                      ? t("common.saving")
                      : t("common.save")}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
};

export default HealthRecords;
