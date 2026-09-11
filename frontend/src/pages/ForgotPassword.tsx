import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Typewriter } from "react-simple-typewriter";
import { ArrowLeft } from "lucide-react";
import { toast } from "react-toastify";
import OtpInput from "@/components/input/OtpInput";
import Loading from "@/components/loading/Loading";
import { sendOtp, verifyOtp } from "@/api/otpApi";
import { getApiErrorMessage } from "@/utils/getApiErrorMessage";

type Step = "email" | "otp" | "reset";

const RESEND_COOLDOWN_SECONDS = 60;

const ForgotPassword: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleSendOtp = async () => {
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      toast.error("Vui lòng nhập email hợp lệ");
      return;
    }
    try {
      setLoading(true);
      await sendOtp(email);
      toast.success("Đã gửi mã OTP đến email");
      setOtp(["", "", "", "", "", ""]);
      setStep("otp");
      setCooldown(RESEND_COOLDOWN_SECONDS);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Lỗi khi gửi OTP"));
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (cooldown > 0) return;
    await handleSendOtp();
  };

  const handleVerifyOtp = async () => {
    const otpCode = otp.join("");
    if (otpCode.length < 6) {
      toast.error("Vui lòng nhập đầy đủ mã OTP");
      return;
    }
    try {
      setLoading(true);
      await verifyOtp(email, otpCode);
      toast.success("Xác minh OTP thành công");
      setStep("reset");
    } catch (error) {
      toast.error(
        getApiErrorMessage(error, "OTP không đúng hoặc đã hết hạn")
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      toast.error("Mật khẩu phải có ít nhất 6 ký tự");
      return;
    }
    try {
      setLoading(true);
      // TODO(backend): no password-reset endpoint exists yet (only
      // /otps/send-otp and /otps/verify-otp) — this step cannot be wired to
      // a real API until one is added, so it's intentionally left simulated.
      await new Promise((r) => setTimeout(r, 1000));
      toast.success("Đặt lại mật khẩu thành công. Vui lòng đăng nhập lại.");
      navigate("/sign-in");
    } catch {
      toast.error("Không thể đặt lại mật khẩu");
    } finally {
      setLoading(false);
    }
  };

  const stepTitle =
    step === "email"
      ? "Quên mật khẩu"
      : step === "otp"
      ? "Nhập mã OTP"
      : "Đặt lại mật khẩu";

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-linear-to-br from-primary via-teal-700 to-emerald-800 text-white">
      {/* Left branding (matches SignIn/SignUp) */}
      <div className="flex flex-col items-center justify-center p-8 md:p-16 flex-1 text-center md:text-left">
        <img
          src="/logo.jpg"
          alt="Logo LifeHealth"
          className="mb-6 w-20 md:w-24 object-cover rounded-2xl shadow-md border-2 border-white/30"
        />
        <div className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold mb-4 leading-tight">
          <Typewriter
            words={["Khôi phục quyền truy cập LifeHealth."]}
            loop={true}
            cursor
            cursorStyle="|"
            typeSpeed={100}
            deleteSpeed={60}
            delaySpeed={2000}
          />
        </div>
        <p className="text-sm sm:text-base md:text-lg text-emerald-50/90 leading-relaxed max-w-lg">
          Xác minh email của bạn để đặt lại mật khẩu và tiếp tục quản lý chăm sóc sức khỏe.
        </p>
      </div>

      {/* Right form */}
      <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 flex items-center justify-center p-6 md:p-12 rounded-t-3xl md:rounded-t-none md:rounded-l-3xl shadow-2xl flex-1 border-t md:border-t-0 md:border-l border-slate-200/50 dark:border-slate-800">
        <Card className="w-full max-w-md shadow-none rounded-none border-0 bg-transparent">
          <CardHeader className="px-0 pt-0">
            {step !== "email" && (
              <button
                type="button"
                onClick={() => setStep(step === "reset" ? "otp" : "email")}
                className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-primary transition-colors mb-3"
              >
                <ArrowLeft size={15} /> Quay lại bước trước
              </button>
            )}
            <CardTitle className="text-center text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-slate-100">
              {stepTitle}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-0 pb-0 space-y-4">
            {step === "email" && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendOtp();
                }}
                className="space-y-4"
              >
                <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
                  Nhập địa chỉ email liên kết với tài khoản của bạn để nhận mã xác thực một lần (OTP).
                </p>
                <Input
                  type="email"
                  placeholder="Nhập email của bạn"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="rounded-xl"
                  required
                />
                <Button type="submit" className="w-full py-2.5 rounded-xl text-sm font-semibold" disabled={loading}>
                  {loading ? <Loading /> : "Gửi mã OTP"}
                </Button>
              </form>
            )}

            {step === "otp" && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleVerifyOtp();
                }}
                className="space-y-4"
              >
                <p className="text-xs text-center text-slate-500 dark:text-slate-400">
                  Mã OTP 6 số đã được gửi đến <strong className="text-slate-800 dark:text-slate-200">{email}</strong>
                </p>
                <OtpInput value={otp} onChange={setOtp} />
                <Button type="submit" className="w-full py-2.5 rounded-xl text-sm font-semibold" disabled={loading}>
                  {loading ? <Loading /> : "Xác minh mã OTP"}
                </Button>
                <p className="text-xs text-center text-slate-500 dark:text-slate-400">
                  Không nhận được mã?{" "}
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={cooldown > 0 || loading}
                    className="text-primary font-semibold hover:underline disabled:text-slate-400 disabled:no-underline disabled:cursor-not-allowed"
                  >
                    {cooldown > 0 ? `Gửi lại (${cooldown}s)` : "Gửi lại"}
                  </button>
                </p>
              </form>
            )}

            {step === "reset" && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleResetPassword();
                }}
                className="space-y-4"
              >
                <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
                  Nhập mật khẩu mới an toàn (tối thiểu 6 ký tự).
                </p>
                <Input
                  type="password"
                  placeholder="Nhập mật khẩu mới"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="rounded-xl"
                  required
                />
                <Button type="submit" className="w-full py-2.5 rounded-xl text-sm font-semibold" disabled={loading}>
                  {loading ? <Loading /> : "Đặt lại mật khẩu"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ForgotPassword;
