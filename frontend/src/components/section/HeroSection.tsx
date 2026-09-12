import React, { useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  CalendarCheck,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  UserCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUserStore } from "@/store/useUserStore";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP);

export const HeroSection: React.FC = () => {
  const { t } = useTranslation();
  const { userInfo } = useUserStore();
  const heroRef = useRef<HTMLDivElement>(null);
  const carePathLineRef = useRef<SVGPathElement>(null);

  const carePathSteps = useMemo(
    () => [
      {
        step: t("home.step1Label"),
        title: t("home.step1Title"),
        desc: t("home.step1Desc"),
        icon: Stethoscope,
      },
      {
        step: t("home.step2Label"),
        title: t("home.step2Title"),
        desc: t("home.step2Desc"),
        icon: UserCheck,
      },
      {
        step: t("home.step3Label"),
        title: t("home.step3Title"),
        desc: t("home.step3Desc"),
        icon: CalendarCheck,
      },
    ],
    [t],
  );

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const tl = gsap.timeline({ defaults: { ease: "power2.out" } });

        tl.fromTo(
          ".hero-eyebrow",
          { opacity: 0, y: -12 },
          { opacity: 1, y: 0, duration: 0.5 }
        )
          .fromTo(
            ".hero-title",
            { opacity: 0, y: 20 },
            { opacity: 1, y: 0, duration: 0.6 },
            "-=0.2"
          )
          .fromTo(
            ".hero-desc",
            { opacity: 0, y: 16 },
            { opacity: 1, y: 0, duration: 0.5 },
            "-=0.2"
          )
          .fromTo(
            ".hero-cta",
            { opacity: 0, y: 16 },
            { opacity: 1, y: 0, stagger: 0.1, duration: 0.45 },
            "-=0.2"
          )
          .fromTo(
            ".hero-visual-card",
            { opacity: 0, scale: 0.96 },
            { opacity: 1, scale: 1, duration: 0.7 },
            "-=0.5"
          )
          .fromTo(
            ".hero-preview-card",
            { opacity: 0, y: 24 },
            { opacity: 1, y: 0, duration: 0.6 },
            "-=0.3"
          )
          .fromTo(
            ".care-path-panel",
            { opacity: 0, y: 16 },
            { opacity: 1, y: 0, duration: 0.55 },
            "-=0.2"
          )
          .fromTo(
            ".care-path-step",
            { opacity: 0, y: 12 },
            { opacity: 1, y: 0, stagger: 0.1, duration: 0.45 },
            "-=0.2"
          );

        // Animate the ECG heartbeat path drawing
        if (carePathLineRef.current) {
          try {
            const length = carePathLineRef.current.getTotalLength();
            gsap.set(carePathLineRef.current, {
              strokeDasharray: length,
              strokeDashoffset: length,
            });
            tl.to(
              carePathLineRef.current,
              {
                strokeDashoffset: 0,
                duration: 1.1,
                ease: "power2.inOut",
              },
              "-=0.5"
            );
          } catch {
            gsap.set(carePathLineRef.current, { strokeDashoffset: 0 });
          }
        }
      });

      mm.add("(prefers-reduced-motion: reduce)", () => {
        // Instant appearance for accessibility
        gsap.set(
          [
            ".hero-eyebrow",
            ".hero-title",
            ".hero-desc",
            ".hero-cta",
            ".care-path-panel",
            ".care-path-step",
            ".hero-visual-card",
            ".hero-preview-card",
          ],
          { opacity: 1, y: 0, scale: 1 }
        );
        if (carePathLineRef.current) {
          gsap.set(carePathLineRef.current, { strokeDashoffset: 0 });
        }
      });
    },
    { scope: heroRef }
  );

  return (
    <header
      ref={heroRef}
      className="relative overflow-hidden pt-4 pb-12 sm:pb-16 lg:pt-8 lg:pb-16 bg-linear-to-b from-teal-50/60 via-slate-50/40 to-transparent dark:from-slate-900/60 dark:via-slate-900/40 dark:to-transparent"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 space-y-8 sm:space-y-10 lg:space-y-12">
        {/* 2-Column Hero Grid: Left content & Right clinical preview */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* Left Column: Clinical Value & Action */}
          <div className="lg:col-span-7 flex flex-col space-y-6 lg:space-y-7">
            {/* Eyebrow */}
            <div className="hero-eyebrow inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-100/80 dark:bg-teal-950/60 border border-teal-200/80 dark:border-teal-800 text-teal-800 dark:text-teal-200 text-xs sm:text-sm font-semibold w-fit shadow-2xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#159a98]"></span>
              </span>
              <span>{t("home.heroEyebrow1")}</span>
              <span className="text-slate-300 dark:text-slate-600">|</span>
              <span className="text-slate-600 dark:text-slate-400 text-xs font-medium">
                {t("home.heroEyebrow2")}
              </span>
            </div>

            {/* Main Headline */}
            <h1 className="hero-title font-heading text-3xl sm:text-4xl md:text-5xl lg:text-[3.25rem] font-extrabold text-slate-900 dark:text-slate-50 tracking-tight leading-[1.18]">
              {t("home.heroHeadlineMain")}{" "}
              <span className="text-[#159a98] dark:text-[#2cd4d1] block sm:inline">
                {t("home.heroHeadlineAccent")}
              </span>
            </h1>

            {/* Clear, patient-oriented description */}
            <p className="hero-desc text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed">
              {t("home.heroDescriptionRich")}
            </p>

            {/* Action CTAs */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 pt-1">
              <Button
                asChild
                className="hero-cta h-12 px-6 rounded-xl bg-[#159a98] hover:bg-[#117d7b] text-white font-bold text-sm sm:text-base shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer"
              >
                <Link to="/doctors" className="inline-flex items-center justify-center gap-2">
                  <span>{t("home.findMatchingDoctor")}</span>
                  <ArrowRight className="h-4 w-4 shrink-0" />
                </Link>
              </Button>

              <Button
                asChild
                variant="outline"
                className="hero-cta h-12 px-5 rounded-xl border-slate-300 dark:border-slate-700 bg-white/90 dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:border-[#159a98] hover:text-[#159a98] dark:hover:text-[#2cd4d1] font-semibold text-sm sm:text-base shadow-2xs transition-all duration-200 cursor-pointer"
              >
                <Link
                  to={userInfo ? "/chatbot" : "/sign-in"}
                  className="inline-flex items-center justify-center gap-2"
                >
                  <Sparkles className="h-4 w-4 text-[#159a98] dark:text-[#2cd4d1] shrink-0" />
                  <span>{t("home.askHealthAssistant")}</span>
                </Link>
              </Button>
            </div>
          </div>

          {/* Right Column: Visual Composition + Appointment Preview Card */}
          <div className="lg:col-span-5 relative flex flex-col items-center">
            {/* Ambient Clinical Glow */}
            <div className="absolute -inset-4 bg-radial from-teal-400/20 via-teal-200/10 to-transparent blur-2xl -z-10 pointer-events-none" />

            {/* Doctor Card Composition */}
            <div className="hero-visual-card relative w-full max-w-[440px] rounded-3xl overflow-hidden border border-slate-200/90 dark:border-[#293548] bg-white dark:bg-[#172033] shadow-xl">
              {/* Cropped & Framed Banner Visual */}
              <div className="relative h-64 sm:h-72 w-full overflow-hidden bg-slate-100 dark:bg-[#1E293B]">
                <img
                  src="/banner.png"
                  alt="LifeHealth Medical Specialists"
                  width={440}
                  height={288}
                  className="w-full h-full object-cover object-center scale-105 hover:scale-100 transition-transform duration-700"
                  loading="eager"
                  fetchPriority="high"
                  decoding="async"
                />
                <div className="absolute inset-0 bg-linear-to-t from-[#0B1220]/90 via-[#0B1220]/30 to-transparent" />

                {/* Top Badge: Verified Clinical Network */}
                <div className="absolute top-3.5 left-3.5 flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/95 dark:bg-[#111827]/95 backdrop-blur-md text-xs font-bold text-slate-800 dark:text-slate-100 shadow-sm border border-transparent dark:border-[#293548]">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#159a98]" />
                  <span>{t("home.verifiedSpecialistBadge")}</span>
                </div>

                <div className="absolute bottom-3 left-4 right-4 text-white">
                  <p className="text-xs font-semibold uppercase tracking-wider text-teal-200">
                    {t("home.hospitalBadge")}
                  </p>
                  <p className="text-base font-bold drop-shadow-sm">
                    {t("home.saveWaitTime")}
                  </p>
                </div>
              </div>

              {/* Interactive Appointment Preview Card */}
              <div className="hero-preview-card p-4 sm:p-5 bg-white dark:bg-[#172033] space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      {t("home.sampleTicket")}
                    </span>
                  </div>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    {t("home.confirmedBadge")}
                  </span>
                </div>

                {/* Doctor Brief */}
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-[#1E293B] border border-slate-100 dark:border-[#293548] flex items-center gap-3">
                  <img
                    src="https://cdn-icons-png.flaticon.com/512/2922/2922510.png"
                    alt="Dr. Nguyen Minh Anh"
                    className="w-12 h-12 rounded-xl object-cover ring-1 ring-slate-200 dark:ring-[#293548] bg-teal-50"
                  />
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                      {t("home.sampleDocName")}
                    </h4>
                    <p className="text-xs text-[#159a98] dark:text-[#2cd4d1] font-medium truncate">
                      {t("home.sampleDocSpec")}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      {t("home.sampleDocExp")}
                    </p>
                  </div>
                </div>

                {/* Slot Details */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-teal-50/70 dark:bg-teal-950/40 border border-teal-100 dark:border-teal-900/60 text-slate-700 dark:text-slate-200 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#159a98] shrink-0" />
                    <div>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block leading-tight">
                        {t("home.timeSlotLabel")}
                      </span>
                      <span className="font-bold">09:00 - 09:30</span>
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-teal-50/70 dark:bg-teal-950/40 border border-teal-100 dark:border-teal-900/60 text-slate-700 dark:text-slate-200 flex items-center gap-2">
                    <CalendarCheck className="w-4 h-4 text-[#159a98] shrink-0" />
                    <div>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block leading-tight">
                        {t("home.availableLabel")}
                      </span>
                      <span className="font-bold">{t("home.todayLabel")}</span>
                    </div>
                  </div>
                </div>

                {/* Quick Link to Browse */}
                <Button
                  asChild
                  className="w-full h-10 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-teal-600 dark:hover:bg-teal-500 text-white font-bold text-xs shadow-xs cursor-pointer"
                >
                  <Link to="/doctors">
                    <span>{t("home.viewRealScheduleBtn")}</span>
                    <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Full-Width Signature Element: Care Path Process Panel */}
        <section
          aria-label={t("home.carePathTitle")}
          className="care-path-panel relative rounded-2xl sm:rounded-3xl bg-white/90 dark:bg-slate-900/80 border border-teal-100/80 dark:border-slate-800/80 p-5 sm:p-6 lg:p-7 shadow-xs backdrop-blur-xs"
        >
          {/* Panel Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-5 mb-5 sm:pb-6 sm:mb-6 border-b border-slate-100 dark:border-slate-800/80">
            <div className="flex items-center gap-2.5">
              <span className="w-1.5 h-4.5 rounded-full bg-[#159a98]" aria-hidden="true" />
              <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 font-heading">
                {t("home.carePathTitle")}
              </h2>
            </div>
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-700 dark:text-teal-300 w-fit px-3 py-1 rounded-full bg-teal-50/80 dark:bg-teal-950/60 border border-teal-100 dark:border-teal-900/60">
              <Clock className="w-3.5 h-3.5 text-[#159a98] shrink-0" aria-hidden="true" />
              <span>{t("home.carePathDuration")}</span>
            </div>
          </div>

          {/* Timeline Wrapper with Semantic <ol> */}
          <div className="relative">
            {/* Desktop Horizontal ECG Connector: strictly runs through the center of icons at top: 24px */}
            <div
              className="hidden md:block absolute top-[24px] left-[calc(100%/6)] w-[calc(100%*2/3)] h-6 pointer-events-none z-0 overflow-visible"
              aria-hidden="true"
            >
              <svg
                className="w-full h-full overflow-visible"
                viewBox="0 0 600 24"
                fill="none"
                preserveAspectRatio="none"
              >
                {/* Base guide track */}
                <path
                  d="M 0 12 L 130 12 L 138 6 L 144 18 L 150 2 L 156 22 L 162 12 L 600 12"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeDasharray="4 4"
                  className="text-slate-200 dark:text-slate-800"
                  vectorEffect="non-scaling-stroke"
                />
                {/* Animated clinical drawing path with ECG heartbeat pulse in gap between steps */}
                <path
                  ref={carePathLineRef}
                  d="M 0 12 L 130 12 L 138 6 L 144 18 L 150 2 L 156 22 L 162 12 L 600 12"
                  stroke="#159a98"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke"
                />
              </svg>
            </div>

            {/* Mobile Vertical Track Line: strictly connects icon centers at left: 21px */}
            <div
              className="md:hidden absolute left-[21px] top-6 bottom-6 w-0.5 bg-linear-to-b from-[#159a98] via-teal-300 dark:via-teal-700 to-[#159a98] z-0"
              aria-hidden="true"
            />

            {/* 3 Steps List */}
            <ol className="relative z-10 flex flex-col md:grid md:grid-cols-3 gap-6 md:gap-8">
              {carePathSteps.map((item, index) => (
                <li
                  key={item.step}
                  className="care-path-step group relative flex items-start gap-4 md:flex-col md:items-center md:text-center"
                >
                  {/* Icon with Step Number Badge */}
                  <div className="relative shrink-0">
                    <div className="w-11 h-11 md:w-12 md:h-12 rounded-2xl bg-white dark:bg-slate-900 border-2 border-teal-500/30 dark:border-teal-400/30 text-[#159a98] dark:text-[#2cd4d1] flex items-center justify-center shadow-2xs group-hover:border-[#159a98] group-hover:scale-105 group-hover:shadow-md transition-all duration-200">
                      <item.icon className="w-5 h-5" aria-hidden="true" />
                    </div>
                    <span
                      className="hidden md:flex absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-teal-50 dark:bg-teal-950 border border-teal-200 dark:border-teal-800 text-[10px] font-extrabold text-[#159a98] dark:text-[#2cd4d1] items-center justify-center shadow-2xs"
                      aria-hidden="true"
                    >
                      0{index + 1}
                    </span>
                  </div>

                  {/* Step Content: No truncate, balanced hierarchy */}
                  <div className="flex-1 min-w-0 md:mt-3.5 space-y-1">
                    <div className="text-[11px] font-extrabold tracking-wider text-[#159a98] dark:text-[#2cd4d1] uppercase">
                      {item.step}
                    </div>
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 leading-snug">
                      {item.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-[260px] md:mx-auto">
                      {item.desc}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>
      </div>
    </header>
  );
};

export default HeroSection;
