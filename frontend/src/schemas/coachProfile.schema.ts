import { z } from "zod";
import { numericStringField } from "./healthProfile.schema";

export const HEALTH_GOAL_OPTIONS = [
  "Giảm cân",
  "Tăng cơ",
  "Cân bằng dinh dưỡng",
  "Khác",
] as const;

export const PREFERENCE_OPTIONS = [
  "Chạy bộ",
  "Tập yoga",
  "Ăn chay",
  "Bơi lội",
  "Gym",
  "Đạp xe",
] as const;

export const coachProfileFormSchema = z.object({
  display_name: z
    .string()
    .min(1, "Vui lòng nhập tên hiển thị")
    .max(100, "Tối đa 100 ký tự"),
  health_goal: z.string().min(1, "Vui lòng chọn mục tiêu sức khỏe"),
  preferences: z.array(z.string()).min(1, "Vui lòng chọn ít nhất 1 sở thích"),
  age: numericStringField("Tuổi", 1, 120),
  height: numericStringField("Chiều cao (cm)", 30, 300),
  weight: numericStringField("Cân nặng (kg)", 1, 500),
});

export type CoachProfileFormValues = z.infer<typeof coachProfileFormSchema>;
