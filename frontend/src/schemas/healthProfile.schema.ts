import { z } from "zod";

export const BLOOD_TYPE_OPTIONS = [
  "A+",
  "A-",
  "B+",
  "B-",
  "AB+",
  "AB-",
  "O+",
  "O-",
] as const;

export const UNSPECIFIED = "unspecified";

const numericStringField = (label: string, min: number, max: number) =>
  z
    .string()
    .optional()
    .refine(
      (val) =>
        !val ||
        (!Number.isNaN(Number(val)) && Number(val) >= min && Number(val) <= max),
      { message: `${label} phải là số từ ${min} đến ${max}` },
    );

export const healthProfileFormSchema = z.object({
  weight: numericStringField("Cân nặng (kg)", 1, 500),
  height: numericStringField("Chiều cao (cm)", 30, 300),
  blood_type: z.string(),
  medical_history: z.string().max(1000, "Tối đa 1000 ký tự").optional(),
  allergies: z.string().max(1000, "Tối đa 1000 ký tự").optional(),
  heart_rate: numericStringField("Nhịp tim (bpm)", 20, 300),
  blood_pressure: z
    .string()
    .optional()
    .refine((val) => !val || /^\d{2,3}\/\d{2,3}$/.test(val), {
      message: "Định dạng huyết áp phải là số/số, ví dụ 120/80",
    }),
  glucose_level: numericStringField("Đường huyết (mg/dL)", 0, 1000),
  cholesterol_level: numericStringField("Cholesterol (mg/dL)", 0, 1000),
  medications: z.string().max(1000, "Tối đa 1000 ký tự").optional(),
  vaccinations: z.string().max(1000, "Tối đa 1000 ký tự").optional(),
  smoking: z.string(),
  alcohol_consumption: z.string(),
  exercise_frequency: z.string().max(500, "Tối đa 500 ký tự").optional(),
  last_checkup_date: z.string().optional(),
});

export type HealthProfileFormValues = z.infer<typeof healthProfileFormSchema>;
