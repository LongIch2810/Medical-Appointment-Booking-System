import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-toastify";
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
import { useEffect, useState } from "react";

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

// Bộ đếm giây riêng cho HealthAILoading trong lúc submit — cùng cách làm
// với typing-interval của Chatbot.tsx.
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
            ? "Đã cập nhật hồ sơ huấn luyện viên AI."
            : "Đã tạo hồ sơ huấn luyện viên AI.",
        );
        onDone?.();
      },
      onError: () => {
        toast.error("Có lỗi xảy ra, vui lòng thử lại.");
      },
    });
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="bg-white rounded-3xl shadow-lg p-8 md:p-10 text-left space-y-6 dark:bg-slate-900 dark:border dark:border-slate-800"
    >
      <div className="space-y-2">
        <Label htmlFor="displayName">Tên hiển thị huấn luyện viên</Label>
        <Input
          id="displayName"
          placeholder="Ví dụ: Coach Mai"
          error={errors.display_name?.message}
          {...register("display_name")}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="healthGoal">Mục tiêu sức khỏe</Label>
        <Controller
          name="health_goal"
          control={control}
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger id="healthGoal" className="w-full">
                <SelectValue placeholder="Chọn mục tiêu sức khỏe" />
              </SelectTrigger>
              <SelectContent>
                {HEALTH_GOAL_OPTIONS.map((goal) => (
                  <SelectItem key={goal} value={goal}>
                    {goal}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.health_goal?.message && (
          <p className="text-rose-600 dark:text-rose-400 text-sm">{errors.health_goal.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label>Sở thích</Label>
        <Controller
          name="preferences"
          control={control}
          render={({ field }) => (
            <div className="flex flex-wrap gap-2">
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
                      "rounded-full border px-4 py-2 text-sm font-semibold transition-colors",
                      selected
                        ? "bg-primary text-white border-primary"
                        : "bg-white text-gray-600 border-gray-200 hover:border-primary dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 dark:hover:border-primary",
                    )}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
          )}
        />
        {errors.preferences?.message && (
          <p className="text-rose-600 dark:text-rose-400 text-sm">{errors.preferences.message}</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="age">Tuổi</Label>
          <Input
            id="age"
            type="number"
            min="0"
            error={errors.age?.message}
            {...register("age")}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="height">Chiều cao (cm)</Label>
          <Input
            id="height"
            type="number"
            min="0"
            error={errors.height?.message}
            {...register("height")}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="weight">Cân nặng (kg)</Label>
          <Input
            id="weight"
            type="number"
            min="0"
            error={errors.weight?.message}
            {...register("weight")}
          />
        </div>
      </div>

      <div className="flex flex-col items-center gap-4 pt-2">
        {isPending ? (
          <HealthAILoading elapsed={elapsed} />
        ) : (
          <Button
            type="submit"
            className="rounded-2xl bg-primary text-white font-semibold px-6 py-3 shadow-md hover:bg-primary/90 transition"
          >
            {isEditMode ? "Lưu thay đổi" : "Tạo hồ sơ huấn luyện viên"}
          </Button>
        )}
      </div>
    </form>
  );
}
