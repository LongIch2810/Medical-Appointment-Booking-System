import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, FileCheck2, Lock, ShieldCheck, UserCheck } from "lucide-react";
import { Button } from "../ui/button";

export const DataSecuritySection: React.FC = () => {
  const securityItems = [
    {
      icon: <FileCheck2 className="w-6 h-6 text-[#159a98] dark:text-[#2cd4d1]" />,
      title: "Hạ tầng đạt chuẩn",
      desc: "ISO 27001:2013 quản lý an toàn thông tin",
    },
    {
      icon: <ShieldCheck className="w-6 h-6 text-[#159a98] dark:text-[#2cd4d1]" />,
      title: "Bảo mật y tế",
      desc: "Tuân thủ nghiêm ngặt theo quy chuẩn HIPAA",
    },
    {
      icon: <Lock className="w-6 h-6 text-[#159a98] dark:text-[#2cd4d1]" />,
      title: "Mã hóa đa tầng",
      desc: "Dữ liệu hồ sơ bệnh án được bảo vệ tuyệt đối",
    },
    {
      icon: <UserCheck className="w-6 h-6 text-[#159a98] dark:text-[#2cd4d1]" />,
      title: "Quyền sở hữu thuộc về bạn",
      desc: "Chỉ người bệnh và bác sĩ được bạn cấp phép mới có quyền xem",
    },
  ];

  return (
    <section className="py-12 sm:py-16 lg:py-20 bg-slate-50/60 dark:bg-slate-900/40">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 space-y-12 sm:space-y-16">
        {/* Security Pillars */}
        <div>
          <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-[#159a98] dark:text-[#2cd4d1]">
              An toàn & Bảo mật
            </span>
            <h2 className="font-heading text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 mt-1">
              Thông tin sức khỏe của bạn là riêng tư tuyệt đối
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              LifeHealth cam kết bảo vệ dữ liệu hồ sơ khám và lịch sử điều trị theo các chuẩn mực an toàn cao nhất trong y tế số.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {securityItems.map((item, index) => (
              <div
                key={index}
                className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs hover:border-[#159a98]/40 transition-colors"
              >
                <div className="w-11 h-11 rounded-xl bg-teal-50 dark:bg-teal-950/60 border border-teal-100 dark:border-teal-900 flex items-center justify-center mb-4">
                  {item.icon}
                </div>
                <h3 className="font-heading text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 mb-1">
                  {item.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Final High-Impact Closing CTA */}
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-slate-900 via-[#123b45] to-[#159a98] text-white shadow-xl p-8 sm:p-12 lg:p-16">
          {/* Subtle Graphic Accents */}
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-teal-400/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-64 h-64 bg-teal-200/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl mx-auto text-center space-y-5">
            <h2 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight leading-tight">
              Sức khỏe không thể trì hoãn. <br className="hidden sm:inline" />
              Hãy chủ động đặt lịch khám ngay hôm nay.
            </h2>
            <p className="text-sm sm:text-base text-teal-100 max-w-xl mx-auto leading-relaxed">
              Tiết kiệm thời gian, tiếp cận bác sĩ giỏi và nhận sự chăm sóc y tế chuẩn mực chỉ trong vài bước thao tác.
            </p>

            <div className="pt-3 flex flex-col sm:flex-row items-center justify-center gap-3.5">
              <Button
                asChild
                className="h-12 px-7 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-sm sm:text-base shadow-lg hover:shadow-xl transition-all cursor-pointer"
              >
                <Link to="/doctors" className="inline-flex items-center gap-2">
                  <span>Tìm bác sĩ & Đặt lịch khám</span>
                  <ArrowRight className="w-4 h-4 text-[#159a98]" />
                </Link>
              </Button>

              <Button
                asChild
                variant="outline"
                className="h-12 px-6 rounded-xl border-white/30 bg-white/10 hover:bg-white/20 text-white font-semibold text-sm sm:text-base backdrop-blur-xs cursor-pointer"
              >
                <Link to="/contact">
                  <span>Liên hệ hỗ trợ</span>
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DataSecuritySection;
