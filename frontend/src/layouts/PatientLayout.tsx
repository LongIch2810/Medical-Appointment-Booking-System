import React from "react";
import {
  AlertTriangle,
  CalendarClock,
  FileHeart,
  FileSearch,
  LayoutDashboard,
  MessageCircleMore,
  Settings,
  Sparkles,
  UserRound,
  UsersRound,
} from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useProfile } from "@/hooks/useProfile";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Dashboard", to: "/patient", icon: LayoutDashboard, end: true },
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
  { label: "Cài đặt", to: "/patient/settings", icon: Settings },
];

const PatientNavigation: React.FC = () => {
  return (
    <>
      <aside className="hidden lg:flex lg:w-72 lg:shrink-0 lg:flex-col lg:gap-1 lg:rounded-2xl lg:border lg:border-slate-200 lg:bg-white lg:p-3 lg:shadow-sm">
        <p className="px-3 pb-2 pt-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Khu vực bệnh nhân
        </p>
        {navItems.map(({ label, to, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                isActive
                  ? "bg-primary text-white shadow-sm"
                  : "text-slate-700 hover:bg-primary/10 hover:text-primary",
              )
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-lg transition-colors",
                    isActive
                      ? "bg-white/20 text-white"
                      : "bg-primary/10 text-primary group-hover:bg-primary/20",
                  )}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <span className="truncate">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </aside>

      <div className="mb-4 flex gap-2 overflow-x-auto pb-2 lg:hidden">
        {navItems.map(({ label, to, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                "flex min-w-fit items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-all",
                isActive
                  ? "border-primary bg-primary text-white shadow-sm"
                  : "border-slate-200 bg-white text-slate-700 hover:border-primary/40 hover:text-primary",
              )
            }
          >
            <Icon className="h-4 w-4" />
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

  return (
    <section className="mt-16 md:mt-24">
      <div className="mb-6 overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary to-primary/80 p-6 text-white shadow-md md:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="h-14 w-14 border-2 border-white/40 md:h-16 md:w-16">
              <AvatarImage
                src={profile?.picture ?? ""}
                alt={profile?.fullname ?? ""}
              />
              <AvatarFallback className="bg-white/20 text-lg font-bold text-white">
                {initial}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium text-white/80">Xin chào,</p>
              <h1 className="text-2xl font-extrabold tracking-tight md:text-3xl">
                {profile?.fullname ?? "Bạn"}
              </h1>
              <p className="mt-1 max-w-xl text-sm text-white/85">
                Quản lý thông tin cá nhân, lịch khám và hồ sơ sức khỏe của bạn
                tại đây.
              </p>
            </div>
          </div>
          <div className="hidden rounded-2xl bg-white/10 px-4 py-3 text-right md:block">
            <p className="text-xs uppercase tracking-wider text-white/70">
              Tài khoản
            </p>
            <p className="text-sm font-semibold">
              {profile?.email ?? "Chưa có email"}
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
        <PatientNavigation />
        <div className="min-w-0 flex-1">
          <Outlet />
        </div>
      </div>
    </section>
  );
};

const PatientLayout: React.FC = () => {
  return <PatientPortalShell />;
};

export default PatientLayout;
