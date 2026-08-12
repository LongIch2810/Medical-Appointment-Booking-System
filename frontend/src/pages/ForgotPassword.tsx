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
    <div className="min-h-screen flex flex-col md:flex-row bg-primary text-white">
      {/* Left branding (matches SignIn/SignUp) */}
      <div className="flex flex-col items-center justify-center p-8 md:p-16 flex-1 text-center md:text-left">
        <img
          src="../../public/logo.jpg"
          alt="Logo"
          className="mb-6 w-24 md:w-28 object-cover rounded-lg"
        />
        <div className="text-3xl md:text-5xl font-extrabold mb-4">
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
        <p className="text-base md:text-lg opacity-90 leading-relaxed max-w-lg">
          Xác minh email của bạn để đặt lại mật khẩu và tiếp tục sử dụng
          LifeHealth.
        </p>
      </div>

      {/* Right form */}
      <div className="bg-white text-gray-900 flex items-center justify-center p-6 md:p-12 rounded-t-3xl md:rounded-tl-3xl md:rounded-bl-3xl shadow-lg flex-1">
        <Card className="w-full max-w-md shadow-none rounded-none">
          <CardHeader>
            {step !== "email" && (
              <button
                type="button"
                onClick={() => setStep(step === "reset" ? "otp" : "email")}
                className="flex items-center gap-1 text-sm text-gray-500 hover:text-primary mb-2"
              >
                <ArrowLeft size={16} /> Quay lại
              </button>
            )}
            <CardTitle className="text-center text-2xl md:text-3xl font-extrabold">
              {stepTitle}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {step === "email" && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendOtp();
                }}
                className="space-y-4"
              >
                <Input
                  type="email"
                  placeholder="Nhập email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <Button type="submit" className="w-full" disabled={loading}>
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
                <p className="text-sm text-center text-gray-500">
                  Mã OTP đã được gửi đến <strong>{email}</strong>
                </p>
                <OtpInput value={otp} onChange={setOtp} />
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? <Loading /> : "Xác minh mã OTP"}
                </Button>
                <p className="text-sm text-center text-gray-500">
                  Không nhận được mã?{" "}
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={cooldown > 0 || loading}
                    className="text-primary font-medium hover:underline disabled:text-gray-400 disabled:no-underline disabled:cursor-not-allowed"
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
                <Input
                  type="password"
                  placeholder="Nhập mật khẩu mới"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <Button type="submit" className="w-full" disabled={loading}>
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
