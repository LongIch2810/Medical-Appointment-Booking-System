import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Calendar, CheckCircle2, Search, ShieldAlert } from "lucide-react";
import { Button } from "../ui/button";

export const BookingProcessSection: React.FC = () => {
  const steps = [
    {
      step: "01",
      icon: <Search className="w-6 h-6 text-[#159a98] dark:text-[#2cd4d1]" />,
      title: "Tra cứu chuyên khoa & bác sĩ",
      desc: "Tìm kiếm chính xác theo chuyên khoa, bệnh viện, khu vực hoặc kinh nghiệm của bác sĩ.",
      perk: "Lọc linh hoạt theo nhu cầu",
    },
    {
      step: "02",
      icon: <Calendar className="w-6 h-6 text-[#159a98] dark:text-[#2cd4d1]" />,
      title: "Chọn khung giờ khám thuận tiện",
      desc: "Xem trực tiếp lịch rảnh theo ngày của từng bác sĩ và ấn chọn giờ khám mong muốn.",
      perk: "Khung giờ cố định, không phải chờ",
    },
    {
      step: "03",
      icon: <CheckCircle2 className="w-6 h-6 text-[#159a98] dark:text-[#2cd4d1]" />,
      title: "Nhận phiếu hẹn & được nhắc lịch",
      desc: "Phiếu khám điện tử được kích hoạt ngay trong tài khoản, kèm thông báo nhắc hẹn tự động.",
      perk: "An tâm đi khám đúng giờ",
    },
  ];

  return (
    <section className="py-12 sm:py-16 bg-gradient-to-b from-slate-50/70 via-white to-slate-50/50 dark:from-slate-900/60 dark:via-slate-900/40 dark:to-slate-900/60">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-14">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#159a98] dark:text-[#2cd4d1] mb-2">
            <span>Quy trình tinh gọn</span>
          </div>
          <h2 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            Đặt lịch khám trong 3 bước đơn giản
          </h2>
          <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-slate-400">
            LifeHealth tối ưu hóa toàn bộ quá trình đặt hẹn, giúp bạn tiết kiệm thời gian chờ đợi và chủ động lịch trình sức khỏe.
          </p>
        </div>

        {/* 3 Step Cards with Connectors */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 relative">
          {steps.map((item, index) => (
            <div
              key={index}
              className="relative flex flex-col justify-between p-6 sm:p-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-[#159a98]/50 transition-all duration-300 group"
            >
              <div>
                {/* Step badge & icon */}
                <div className="flex items-center justify-between mb-5">
                  <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-950/70 border border-teal-100 dark:border-teal-900 flex items-center justify-center group-hover:scale-105 transition-transform">
                    {item.icon}
                  </div>
                  <span className="font-heading text-2xl sm:text-3xl font-black text-slate-200 dark:text-slate-800 group-hover:text-teal-200 dark:group-hover:text-teal-900 transition-colors">
                    {item.step}
                  </span>
                </div>

                <h3 className="font-heading text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">
                  {item.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  {item.desc}
                </p>
              </div>

              {/* Bottom Perk Pill */}
              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center gap-1.5 text-xs font-semibold text-[#159a98] dark:text-[#2cd4d1]">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>{item.perk}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Action button */}
        <div className="mt-10 sm:mt-12 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button
            asChild
            className="h-11 px-6 rounded-xl bg-[#159a98] hover:bg-[#117d7b] text-white font-bold text-sm shadow-md hover:shadow-lg transition-all cursor-pointer"
          >
            <Link to="/doctors" className="inline-flex items-center gap-2">
              <span>Bắt đầu tìm bác sĩ & Đặt lịch</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>

          <p className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1">
            <ShieldAlert className="w-3.5 h-3.5" />
            Không phát sinh phí đặt lịch trên hệ thống
          </p>
        </div>
      </div>
    </section>
  );
};

export default BookingProcessSection;
