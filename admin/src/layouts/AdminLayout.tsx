import { Command, Loader2, Menu, PanelLeftClose, PanelLeftOpen, Search, Shield, Stethoscope } from "lucide-react";
import { useEffect } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { CommandPaletteDialog } from "@/components/app/CommandPaletteDialog";
import { NotificationBell } from "@/components/app/NotificationBell";
import { NotificationRealtimeProvider } from "@/components/app/NotificationRealtimeProvider";
import { SocketProvider } from "@/components/app/SocketProvider";
import { ThemeToggle } from "@/components/app/ThemeToggle";
import { useLogout } from "@/hooks/useAuth";
import { useCurrentUser } from "@/hooks/useUsers";
import { useUserSettings } from "@/hooks/useSettings";
import { cn } from "@/lib/utils";
import {
  findMenuByPath,
  getWorkspaceMenu,
  groupMenuBySection,
} from "@/lib/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { useUiStore } from "@/store/useUiStore";

function getInitials(name: string) {
  if (!name) return "AD";
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase() || "AD";
}

function SidebarNav({ mobile = false }: { mobile?: boolean }) {
  const permissions = useAuthStore((state) => state.permissions);
  const currentRole = useAuthStore((state) => state.currentRole);
  const items = getWorkspaceMenu(currentRole, permissions);
  const grouped = groupMenuBySection(items);
  const collapsed = useUiStore((state) => state.isSidebarCollapsed);

  const isDoctor = currentRole === "doctor";

  return (
    <div
      className={cn(
        "dark-product-field flex h-full min-h-0 flex-col gap-6 overflow-hidden px-4 py-5 text-white transition-all duration-300",
        mobile ? "w-full" : collapsed ? "w-[88px]" : "w-[280px]"
      )}
    >
      <div className="flex items-center gap-3 px-2 border-b border-white/10 pb-4">
        <div className="flex size-11 items-center justify-center overflow-hidden rounded-2xl bg-white p-1 shadow-md shrink-0">
          <img
            src="/logo.jpg"
            alt="LifeHealth logo"
            className="size-full rounded-xl object-cover"
          />
        </div>
        {mobile || !collapsed ? (
          <div className="min-w-0 flex-1">
            <div className="font-display text-lg font-bold leading-tight tracking-tight flex items-center gap-1.5">
              <span>LifeHealth</span>
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <div className="mt-1 flex items-center gap-1.5">
              <Badge className="bg-white/15 text-emerald-200 border-white/20 text-[10px] px-2 py-0 font-bold">
                {isDoctor ? "Doctor Portal" : "Admin Console"}
              </Badge>
            </div>
          </div>
        ) : null}
      </div>

      <div className="scrollbar-soft min-h-0 flex-1 space-y-6 overflow-y-auto pr-1">
        {Object.entries(grouped).map(([section, sectionItems]) => (
          <div key={section} className="space-y-1.5">
            {mobile || !collapsed ? (
              <div className="mono-label px-3 text-[10px] font-bold text-emerald-300/60 uppercase tracking-wider">
                {section}
              </div>
            ) : null}
            <div className="space-y-1">
              {sectionItems.map(({ id, icon: Icon, label, path }) => (
                <NavLink
                  key={id}
                  to={path}
                  title={!mobile && collapsed ? label : undefined}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs sm:text-sm font-semibold transition-all duration-200",
                      isActive
                        ? "bg-white text-emerald-950 shadow-md font-bold"
                        : "text-white/75 hover:bg-white/10 hover:text-white"
                    )
                  }
                >
                  <Icon className="size-4 shrink-0" />
                  {mobile || !collapsed ? <span className="truncate">{label}</span> : null}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const setSession = useAuthStore((state) => state.setSession);
  const currentUser = useAuthStore((state) => state.currentUser);
  const currentRole = useAuthStore((state) => state.currentRole);
  const collapsed = useUiStore((state) => state.isSidebarCollapsed);
  const toggleSidebar = useUiStore((state) => state.toggleSidebar);
  const setTheme = useUiStore((state) => state.setTheme);
  const setCommandPaletteOpen = useUiStore(
    (state) => state.setCommandPaletteOpen
  );
  const activeMenu = findMenuByPath(location.pathname);

  const profileQuery = useCurrentUser();
  const settingsQuery = useUserSettings(Boolean(currentUser));
  const logoutMutation = useLogout();

  useEffect(() => {
    if (profileQuery.data?.data) {
      setSession(profileQuery.data.data);
    }
  }, [profileQuery.data, setSession]);

  useEffect(() => {
    const theme = settingsQuery.data?.data.theme;
    if (theme) setTheme(theme.toLowerCase() as "light" | "dark" | "system");
  }, [setTheme, settingsQuery.data?.data.theme]);

  if (profileQuery.isLoading && !currentUser) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white text-slate-500 dark:bg-slate-950 dark:text-slate-400">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    );
  }

  const displayUser = profileQuery.data?.data ?? currentUser;
  if (!displayUser) return null;

  const fullname = displayUser.fullname ?? displayUser.username ?? "Admin";
  const isDoctor = currentRole === "doctor";
  const isReportAssistant = location.pathname.startsWith("/admin/ai-report-assistant");

  return (
    <SocketProvider userId={displayUser.id}>
      <NotificationRealtimeProvider enabled>
        <div
          className={cn(
            "min-h-screen bg-slate-50 text-slate-900 transition-colors duration-200 dark:bg-slate-950 dark:text-slate-100",
            isReportAssistant && "h-[100dvh] overflow-hidden"
          )}
        >
          <CommandPaletteDialog />
          <div className={cn("flex min-h-screen", isReportAssistant && "h-[100dvh] overflow-hidden")}>
        <aside className="hidden h-screen shrink-0 border-r border-slate-200 transition-all duration-300 xl:sticky xl:top-0 xl:block dark:border-slate-800">
          <SidebarNav />
        </aside>

        <div className={cn("flex min-h-screen min-w-0 flex-1 flex-col", isReportAssistant && "h-[100dvh] min-h-0 overflow-hidden")}>
          <header
            className={cn(
              "sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur-md transition-colors duration-200 dark:border-slate-800 dark:bg-slate-950/90",
              isReportAssistant && "shrink-0"
            )}
          >
            {/* Top real-time ticker */}
            <div
              className={cn(
                "flex h-8 items-center justify-between gap-4 border-b border-slate-800 bg-slate-900 px-4 text-center text-xs text-white dark:bg-slate-950",
                isReportAssistant && "hidden",
              )}
            >
              <div className="flex shrink-0 items-center gap-2 text-[11px] font-semibold text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>LifeHealth Command Center v2.5</span>
              </div>
              <div className="hidden min-w-0 truncate text-[11px] text-slate-400 sm:block">
                Hệ thống đồng bộ dữ liệu y tế trực tuyến &amp; Quản trị bảo mật RBAC
              </div>
            </div>

            {/* Main Header Bar */}
            <div
              className={cn(
                "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-3 px-4 py-3 lg:px-6 xl:grid-cols-[auto_minmax(220px,1fr)_auto]",
                isReportAssistant && "py-2",
              )}
            >
              <div className="flex min-w-0 items-center gap-2.5">
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="icon" className="xl:hidden rounded-xl border-slate-200 dark:border-slate-800 dark:bg-slate-900">
                      <Menu className="size-4" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="p-0 border-r border-slate-800 w-[280px]">
                    <SidebarNav mobile />
                  </SheetContent>
                </Sheet>

                <Button
                  variant="outline"
                  size="icon"
                  className="hidden xl:inline-flex rounded-xl border-slate-200 dark:border-slate-800 dark:bg-slate-900 hover:border-primary/40"
                  onClick={toggleSidebar}
                  title={collapsed ? "Mở rộng menu" : "Thu gọn menu"}
                >
                  {collapsed ? (
                    <PanelLeftOpen className="size-4 text-slate-600 dark:text-slate-300" />
                  ) : (
                    <PanelLeftClose className="size-4 text-slate-600 dark:text-slate-300" />
                  )}
                </Button>

                <div className="min-w-0">
                  <div className="mono-label text-[10px] font-bold text-slate-400 dark:text-slate-400">
                    {activeMenu?.section ?? "Workspace"}
                  </div>
                  <div className="flex min-w-0 items-center gap-1.5 text-sm font-bold text-slate-900 dark:text-slate-100 sm:text-base">
                    {isDoctor ? <Stethoscope className="size-4 text-primary shrink-0" /> : <Shield className="size-4 text-primary shrink-0" />}
                    <span className="truncate">{activeMenu?.label ?? "LifeHealth Admin"}</span>
                  </div>
                </div>
              </div>

              {/* Quick Search Trigger Button */}
              <button
                onClick={() => setCommandPaletteOpen(true)}
                className="hidden min-w-0 items-center gap-3 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs text-slate-500 shadow-2xs transition-all hover:border-primary/40 hover:bg-white md:col-span-2 md:row-start-2 md:flex md:w-full dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:border-slate-700 dark:hover:bg-slate-800 xl:col-span-1 xl:row-start-auto xl:max-w-md xl:justify-self-center"
              >
                <Search className="size-3.5 text-slate-400" />
                <span className="min-w-0 flex-1 truncate text-left">
                  Tìm kiếm nhanh trang hoặc câu lệnh...
                </span>
                <kbd className="flex shrink-0 items-center gap-0.5 rounded-lg bg-white px-2 py-0.5 text-[10px] font-bold text-slate-700 shadow-2xs border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
                  <Command className="size-2.5" /> K
                </kbd>
              </button>

              <div className="flex shrink-0 items-center gap-1.5 sm:gap-2.5">
                <NotificationBell />
                <ThemeToggle />

                <Card
                  role="button"
                  tabIndex={0}
                  onClick={() => navigate("/account/settings")}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      navigate("/account/settings");
                    }
                  }}
                  className="hidden max-w-[220px] cursor-pointer rounded-2xl border-slate-200/80 px-3.5 py-1.5 shadow-none dark:border-slate-800 dark:bg-slate-900 xl:flex xl:flex-row xl:items-center xl:gap-3"
                >
                  <Avatar className="size-8.5 border border-primary/30">
                    <AvatarImage
                      src={displayUser.picture ?? undefined}
                      alt={fullname}
                      className="object-cover"
                    />
                    <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs dark:bg-slate-800 dark:text-emerald-400">
                      {getInitials(fullname)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <div className="truncate text-xs font-bold text-slate-900 dark:text-slate-100">
                      {fullname}
                    </div>
                    <div className="truncate text-[10px] text-slate-500 dark:text-slate-400">
                      {isDoctor ? "Bác sĩ chuyên khoa" : "Quản trị viên"}
                    </div>
                  </div>
                </Card>

                <Button
                  variant="outline"
                  size="sm"
                  className="hidden sm:inline-flex rounded-xl border-slate-200 text-xs font-semibold dark:border-slate-800 dark:bg-slate-900"
                  onClick={() => navigate("/login")}
                >
                  Đổi vai trò
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  disabled={logoutMutation.isPending}
                  onClick={() => logoutMutation.mutate()}
                  className="rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:text-rose-400 dark:hover:bg-rose-950/40"
                >
                  {logoutMutation.isPending ? "Đang đăng xuất..." : "Đăng xuất"}
                </Button>
              </div>
            </div>
          </header>

          <main
            className={cn(
              "flex-1 bg-slate-50/70 transition-colors duration-200 dark:bg-slate-950",
              isReportAssistant
                ? "flex flex-col min-h-0 overflow-hidden p-2 sm:p-3"
                : "px-4 py-6 lg:px-8 lg:py-8"
            )}
          >
            <Outlet />
          </main>
        </div>
          </div>
        </div>
      </NotificationRealtimeProvider>
    </SocketProvider>
  );
}
