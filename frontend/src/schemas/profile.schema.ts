import { z } from "zod";

const phoneRegex = /^(0[3|5|7|8|9])[0-9]{8}$/;

export const profileFormSchema = z.object({
  fullname: z
    .string()
    .min(2, "Họ và tên tối thiểu 2 ký tự")
    .max(100, "Họ và tên tối đa 100 ký tự"),
  phone: z
    .string()
    .min(1, "Vui lòng nhập số điện thoại")
    .regex(phoneRegex, "Số điện thoại không hợp lệ (gồm 10 số, bắt đầu bằng 03, 05, 07, 08, 09)"),
  date_of_birth: z
    .string()
    .min(1, "Vui lòng chọn ngày sinh"),
  gender: z.enum(["true", "false"], {
    required_error: "Vui lòng chọn giới tính",
  }),
  address: z
    .string()
    .max(255, "Địa chỉ tối đa 255 ký tự")
    .optional()
    .or(z.literal("")),
});

export type ProfileFormValues = z.infer<typeof profileFormSchema>;
