import { useForm, Controller } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-toastify";
import { AlertCircle, Check, Plus, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  coachProfileFormSchema,
  HEALTH_GOAL_OPTIONS,
  PREFERENCE_OPTIONS,
  type CoachProfileFormValues,
} from "@/schemas/coachProfile.schema";
import {
  useCreateCoachProfile,
  useUpdateCoachProfile,
} from "@/hooks/useCoachProfile";
import type { CoachProfile } from "@/types/interface/coachProfile.interface";
import HealthAILoading from "@/components/animation/HealthAILoading";

function toFormValues(profile?: CoachProfile | null): CoachProfileFormValues {
  return {
    display_name: profile?.display_name ?? "",
    health_goal: profile?.health_goal ?? "",
    preferences: profile?.preferences ?? [],
    age: profile?.age != null ? String(profile.age) : "",
    height: profile?.height != null ? String(profile.height) : "",
    weight: profile?.weight != null ? String(profile.weight) : "",
  };
}

// Bộ đếm giây riêng cho HealthAILoading trong lúc submit
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

export default function CreateCoachProfileForm({
  existingProfile,
  onDone,
}: {
  existingProfile?: CoachProfile | null;
  onDone?: () => void;
}) {
  const { t } = useTranslation();
  const isEditMode = !!existingProfile;
  const createMutation = useCreateCoachProfile();
  const updateMutation = useUpdateCoachProfile();
  const isPending = createMutation.isPending || updateMutation.isPending;
  const elapsed = useElapsedWhile(isPending);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<CoachProfileFormValues>({
    resolver: zodResolver(coachProfileFormSchema),
    defaultValues: toFormValues(existingProfile),
  });

  const onSubmit = (values: CoachProfileFormValues) => {
    const payload = {
      display_name: values.display_name,
      health_goal: values.health_goal,
      preferences: values.preferences,
      ...(values.age ? { age: Number(values.age) } : {}),
      ...(values.height ? { height: Number(values.height) } : {}),
      ...(values.weight ? { weight: Number(values.weight) } : {}),
    };

    const mutation = isEditMode ? updateMutation : createMutation;
    mutation.mutate(payload, {
      onSuccess: () => {
        toast.success(
          isEditMode
            ? t("aiCoach.coachUpdateSuccess")
            : t("aiCoach.coachCreateSuccess"),
        );
        onDone?.();
      },
      onError: () => {
        toast.error(t("aiCoach.errorOccurred"));
      },
    });
  };

  return (
    <div className="w-full flex justify-center py-2 px-1 sm:px-0">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="w-full max-w-2xl rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 md:p-9 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-6 text-left transition-all"
      >
        {/* Form Header */}
        <div className="border-b border-slate-100 pb-5 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary dark:bg-primary/20">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="space-y-0.5">
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100">
                {isEditMode
                  ? t("aiCoach.editCoachProfileBtn")
                  : t("aiCoach.createCoachProfileBtn")}
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                Thiết lập thông số thể trạng và sở thích để AI thiết kế lộ trình rèn luyện, dinh dưỡng chuẩn xác.
              </p>
            </div>
          </div>
        </div>

        {/* Display Name Field */}
        <div className="space-y-1.5">
          <Label
            htmlFor="displayName"
            className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1"
          >
            <span>{t("aiCoach.displayNameLabel")}</span>
            <span className="text-rose-500">*</span>
          </Label>
          <Input
            id="displayName"
            placeholder={t("aiCoach.displayNamePlaceholder")}
            error={errors.display_name?.message}
            className="h-10 rounded-xl bg-slate-50/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-sm focus-visible:ring-2 focus-visible:ring-primary/20"
            aria-invalid={!!errors.display_name}
            {...register("display_name")}
          />
        </div>

        {/* Health Goal Select */}
        <div className="space-y-1.5">
          <Label
            htmlFor="healthGoal"
            className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1"
          >
            <span>{t("aiCoach.healthGoalSelectLabel")}</span>
            <span className="text-rose-500">*</span>
          </Label>
          <Controller
            name="health_goal"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger
                  id="healthGoal"
                  className={cn(
                    "h-10 w-full rounded-xl bg-slate-50/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-sm transition-all focus:ring-2 focus:ring-primary/20",
                    errors.health_goal &&
                      "border-rose-400 dark:border-rose-800 focus:ring-rose-200",
                  )}
                >
                  <SelectValue placeholder={t("aiCoach.healthGoalPlaceholder")} />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {HEALTH_GOAL_OPTIONS.map((goal) => (
                    <SelectItem
                      key={goal}
                      value={goal}
                      className="rounded-lg text-sm"
                    >
                      {goal}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.health_goal?.message ? (
            <p className="text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-1 pt-0.5">
              <AlertCircle className="size-3 shrink-0" />
              <span>{errors.health_goal.message}</span>
            </p>
          ) : null}
        </div>

        {/* Preferences */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
              <span>{t("aiCoach.preferencesLabel")}</span>
              <span className="text-rose-500">*</span>
            </Label>
            <span className="text-[11px] text-slate-400">Chọn ít nhất 1 sở thích</span>
          </div>

          <Controller
            name="preferences"
            control={control}
            render={({ field }) => (
              <div className="flex flex-wrap gap-2 pt-0.5">
                {PREFERENCE_OPTIONS.map((option) => {
                  const selected = field.value?.includes(option);
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() =>
                        field.onChange(
                          selected
                            ? field.value.filter((v) => v !== option)
                            : [...(field.value ?? []), option],
                        )
                      }
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs sm:text-sm font-semibold transition-all cursor-pointer select-none",
                        selected
                          ? "bg-primary text-white border-primary shadow-xs ring-2 ring-primary/20 scale-[1.02]"
                          : "bg-slate-50 text-slate-700 border-slate-200 hover:border-primary/40 hover:bg-primary/5 hover:text-primary dark:bg-slate-800/80 dark:border-slate-700 dark:text-slate-300 dark:hover:border-primary/50",
                      )}
                      aria-pressed={selected}
                    >
                      {selected ? (
                        <Check className="size-3.5 text-white stroke-[2.5]" />
                      ) : (
                        <Plus className="size-3.5 opacity-60" />
                      )}
                      <span>{option}</span>
                    </button>
                  );
                })}
              </div>
            )}
          />
          {errors.preferences?.message ? (
            <p className="text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-1 pt-0.5">
              <AlertCircle className="size-3 shrink-0" />
              <span>{errors.preferences.message}</span>
            </p>
          ) : null}
        </div>

        {/* Biometrics Grid: Age, Height, Weight */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {/* Age */}
          <div className="space-y-1.5">
            <Label
              htmlFor="age"
              className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200"
            >
              {t("aiCoach.ageLabel")}
            </Label>
            <Input
              id="age"
              type="number"
              min="1"
              max="120"
              placeholder="VD: 28"
              error={errors.age?.message}
              className="h-10 rounded-xl bg-slate-50/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-sm focus-visible:ring-2 focus-visible:ring-primary/20"
              {...register("age")}
            />
          </div>

          {/* Height */}
          <div className="space-y-1.5">
            <Label
              htmlFor="height"
              className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200"
            >
              {t("aiCoach.heightLabel")}{" "}
              <span className="text-xs font-normal text-slate-400">(cm)</span>
            </Label>
            <Input
              id="height"
              type="number"
              min="30"
              max="300"
              placeholder="VD: 170"
              error={errors.height?.message}
              className="h-10 rounded-xl bg-slate-50/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-sm focus-visible:ring-2 focus-visible:ring-primary/20"
              {...register("height")}
            />
          </div>

          {/* Weight */}
          <div className="space-y-1.5">
            <Label
              htmlFor="weight"
              className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200"
            >
              {t("aiCoach.weightLabel")}{" "}
              <span className="text-xs font-normal text-slate-400">(kg)</span>
            </Label>
            <Input
              id="weight"
              type="number"
              min="1"
              max="500"
              placeholder="VD: 65"
              error={errors.weight?.message}
              className="h-10 rounded-xl bg-slate-50/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-sm focus-visible:ring-2 focus-visible:ring-primary/20"
              {...register("weight")}
            />
          </div>
        </div>

        {/* Submit Actions */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
          {isPending ? (
            <div className="flex justify-center py-2">
              <HealthAILoading elapsed={elapsed} />
            </div>
          ) : (
            <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3">
              {isEditMode ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onDone}
                  disabled={isPending}
                  className="w-full sm:w-auto h-11 px-5 rounded-xl font-semibold text-xs sm:text-sm border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  {t("common.cancel")}
                </Button>
              ) : null}
              <Button
                type="submit"
                disabled={isPending}
                className="w-full sm:w-auto h-11 px-7 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold text-sm shadow-xs hover:shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Sparkles className="h-4 w-4 text-white" />
                <span>
                  {isEditMode
                    ? t("common.save")
                    : t("aiCoach.createCoachProfileBtn")}
                </span>
              </Button>
            </div>
          )}
        </div>
      </form>
    </div>
  );
}
