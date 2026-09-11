import { z } from "zod";

const phoneRegex = /^(0[3|5|7|8|9])[0-9]{8}$/;

export const relativeFormSchema = z.object({
  id: z.number().optional(),
  fullname: z
    .string()
    .min(2, "Họ và tên tối thiểu 2 ký tự")
    .max(100, "Họ và tên tối đa 100 ký tự"),
  relationship_code: z
    .string()
    .min(1, "Vui lòng chọn mối quan hệ"),
  dob: z
    .string()
    .optional()
    .or(z.literal("")),
  gender: z.enum(["true", "false"], {
    required_error: "Vui lòng chọn giới tính",
  }),
  phone: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine(
      (val) => !val || phoneRegex.test(val),
      "Số điện thoại không hợp lệ (gồm 10 số, bắt đầu bằng 03, 05, 07, 08, 09)",
    ),
});

export type RelativeFormValues = z.infer<typeof relativeFormSchema>;
