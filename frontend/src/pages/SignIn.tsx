import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { FaGoogle } from "react-icons/fa";
import { Typewriter } from "react-simple-typewriter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Lock, Unlock, UserCircle } from "lucide-react";
import { useShow } from "@/hooks/useShow";
import { useLogin } from "@/hooks/useLogin";
import { signInSchema, type SignInFormData } from "@/schemas/auth.schema";
import { backendBaseURL } from "@/configs/axios";
import Loading from "@/components/loading/Loading";

const SignIn = () => {
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

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-linear-to-br from-primary via-teal-700 to-emerald-800 text-white">
      {/* Left branding (logo + text) */}
      <div className="flex flex-col items-center justify-center p-8 md:p-16 flex-1 text-center md:text-left">
        <img
          src="/logo.jpg"
          alt="Logo LifeHealth"
          className="mb-6 w-20 md:w-24 object-cover rounded-2xl shadow-md border-2 border-white/30"
        />
        <div className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold mb-4 leading-tight">
          <Typewriter
            words={["Chào mừng bạn đến với LifeHealth."]}
            loop={true}
            cursor
            cursorStyle="|"
            typeSpeed={100}
            deleteSpeed={60}
            delaySpeed={2000}
          />
        </div>
        <p className="text-sm sm:text-base md:text-lg text-emerald-50/90 leading-relaxed max-w-lg">
          Đăng nhập để đặt lịch khám, theo dõi hồ sơ sức khỏe và kết nối với bác sĩ chuyên khoa mọi lúc, mọi nơi.
        </p>
      </div>

      {/* Right form */}
      <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 flex items-center justify-center p-6 md:p-12 rounded-t-3xl md:rounded-t-none md:rounded-l-3xl shadow-2xl flex-1 border-t md:border-t-0 md:border-l border-slate-200/50 dark:border-slate-800">
        <Card className="w-full max-w-md shadow-none rounded-none border-0 bg-transparent">
          <CardHeader className="text-center px-0 pt-0">
            <CardTitle className="text-2xl md:text-3xl font-extrabold mb-2 text-slate-900 dark:text-slate-100">
              Đăng nhập
            </CardTitle>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Chưa có tài khoản?{" "}
              <Link
                to="/sign-up"
                className="text-primary hover:underline font-semibold"
              >
                Đăng ký ngay
              </Link>
            </p>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input
                type="text"
                placeholder="Tên đăng nhập hoặc email"
                icon={<UserCircle size={16} />}
                error={errors.usernameOrEmail?.message}
                {...register("usernameOrEmail")}
              />
              <Input
                type={isShow ? "text" : "password"}
                placeholder="Mật khẩu"
                icon={isShow ? <Unlock size={16} /> : <Lock size={16} />}
                onClickIcon={toggleShow}
                error={errors.password?.message}
                {...register("password")}
              />
              <div className="flex justify-end text-xs sm:text-sm">
                <Link to="/forgot-password" className="text-slate-500 dark:text-slate-400 hover:text-primary transition-colors">
                  Quên mật khẩu?
                </Link>
              </div>
              <Button
                type="submit"
                className="w-full py-2.5 text-sm font-semibold rounded-xl"
                disabled={isPending}
              >
                {isPending ? <Loading /> : "Đăng nhập"}
              </Button>
            </form>

            <div className="mt-6">
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-slate-200 dark:border-slate-800" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white dark:bg-slate-900 px-3 text-slate-400 font-medium">
                    Hoặc đăng nhập với
                  </span>
                </div>
              </div>
              <div className="mt-4">
                <Button
                  type="button"
                  variant={"google"}
                  className="flex items-center justify-center w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 font-medium hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors"
                  onClick={handleGoogleLogin}
                >
                  <FaGoogle className="mr-2 text-rose-500" /> Tiếp tục với Google
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
