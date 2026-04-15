import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Typewriter } from "react-simple-typewriter";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useShow } from "@/hooks/useShow";
import { Unlock, Lock, Mail, UserCircle, User } from "lucide-react";
import { useRegister } from "@/hooks/useRegister";
import Loading from "@/components/loading/Loading";

const schema = z.object({
  username: z.string().min(6, "Username tối thiểu 6 kí tự !"),
  email: z.string().email("Email không hợp lệ !"),
  password: z.string().min(6, "Mật khẩu tối thiểu 6 kí tự !"),
  fullname: z.string().min(3, "Họ tên tối thiểu 3 kí tự !"),
});

type FormData = z.infer<typeof schema>;

const SignUp = () => {
  const { isShow, toggleShow } = useShow(false);
  const { mutate, isPending } = useRegister();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    mutate(data);
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-primary text-white">
      {/* Left branding */}
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
            typeSpeed={100} // Tốc độ gõ chậm hơn → mượt
            deleteSpeed={60} // Tốc độ xoá chậm hơn → mượt
            delaySpeed={2000} // Giữ lại chữ lâu hơn một chút
          />
        </div>
        <p className="text-base md:text-lg opacity-90 leading-relaxed max-w-lg">
          Đăng ký tài khoản để bắt đầu quản lý sức khỏe, đặt lịch khám và kết
          nối với bác sĩ của bạn.
        </p>
      </div>

      {/* Right form */}
      <div className="bg-white text-gray-900 flex items-center justify-center p-6 md:p-12 rounded-t-3xl md:rounded-tl-3xl md:rounded-bl-3xl shadow-lg flex-1">
        <Card className="w-full max-w-md shadow-none rounded-none">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl md:text-3xl font-extrabold mb-2">
              Đăng ký
            </CardTitle>
            <p className="text-sm text-gray-600">
              Đã có tài khoản?{" "}
              <Link
                to="/sign-in"
                className="text-primary hover:underline font-semibold"
              >
                Đăng nhập
              </Link>
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <Input
                type="text"
                icon={<UserCircle size={16} />}
                placeholder="Tên đăng nhập"
                error={errors.username?.message}
                {...register("username")}
              />

              <Input
                type="email"
                icon={<Mail size={16} />}
                placeholder="Email"
                error={errors.email?.message}
                {...register("email")}
              />

              <Input
                type="text"
                icon={<User size={16} />}
                placeholder="Họ tên"
                error={errors.fullname?.message}
                {...register("fullname")}
              />

              <Input
                type={isShow ? "text" : "password"}
                placeholder="Mật khẩu"
                icon={isShow ? <Unlock size={16} /> : <Lock size={16} />}
                onClickIcon={toggleShow}
                error={errors.password?.message}
                {...register("password")}
              />
              <Button
                type="submit"
                className="w-full py-3 text-base"
                disabled={isPending}
              >
                {isPending ? <Loading /> : "Đăng ký"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SignUp;
