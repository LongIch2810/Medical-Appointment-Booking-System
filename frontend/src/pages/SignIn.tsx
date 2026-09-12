import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { FaGoogle } from "react-icons/fa";
import { Typewriter } from "react-simple-typewriter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Lock, Unlock, UserCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useShow } from "@/hooks/useShow";
import { useLogin } from "@/hooks/useLogin";
import { signInSchema, type SignInFormData } from "@/schemas/auth.schema";
import { backendBaseURL } from "@/configs/axios";
import Loading from "@/components/loading/Loading";

const SignIn = () => {
  const { t } = useTranslation();
  const { isShow, toggleShow } = useShow(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignInFormData>({ resolver: zodResolver(signInSchema) });

  const { mutate, isPending } = useLogin();

  const onSubmit = async (data: SignInFormData) => {
    mutate(data);
  };

  const handleGoogleLogin = () => {
    window.location.href = `${backendBaseURL}/auth/google`;
  };

  const typewriterWords = [
    t("auth.typewriter1", { defaultValue: "Chăm sóc sức khỏe toàn diện." }),
    t("auth.typewriter2", { defaultValue: "Đặt lịch khám dễ dàng 24/7." }),
    t("auth.typewriter3", { defaultValue: "Đồng hành cùng bác sĩ đầu ngành." }),
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gradient-to-br from-teal-900 via-teal-800 to-emerald-900 text-white relative overflow-hidden">
      {/* Subtle decorative glow & patterns */}
      <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-teal-400/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-emerald-400/10 blur-3xl pointer-events-none" />

      {/* Left branding (logo + text + trust badges) */}
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
            {t("auth.signInHeroDesc", {
              defaultValue: "Đăng nhập để đặt lịch khám bác sĩ chuyên khoa, tra cứu bệnh án số hóa và tương tác với trợ lý y tế thông minh MedAI."
            })}
          </p>

          <div className="hidden sm:grid grid-cols-1 gap-3 pt-2 text-xs text-teal-50">
            <div className="flex items-center gap-2.5 rounded-xl bg-white/10 px-3.5 py-2.5 backdrop-blur-xs border border-white/10">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-400/20 text-emerald-300 font-bold">✓</span>
              <span>{t("auth.trustBadge1", { defaultValue: "Hơn 500+ bác sĩ chuyên khoa đầu ngành đã xác thực" })}</span>
            </div>
            <div className="flex items-center gap-2.5 rounded-xl bg-white/10 px-3.5 py-2.5 backdrop-blur-xs border border-white/10">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-400/20 text-emerald-300 font-bold">✓</span>
              <span>{t("auth.trustBadge2", { defaultValue: "Bảo mật dữ liệu bệnh án theo tiêu chuẩn y tế" })}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right form */}
      <div className="relative z-10 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 flex items-center justify-center p-6 sm:p-10 md:p-12 lg:p-16 rounded-t-3xl md:rounded-t-none md:rounded-l-3xl shadow-2xl flex-1 border-t md:border-t-0 md:border-l border-slate-200/50 dark:border-slate-800">
        <Card className="w-full max-w-md shadow-none rounded-none border-0 bg-transparent py-0">
          <CardHeader className="text-center px-0 pt-0 pb-6">
            <CardTitle className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 font-heading">
              {t("auth.signInTitle", { defaultValue: "Đăng nhập tài khoản" })}
            </CardTitle>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              {t("auth.dontHaveAccount", { defaultValue: "Chưa có tài khoản LifeHealth?" })}{" "}
              <Link
                to="/sign-up"
                className="text-primary hover:underline font-bold"
              >
                {t("auth.signUpNow", { defaultValue: "Đăng ký ngay" })}
              </Link>
            </p>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1.5 text-left">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {t("auth.usernameOrEmail", { defaultValue: "Tên đăng nhập hoặc email" })} <span className="text-rose-500">*</span>
                </label>
                <Input
                  type="text"
                  placeholder={t("auth.usernameOrEmailPlaceholder", { defaultValue: "Nhập tên đăng nhập hoặc email" })}
                  icon={<UserCircle size={18} className="text-slate-400" />}
                  error={errors.usernameOrEmail?.message}
                  className="rounded-xl h-11"
                  aria-label={t("auth.usernameOrEmail", { defaultValue: "Tên đăng nhập hoặc email" })}
                  {...register("usernameOrEmail")}
                />
              </div>

              <div className="space-y-1.5 text-left">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {t("auth.password", { defaultValue: "Mật khẩu" })} <span className="text-rose-500">*</span>
                  </label>
                  <Link
                    to="/forgot-password"
                    className="text-xs text-slate-500 dark:text-slate-400 hover:text-primary transition-colors font-medium"
                  >
                    {t("auth.forgotPassword", { defaultValue: "Quên mật khẩu?" })}
                  </Link>
                </div>
                <Input
                  type={isShow ? "text" : "password"}
                  placeholder={t("auth.passwordPlaceholder", { defaultValue: "Nhập mật khẩu" })}
                  icon={isShow ? <Unlock size={18} className="text-slate-400" /> : <Lock size={18} className="text-slate-400" />}
                  onClickIcon={toggleShow}
                  error={errors.password?.message}
                  className="rounded-xl h-11"
                  aria-label={t("auth.password", { defaultValue: "Mật khẩu" })}
                  {...register("password")}
                />
              </div>

              <Button
                type="submit"
                className="w-full h-11 text-sm font-bold rounded-xl shadow-xs hover:shadow-md transition-all cursor-pointer mt-2"
                disabled={isPending}
              >
                {isPending ? <Loading /> : t("common.signIn", { defaultValue: "Đăng nhập" })}
              </Button>
            </form>

            <div className="mt-6">
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-slate-200 dark:border-slate-800" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white dark:bg-slate-900 px-3 text-slate-400 font-semibold">
                    {t("auth.orContinueWith", { defaultValue: "Hoặc đăng nhập với" })}
                  </span>
                </div>
              </div>
              <div className="mt-4">
                <Button
                  type="button"
                  variant="outline"
                  className="flex items-center justify-center w-full h-11 rounded-xl border border-slate-200 dark:border-slate-800 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors shadow-2xs cursor-pointer"
                  onClick={handleGoogleLogin}
                  aria-label={t("auth.googleSignIn", { defaultValue: "Đăng nhập bằng tài khoản Google" })}
                >
                  <FaGoogle className="mr-2 text-rose-500" /> {t("auth.continueWithGoogle", { defaultValue: "Tiếp tục với Google" })}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SignIn;
