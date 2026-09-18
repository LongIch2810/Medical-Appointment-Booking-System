import { z } from "zod";
import { formatDateYYYYMMDD, getVietnamTimeHHmm } from "@/utils/formatDate";

export const TIME_PRESETS = [
  {
    id: "morning",
    label: "Buổi sáng",
    timeRange: "08:00 - 12:00",
    start_time: "08:00",
    end_time: "12:00",
  },
  {
    id: "afternoon",
    label: "Buổi chiều",
    timeRange: "13:30 - 17:00",
    start_time: "13:30",
    end_time: "17:00",
  },
  {
    id: "evening",
    label: "Buổi tối",
    timeRange: "17:30 - 20:30",
    start_time: "17:30",
    end_time: "20:30",
  },
  {
    id: "custom",
    label: "Tự chọn giờ",
    timeRange: "Theo yêu cầu",
    start_time: "",
    end_time: "",
  },
] as const;

export type TimePresetId = (typeof TIME_PRESETS)[number]["id"];

const phoneRegex = /^(0[3|5|7|8|9])[0-9]{8}$/;

export const isPresetPastForToday = (
  presetStartTime: string,
  targetDate: Date | null | undefined,
  currentDate: Date = new Date()
): boolean => {
  if (!targetDate || !presetStartTime) return false;
  const isToday =
    formatDateYYYYMMDD(targetDate) === formatDateYYYYMMDD(currentDate);
  if (!isToday) return false;
  const currentVnHhmm = getVietnamTimeHHmm(currentDate);
  return presetStartTime <= currentVnHhmm;
};

export const autoBookingSchema = z
  .object({
    relative_id: z.number(),
    is_new_relative: z.boolean(),
    new_relative: z
      .object({
        fullname: z.string().optional(),
        relationship_code: z.string().optional(),
        gender: z.enum(["true", "false"]).optional(),
        dob: z.string().optional(),
        phone: z.string().optional(),
      })
      .optional(),
    specialty_id: z.number().min(1, "Vui lòng chọn chuyên khoa khám"),
    appointment_date: z.date({
      required_error: "Vui lòng chọn ngày khám",
      invalid_type_error: "Ngày khám không hợp lệ",
    }),
    time_preset: z.enum(["morning", "afternoon", "evening", "custom"]),
    start_time: z
      .string()
      .min(1, "Vui lòng chọn hoặc nhập giờ bắt đầu")
      .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Giờ bắt đầu không đúng định dạng (HH:mm)"),
    end_time: z
      .string()
      .optional()
      .refine(
        (val) => !val || /^([01]\d|2[0-3]):([0-5]\d)$/.test(val),
        "Giờ kết thúc không đúng định dạng (HH:mm)"
      ),
  })
  .superRefine((data, ctx) => {
    // 1. Kiểm tra thông tin người khám
    if (data.is_new_relative) {
      const trimmedFullname = data.new_relative?.fullname?.trim() ?? "";
      if (trimmedFullname.length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["new_relative", "fullname"],
          message: "Họ và tên tối thiểu 2 ký tự",
        });
      }
      if (!data.new_relative?.relationship_code) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["new_relative", "relationship_code"],
          message: "Vui lòng chọn mối quan hệ",
        });
      }
      const trimmedPhone = data.new_relative?.phone?.trim();
      if (trimmedPhone && trimmedPhone.length > 0 && !phoneRegex.test(trimmedPhone)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["new_relative", "phone"],
          message:
            "Số điện thoại không hợp lệ (gồm 10 số, bắt đầu bằng 03, 05, 07, 08, 09)",
        });
      }
    } else {
      if (!data.relative_id || data.relative_id <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["relative_id"],
          message: "Vui lòng chọn người đi khám",
        });
      }
    }

    // 2. Kiểm tra giờ bắt đầu và giờ kết thúc
    if (data.start_time && data.end_time && data.end_time.trim() !== "") {
      if (data.end_time <= data.start_time) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["end_time"],
          message: "Giờ kết thúc phải lớn hơn giờ bắt đầu",
        });
      }
    }

    // 3. Kiểm tra giờ đã qua nếu ngày khám là hôm nay (giờ Việt Nam)
    if (data.appointment_date && data.start_time) {
      const now = new Date();
      if (isPresetPastForToday(data.start_time, data.appointment_date, now)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["start_time"],
          message: "Khung giờ này đã qua trong ngày hôm nay",
        });
      }
    }
  });

export type AutoBookingFormValues = z.infer<typeof autoBookingSchema>;
