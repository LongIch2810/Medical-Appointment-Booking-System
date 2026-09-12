import React, { useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Cake,
  HeartHandshake,
  Loader2,
  Pencil,
  Phone,
  RotateCcw,
  Sparkles,
  Trash2,
  UserCheck,
  UserPlus,
  UsersRound,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ErrorState from "@/components/notification/ErrorState";
import MedicalAiLoading from "@/components/loading/MedicalAiLoading";
import {
  useCreatePatientRelative,
  useDeletePatientRelative,
  usePatientRelatives,
  useRelationships,
  useUpdatePatientRelative,
} from "@/hooks/usePatientPortalApi";
import { cn } from "@/lib/utils";
import {
  relativeFormSchema,
  type RelativeFormValues,
} from "@/schemas/relative.schema";
import type { Relative } from "@/types/interface/patient.interface";
import { useTranslation } from "react-i18next";

const defaultFormState: RelativeFormValues = {
  fullname: "",
  relationship_code: "",
  dob: "",
  gender: "true",
  phone: "",
};

const toDateInputValue = (value: string | null | undefined): string => {
  if (!value) return "";
  if (/^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 10);
  const separator = value.includes("/") ? "/" : "-";
  const parts = value.split(separator);
  if (parts.length === 3) {
    const [first, second, third] = parts;
    if (third?.length === 4) {
      return `${third}-${second.padStart(2, "0")}-${first.padStart(2, "0")}`;
    }
  }
  return value.slice(0, 10);
};

const getInitial = (name?: string | null) =>
  (name ?? "").trim().charAt(0).toUpperCase() || "?";

const Relatives: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const {
    data: relativesResponse,
    isLoading: isRelativesLoading,
    isError: isRelativesError,
    refetch: refetchRelatives,
  } = usePatientRelatives({
    page: 1,
    limit: 50,
  });

  const {
    data: relationshipsResponse,
    isLoading: isRelationshipsLoading,
  } = useRelationships({
    page: 1,
    limit: 50,
  });

  const createMutation = useCreatePatientRelative();
  const updateMutation = useUpdatePatientRelative();
  const deleteMutation = useDeletePatientRelative();

  const [editingRelativeId, setEditingRelativeId] = useState<number | null>(null);
  const [deletingRelative, setDeletingRelative] = useState<Relative | null>(null);

  const relatives = relativesResponse?.data.relatives ?? [];
  const relationships = relationshipsResponse?.data.relationships ?? [];
  const isEditing = useMemo(() => editingRelativeId !== null, [editingRelativeId]);
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<RelativeFormValues>({
    resolver: zodResolver(relativeFormSchema),
    defaultValues: defaultFormState,
  });

  const handleResetForm = () => {
    setEditingRelativeId(null);
    reset(defaultFormState);
  };

  const handleEdit = (relative: Relative) => {
    setEditingRelativeId(relative.id);
    setValue("id", relative.id);
    setValue("fullname", relative.fullname ?? "");
    setValue("relationship_code", relative.relationship.relationship_code);
    setValue("dob", toDateInputValue(relative.dob));
    setValue("gender", relative.gender ? "true" : "false");
    setValue("phone", relative.phone ?? "");
  };

  const onSubmit = (values: RelativeFormValues) => {
    const trimmedPhone = values.phone ? values.phone.trim() : "";
    const payload = {
      fullname: values.fullname.trim(),
      relationship_code: values.relationship_code,
      gender: values.gender === "true",
      ...(values.dob ? { dob: values.dob } : {}),
      ...(trimmedPhone ? { phone: trimmedPhone } : {}),
    };

    if (editingRelativeId) {
      updateMutation.mutate(
        { relativeId: editingRelativeId, data: payload },
        {
          onSuccess: () => {
            toast.success(t("relatives.updateSuccessToast"));
            handleResetForm();
          },
          onError: () => toast.error(t("common.error")),
        },
      );
      return;
    }

    createMutation.mutate(payload, {
      onSuccess: () => {
        toast.success(t("relatives.addSuccessToast"));
        handleResetForm();
      },
      onError: () => toast.error(t("common.error")),
    });
  };

  const handleConfirmDelete = () => {
    if (!deletingRelative) return;
    const targetId = deletingRelative.id;
    deleteMutation.mutate(targetId, {
      onSuccess: () => {
        toast.info(t("relatives.deleteSuccessToast"));
        if (editingRelativeId === targetId) {
          handleResetForm();
        }
        setDeletingRelative(null);
      },
      onError: () => {
        toast.error(t("common.error"));
        setDeletingRelative(null);
      },
    });
  };

  const handleNavigateToAICoach = (relativeId: number) => {
    navigate(`/patient/ai-coach-health?relativeId=${relativeId}`);
  };

  return (
    <>
      <div className="grid gap-6 xl:grid-cols-[1.3fr_1fr] items-start">
        {/* Left Column: Relatives List */}
        <Card className="border-slate-200/80 bg-white dark:border-[#293548] dark:bg-[#172033] py-0 shadow-sm transition-all">
          <CardHeader className="flex flex-row items-center justify-between gap-3 border-b border-slate-100 dark:border-[#293548] px-6 py-5">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <UsersRound className="h-4 w-4" />
              </span>
              <div>
                <CardTitle className="text-base font-bold text-slate-900 dark:text-[#F1F5F9]">
                  {t("relatives.pageTitle")}
                </CardTitle>
                <p className="text-xs text-slate-500 dark:text-[#94A3B8]">
                  {t("relatives.pageSubtitle")}
                </p>
              </div>
            </div>
            <Badge variant="secondary" className="rounded-full px-3 py-1 font-semibold text-xs">
              {t("relatives.membersCount", { count: relatives.length })}
            </Badge>
          </CardHeader>

          <CardContent className="space-y-3.5 p-6">
            {isRelativesLoading ? (
              <MedicalAiLoading
                label={t("common.loading")}
                description="Loading family members"
                minHeight="min-h-56"
              />
            ) : isRelativesError ? (
              <ErrorState
                title={t("common.error")}
                description="Error loading relatives list."
                onRetry={() => refetchRelatives()}
              />
            ) : relatives.length === 0 ? (
              <div className="rounded-2xl border-2 border-dashed border-slate-200 dark:border-[#293548] bg-slate-50/50 dark:bg-[#1E293B]/40 p-8 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-[#1E293B] text-slate-400">
                  <UsersRound className="h-6 w-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-[#CBD5E1]">
                  {t("relatives.emptyListTitle")}
                </h4>
                <p className="mt-1 text-xs text-slate-500 dark:text-[#94A3B8] max-w-sm mx-auto">
                  {t("relatives.emptyListDesc")}
                </p>
              </div>
            ) : (
              relatives.map((relative) => {
                const isSelectedForEdit = editingRelativeId === relative.id;
                return (
                  <div
                    key={relative.id}
                    className={cn(
                      "group rounded-2xl border p-4.5 transition-all",
                      isSelectedForEdit
                        ? "border-primary bg-primary/5 dark:bg-primary/20 shadow-sm ring-1 ring-primary/20"
                        : "border-slate-200/80 bg-white dark:border-[#293548] dark:bg-[#1E293B]/60 hover:border-primary/40 dark:hover:border-[#38BDF8]/40 hover:shadow-md",
                    )}
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      {/* Member Info */}
                      <div className="flex flex-1 items-start gap-3.5 min-w-0">
                        <Avatar className="h-12 w-12 border-2 border-white dark:border-slate-800 shadow-sm shrink-0 mt-0.5">
                          <AvatarFallback
                            className={cn(
                              "text-sm font-bold",
                              relative.gender
                                ? "bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300"
                                : "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300",
                            )}
                          >
                            {getInitial(relative.fullname)}
                          </AvatarFallback>
                        </Avatar>

                        <div className="min-w-0 space-y-1.5 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                              {relative.fullname}
                            </p>
                            <span
                              className={cn(
                                "inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold",
                                relative.gender
                                    ? "bg-sky-50 text-sky-700 border border-sky-200/60 dark:bg-sky-950/40 dark:border-sky-800/60 dark:text-sky-300"
                                    : "bg-rose-50 text-rose-700 border border-rose-200/60 dark:bg-rose-950/40 dark:border-rose-800/60 dark:text-rose-300",
                              )}
                            >
                              {relative.gender ? t("common.male") : t("common.female")}
                            </span>
                            <span className="inline-flex items-center gap-1 rounded-md bg-violet-50 border border-violet-200/60 text-violet-700 dark:bg-violet-950/40 dark:border-violet-800/60 dark:text-violet-300 px-2 py-0.5 text-[11px] font-semibold">
                              <HeartHandshake className="h-3 w-3" />
                              {relative.relationship?.relationship_name || t("common.patient")}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                            {relative.dob && (
                              <span className="inline-flex items-center gap-1.5">
                                <Cake className="h-3.5 w-3.5 text-slate-400" />
                                {relative.dob}
                              </span>
                            )}
                            {relative.phone && (
                              <span className="inline-flex items-center gap-1.5">
                                <Phone className="h-3.5 w-3.5 text-slate-400" />
                                {relative.phone}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-wrap items-center gap-2 shrink-0 self-end sm:self-start">
                        {/* Quick AI Coach Link */}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleNavigateToAICoach(relative.id)}
                          className="h-8 gap-1 rounded-lg border-emerald-200 bg-emerald-50/60 text-emerald-700 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-300 hover:bg-emerald-100 hover:text-emerald-800 text-xs font-semibold cursor-pointer"
                          title={t("relatives.aiCoachBtn")}
                        >
                          <Sparkles className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                          {t("relatives.aiCoachBtn")}
                        </Button>

                        {/* Edit Button */}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(relative)}
                          className="h-8 gap-1 rounded-lg text-slate-700 hover:text-primary dark:text-slate-300 dark:hover:text-primary text-xs font-medium cursor-pointer"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          {t("common.edit")}
                        </Button>

                        {/* Delete Button */}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          disabled={deleteMutation.isPending}
                          onClick={() => setDeletingRelative(relative)}
                          className="h-8 gap-1 rounded-lg text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:text-rose-400 dark:hover:bg-rose-950/40 text-xs font-medium cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          {t("common.delete")}
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Right Column: Form Add / Edit Relative */}
        <Card className="border-slate-200/80 bg-white dark:border-[#293548] dark:bg-[#172033] py-0 shadow-sm transition-all sticky top-24">
          <CardHeader className="flex flex-row items-center justify-between gap-3 border-b border-slate-100 dark:border-[#293548] px-6 py-5">
            <div className="flex items-center gap-2.5">
              <span
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-xl",
                  isEditing
                    ? "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300"
                    : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300",
                )}
              >
                {isEditing ? (
                  <Pencil className="h-4 w-4" />
                ) : (
                  <UserPlus className="h-4 w-4" />
                )}
              </span>
              <div>
                <CardTitle className="text-base font-bold text-slate-900 dark:text-[#F1F5F9]">
                  {isEditing ? t("relatives.editTitle") : t("relatives.addTitle")}
                </CardTitle>
                <p className="text-xs text-slate-500 dark:text-[#94A3B8]">
                  {isEditing ? t("relatives.editTitle") : t("relatives.addSubtitle")}
                </p>
              </div>
            </div>

            {isEditing && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 gap-1 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 rounded-lg text-xs cursor-pointer"
                onClick={handleResetForm}
              >
                <X className="h-3.5 w-3.5" />
                {t("common.cancel")}
              </Button>
            )}
          </CardHeader>

          <CardContent className="p-6">
            <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
              {/* Họ tên */}
              <div className="space-y-2">
                <Label htmlFor="fullname" className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  {t("relatives.fullname")} <span className="text-rose-500">*</span>
                </Label>
                <Input
                  id="fullname"
                  placeholder={t("relatives.fullnamePlaceholder")}
                  error={errors.fullname?.message}
                  {...register("fullname")}
                  className="rounded-xl"
                />
                {errors.fullname && (
                  <p className="text-xs text-rose-500">{errors.fullname.message}</p>
                )}
              </div>

              {/* Mối quan hệ */}
              <div className="space-y-2">
                <Label htmlFor="relationship_code" className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  {t("relatives.relationship")} <span className="text-rose-500">*</span>
                </Label>
                <Controller
                  name="relationship_code"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={isRelationshipsLoading}
                    >
                      <SelectTrigger id="relationship_code" className="rounded-xl w-full">
                        <SelectValue placeholder={t("relatives.relationshipPlaceholder")} />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        {relationships.map((rel) => (
                          <SelectItem key={rel.relationship_code} value={rel.relationship_code}>
                            {rel.relationship_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.relationship_code && (
                  <p className="text-xs text-rose-500">{errors.relationship_code.message}</p>
                )}
              </div>

              {/* Giới tính & Ngày sinh */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="gender" className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    {t("relatives.gender")} <span className="text-rose-500">*</span>
                  </Label>
                  <Controller
                    name="gender"
                    control={control}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger id="gender" className="rounded-xl w-full">
                          <SelectValue placeholder={t("relatives.gender")} />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                          <SelectItem value="true">{t("common.male")}</SelectItem>
                          <SelectItem value="false">{t("common.female")}</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.gender && (
                    <p className="text-xs text-rose-500">{errors.gender.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dob" className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    {t("relatives.dob")} ({t("common.optional")})
                  </Label>
                  <Input
                    id="dob"
                    type="date"
                    error={errors.dob?.message}
                    {...register("dob")}
                    className="rounded-xl"
                  />
                  {errors.dob && (
                    <p className="text-xs text-rose-500">{errors.dob.message}</p>
                  )}
                </div>
              </div>

              {/* Số điện thoại */}
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  {t("relatives.phone")} ({t("common.optional")})
                </Label>
                <Input
                  id="phone"
                  placeholder={t("relatives.phonePlaceholder")}
                  error={errors.phone?.message}
                  {...register("phone")}
                  className="rounded-xl"
                />
                {errors.phone && (
                  <p className="text-xs text-rose-500">{errors.phone.message}</p>
                )}
              </div>

              {/* Form Action Buttons */}
              <div className="flex gap-2.5 pt-3">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 gap-2 rounded-xl !bg-primary hover:!bg-primary/90 font-semibold !text-white hover:!text-white shadow-sm cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-white" />
                      <span className="text-white">{t("common.saving")}</span>
                    </>
                  ) : (
                    <>
                      {isEditing ? (
                        <UserCheck className="h-4 w-4 text-white" />
                      ) : (
                        <UserPlus className="h-4 w-4 text-white" />
                      )}
                      <span className="text-white">{isEditing ? t("relatives.updateBtn") : t("relatives.addBtn")}</span>
                    </>
                  )}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={handleResetForm}
                  disabled={isSubmitting}
                  className="gap-1 rounded-xl text-slate-600 dark:text-slate-300 dark:border-slate-700 dark:bg-slate-800 cursor-pointer"
                >
                  <RotateCcw className="h-4 w-4" />
                  {t("common.reset")}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Alert Dialog */}
      <AlertDialog open={!!deletingRelative} onOpenChange={(open) => !open && setDeletingRelative(null)}>
        <AlertDialogContent className="rounded-2xl sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-bold text-slate-900 dark:text-slate-100">
              {t("relatives.deleteDialogTitle")}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-slate-600 dark:text-slate-300">
              {t("relatives.deleteDialogDesc", { name: deletingRelative?.fullname ?? "" })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel className="rounded-xl">{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="rounded-xl bg-rose-600 font-semibold text-white hover:bg-rose-700"
            >
              {t("relatives.deleteConfirmBtn")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default Relatives;
