import { Menu, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import {
  findMenuByPath,
  getWorkspaceMenu,
  groupMenuBySection,
} from "@/lib/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { useUiStore } from "@/store/useUiStore";

function SidebarNav({ mobile = false }: { mobile?: boolean }) {
  const user = useAuthStore((state) => state.currentUser);
  const currentRole = useAuthStore((state) => state.currentRole);
  const items = getWorkspaceMenu(currentRole, user?.permissions ?? []);
  const grouped = groupMenuBySection(items);
  const collapsed = useUiStore((state) => state.isSidebarCollapsed);

  return (
    <div
      className={cn(
        "flex h-full min-h-0 flex-col gap-6 overflow-hidden bg-slate-950 px-4 py-5 text-white",
        mobile ? "w-full" : collapsed ? "w-[92px]" : "w-[280px]"
      )}
    >
      <div className="flex items-center gap-3 px-2">
        <div className="flex size-12 items-center justify-center overflow-hidden rounded-2xl bg-white p-1.5 shadow-sm">
          <img
            src="/logo.jpg"
            alt="LifeHealth logo"
            className="size-full rounded-xl object-cover"
          />
        </div>
        {mobile || !collapsed ? (
          <div>
            <div className="font-display text-xl">LifeHealth</div>
            <div className="text-xs uppercase tracking-[0.22em] text-white/55">
              admin console
            </div>
          </div>
        ) : null}
      </div>

      <div className="scrollbar-soft min-h-0 flex-1 space-y-6 overflow-y-auto pr-1">
        {Object.entries(grouped).map(([section, sectionItems]) => (
          <div key={section} className="space-y-2">
            {mobile || !collapsed ? (
              <div className="px-3 text-[11px] uppercase tracking-[0.2em] text-white/40">
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
                      "flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium transition",
                      isActive
                        ? "bg-white text-slate-950"
                        : "text-white/72 hover:bg-white/10 hover:text-white"
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
  const currentUser = useAuthStore((state) => state.currentUser);
  const logout = useAuthStore((state) => state.logout);
  const collapsed = useUiStore((state) => state.isSidebarCollapsed);
  const toggleSidebar = useUiStore((state) => state.toggleSidebar);
  const activeMenu = findMenuByPath(location.pathname);

  if (!currentUser) return null;

  return (
    <div className="min-h-screen bg-grid">
      <div className="flex min-h-screen">
        <aside className="hidden h-screen shrink-0 border-r border-white/60 xl:sticky xl:top-0 xl:block">
          <SidebarNav />
        </aside>

        <div className="flex min-h-screen min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-40 border-b border-white/60 bg-white/70 backdrop-blur-xl">
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
                  <div className="text-xs uppercase tracking-[0.2em] text-slate-400">
                    {activeMenu?.section ?? "Workspace"}
                  </div>
                  <div className="text-sm font-semibold text-slate-900">
                    {activeMenu?.label ?? "LifeHealth Admin"}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Card className="hidden border-white/60 bg-white/70 px-4 py-3 md:flex md:flex-row md:items-center md:gap-3">
                  <Avatar className="size-11">
                    <AvatarImage src={currentUser.avatar} alt={currentUser.displayName} />
                    <AvatarFallback>
                      {currentUser.displayName.slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-slate-900">
                      {currentUser.displayName}
                    </div>
                    <div className="truncate text-xs text-slate-500">
                      {currentUser.title}
                    </div>
                  </div>
                </Card>

                <Button variant="outline" onClick={() => navigate("/login")}>
                  Switch role
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    logout();
                    navigate("/login");
                  }}
                >
                  Logout
                </Button>
              </div>
            </div>
          </header>

          <main className="flex-1 px-4 py-5 lg:px-6 lg:py-6">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
