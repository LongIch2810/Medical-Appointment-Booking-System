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

const navItems = [
  { label: "Dashboard", to: "/patient", icon: LayoutDashboard, end: true },
  { label: "Thông báo", to: "/patient/notifications", icon: BellRing },
  { label: "Thông tin cá nhân", to: "/patient/profile", icon: UserRound },
  { label: "Lịch khám", to: "/patient/appointments", icon: CalendarClock },
  { label: "Người thân", to: "/patient/relatives", icon: UsersRound },
  {
    label: "Tư vấn trực tuyến",
    to: "/patient/messages",
    icon: MessageCircleMore,
  },
  {
    label: "AI Coach Health",
    to: "/patient/ai-coach-health",
    icon: Sparkles,
  },
  { label: "Hồ sơ sức khỏe", to: "/patient/health-records", icon: FileHeart },
  { label: "Kết quả khám", to: "/patient/visit-results", icon: FileSearch },
  { label: "Góp ý & khiếu nại", to: "/patient/complaints", icon: AlertTriangle },
  { label: "Cài đặt & Bảo mật", to: "/patient/settings", icon: Settings },
];

const PatientNavigation: React.FC = () => {
  const queryClient = useQueryClient();

  const handleIntent = (to: string) => {
    prefetchPatientRoute(to);
    prefetchPatientData(to, queryClient);
  };

  return (
    <>
      <aside className="hidden lg:flex lg:w-72 lg:shrink-0 lg:flex-col lg:gap-1.5 lg:rounded-3xl lg:border lg:border-slate-200/80 lg:bg-white lg:p-4 lg:shadow-xs sticky top-32 dark:border-slate-800 dark:bg-slate-900">
        <Button asChild className="mb-3 w-full justify-center gap-2 rounded-2xl bg-primary hover:bg-primary/90 font-bold text-white shadow-xs hover:shadow-md transition-all cursor-pointer h-11">
          <NavLink
            to="/doctors"
            onMouseEnter={() => prefetchPatientRoute("/doctors")}
            onFocus={() => prefetchPatientRoute("/doctors")}
            className="text-white flex items-center justify-center gap-2 w-full"
          >
            <CalendarPlus className="h-4.5 w-4.5 text-white" />
            <span className="text-white font-bold text-sm">Đặt lịch khám mới</span>
          </NavLink>
        </Button>
        <p className="px-3 pb-1.5 pt-1 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          Trung tâm Quản lý
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
                    ? "bg-primary text-white shadow-xs font-semibold"
                    : "text-slate-700 hover:bg-slate-100/80 hover:text-primary dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white",
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
                        : "bg-primary/10 text-primary group-hover:bg-primary/20 dark:bg-slate-800 dark:text-teal-400",
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
          className="flex min-w-fit items-center gap-2 rounded-full border border-primary bg-primary hover:bg-primary/90 px-4 py-2 text-xs sm:text-sm font-bold text-white shadow-xs"
        >
          <CalendarPlus className="h-4 w-4 text-white" />
          <span>Đặt lịch mới</span>
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
                  ? "border-primary bg-primary text-white shadow-xs font-bold"
                  : "border-slate-200 bg-white text-slate-700 hover:border-primary/40 hover:text-primary dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300",
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
      <div className="mb-6 overflow-hidden rounded-3xl bg-gradient-to-r from-teal-700 via-primary to-emerald-600 p-6 text-white shadow-md md:p-7">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4.5">
            <Avatar className="h-16 w-16 border-3 border-white/40 shadow-sm shrink-0 md:h-18 md:w-18">
              <AvatarImage
                src={profile?.picture ?? ""}
                alt={profile?.fullname ?? "User avatar"}
                className="object-cover"
              />
              <AvatarFallback className="bg-white/20 text-xl font-bold text-white">
                {initial}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-xs md:text-sm font-medium text-white/80">Xin chào,</p>
                <Badge className="bg-white/20 hover:bg-white/25 text-white text-[11px] font-semibold border-none backdrop-blur-xs gap-1">
                  <ShieldCheck className="h-3 w-3" />
                  Bệnh nhân LifeHealth
                </Badge>
              </div>
              <h1 className="text-xl font-extrabold tracking-tight md:text-2xl truncate mt-0.5">
                {profile?.fullname ?? profile?.username ?? "Bệnh nhân LifeHealth"}
              </h1>
              <p className="mt-1 max-w-xl text-xs md:text-sm text-white/85 line-clamp-1">
                Quản lý lịch khám, hồ sơ sức khỏe, trao đổi bác sĩ và trợ lý y tế AI.
              </p>
            </div>
          </div>

          <div className="hidden rounded-2xl bg-white/10 px-4.5 py-3 text-right md:block border border-white/15 backdrop-blur-xs">
            <p className="text-[11px] uppercase tracking-wider text-white/70 font-semibold">
              Tài khoản liên kết
            </p>
            <p className="text-sm font-bold text-white truncate max-w-xs">
              {profile?.email ?? "Chưa cập nhật email"}
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

