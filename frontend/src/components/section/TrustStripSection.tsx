import React from "react";
import { ShieldCheck, CalendarCheck, Lock } from "lucide-react";
import { useTranslation } from "react-i18next";

export const TrustStripSection: React.FC = () => {
  const { t } = useTranslation();

  const trustPoints = [
    {
      icon: <ShieldCheck className="w-5 h-5 text-[#159a98] dark:text-[#2cd4d1] shrink-0" />,
      title: t("home.trust1Title"),
      description: t("home.trust1Desc"),
    },
    {
      icon: <CalendarCheck className="w-5 h-5 text-[#159a98] dark:text-[#2cd4d1] shrink-0" />,
      title: t("home.trust2Title"),
      description: t("home.trust2Desc"),
    },
    {
      icon: <Lock className="w-5 h-5 text-[#159a98] dark:text-[#2cd4d1] shrink-0" />,
      title: t("home.trust3Title"),
      description: t("home.trust3Desc"),
    },
  ];

  return (
    <section className="relative z-10 -mt-4 mb-8 sm:mb-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-md p-5 sm:p-6 lg:p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 divide-y md:divide-y-0 md:divide-x divide-slate-100 dark:divide-slate-800">
            {trustPoints.map((point, index) => (
              <div
                key={index}
                className={`flex items-start gap-4 ${
                  index > 0 ? "pt-5 md:pt-0 md:pl-6 lg:pl-8" : ""
                }`}
              >
                <div className="w-11 h-11 rounded-2xl bg-teal-50 dark:bg-teal-950/60 border border-teal-100 dark:border-teal-900 flex items-center justify-center shrink-0">
                  {point.icon}
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
                    {point.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                    {point.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default TrustStripSection;
