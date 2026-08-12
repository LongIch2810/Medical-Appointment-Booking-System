import { z } from "zod";

export const passwordSchema = z
  .string()
  .min(6, "Mật khẩu tối thiểu 6 kí tự !");

export const usernameOrEmailSchema = z
  .string()
  .min(6, "Phải có ít nhất 6 kí tự !")
  .refine(
    (val) => (val.includes("@") ? z.string().email().safeParse(val).success : true),
    { message: "Email không hợp lệ !" }
  );

export const signInSchema = z.object({
  usernameOrEmail: usernameOrEmailSchema,
  password: passwordSchema,
});

export type SignInFormData = z.infer<typeof signInSchema>;

export const signUpSchema = z
  .object({
    username: z.string().min(6, "Username tối thiểu 6 kí tự !"),
    email: z.string().email("Email không hợp lệ !"),
    password: passwordSchema,
    confirmPassword: passwordSchema,
    fullname: z.string().min(3, "Họ tên tối thiểu 3 kí tự !"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Mật khẩu xác nhận không khớp !",
    path: ["confirmPassword"],
  });

export type SignUpFormData = z.infer<typeof signUpSchema>;

export const forgotPasswordEmailSchema = z.object({
  email: z.string().email("Email không hợp lệ !"),
});

export const resetPasswordSchema = z.object({
  newPassword: passwordSchema,
});
