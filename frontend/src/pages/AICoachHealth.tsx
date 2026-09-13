import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import {
  Activity,
  AlertCircle,
  Cake,
  CheckCircle2,
  Download,
  ExternalLink,
  HeartHandshake,
  Loader2,
  Sparkles,
} from "lucide-react";
import { useSearchParams } from "react-router-dom";

import AIHealthCoachAvatar from "@/components/animation/AIHealthCoachAvatar";
import HealthAILoading from "@/components/animation/HealthAILoading";
import NutritionAnimation from "@/components/animation/NutritionAnimation";
import PlankAnimation from "@/components/animation/PlankAnimation";
import CreateCoachProfileForm from "@/components/coach/CreateCoachProfileForm";
import { HealthRoadmapHistory } from "@/components/coach/HealthRoadmapHistory";
import LazyViewport from "@/components/lazy/LazyViewport";
import { backendOrigin } from "@/configs/axios";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useCoachProfile } from "@/hooks/useCoachProfile";
import { useBuildHealthRoadmap } from "@/hooks/useHealthRoadmap";
import { usePatientRelatives } from "@/hooks/usePatientPortalApi";
import { useProfile } from "@/hooks/useProfile";
import { cn } from "@/lib/utils";
import { useUserStore } from "@/store/useUserStore";
import type { PatientUser } from "@/types/interface/patient.interface";
import { getApiErrorMessage } from "@/utils/getApiErrorMessage";

// Bộ đếm giây cho HealthAILoading trong lúc chờ AI tạo lộ trình
function useElapsedWhile(active: boolean) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (!active) {
      setElapsed(0);
      return;
    }
    const start = Date.now();
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - start) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [active]);
  return elapsed;
}

function CoachProfileGate() {
  const { t } = useTranslation();
  const { userInfo } = useUserStore();
  const { data, isLoading, isError, error } = useCoachProfile(!!userInfo);
  const [isEditing, setIsEditing] = useState(false);

  if (isLoading) {
    return (
      <Card className="border-slate-200/80 bg-white p-6 shadow-sm flex justify-center dark:border-slate-800 dark:bg-slate-900">
        <HealthAILoading elapsed={0} />
      </Card>
    );
  }

  const notFound =
    isError &&
    (error as { response?: { status?: number } })?.response?.status === 404;
  const coachProfile = data?.data ?? null;

  if (!coachProfile || notFound) {
    return <CreateCoachProfileForm />;
  }

  if (isEditing) {
    return (
      <CreateCoachProfileForm
        existingProfile={coachProfile}
        onDone={() => setIsEditing(false)}
      />
    );
  }

  return (
    <Card className="overflow-hidden border-slate-200/80 bg-white py-0 shadow-sm transition-all dark:border-slate-800/80 dark:bg-slate-900">
      <div className="border-b border-slate-100 bg-gradient-to-r from-emerald-50/70 via-teal-50/40 to-slate-50/20 p-6 md:p-8 dark:border-slate-800 dark:from-emerald-950/20 dark:via-teal-950/10 dark:to-slate-900">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
          <AIHealthCoachAvatar />
          <div className="flex-1 space-y-2.5 text-center md:text-left min-w-0">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5">
              <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-slate-100">
                {coachProfile.display_name}
              </h2>
              <Badge className="bg-emerald-600 hover:bg-emerald-700 text-xs font-semibold gap-1">
                <Sparkles className="h-3 w-3" />
                {t("aiCoach.coachBadge")}
              </Badge>
            </div>

            <p className="text-sm text-slate-700 dark:text-slate-300">
              {t("aiCoach.healthGoalLabel")}{" "}
              <span className="font-bold text-primary">
                {coachProfile.health_goal}
              </span>
            </p>

            {coachProfile.preferences && coachProfile.preferences.length > 0 && (
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-1.5 pt-0.5">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 mr-1">
                  {t("aiCoach.preferencesLabel")}
                </span>
                {coachProfile.preferences.map((pref) => (
                  <span
                    key={pref}
                    className="inline-block rounded-full bg-white border border-slate-200 px-2.5 py-0.5 text-xs font-medium text-slate-700 shadow-2xs dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300"
                  >
                    {pref}
                  </span>
                ))}
              </div>
            )}

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400 pt-1">
              {coachProfile.age != null && (
                <span>
                  {t("aiCoach.ageLabel")} <strong>{coachProfile.age}</strong>
                </span>
              )}
              {coachProfile.height != null && (
                <span>
                  {t("aiCoach.heightLabel")} <strong>{coachProfile.height} cm</strong>
                </span>
              )}
              {coachProfile.weight != null && (
                <span>
                  {t("aiCoach.weightLabel")} <strong>{coachProfile.weight} kg</strong>
                </span>
              )}
            </div>

            <div className="pt-2">
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl border-slate-200 text-xs font-semibold hover:border-primary hover:text-primary dark:border-slate-800 dark:bg-slate-800/80 dark:text-slate-200"
                onClick={() => setIsEditing(true)}
              >
                {t("aiCoach.editCoachProfileBtn")}
              </Button>
      </div>
    </div>
        </div>
      </div>
    </Card>
  );
}

export default function AICoachHealth() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const relativeIdParam = searchParams.get("relativeId");

  const { data: profileResponse, isLoading: isProfileLoading } = useProfile();
  const {
    data: relativesResponse,
    isLoading: isRelativesLoading,
    isError: isRelativesError,
  } = usePatientRelatives({ page: 1, limit: 50 });
  const buildHealthRoadmapMutation = useBuildHealthRoadmap();

  const patient = profileResponse?.data as PatientUser | undefined;

  // Tạo danh sách hồ sơ thực tế (Bản thân + Người thân, tự động lọc trùng "Bản thân")
  const availableProfiles = useMemo(() => {
    const relatives = relativesResponse?.data.relatives ?? [];
    const list: Array<{
      key: string;
      id: number;
      isOwner: boolean;
      fullname: string;
      relationship: string;
      dob?: string | null;
      gender?: boolean;
    }> = [];

    const selfRelative = relatives.find((rel) => {
      const relationshipCode =
        rel.relationship?.relationship_code?.trim().toLowerCase() ?? "";
      const relationshipName =
        rel.relationship?.relationship_name?.trim().toLowerCase() ?? "";

      return (
        relationshipCode === "ban_than" ||
        relationshipCode === "bt" ||
        relationshipName.includes("bản thân")
      );
    });

    if (selfRelative) {
      list.push({
        key: "owner",
        id: selfRelative.id,
        isOwner: true,
        fullname:
          patient?.fullname ||
          patient?.username ||
          selfRelative.fullname ||
          t("aiCoach.accountOwner"),
        relationship: t("aiCoach.selfRelationship"),
        dob: patient?.date_of_birth ?? selfRelative.dob,
        gender: patient?.gender ?? selfRelative.gender,
      });
    }

    relatives.forEach((rel) => {
      if (rel.id === selfRelative?.id) {
        return;
      }

      list.push({
        key: `relative_${rel.id}`,
        id: rel.id,
        isOwner: false,
        fullname: rel.fullname || t("aiCoach.relativeDefault"),
        relationship: rel.relationship?.relationship_name?.trim() || t("aiCoach.relativeDefault"),
        dob: rel.dob,
        gender: rel.gender,
      });
    });

    return list;
  }, [patient, relativesResponse?.data.relatives, t]);

  const [selectedProfileKey, setSelectedProfileKey] = useState<string>("");
  const [status, setStatus] = useState<"idle" | "processing" | "completed" | "failed">("idle");
  const [error, setError] = useState("");
  const [pdfUrl, setPdfUrl] = useState("");
  const [completedProfileKey, setCompletedProfileKey] = useState<string | null>(null);

  const generateElapsed = useElapsedWhile(status === "processing");

  // Đồng bộ lựa chọn từ URL parameter (?relativeId=...)
  useEffect(() => {
    if (availableProfiles.length === 0) return;

    if (relativeIdParam) {
      const match = availableProfiles.find(
        (p) => String(p.id) === relativeIdParam || p.key === `relative_${relativeIdParam}`,
      );
      if (match) {
        setSelectedProfileKey(match.key);
        return;
      }
    }

    if (!selectedProfileKey) {
      setSelectedProfileKey(availableProfiles[0].key);
    }
  }, [relativeIdParam, availableProfiles, selectedProfileKey]);

  const selectedProfileObj = useMemo(
    () => availableProfiles.find((p) => p.key === selectedProfileKey) ?? availableProfiles[0],
    [availableProfiles, selectedProfileKey],
  );

  const handleProfileChange = (key: string) => {
    setSelectedProfileKey(key);
    setPdfUrl("");
    setError("");
    setStatus("idle");
    setCompletedProfileKey(null);

    const target = availableProfiles.find((p) => p.key === key);
    if (target && !target.isOwner) {
      setSearchParams({ relativeId: String(target.id) });
    } else {
      setSearchParams({});
    }
  };

  const handleGenerate = async () => {
    setError("");
    setPdfUrl("");

    if (!selectedProfileObj) {
      setError(t("aiCoach.selectPromptError"));
      return;
    }

    if (
      !Number.isInteger(selectedProfileObj.id) ||
      selectedProfileObj.id < 1
    ) {
      setError(t("aiCoach.invalidMemberError"));
      setStatus("failed");
      return;
    }

    setStatus("processing");

    try {
      const result = await buildHealthRoadmapMutation.mutateAsync(
        selectedProfileObj.id,
      );
      const generatedPdfUrl = result?.pdfUrl?.trim();

      if (!generatedPdfUrl) {
        throw new Error(t("aiCoach.missingPdfError"));
      }

      setPdfUrl(generatedPdfUrl);
      setStatus("completed");
      setCompletedProfileKey(selectedProfileObj.key);
    } catch (requestError) {
      setError(
        getApiErrorMessage(
          requestError,
          requestError instanceof Error && requestError.message
            ? requestError.message
            : t("aiCoach.genericError"),
        ),
      );
      setStatus("failed");
      setCompletedProfileKey(null);
    }
  };

  const isDataLoading = isProfileLoading || isRelativesLoading;

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <Card className="overflow-hidden border-slate-200/80 bg-white py-0 shadow-sm">
        <div className="bg-gradient-to-r from-teal-600 via-primary to-emerald-600 p-6 md:p-8 text-white">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold backdrop-blur-xs">
                <Sparkles className="h-3.5 w-3.5" />
                <span>{t("aiCoach.tagline")}</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
                {t("aiCoach.title")}
              </h1>
              <p className="text-sm md:text-base text-white/90 leading-relaxed">
                {t("aiCoach.desc")}
              </p>
            </div>
            <div className="hidden lg:flex items-center gap-3 rounded-2xl bg-white/10 p-4 border border-white/20 backdrop-blur-xs">
              <Activity className="h-8 w-8 text-emerald-200" />
              <div>
                <p className="text-xs uppercase tracking-wider text-white/70 font-medium">
                  {t("aiCoach.availableProfiles")}
                </p>
                <p className="text-lg font-bold">
                  {t("aiCoach.membersCount", { count: availableProfiles.length })}
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Hồ sơ huấn luyện viên AI (Gate) */}
      <CoachProfileGate />

      {/* Animations Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
        <Card className="border-slate-200/80 bg-white p-6 shadow-sm flex flex-col items-center justify-center text-center dark:border-slate-800/80 dark:bg-slate-900">
          <NutritionAnimation />
          <div className="mt-4">
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">
              {t("aiCoach.nutritionTitle")}
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {t("aiCoach.nutritionDesc")}
            </p>
          </div>
        </Card>

        <Card className="border-slate-200/80 bg-white p-6 shadow-sm flex flex-col items-center justify-center text-center dark:border-slate-800/80 dark:bg-slate-900">
          <PlankAnimation />
          <div className="mt-4">
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">
              {t("aiCoach.exerciseTitle")}
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {t("aiCoach.exerciseDesc")}
            </p>
          </div>
        </Card>
      </div>

      {/* Form & Generation Section */}
      <Card className="border-slate-200/80 bg-white py-0 shadow-sm dark:border-slate-800/80 dark:bg-slate-900">
        <CardHeader className="border-b border-slate-100 dark:border-slate-800 px-6 py-5">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary dark:bg-primary/20">
              <Sparkles className="h-4 w-4" />
            </span>
            <div>
              <CardTitle className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {t("aiCoach.formCardTitle")}
              </CardTitle>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                {t("aiCoach.formCardSubtitle")}
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 md:p-8 space-y-6">
          {/* Profile Selector */}
          <div className="space-y-3">
            <label className="block text-sm font-bold text-slate-800 dark:text-slate-200">
              {t("aiCoach.targetLabel")} <span className="text-rose-500">*</span>
            </label>

            {isDataLoading ? (
              <Skeleton className="h-11 w-full rounded-xl" />
            ) : isRelativesError ? (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300">
                {t("aiCoach.loadProfilesError")}
              </div>
            ) : availableProfiles.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-400">
                {t("aiCoach.noProfiles")}
              </div>
            ) : (
              <Select
                value={selectedProfileObj?.key ?? ""}
                onValueChange={handleProfileChange}
                disabled={status === "processing"}
              >
                <SelectTrigger className="h-11 rounded-xl w-full text-sm font-medium">
                  <SelectValue placeholder={t("aiCoach.selectPlaceholder")} />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {availableProfiles.map((p) => (
                    <SelectItem key={p.key} value={p.key}>
                      <span className="font-semibold text-slate-900 dark:text-slate-100">{p.fullname}</span>
                      <span className="text-slate-500 dark:text-slate-400 text-xs ml-2">
                        ({p.relationship}{p.dob ? ` • ${p.dob}` : ""})
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Selected Member Summary Card */}
          {selectedProfileObj && (
            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4.5 transition-all dark:border-[#293548] dark:bg-[#1E293B]/60">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <Avatar className="h-12 w-12 border-2 border-white shadow-sm shrink-0 dark:border-[#293548]">
                    <AvatarFallback
                      className={cn(
                        "text-sm font-bold",
                        selectedProfileObj.isOwner
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                          : selectedProfileObj.gender
                            ? "bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300"
                            : "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300",
                      )}
                    >
                      {selectedProfileObj.fullname.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-bold text-slate-900 dark:text-[#F1F5F9]">
                        {selectedProfileObj.fullname}
                      </p>
                      <Badge
                        variant="secondary"
                        className={cn(
                          "text-[11px] font-semibold gap-1",
                          selectedProfileObj.isOwner
                            ? "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60"
                            : "bg-violet-100 text-violet-800 border-violet-200 dark:bg-violet-950/40 dark:text-violet-300 dark:border-violet-800/60",
                        )}
                      >
                        <HeartHandshake className="h-3 w-3" />
                        {selectedProfileObj.relationship}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                      {selectedProfileObj.dob && (
                        <span className="inline-flex items-center gap-1">
                          <Cake className="h-3 w-3 text-slate-400" />
                          {selectedProfileObj.dob}
                        </span>
                      )}
                      <span>
                        {t("profile.genderLabel")}:{" "}
                        <strong>
                          {selectedProfileObj.gender === undefined
                            ? t("profile.notSpecifiedGender")
                            : selectedProfileObj.gender
                              ? t("common.male")
                              : t("common.female")}
                        </strong>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-xs text-slate-500 dark:text-slate-400 max-w-xs text-left sm:text-right">
                  {t("aiCoach.aiOptimizedNote")}
                </div>
              </div>
            </div>
          )}

          {/* Mandatory Amber Medical Disclaimer Box */}
          <div className="p-3.5 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/60 flex items-start gap-3 text-xs text-amber-900 dark:text-amber-300">
            <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>{t("aiCoach.disclaimerStrong")}</strong> {t("aiCoach.disclaimerText")}
            </p>
          </div>

          {/* Action Button & Status */}
          <div className="flex flex-col items-center gap-4 pt-2">
            <Button
              type="button"
              onClick={handleGenerate}
              disabled={
                status === "processing" ||
                buildHealthRoadmapMutation.isPending ||
                isDataLoading ||
                isRelativesError ||
                !selectedProfileObj ||
                (!!completedProfileKey && completedProfileKey === selectedProfileKey)
              }
              className="h-12 px-8 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold shadow-md transition-all text-sm gap-2 disabled:opacity-60 cursor-pointer"
            >
              {status === "processing" ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                  <span className="text-white">{t("aiCoach.btnGenerating")}</span>
                </>
              ) : completedProfileKey === selectedProfileKey ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-white" />
                  <span className="text-white">
                    {t("aiCoach.btnCompleted", { name: selectedProfileObj?.fullname })}
                  </span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 text-white" />
                  <span className="text-white">{t("aiCoach.btnGenerate")}</span>
                </>
              )}
            </Button>

            {status === "processing" && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="py-4"
              >
                <HealthAILoading elapsed={generateElapsed} />
              </motion.div>
            )}

            {error && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-lg p-4 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-700 dark:bg-rose-950/30 dark:border-rose-900/50 dark:text-rose-300 flex items-center justify-center gap-2"
              >
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}

            {pdfUrl && status === "completed" && completedProfileKey === selectedProfileKey && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="w-full rounded-2xl border border-emerald-200 bg-emerald-50/70 p-6 text-center space-y-4 dark:border-emerald-800/60 dark:bg-emerald-950/30"
              >
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-300">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-emerald-900 dark:text-emerald-100">
                    {t("aiCoach.successTitle")}
                  </h3>
                  <p className="text-xs sm:text-sm text-emerald-700 dark:text-emerald-300 mt-1">
                    {t("aiCoach.successDesc", {
                      name: selectedProfileObj?.fullname,
                      relationship: selectedProfileObj?.relationship,
                    })}
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
                  <a
                    href={`${backendOrigin}${pdfUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary/90 transition"
                  >
                    <ExternalLink className="h-4 w-4" />
                    {t("aiCoach.viewPdfBtn")}
                  </a>
                  <Button
                    variant="outline"
                    className="rounded-xl border-emerald-200 bg-white text-emerald-800 hover:bg-emerald-50 text-sm font-semibold gap-2 dark:border-emerald-800 dark:bg-slate-900 dark:text-emerald-300 dark:hover:bg-emerald-950/30"
                    onClick={() => window.open(`${backendOrigin}${pdfUrl}`, "_blank", "noopener,noreferrer")}
                  >
                    <Download className="h-4 w-4" />
                    {t("aiCoach.downloadBtn")}
                  </Button>
                </div>
              </motion.div>
            )}
          </div>
        </CardContent>
      </Card>
      <LazyViewport minHeight="420px" fallback={<div className="h-64 animate-pulse rounded-3xl bg-slate-100 dark:bg-slate-900" />}>
        <HealthRoadmapHistory relativeId={selectedProfileObj?.id} />
      </LazyViewport>
    </div>
  );
}
