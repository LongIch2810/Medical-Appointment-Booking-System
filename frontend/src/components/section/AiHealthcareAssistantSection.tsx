import React from "react";
import { Link } from "react-router-dom";
import { AlertCircle, ArrowRight, Bot, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "../ui/button";
import { useUserStore } from "@/store/useUserStore";
import AIApplicationInHealthCareAnimation from "../animation/AIApplicationInHealthCareAnimation";

export const AiHealthcareAssistantSection: React.FC = () => {
  const { t } = useTranslation();
  const { userInfo } = useUserStore();

  return (
    <section className="py-12 sm:py-16 lg:py-20 relative overflow-hidden">
      {/* Subtle Background Accent */}
      <div className="absolute inset-0 bg-gradient-to-tr from-teal-50/40 via-transparent to-teal-50/20 dark:from-teal-950/20 dark:via-transparent dark:to-transparent pointer-events-none -z-10" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-lg p-6 sm:p-10 lg:p-12 overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left Info Column */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-50 dark:bg-teal-950/60 border border-teal-200/80 dark:border-teal-800 text-teal-800 dark:text-teal-200 text-xs font-bold w-fit">
                <Sparkles className="w-3.5 h-3.5 text-[#159a98]" />
                <span>{t("home.aiAssistantBadge")}</span>
              </div>

              <h2 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight leading-tight">
                {t("home.aiAssistantHeading")}
              </h2>

              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                {t("home.aiAssistantDesc")}
              </p>

              {/* 2 Feature Pills */}
              <div className="grid max-w-md grid-cols-1 gap-3.5">
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-teal-100 dark:bg-teal-900/60 text-[#159a98] dark:text-[#2cd4d1] flex items-center justify-center shrink-0">
                    <Bot className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                      {t("home.aiFeature1Title")}
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {t("home.aiFeature1Desc")}
                    </p>
                  </div>
                </div>

              </div>

              {/* Strict Medical Disclaimer */}
              <div className="p-3.5 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/60 flex items-start gap-3 text-xs text-amber-800 dark:text-amber-300">
                <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  <strong>{t("home.aiDisclaimerStrong")}</strong> {t("home.aiDisclaimerText")}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                <Button
                  asChild
                  className="h-11 px-5 rounded-xl bg-[#159a98] hover:bg-[#117d7b] text-white font-bold text-xs sm:text-sm shadow-sm cursor-pointer"
                >
                  <Link
                    to={userInfo ? "/chatbot" : "/sign-in"}
                    className="inline-flex items-center justify-center gap-2"
                  >
                    <Bot className="w-4 h-4" />
                    <span>{t("home.askAiBtn")}</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>

              </div>
            </div>

            {/* Right Animation Visual Column */}
            <div className="lg:col-span-5 flex justify-center items-center">
              <div className="relative w-full max-w-[380px] sm:max-w-[420px] rounded-3xl bg-teal-50/50 dark:bg-slate-800/40 border border-teal-100 dark:border-slate-800 p-4 sm:p-6 flex flex-col items-center justify-center">
                <AIApplicationInHealthCareAnimation />
                <div className="mt-2 text-center">
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    {t("home.aiAnimationNote")}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AiHealthcareAssistantSection;
