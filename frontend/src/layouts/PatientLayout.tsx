import React, { Suspense, useEffect } from "react";
import {
  AlertTriangle,
  CalendarClock,
  BellRing,
  CalendarPlus,
  FileHeart,
  FileSearch,
  LayoutDashboard,
  MessageCircleMore,
  Settings,
  ShieldCheck,
  Sparkles,
  UserRound,
  UsersRound,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { NavLink, Outlet } from "react-router-dom";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useProfile } from "@/hooks/useProfile";
import { cn } from "@/lib/utils";
import PatientContentSkeleton from "@/components/loading/PatientContentSkeleton";
import {
  prefetchCorePatientRoutes,
  prefetchPatientData,
  prefetchPatientRoute,
} from "@/utils/routePrefetch";
import { useQueryClient } from "@tanstack/react-query";

const PatientNavigation: React.FC = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const navItems = [
    { label: t("nav.dashboard"), to: "/patient", icon: LayoutDashboard, end: true },
    { label: t("nav.notifications"), to: "/patient/notifications", icon: BellRing },
    { label: t("nav.profile"), to: "/patient/profile", icon: UserRound },
    { label: t("nav.appointments"), to: "/patient/appointments", icon: CalendarClock },
    { label: t("nav.relatives"), to: "/patient/relatives", icon: UsersRound },
    {
      label: t("nav.messages"),
      to: "/patient/messages",
      icon: MessageCircleMore,
    },
    {
      label: t("nav.aiCoachHealth"),
      to: "/patient/ai-coach-health",
      icon: Sparkles,
    },
    { label: t("nav.healthRecords"), to: "/patient/health-records", icon: FileHeart },
    { label: t("nav.visitResults"), to: "/patient/visit-results", icon: FileSearch },
    { label: t("nav.complaints"), to: "/patient/complaints", icon: AlertTriangle },
    { label: t("nav.settings"), to: "/patient/settings", icon: Settings },
  ];

  const handleIntent = (to: string) => {
    prefetchPatientRoute(to);
    prefetchPatientData(to, queryClient);
  };

  return (
    <>
      <aside className="hidden lg:flex lg:w-72 lg:shrink-0 lg:flex-col lg:gap-1.5 lg:rounded-3xl lg:border lg:border-slate-200/80 lg:bg-white lg:p-4 lg:shadow-xs sticky top-32 dark:border-[#293548] dark:bg-[#111827]">
        <Button asChild className="mb-3 w-full justify-center gap-2 rounded-2xl bg-primary hover:bg-primary/90 font-bold text-primary-foreground shadow-xs hover:shadow-md transition-all cursor-pointer h-11">
          <NavLink
            to="/doctors"
            onMouseEnter={() => prefetchPatientRoute("/doctors")}
            onFocus={() => prefetchPatientRoute("/doctors")}
            className="text-primary-foreground flex items-center justify-center gap-2 w-full"
          >
            <CalendarPlus className="h-4.5 w-4.5 text-primary-foreground" />
            <span className="text-primary-foreground font-bold text-sm">{t("dashboard.bookNewAppointment", { defaultValue: "Đặt lịch khám mới" })}</span>
          </NavLink>
        </Button>
        <p className="px-3 pb-1.5 pt-1 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          {t("nav.managementCenter", { defaultValue: "Trung tâm Quản lý" })}
        </p>
        <div className="space-y-1">
          {navItems.map(({ label, to, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onMouseEnter={() => handleIntent(to)}
              onFocus={() => handleIntent(to)}
              className={({ isActive }) =>
                cn(
                  "group flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-all",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-xs font-bold"
                    : "text-slate-700 hover:bg-slate-100/80 hover:text-primary dark:text-slate-300 dark:hover:bg-[#1E293B] dark:hover:text-primary",
                )
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={cn(
                      "flex h-8.5 w-8.5 items-center justify-center rounded-xl transition-colors",
                      isActive
                        ? "bg-white/20 text-white"
                        : "bg-primary/10 text-primary group-hover:bg-primary/20 dark:bg-[#1E293B] dark:text-teal-300",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="truncate">{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </aside>

      {/* Mobile Horizontal Navigation */}
      <div className="mb-5 flex gap-2 overflow-x-auto pb-2 lg:hidden mobile-nav-scroll">
        <NavLink
          to="/doctors"
          onMouseEnter={() => prefetchPatientRoute("/doctors")}
          onFocus={() => prefetchPatientRoute("/doctors")}
          className="flex min-w-fit items-center gap-2 rounded-full border border-primary bg-primary hover:bg-primary/90 px-4 py-2 text-xs sm:text-sm font-bold text-primary-foreground shadow-xs"
        >
          <CalendarPlus className="h-4 w-4 text-primary-foreground" />
          <span>{t("dashboard.bookNewAppointment", { defaultValue: "Đặt lịch mới" })}</span>
        </NavLink>
        {navItems.map(({ label, to, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onMouseEnter={() => handleIntent(to)}
            onFocus={() => handleIntent(to)}
            className={({ isActive }) =>
              cn(
                "flex min-w-fit items-center gap-2 rounded-full border px-3.5 py-2 text-xs sm:text-sm font-semibold transition-all",
                isActive
                  ? "border-primary bg-primary text-primary-foreground shadow-xs font-bold"
                  : "border-slate-200 bg-white text-slate-700 hover:border-primary/40 hover:text-primary dark:border-[#293548] dark:bg-[#111827] dark:text-slate-300",
              )
            }
          >
            <Icon className="h-3.5 w-3.5" />
            <span>{label}</span>
          </NavLink>
        ))}
      </div>
    </>
  );
};

const PatientPortalShell: React.FC = () => {
  const { t } = useTranslation();
  const { data: profileResponse } = useProfile();
  const profile = profileResponse?.data;
  const initial =
    profile?.fullname?.charAt(0)?.toUpperCase() ??
    profile?.username?.charAt(0)?.toUpperCase() ??
    "P";

  // Prefetch core patient routes during browser idle time
  useEffect(() => {
    prefetchCorePatientRoutes();
  }, []);

  return (
    <section className="mt-16 md:mt-24 pb-12">
      {/* Top Welcome Banner */}
      <div className="relative mb-6 overflow-hidden rounded-3xl border border-teal-600/30 bg-gradient-to-br from-teal-800 via-teal-700 to-emerald-700 p-6 text-white shadow-md dark:border-teal-500/20 dark:from-[#0B1220] dark:via-[#132B32] dark:to-[#0B1220] md:p-7">
        {/* Subtle decorative glow */}
        <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-emerald-400/15 blur-3xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 h-64 w-64 rounded-full bg-teal-300/10 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4.5">
            <div className="relative shrink-0">
              <Avatar className="h-16 w-16 border-2 border-white/50 shadow-md ring-4 ring-white/15 md:h-18 md:w-18">
                <AvatarImage
                  src={profile?.picture ?? ""}
                  alt={profile?.fullname ?? "User avatar"}
                  className="object-cover"
                />
                <AvatarFallback className="bg-teal-900/60 text-xl font-extrabold text-white">
                  {initial}
                </AvatarFallback>
              </Avatar>
              <span className="absolute bottom-0.5 right-0.5 h-4 w-4 rounded-full border-2 border-white dark:border-[#111827] bg-emerald-400 shadow-xs" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-xs md:text-sm font-medium text-white/80">{t("header.greeting", { defaultValue: "Xin chào," })}</p>
                <Badge className="bg-white/20 hover:bg-white/25 text-white text-[11px] font-bold border-none backdrop-blur-xs gap-1">
                  <ShieldCheck className="h-3 w-3" />
                  {t("header.patientBadge", { defaultValue: "Bệnh nhân LifeHealth" })}
                </Badge>
              </div>
              <h1 className="text-xl font-extrabold tracking-tight md:text-2xl truncate mt-0.5 text-white font-heading">
                {profile?.fullname ?? profile?.username ?? "Bệnh nhân LifeHealth"}
              </h1>
              <p className="mt-1 max-w-xl text-xs md:text-sm text-teal-50/90 dark:text-slate-300 line-clamp-1">
                {t("header.patientSubtitle", { defaultValue: "Quản lý lịch khám, hồ sơ sức khỏe, trao đổi bác sĩ và trợ lý y tế AI." })}
              </p>
            </div>
          </div>

          <div className="hidden rounded-2xl bg-white/10 dark:bg-[#172033]/80 px-5 py-3 text-right md:block border border-white/15 dark:border-[#293548] backdrop-blur-xs shadow-2xs">
            <p className="text-[10px] uppercase tracking-widest text-teal-100/75 dark:text-slate-400 font-bold">
              {t("header.linkedAccount", { defaultValue: "Tài khoản liên kết" })}
            </p>
            <p className="text-sm font-bold text-white truncate max-w-xs mt-0.5">
              {profile?.email ?? t("header.noEmail", { defaultValue: "Chưa cập nhật email" })}
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <PatientNavigation />
        <div className="min-w-0 flex-1">
          <Suspense fallback={<PatientContentSkeleton />}>
            <Outlet />
          </Suspense>
        </div>
      </div>
    </section>
  );
};

const PatientLayout: React.FC = () => {
  return <PatientPortalShell />;
};

export default PatientLayout;

