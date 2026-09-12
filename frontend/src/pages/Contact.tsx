import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import FadeInView from "@/components/view/FadeInView";
import { toast } from "react-toastify";
import {
  Sparkles,
  TrendingUp,
  Stethoscope,
  Globe,
  ShieldCheck,
  Building2,
  Phone,
  Mail,
  Clock,
  Send,
  CheckCircle2,
  Users,
} from "lucide-react";

const Contact = () => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Gửi liên hệ:", formData);
    toast.success(t("staticPages.contactSuccessToast"));
    setFormData({ name: "", email: "", phone: "", message: "" });
  };

  return (
    <section className="mt-16 md:mt-24 pb-16">
      <div className="max-w-5xl mx-auto py-10 px-4 sm:px-6 space-y-12">
        {/* Phần giới thiệu về LifeHealth */}
        <FadeInView>
          <section className="text-center space-y-4 max-w-3xl mx-auto">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
              <Sparkles className="w-3.5 h-3.5" />
              {t("staticPages.contactBadge")}
            </span>
            <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
              {t("staticPages.contactTitle")}
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-base md:text-lg leading-relaxed">
              {t("staticPages.contactSubtitle")}
            </p>
          </section>
        </FadeInView>

        {/* Dẫn chứng về uy tín */}
        <FadeInView>
          <section className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-teal-50 dark:bg-teal-950/50 text-primary flex items-center justify-center mx-auto mb-4">
                <Stethoscope className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-1">
                +500 bác sĩ
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Hợp tác với các bác sĩ đầu ngành chuyên khoa tại TP.HCM, Hà Nội, Đà Nẵng...
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-4">
                <Building2 className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-1">
                +20 bệnh viện
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Liên kết với các cơ sở y tế lớn như Bệnh viện Đại học Y Dược, Vinmec, Hoàn Mỹ...
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-4">
                <Users className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-1">
                +100.000 người dùng
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Đã và đang sử dụng LifeHealth để đặt khám và theo dõi sức khỏe định kỳ tin cậy.
              </p>
            </div>
          </section>
        </FadeInView>

        {/* Thành tựu nổi bật và uy tín */}
        <FadeInView>
          <section className="space-y-6">
            <div className="text-center space-y-1">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                Vì sao người bệnh tin chọn LifeHealth?
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Những giá trị cốt lõi tạo nên trải nghiệm y tế số an toàn và tiện lợi
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <Card className="border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-sm bg-white dark:bg-slate-900">
                <CardContent className="p-6 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
                      <TrendingUp className="w-5 h-5" />
                    </div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                      Tăng trưởng ấn tượng
                    </h3>
                  </div>
                  <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                      <span>Hơn <strong className="text-slate-900 dark:text-slate-200">3 triệu người dùng</strong> trên toàn quốc</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                      <span>Hơn <strong className="text-slate-900 dark:text-slate-200">1 triệu lượt đặt lịch</strong> hàng năm</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                      <span>Tỷ lệ hài lòng đánh giá lên tới <strong className="text-slate-900 dark:text-slate-200">98%</strong></span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-sm bg-white dark:bg-slate-900">
                <CardContent className="p-6 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-teal-50 dark:bg-teal-950/50 text-primary">
                      <Stethoscope className="w-5 h-5" />
                    </div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                      Mạng lưới y tế hàng đầu
                    </h3>
                  </div>
                  <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                      <span>+1.200 bác sĩ chuyên khoa giàu kinh nghiệm</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                      <span>Hợp tác với hơn 40 bệnh viện lớn như Vinmec, Y Dược, Hoàn Mỹ</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-sm bg-white dark:bg-slate-900">
                <CardContent className="p-6 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
                      <Globe className="w-5 h-5" />
                    </div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                      Công nghệ hiện đại
                    </h3>
                  </div>
                  <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                      <span>AI hỗ trợ chẩn đoán sơ bộ, nhắc lịch khám tự động</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                      <span>Hồ sơ y tế điện tử đồng bộ tức thì trên thiết bị</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                      <span>Ứng dụng đa nền tảng phản hồi nhanh chóng</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-sm bg-white dark:bg-slate-900">
                <CardContent className="p-6 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                      Bảo mật & Chuẩn y tế
                    </h3>
                  </div>
                  <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                      <span>Tiêu chuẩn an toàn dữ liệu: HIPAA, ISO 27001</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                      <span>Được đánh giá cao trong chuyển đổi số y tế</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                      <span>Cam kết bảo mật dữ liệu hồ sơ bệnh án người dùng</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </section>
        </FadeInView>

        {/* Thông tin & form liên hệ */}
        <section className="grid md:grid-cols-2 gap-8 pt-4">
          {/* Thông tin liên hệ */}
          <Card className="border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-sm bg-white dark:bg-slate-900">
            <CardContent className="p-6 space-y-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                  {t("staticPages.contactInfoTitle")}
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  {t("staticPages.contactInfoDesc")}
                </p>
              </div>

              <div className="space-y-4 text-sm text-slate-600 dark:text-slate-300">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 shrink-0">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-slate-100">{t("staticPages.contactHeadquarters")}</p>
                    <p className="text-slate-500 dark:text-slate-400">{t("staticPages.contactHeadquartersAddress")}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 shrink-0">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-slate-100">{t("staticPages.contactHotline")}</p>
                    <p className="text-slate-500 dark:text-slate-400">{t("staticPages.contactHotlineFee")}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 shrink-0">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-slate-100">{t("staticPages.contactEmailLabel")}</p>
                    <p className="text-slate-500 dark:text-slate-400">support@lifehealth.vn</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 shrink-0">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-slate-100">{t("staticPages.contactWorkTime")}</p>
                    <p className="text-slate-500 dark:text-slate-400">{t("staticPages.contactWorkHours")}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Form liên hệ */}
          <Card className="border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-sm bg-white dark:bg-slate-900">
            <CardContent className="p-6">
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-1">
                {t("staticPages.contactOnlineFeedback")}
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">
                {t("staticPages.contactOnlineFeedbackDesc")}
              </p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {t("staticPages.contactName")} *
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="Nguyễn Văn A"
                    value={formData.name}
                    onChange={handleChange}
                    className="mt-1 rounded-xl"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {t("staticPages.contactEmail")} *
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    name="email"
                    placeholder="example@gmail.com"
                    value={formData.email}
                    onChange={handleChange}
                    className="mt-1 rounded-xl"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="phone" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {t("staticPages.contactPhone")}
                  </Label>
                  <Input
                    id="phone"
                    name="phone"
                    placeholder="0912 345 678"
                    value={formData.phone}
                    onChange={handleChange}
                    className="mt-1 rounded-xl"
                  />
                </div>
                <div>
                  <Label htmlFor="message" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {t("staticPages.contactMessage")} *
                  </Label>
                  <Textarea
                    id="message"
                    name="message"
                    rows={4}
                    placeholder={t("staticPages.contactMsgPlaceholder")}
                    value={formData.message}
                    onChange={handleChange}
                    className="mt-1 rounded-xl resize-none"
                    required
                  />
                </div>
                <Button type="submit" className="w-full gap-2 rounded-xl">
                  <Send className="w-4 h-4" />
                  {t("staticPages.contactSubmitBtn")}
                </Button>
              </form>
            </CardContent>
          </Card>
        </section>
      </div>
    </section>
  );
};

export default Contact;
