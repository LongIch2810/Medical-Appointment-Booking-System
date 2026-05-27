import { Loader2, Menu, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useEffect } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useLogout } from "@/hooks/useAuth";
import { useCurrentUser } from "@/hooks/useUsers";
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

  return (
    <div
      className={cn(
        "dark-product-field flex h-full min-h-0 flex-col gap-8 overflow-hidden px-4 py-6 text-white",
        mobile ? "w-full" : collapsed ? "w-[92px]" : "w-[280px]"
      )}
    >
      <div className="flex items-center gap-3 px-2">
        <div className="flex size-12 items-center justify-center overflow-hidden rounded-lg bg-white p-1.5">
          <img
            src="/logo.jpg"
            alt="LifeHealth logo"
            className="size-full rounded-sm object-cover"
          />
        </div>
        {mobile || !collapsed ? (
          <div>
            <div className="font-display text-xl font-medium leading-none">
              LifeHealth
            </div>
            <div className="mono-label mt-2 text-[10px] text-white/[0.55]">
              admin console
            </div>
          </div>
        ) : null}
      </div>

      <div className="scrollbar-soft min-h-0 flex-1 space-y-6 overflow-y-auto pr-1">
        {Object.entries(grouped).map(([section, sectionItems]) => (
          <div key={section} className="space-y-2">
            {mobile || !collapsed ? (
              <div className="mono-label px-3 text-[10px] text-white/40">
                {section}
              </div>
            ) : null}
            <div className="space-y-1">
              {sectionItems.map(({ id, icon: Icon, label, path }) => (
                <NavLink
                  key={id}
                  to={path}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition",
                      isActive
                        ? "bg-white text-[#003c33]"
                        : "text-white/70 hover:bg-white/10 hover:text-white"
                    )
                  }
                >
                  <Icon className="size-4 shrink-0" />
                  {mobile || !collapsed ? <span>{label}</span> : null}
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
  const collapsed = useUiStore((state) => state.isSidebarCollapsed);
  const toggleSidebar = useUiStore((state) => state.toggleSidebar);
  const activeMenu = findMenuByPath(location.pathname);

  const profileQuery = useCurrentUser();
  const logoutMutation = useLogout();

  useEffect(() => {
    if (profileQuery.data?.data) {
      setSession(profileQuery.data.data);
    }
  }, [profileQuery.data, setSession]);

  if (profileQuery.isLoading && !currentUser) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white text-[#75758a]">
        <Loader2 className="size-5 animate-spin text-primary" />
      </div>
    );
  }

  const displayUser = profileQuery.data?.data ?? currentUser;
  if (!displayUser) return null;

  const fullname = displayUser.fullname ?? displayUser.username ?? "Admin";
  const titleHint = displayUser.email ?? displayUser.username ?? "Admin user";

  return (
    <div className="min-h-screen bg-white">
      <div className="flex min-h-screen">
        <aside className="hidden h-screen shrink-0 border-r border-[#d9d9dd] xl:sticky xl:top-0 xl:block">
          <SidebarNav />
        </aside>

        <div className="flex min-h-screen min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-40 border-b border-[#d9d9dd] bg-white">
            <div className="flex h-9 items-center justify-center bg-black px-4 text-center text-xs text-white">
              <span className="hidden sm:inline">
                LifeHealth command center
              </span>
              <span className="mx-2 hidden text-white/[0.35] sm:inline">/</span>
              <span className="text-white/[0.72]">
                Real-time data via secure backend APIs
              </span>
            </div>
            <div className="flex items-center justify-between gap-3 px-4 py-3 lg:px-6">
              <div className="flex items-center gap-2">
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="icon" className="xl:hidden">
                      <Menu className="size-4" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="p-0">
                    <SidebarNav mobile />
                  </SheetContent>
                </Sheet>

                <Button
                  variant="outline"
                  size="icon"
                  className="hidden xl:inline-flex"
                  onClick={toggleSidebar}
                >
                  {collapsed ? (
                    <PanelLeftOpen className="size-4" />
                  ) : (
                    <PanelLeftClose className="size-4" />
                  )}
                </Button>

                <div>
                  <div className="mono-label text-[10px] text-[#75758a]">
                    {activeMenu?.section ?? "Workspace"}
                  </div>
                  <div className="text-sm font-medium text-[#212121]">
                    {activeMenu?.label ?? "LifeHealth Admin"}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Card className="hidden rounded-lg border-[#d9d9dd] px-4 py-3 md:flex md:flex-row md:items-center md:gap-3">
                  <Avatar className="size-11">
                    <AvatarImage
                      src={displayUser.picture ?? undefined}
                      alt={fullname}
                    />
                    <AvatarFallback>{getInitials(fullname)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-[#212121]">
                      {fullname}
                    </div>
                    <div className="truncate text-xs text-[#75758a]">
                      {titleHint}
                    </div>
                  </div>
                </Card>

                <Button
                  variant="outline"
                  className="hidden sm:inline-flex"
                  onClick={() => navigate("/login")}
                >
                  Switch role
                </Button>
                <Button
                  variant="ghost"
                  disabled={logoutMutation.isPending}
                  onClick={() => logoutMutation.mutate()}
                >
                  {logoutMutation.isPending ? "Đang đăng xuất..." : "Logout"}
                </Button>
              </div>
            </div>
          </header>

          <main className="flex-1 bg-white px-4 py-8 lg:px-8 lg:py-10">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
