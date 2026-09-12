import {
  Facebook,
  Instagram,
  Twitter,
  Youtube,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Send,
  GraduationCap,
  Info,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import { openEducationalDisclaimer } from "@/utils/disclaimer";

const Footer = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800 mt-16 text-sm">
      <div className="max-w-7xl mx-auto px-6 py-14 grid grid-cols-1 md:grid-cols-5 gap-10">
        {/* Logo and Description */}
        <div className="md:col-span-2 space-y-4">
          <div
            className="flex items-center gap-x-3 text-2xl font-extrabold text-white cursor-pointer"
            onClick={() => navigate("/")}
          >
            <img
              src="/logo.jpg"
              alt="logo"
              width={40}
              height={40}
              loading="lazy"
              decoding="async"
              className="w-10 h-10 rounded-xl object-cover border border-teal-400/30"
            />
            <span className="bg-gradient-to-r from-white via-slate-100 to-teal-200 bg-clip-text text-transparent">
              LifeHealth
            </span>
          </div>
          <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
            {t("footer.tagline")}
          </p>

          <div className="space-y-2.5 pt-2 text-xs sm:text-sm text-slate-300">
            <div className="flex items-start gap-2.5">
              <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <span>{t("footer.address", { defaultValue: "123 Lý Thường Kiệt, P.7, Q.10, TP.HCM" })}</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Phone className="w-4 h-4 text-primary shrink-0" />
              <span className="font-bold text-white">{t("footer.emergencyHotline")}</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Mail className="w-4 h-4 text-primary shrink-0" />
              <span>support@lifehealth.vn</span>
            </div>
          </div>

          <div className="flex space-x-3 pt-3">
            {[
              { icon: Facebook, label: "Facebook", href: "#" },
              { icon: Instagram, label: "Instagram", href: "#" },
              { icon: Twitter, label: "Twitter", href: "#" },
              { icon: Youtube, label: "YouTube", href: "#" },
            ].map((social, index) => (
              <a
                key={index}
                href={social.href}
                aria-label={social.label}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-800 text-slate-400 hover:bg-primary hover:text-white transition-all shadow-xs"
              >
                <social.icon className="w-4 h-4" />
              </a>
            ))}
          </div>
        </div>

        {/* Links */}
        <div>
          <h3 className="font-bold text-white text-sm uppercase tracking-wider mb-4">{t("footer.aboutUs")}</h3>
          <ul className="space-y-2.5 text-slate-400 text-sm">
            <li>
              <Link to="/team" className="hover:text-primary transition-colors">{t("footer.team", { defaultValue: "Đội ngũ chuyên gia" })}</Link>
            </li>
            <li>
              <Link to="/careers" className="hover:text-primary transition-colors">{t("footer.careers", { defaultValue: "Tuyển dụng" })}</Link>
            </li>
            <li>
              <Link to="/news" className="hover:text-primary transition-colors">{t("footer.medicalNews", { defaultValue: "Tin tức y khoa" })}</Link>
            </li>
            <li>
              <Link to="/terms" className="hover:text-primary transition-colors">{t("footer.privacyPolicy", { defaultValue: "Chính sách bảo mật" })}</Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="font-bold text-white text-sm uppercase tracking-wider mb-4">{t("footer.medicalServices")}</h3>
          <ul className="space-y-2.5 text-slate-400 text-sm">
            <li>
              <Link to="/doctors" className="hover:text-primary transition-colors">{t("footer.bookDoctor", { defaultValue: "Đặt lịch khám bác sĩ" })}</Link>
            </li>
            <li>
              <Link to="/chatbot" className="hover:text-primary transition-colors">{t("footer.aiMedAi", { defaultValue: "Trợ lý AI MedAI" })}</Link>
            </li>
            <li>
              <Link to="/patient/ai-coach-health" className="hover:text-primary transition-colors">AI Health Coach</Link>
            </li>
            <li>
              <Link to="/patient/visit-results" className="hover:text-primary transition-colors">{t("footer.checkRecords", { defaultValue: "Tra cứu bệnh án" })}</Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="font-bold text-white text-sm uppercase tracking-wider mb-4">{t("footer.support")}</h3>
          <ul className="space-y-2.5 text-slate-400 text-sm">
            <li>
              <Link to="/faq" className="hover:text-primary transition-colors">{t("footer.faq", { defaultValue: "Câu hỏi thường gặp" })}</Link>
            </li>
            <li>
              <Link to="/contact" className="hover:text-primary transition-colors">{t("footer.contactSupport", { defaultValue: "Liên hệ tư vấn" })}</Link>
            </li>
            <li>
              <Link to="/feedback" className="hover:text-primary transition-colors">{t("footer.feedback", { defaultValue: "Góp ý chất lượng" })}</Link>
            </li>
            <li className="pt-2">
              <div className="inline-flex items-center gap-1.5 rounded-lg bg-slate-800/80 px-2.5 py-1.5 text-xs text-emerald-400 border border-slate-700">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>{t("footer.isoStandards", { defaultValue: "Chuẩn ISO y tế số" })}</span>
              </div>
            </li>
          </ul>
        </div>
      </div>

      {/* Newsletter */}
      <div className="border-t border-slate-800/80 bg-slate-950/60 py-7">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-center md:text-left">
            <h4 className="text-sm font-bold text-white">
              {t("footer.newsletter")}
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              {t("footer.newsletterDesc")}
            </p>
          </div>
          <form
            className="flex items-center w-full md:w-auto gap-2"
            onSubmit={(e) => e.preventDefault()}
          >
            <input
              type="email"
              placeholder={t("footer.emailPlaceholder")}
              className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white placeholder:text-slate-500 w-full md:w-72 outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 bg-primary text-white font-bold px-4 py-2.5 rounded-xl hover:bg-primary/90 transition text-xs sm:text-sm shrink-0 shadow-xs cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{t("footer.subscribe")}</span>
            </button>
          </form>
        </div>
      </div>

      {/* Educational & Non-Commercial Disclaimer Section */}
      <div className="border-t border-slate-800/80 bg-slate-950/80 py-6 px-6">
        <div className="max-w-7xl mx-auto rounded-2xl bg-slate-900 border border-slate-800 p-5 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-start gap-3.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-400/10 text-amber-400 border border-amber-400/20 shrink-0 mt-0.5">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide bg-amber-400/15 text-amber-300 border border-amber-400/30">
                  {t("footer.disclaimerBadge", { defaultValue: "DỰ ÁN HỌC TẬP PHI THƯƠNG MẠI" })}
                </span>
                <span className="text-[11px] font-medium text-slate-400">
                  Non-commercial Educational Project
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-4xl">
                {t("footer.disclaimerText", {
                  defaultValue: "Website LifeHealth được xây dựng phục vụ nghiên cứu công nghệ, học thuật và đồ án. Mọi hình ảnh bác sĩ và cơ sở y tế trên trang web được sử dụng nhằm mục đích minh họa giao diện & nghiên cứu phi lợi nhuận. Hệ thống không thực hiện hoạt động kinh doanh y tế hay thu phí."
                })}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={openEducationalDisclaimer}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary/10 hover:bg-primary/20 text-teal-300 hover:text-teal-200 border border-teal-500/30 text-xs sm:text-sm font-semibold transition-all shrink-0 cursor-pointer shadow-xs"
          >
            <Info className="w-4 h-4" />
            <span>{t("footer.disclaimerButton", { defaultValue: "Xem chi tiết miễn trừ" })}</span>
          </button>
        </div>
      </div>

      {/* Bottom */}
      <div className="border-t border-slate-800/60 text-center py-5 text-xs text-slate-500">
        &copy; {new Date().getFullYear()} LifeHealth Medical Platform. {t("footer.copyrightDesc", { defaultValue: "Dự án nghiên cứu & học thuật phi thương mại." })}
      </div>
    </footer>
  );
};

export default Footer;
