import React from "react";
import {
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

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { PatientPortalProvider } from "@/pages/patient/PatientPortalContext";
import { usePatientPortal } from "@/pages/patient/usePatientPortal";

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
  { label: "Cài đặt", to: "/patient/settings", icon: Settings },
];

const PatientNavigation: React.FC = () => {
  return (
    <>
      <Card className="hidden lg:flex lg:w-72 lg:shrink-0 lg:gap-2 lg:p-4">
        {navItems.map(({ label, to, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors",
                isActive
                  ? "bg-primary text-white"
                  : "text-slate-700 hover:bg-primary/10 hover:text-primary"
              )
            }
          >
            <Icon className="h-4 w-4" />
            <span>{label}</span>
          </NavLink>
        ))}
      </Card>

      <div className="mb-4 flex gap-2 overflow-x-auto pb-2 lg:hidden">
        {navItems.map(({ label, to, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                "flex min-w-fit items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold",
                isActive
                  ? "border-primary bg-primary text-white"
                  : "border-slate-200 bg-white text-slate-700"
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
  const { profile } = usePatientPortal();

  return (
    <section className="mt-16 md:mt-24">
      <div className="mb-5 rounded-2xl bg-primary p-5 text-white shadow-sm md:p-6">
        <p className="text-sm text-white/80">Xin chào,</p>
        <h1 className="text-2xl font-extrabold md:text-3xl">
          {profile.fullName}
        </h1>
        <p className="mt-1 text-sm text-white/85">
          Quản lý thông tin cá nhân, lịch khám và hồ sơ sức khỏe của bạn tại đây.
        </p>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
        <PatientNavigation />
        <div className="min-w-0 flex-1">
          <Outlet />
        </div>
      </div>
    </section>
  );
};

const PatientLayout: React.FC = () => {
  return (
    <PatientPortalProvider>
      <PatientPortalShell />
    </PatientPortalProvider>
  );
};

export default PatientLayout;

