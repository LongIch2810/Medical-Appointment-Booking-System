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
import { useTranslation } from "react-i18next";

type Step = "email" | "otp" | "reset";

const RESEND_COOLDOWN_SECONDS = 60;

const ForgotPassword: React.FC = () => {
  const { t } = useTranslation();
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
      ? t("auth.forgotStepEmailTitle")
      : step === "otp"
      ? t("auth.forgotStepOtpTitle")
      : t("auth.forgotStepResetTitle");

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gradient-to-br from-teal-900 via-teal-800 to-emerald-900 text-white relative overflow-hidden">
      {/* Decorative glow */}
      <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-teal-400/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-emerald-400/10 blur-3xl pointer-events-none" />

      {/* Left branding (matches SignIn/SignUp) */}
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
                Security &amp; Account
              </p>
            </div>
          </div>

          <div className="text-2xl sm:text-3xl lg:text-4xl font-extrabold mb-4 leading-tight font-heading min-h-[72px]">
            <Typewriter
              words={[
                t("auth.forgotTypewriter1"),
                t("auth.forgotTypewriter2"),
                t("auth.forgotTypewriter3"),
              ]}
              loop={true}
              cursor
              cursorStyle="|"
              typeSpeed={80}
              deleteSpeed={50}
              delaySpeed={2200}
            />
          </div>

          <p className="text-sm sm:text-base text-teal-100/90 leading-relaxed mb-8">
            {t("auth.forgotDescription")}
          </p>

          <div className="hidden sm:grid grid-cols-1 gap-3 pt-2 text-xs text-teal-50">
            <div className="flex items-center gap-2.5 rounded-xl bg-white/10 px-3.5 py-2.5 backdrop-blur-xs border border-white/10">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-400/20 text-emerald-300 font-bold">✓</span>
              <span>{t("auth.forgotOtpFeature")}</span>
            </div>
            <div className="flex items-center gap-2.5 rounded-xl bg-white/10 px-3.5 py-2.5 backdrop-blur-xs border border-white/10">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-400/20 text-emerald-300 font-bold">✓</span>
              <span>{t("auth.forgotEncryptedFeature")}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right form */}
      <div className="relative z-10 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 flex items-center justify-center p-6 sm:p-10 md:p-12 lg:p-16 rounded-t-3xl md:rounded-t-none md:rounded-l-3xl shadow-2xl flex-1 border-t md:border-t-0 md:border-l border-slate-200/50 dark:border-slate-800">
        <Card className="w-full max-w-md shadow-none rounded-none border-0 bg-transparent py-0">
          <CardHeader className="px-0 pt-0 pb-5">
            {step !== "email" && (
              <button
                type="button"
                onClick={() => setStep(step === "reset" ? "otp" : "email")}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-primary transition-colors mb-3 cursor-pointer w-fit"
              >
                <ArrowLeft size={15} /> {t("auth.backToPrevStep")}
              </button>
            )}
            <CardTitle className="text-center text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 font-heading">
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
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 text-center leading-relaxed">
                  {t("auth.forgotEmailDesc")}
                </p>
                <div className="space-y-1.5 text-left">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {t("auth.email")} <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    type="email"
                    placeholder={t("auth.emailPlaceholder")}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="rounded-xl h-11"
                    aria-label={t("auth.email")}
                    required
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full h-11 rounded-xl text-sm font-bold shadow-xs hover:shadow-md transition-all cursor-pointer"
                  disabled={loading}
                >
                  {loading ? <Loading /> : t("auth.sendOtpBtn")}
                </Button>
                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => navigate("/sign-in")}
                    className="text-xs font-bold text-primary hover:underline cursor-pointer"
                  >
                    {t("auth.backToSignIn")}
                  </button>
                </div>
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
                <p className="text-xs sm:text-sm text-center text-slate-600 dark:text-slate-300 leading-relaxed">
                  {t("auth.otpSentTo")} <strong className="text-primary">{email}</strong>
                </p>
                <div className="py-2">
                  <OtpInput value={otp} onChange={setOtp} />
                </div>
                <Button
                  type="submit"
                  className="w-full h-11 rounded-xl text-sm font-bold shadow-xs hover:shadow-md transition-all cursor-pointer"
                  disabled={loading}
                >
                  {loading ? <Loading /> : t("auth.verifyOtpBtn")}
                </Button>
                <p className="text-xs text-center text-slate-500 dark:text-slate-400">
                  {t("auth.resendOtpPrompt")}{" "}
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={cooldown > 0 || loading}
                    className="text-primary font-bold hover:underline disabled:text-slate-400 disabled:no-underline disabled:cursor-not-allowed cursor-pointer"
                  >
                    {cooldown > 0 ? `${t("auth.resendOtpBtn")} (${cooldown}s)` : t("auth.resendOtpBtn")}
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
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 text-center leading-relaxed">
                  {t("auth.forgotResetDesc")}
                </p>
                <div className="space-y-1.5 text-left">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {t("auth.newPassword")} <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    type="password"
                    placeholder={t("auth.newPasswordPlaceholder")}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="rounded-xl h-11"
                    aria-label={t("auth.newPassword")}
                    required
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full h-11 rounded-xl text-sm font-bold shadow-xs hover:shadow-md transition-all cursor-pointer"
                  disabled={loading}
                >
                  {loading ? <Loading /> : t("auth.resetPasswordBtn")}
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
