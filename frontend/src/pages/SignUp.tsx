import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { FaGoogle } from "react-icons/fa";
import { Typewriter } from "react-simple-typewriter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { useShow } from "@/hooks/useShow";
import { Unlock, Lock, Mail, UserCircle, User } from "lucide-react";
import { useRegister } from "@/hooks/useRegister";
import Loading from "@/components/loading/Loading";
import { signUpSchema, type SignUpFormData } from "@/schemas/auth.schema";
import { backendBaseURL } from "@/configs/axios";

const SignUp = () => {
  const { t } = useTranslation();
  const { isShow, toggleShow } = useShow(false);
  const { isShow: isShowConfirm, toggleShow: toggleShowConfirm } = useShow(false);
  const { mutate, isPending } = useRegister();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
  });

  const onSubmit = async (data: SignUpFormData) => {
    mutate(data);
  };

  const handleGoogleLogin = () => {
    window.location.href = `${backendBaseURL}/auth/google`;
  };

  const typewriterWords = [
    t("auth.typewriterSignUp1", { defaultValue: "Đăng ký tài khoản người bệnh." }),
    t("auth.typewriterSignUp2", { defaultValue: "Quản lý hồ sơ sức khỏe thông minh." }),
    t("auth.typewriterSignUp3", { defaultValue: "Kết nối bác sĩ mọi lúc mọi nơi." }),
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gradient-to-br from-teal-900 via-teal-800 to-emerald-900 text-white relative overflow-hidden">
      {/* Decorative glow */}
      <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-teal-400/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-emerald-400/10 blur-3xl pointer-events-none" />

      {/* Left branding */}
      <div className="relative z-10 flex flex-col justify-center p-8 sm:p-12 md:p-16 lg:p-20 flex-1">
        <div className="max-w-lg mx-auto md:mx-0">
          <div className="flex items-center gap-3.5 mb-8">
            <img
              src="/logo.jpg"
              alt="Logo LifeHealth"
              className="w-12 h-12 md:w-14 md:h-14 object-cover rounded-2xl shadow-md border-2 border-white/30"
            />
            <div>
              <span className="text-xl md:text-2xl font-extrabold tracking-tight text-white font-heading">
                LifeHealth
              </span>
              <p className="text-[11px] uppercase tracking-widest text-teal-200/80 font-bold">
                Medical Platform
              </p>
            </div>
          </div>

          <div className="text-2xl sm:text-3xl lg:text-4xl font-extrabold mb-4 leading-tight font-heading min-h-[72px]">
            <Typewriter
              words={typewriterWords}
              loop={true}
              cursor
              cursorStyle="|"
              typeSpeed={80}
              deleteSpeed={50}
              delaySpeed={2200}
            />
          </div>

          <p className="text-sm sm:text-base text-teal-100/90 leading-relaxed mb-8">
            {t("auth.signUpHeroDesc", {
              defaultValue: "Tạo tài khoản LifeHealth chỉ trong vài bước để bắt đầu hành trình chăm sóc sức khỏe chủ động và chuyên nghiệp."
            })}
          </p>

          <div className="hidden sm:grid grid-cols-1 gap-3 pt-2 text-xs text-teal-50">
            <div className="flex items-center gap-2.5 rounded-xl bg-white/10 px-3.5 py-2.5 backdrop-blur-xs border border-white/10">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-400/20 text-emerald-300 font-bold">✓</span>
              <span>{t("auth.trustBadgeSignUp1", { defaultValue: "Theo dõi tiến trình khám và đơn thuốc trực tuyến" })}</span>
            </div>
            <div className="flex items-center gap-2.5 rounded-xl bg-white/10 px-3.5 py-2.5 backdrop-blur-xs border border-white/10">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-400/20 text-emerald-300 font-bold">✓</span>
              <span>{t("auth.trustBadgeSignUp2", { defaultValue: "Trợ lý AI MedAI đồng hành giải đáp thắc mắc 24/7" })}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right form */}
      <div className="relative z-10 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 flex items-center justify-center p-6 sm:p-10 md:p-12 lg:p-16 rounded-t-3xl md:rounded-t-none md:rounded-l-3xl shadow-2xl flex-1 border-t md:border-t-0 md:border-l border-slate-200/50 dark:border-slate-800">
        <Card className="w-full max-w-md shadow-none rounded-none border-0 bg-transparent py-0">
          <CardHeader className="text-center px-0 pt-0 pb-5">
            <CardTitle className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 font-heading">
              {t("auth.signUpTitle", { defaultValue: "Đăng ký tài khoản" })}
            </CardTitle>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              {t("auth.alreadyHaveAccount", { defaultValue: "Đã có tài khoản LifeHealth?" })}{" "}
              <Link
                to="/sign-in"
                className="text-primary hover:underline font-bold"
              >
                {t("common.signIn", { defaultValue: "Đăng nhập" })}
              </Link>
            </p>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
              <div className="space-y-1 text-left">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {t("auth.username", { defaultValue: "Tên đăng nhập" })} <span className="text-rose-500">*</span>
                </label>
                <Input
                  type="text"
                  icon={<UserCircle size={18} className="text-slate-400" />}
                  placeholder={t("auth.usernamePlaceholder", { defaultValue: "Nhập tên đăng nhập" })}
                  error={errors.username?.message}
                  className="rounded-xl h-10.5"
                  aria-label={t("auth.username", { defaultValue: "Tên đăng nhập" })}
                  {...register("username")}
                />
              </div>

              <div className="space-y-1 text-left">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {t("auth.email", { defaultValue: "Email liên hệ" })} <span className="text-rose-500">*</span>
                </label>
                <Input
                  type="email"
                  icon={<Mail size={18} className="text-slate-400" />}
                  placeholder="nhap.email@example.com"
                  error={errors.email?.message}
                  className="rounded-xl h-10.5"
                  aria-label={t("auth.email", { defaultValue: "Email liên hệ" })}
                  {...register("email")}
                />
              </div>

              <div className="space-y-1 text-left">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {t("auth.fullname", { defaultValue: "Họ và tên" })} <span className="text-rose-500">*</span>
                </label>
                <Input
                  type="text"
                  icon={<User size={18} className="text-slate-400" />}
                  placeholder="Nguyễn Văn A"
                  error={errors.fullname?.message}
                  className="rounded-xl h-10.5"
                  aria-label={t("auth.fullname", { defaultValue: "Họ và tên" })}
                  {...register("fullname")}
                />
              </div>

              <div className="space-y-1 text-left">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {t("auth.password", { defaultValue: "Mật khẩu" })} <span className="text-rose-500">*</span>
                </label>
                <Input
                  type={isShow ? "text" : "password"}
                  placeholder={t("auth.passwordMinLength", { defaultValue: "Tối thiểu 6 ký tự" })}
                  icon={isShow ? <Unlock size={18} className="text-slate-400" /> : <Lock size={18} className="text-slate-400" />}
                  onClickIcon={toggleShow}
                  error={errors.password?.message}
                  className="rounded-xl h-10.5"
                  aria-label={t("auth.password", { defaultValue: "Mật khẩu" })}
                  {...register("password")}
                />
              </div>

              <div className="space-y-1 text-left">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {t("auth.confirmPassword", { defaultValue: "Xác nhận mật khẩu" })} <span className="text-rose-500">*</span>
                </label>
                <Input
                  type={isShowConfirm ? "text" : "password"}
                  placeholder={t("auth.confirmPasswordPlaceholder", { defaultValue: "Nhập lại mật khẩu" })}
                  icon={isShowConfirm ? <Unlock size={18} className="text-slate-400" /> : <Lock size={18} className="text-slate-400" />}
                  onClickIcon={toggleShowConfirm}
                  error={errors.confirmPassword?.message}
                  className="rounded-xl h-10.5"
                  aria-label={t("auth.confirmPassword", { defaultValue: "Xác nhận mật khẩu" })}
                  {...register("confirmPassword")}
                />
              </div>

              <Button
                type="submit"
                className="w-full h-11 text-sm font-bold rounded-xl mt-3 shadow-xs hover:shadow-md transition-all cursor-pointer"
                disabled={isPending}
              >
                {isPending ? <Loading /> : t("auth.createAccount", { defaultValue: "Tạo tài khoản" })}
              </Button>
            </form>

            <div className="mt-5">
              <div className="relative my-3">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-slate-200 dark:border-slate-800" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white dark:bg-slate-900 px-3 text-slate-400 font-semibold">
                    {t("auth.orContinueWith", { defaultValue: "Hoặc tiếp tục với" })}
                  </span>
                </div>
              </div>
              <div className="mt-3">
                <Button
                  type="button"
                  variant="outline"
                  className="flex items-center justify-center w-full h-11 rounded-xl border border-slate-200 dark:border-slate-800 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors shadow-2xs cursor-pointer"
                  onClick={handleGoogleLogin}
                  aria-label={t("auth.googleSignUp", { defaultValue: "Đăng ký bằng tài khoản Google" })}
                >
                  <FaGoogle className="mr-2 text-rose-500" /> {t("auth.signUpWithGoogle", { defaultValue: "Đăng ký với Google" })}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SignUp;
