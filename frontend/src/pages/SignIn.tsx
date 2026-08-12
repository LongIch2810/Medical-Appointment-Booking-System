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
    <div className="min-h-screen flex flex-col md:flex-row bg-primary text-white">
      {/* Left branding (logo + text) */}
      <div className="flex flex-col items-center justify-center p-8 md:p-16 flex-1 text-center md:text-left">
        <img
          src="../../public/logo.jpg"
          alt="Logo"
          className="mb-6 w-24 md:w-28 object-cover rounded-lg"
        />
        <div className="text-3xl md:text-5xl font-extrabold mb-4">
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
        <p className="text-base md:text-lg opacity-90 leading-relaxed max-w-lg">
          Đăng nhập để đặt lịch khám, theo dõi hồ sơ sức khỏe và kết nối với bác
          sĩ mọi lúc, mọi nơi.
        </p>
      </div>

      {/* Right form */}
      <div className="bg-white text-gray-900 flex items-center justify-center p-6 md:p-12 rounded-t-3xl md:rounded-tl-3xl md:rounded-bl-3xl shadow-lg flex-1">
        <Card className="w-full max-w-md shadow-none rounded-none">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl md:text-3xl font-extrabold mb-2">
              Đăng nhập
            </CardTitle>
            <p className="text-sm text-gray-600">
              Chưa có tài khoản?{" "}
              <Link
                to="/sign-up"
                className="text-primary hover:underline font-semibold"
              >
                Đăng ký ngay
              </Link>
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
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
              <div className="flex justify-between text-sm text-gray-500">
                <Link to="/forgot-password" className="hover:underline">
                  Quên mật khẩu?
                </Link>
              </div>
              <Button
                type="submit"
                className="w-full py-3 text-base"
                disabled={isPending}
              >
                {isPending ? <Loading /> : "Đăng nhập"}
              </Button>
            </form>

            <div className="mt-8">
              <div className="flex items-center justify-center text-sm text-gray-400">
                <span>hoặc đăng nhập với</span>
              </div>
              <div className="mt-4">
                <Button
                  type="button"
                  variant={"google"}
                  className="flex items-center justify-center w-full px-4 py-2"
                  onClick={handleGoogleLogin}
                >
                  <FaGoogle className="mr-2" /> Google
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
