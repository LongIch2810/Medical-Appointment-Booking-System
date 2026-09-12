import React, { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "../ui/button";
import { Link, NavLink } from "react-router-dom";
import { prefetchPatientRoute } from "@/utils/routePrefetch";
import {
  Menu,
  Stethoscope,
  Newspaper,
  PhoneCall,
  Bot,
  LayoutDashboard,
  Calendar,
  Users,
  Sparkles,
  ClipboardList,
  Settings,
  LogOut,
  User as UserIcon,
  FileSearch,
  MessageSquare,
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "@/components/common/LanguageSwitcher";
import ThemeToggle from "@/components/common/ThemeToggle";
import type { User } from "@/types/interface/user.interface";
import { useLogout } from "@/hooks/useLogout";
import { cn } from "@/lib/utils";
import NotificationBell from "@/components/notification/NotificationBell";

const HEADER_HEIGHT_MOBILE = 72;
const HEADER_HEIGHT_DESKTOP = 112;
const DESKTOP_BREAKPOINT = 1024;

type HeaderProps = {
  userInfo: User | null;
};

const Header: React.FC<HeaderProps> = ({ userInfo }) => {
  const { t } = useTranslation();
  const { mutate, isPending } = useLogout();
  const handleLogout = () => {
    mutate();
  };

  const headerItems = [
    {
      name: t("nav.doctors"),
      to: "/doctors",
      icon: Stethoscope,
    },
    {
      name: t("nav.news"),
      to: "/news",
      icon: Newspaper,
    },
    {
      name: t("nav.contact"),
      to: "/contact",
      icon: PhoneCall,
    },
    {
      name: t("nav.medAi"),
      to: "/chatbot",
      icon: Bot,
      badge: "AI",
    },
  ];

  const headerSubItems = [
    {
      name: t("nav.dashboard"),
      to: "/patient",
      icon: LayoutDashboard,
    },
    {
      name: t("nav.profile"),
      to: "/patient/profile",
      icon: UserIcon,
    },
    {
      name: t("nav.appointments"),
      to: "/patient/appointments",
      icon: Calendar,
    },
    {
      name: t("nav.relatives"),
      to: "/patient/relatives",
      icon: Users,
    },
    {
      name: t("nav.messages"),
      to: "/patient/messages",
      icon: MessageSquare,
    },
    {
      name: t("nav.aiCoachHealth"),
      to: "/patient/ai-coach-health",
      icon: Sparkles,
      badge: t("common.new"),
    },
    {
      name: t("nav.healthRecords"),
      to: "/patient/health-records",
      icon: ClipboardList,
    },
    {
      name: t("nav.visitResults"),
      to: "/patient/visit-results",
      icon: FileSearch,
    },
    {
      name: t("nav.settings"),
      to: "/patient/settings",
      icon: Settings,
    },
  ];

  const [hidden, setHidden] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const isMenuOpenRef = useRef(false);
  isMenuOpenRef.current = isMobileMenuOpen || isUserMenuOpen;
  const headerRef = useRef<HTMLElement | null>(null);
  const lastScrollY = useRef(0);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (hidden && headerRef.current?.contains(document.activeElement)) {
      (document.activeElement as HTMLElement | null)?.blur();
    }
  }, [hidden]);

  useEffect(() => {
    const onScroll = () => {
      if (isMenuOpenRef.current) {
        setHidden(false);
        return;
      }
      const headerHeight =
        window.innerWidth >= DESKTOP_BREAKPOINT
          ? HEADER_HEIGHT_DESKTOP
          : HEADER_HEIGHT_MOBILE;
      const currentY = window.scrollY;
      if (currentY > lastScrollY.current && currentY > headerHeight) {
        setHidden(true);
      } else {
        setHidden(false);
      }
      lastScrollY.current = currentY;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.header
      ref={headerRef}
      className="fixed top-0 flex h-[72px] lg:h-[112px] items-center justify-between px-4 sm:px-6 py-4 bg-white/95 dark:bg-[#0B1220]/95 backdrop-blur-md shadow-xs border-b border-slate-100 dark:border-[#293548] w-full z-[40]"
      animate={{ y: hidden ? "-100%" : 0 }}
      transition={{ duration: prefersReducedMotion ? 0 : 0.25, ease: "easeInOut" }}
      inert={hidden ? true : undefined}
    >
      <div className="flex items-center gap-x-3 sm:gap-x-5">
        {/* Mobile Hamburger Drawer */}
        <div className="md:hidden">
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer text-slate-700 dark:text-slate-200"
                aria-label="Mở menu điều hướng"
              >
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="left"
              className="w-[85vw] max-w-[340px] p-0 flex flex-col justify-between bg-white dark:bg-[#111827] border-r border-slate-200 dark:border-[#293548] shadow-2xl h-full"
            >
              {/* Top Drawer Header & Brand */}
              <div className="border-b border-slate-100 dark:border-[#293548] p-5 pb-4">
                <Link
                  to="/"
                  className="flex items-center gap-3 cursor-pointer"
                  onClick={() => setIsMobileMenuOpen(false)}
                  onMouseEnter={() => prefetchPatientRoute("/")}
                >
                  <img
                    src="/logo.jpg"
                    alt="LifeHealth logo"
                    className="w-10 h-10 rounded-xl object-cover shadow-xs border border-primary/20"
                  />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-lg font-bold text-primary tracking-tight">LifeHealth</span>
                      <span className="rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary">
                        CARE
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 font-medium">{t("header.tagline")}</p>
                  </div>
                </Link>

                {/* Mobile Language Switcher Pills */}
                <div className="mt-3">
                  <LanguageSwitcher variant="pills" />
                </div>

                {/* Mobile Theme Toggle Pills */}
                <div className="mt-2">
                  <ThemeToggle variant="pills" />
                </div>

                {/* User Identity Banner (if logged in) */}
                {userInfo ? (
                  <div className="mt-4 flex items-center justify-between rounded-2xl bg-slate-50 dark:bg-[#172033] p-3 border border-slate-200/70 dark:border-[#293548]">
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-sm font-bold text-primary">
                        {(userInfo.username || "U").charAt(0).toUpperCase()}
                      </div>
                      <div className="truncate">
                        <p className="truncate text-xs font-bold text-slate-900 dark:text-[#F1F5F9]">{userInfo.username}</p>
                        <p className="truncate text-[11px] text-slate-500 dark:text-[#94A3B8]">{userInfo.email || t("header.patient")}</p>
                      </div>
                    </div>
                    <NavLink
                      to="/patient/profile"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="shrink-0 rounded-lg bg-white dark:bg-[#1E293B] px-2.5 py-1 text-[11px] font-semibold text-primary shadow-xs border border-slate-200/80 dark:border-[#293548] hover:bg-primary hover:text-primary-foreground transition-colors"
                    >
                      {t("header.profileBtn")}
                    </NavLink>
                  </div>
                ) : (
                  <div className="mt-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 dark:from-emerald-500/15 dark:to-teal-500/15 p-3.5 border border-primary/15 text-center">
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">{t("header.bannerText")}</p>
                    <div className="mt-2.5 flex gap-2">
                      <Button
                        asChild
                        size="sm"
                        className="flex-1 rounded-xl !bg-primary hover:!bg-primary/90 !text-primary-foreground font-bold text-xs shadow-xs"
                      >
                        <NavLink to="/sign-in" onClick={() => setIsMobileMenuOpen(false)}>
                          {t("common.signIn")}
                        </NavLink>
                      </Button>
                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="flex-1 rounded-xl text-xs font-semibold border-slate-200 dark:border-[#293548] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#1E293B]"
                      >
                        <NavLink to="/sign-up" onClick={() => setIsMobileMenuOpen(false)}>
                          {t("common.signUp")}
                        </NavLink>
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Middle Navigation Section (Scrollable) */}
              <div className="flex-1 overflow-y-auto px-3.5 py-4 space-y-5">
                {/* Main Discovery Items */}
                <div className="space-y-1">
                  <p className="px-2 pb-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    {t("header.exploreServices")}
                  </p>
                  {headerItems.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={() => setIsMobileMenuOpen(false)}
                      onMouseEnter={() => prefetchPatientRoute(item.to)}
                      onTouchStart={() => prefetchPatientRoute(item.to)}
                      className={({ isActive }) =>
                        cn(
                          "group flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                          isActive
                            ? "bg-primary text-primary-foreground font-bold shadow-xs"
                            : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1E293B] hover:text-primary",
                        )
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <div className="flex items-center gap-3">
                            <span
                              className={cn(
                                "flex h-8 w-8 items-center justify-center rounded-lg transition-colors",
                                isActive
                                  ? "bg-white/20 text-white"
                                  : "bg-slate-100 dark:bg-[#1E293B] text-slate-600 dark:text-slate-300 group-hover:bg-primary/10 group-hover:text-primary",
                              )}
                            >
                              <item.icon className="h-4 w-4" />
                            </span>
                            <span>{item.name}</span>
                          </div>
                          {item.badge && (
                            <span
                              className={cn(
                                "rounded-full px-2 py-0.5 text-[10px] font-bold",
                                isActive
                                  ? "bg-white text-primary"
                                  : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border dark:border-emerald-800/60",
                              )}
                            >
                              {item.badge}
                            </span>
                          )}
                        </>
                      )}
                    </NavLink>
                  ))}
                </div>

                {/* Patient Portal Items (If logged in) */}
                {userInfo && (
                  <div className="space-y-1 pt-2 border-t border-slate-100 dark:border-[#293548]">
                    <p className="px-2 pb-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      {t("header.patientArea")}
                    </p>
                    {headerSubItems.map((item) => (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        onClick={() => setIsMobileMenuOpen(false)}
                        onMouseEnter={() => prefetchPatientRoute(item.to)}
                        onTouchStart={() => prefetchPatientRoute(item.to)}
                        className={({ isActive }) =>
                          cn(
                            "group flex items-center justify-between rounded-xl px-3 py-2 text-xs sm:text-sm font-medium transition-all",
                            isActive
                              ? "bg-primary text-primary-foreground font-bold shadow-xs"
                              : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1E293B] hover:text-primary",
                          )
                        }
                      >
                        {({ isActive }) => (
                          <>
                            <div className="flex items-center gap-2.5">
                              <span
                                className={cn(
                                  "flex h-7 w-7 items-center justify-center rounded-lg transition-colors",
                                  isActive
                                    ? "bg-white/20 text-white"
                                    : "bg-slate-100 dark:bg-[#1E293B] text-slate-500 dark:text-slate-400 group-hover:bg-primary/10 group-hover:text-primary",
                                )}
                              >
                                <item.icon className="h-3.5 w-3.5" />
                              </span>
                              <span>{item.name}</span>
                            </div>
                            {item.badge && (
                              <span
                                className={cn(
                                  "rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                                  isActive
                                    ? "bg-white text-primary"
                                    : "bg-violet-100 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300 dark:border dark:border-violet-800/60",
                                )}
                              >
                                {item.badge}
                              </span>
                            )}
                          </>
                        )}
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>

              {/* Bottom Drawer Footer */}
              <div className="border-t border-slate-100 dark:border-[#293548] bg-slate-50/70 dark:bg-[#0B1220]/90 p-4 space-y-3">
                {userInfo ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      handleLogout();
                    }}
                    disabled={isPending}
                    className="w-full justify-center gap-2 rounded-xl border-rose-200 dark:border-rose-900/50 bg-white dark:bg-[#172033] text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 font-semibold text-xs shadow-xs cursor-pointer"
                  >
                    <LogOut className="h-4 w-4" />
                    {isPending ? t("common.loggingOut") : t("common.logout")}
                  </Button>
                ) : (
                  <div className="text-center text-[11px] text-slate-500">
                    {t("header.hotline")}:{" "}
                    <a href="tel:1900123456" className="font-bold text-primary hover:underline">
                      1900 123 456
                    </a>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Logo and Brand Title */}
        <Link
          to="/"
          onMouseEnter={() => prefetchPatientRoute("/")}
          className="flex items-center gap-x-2 sm:gap-x-3 lg:text-2xl text-xl font-bold text-primary cursor-pointer"
        >
          <img
            src="/logo.jpg"
            alt="LifeHealth Logo"
            className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl object-cover shadow-xs border border-primary/10"
          />
          <span className="hidden sm:block">LifeHealth</span>
        </Link>
      </div>

      {userInfo && (
        <div className="ml-auto md:hidden flex items-center gap-2">
          <NotificationBell />
        </div>
      )}

      {/* Desktop Navigation Links */}
      <div className="hidden md:flex items-center space-x-2 lg:space-x-3">
        {headerItems.map((item, index) => (
          <NavLink
            key={index}
            to={item.to}
            onMouseEnter={() => prefetchPatientRoute(item.to)}
            onFocus={() => prefetchPatientRoute(item.to)}
            className={({ isActive }) =>
              cn(
                "relative inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all duration-200",
                isActive
                  ? "text-primary bg-primary/10 shadow-2xs font-bold"
                  : "text-slate-600 dark:text-slate-300 hover:text-primary dark:hover:text-primary hover:bg-slate-50 dark:hover:bg-slate-800/80"
              )
            }
          >
            <item.icon className="h-4 w-4" />
            <span>{item.name}</span>
            {item.badge && (
              <span className="rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-extrabold px-1.5 py-0.2">
                {item.badge}
              </span>
            )}
          </NavLink>
        ))}

        {/* Desktop Language Switcher */}
        <LanguageSwitcher variant="dropdown" />

        {/* Desktop Theme Switcher */}
        <ThemeToggle variant="dropdown" />

        {userInfo && <NotificationBell />}
        {!userInfo ? (
          <div className="flex items-center gap-2 pl-2">
            <NavLink
              to="/sign-in"
              className="inline-flex items-center justify-center h-9.5 px-4 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-200 hover:text-primary dark:hover:text-primary hover:bg-slate-50 dark:hover:bg-[#1E293B] border border-slate-200 dark:border-[#293548] transition-all"
            >
              {t("common.signIn")}
            </NavLink>
            <NavLink
              to="/sign-up"
              className="inline-flex items-center justify-center h-9.5 px-4 rounded-xl text-sm font-bold !text-primary-foreground bg-primary hover:bg-primary/90 shadow-xs hover:shadow-md transition-all"
            >
              {t("common.signUp")}
            </NavLink>
          </div>
        ) : (
          <DropdownMenu open={isUserMenuOpen} onOpenChange={setIsUserMenuOpen}>
            <DropdownMenuTrigger asChild className="cursor-pointer">
              <Button variant="outline" className="flex items-center gap-2.5 rounded-2xl h-10 px-3 border-slate-200/90 dark:border-[#293548] hover:border-primary/40 bg-white dark:bg-[#172033] dark:text-slate-100">
                <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-primary/10 text-xs font-bold text-primary">
                  {(userInfo.fullname || userInfo.username || "U").charAt(0).toUpperCase()}
                </div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 max-w-[120px] truncate">
                  {userInfo.fullname || userInfo.username}
                </span>
                <span className="text-slate-400 text-xs">▼</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 rounded-2xl p-1.5 shadow-xl border-slate-200 dark:border-[#293548] bg-white dark:bg-[#172033]" align="end">
              <DropdownMenuLabel className="px-3 py-2">
                <p className="text-xs text-slate-400 font-normal">{t("header.greeting")}</p>
                <p className="font-bold text-slate-800 dark:text-[#F1F5F9] truncate">{userInfo.fullname || userInfo.username}</p>
                <p className="text-[11px] text-slate-500 dark:text-[#94A3B8] truncate font-normal">{userInfo.email}</p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {headerSubItems.map((item, index) => (
                <DropdownMenuItem
                  key={index}
                  asChild
                  className="cursor-pointer rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1E293B] hover:text-primary dark:hover:text-primary transition-colors flex items-center justify-between"
                >
                  <Link
                    to={item.to}
                    onMouseEnter={() => prefetchPatientRoute(item.to)}
                    onFocus={() => prefetchPatientRoute(item.to)}
                    className="flex items-center justify-between w-full"
                  >
                    <div className="flex items-center gap-2">
                      <item.icon className="h-3.5 w-3.5 text-slate-400" />
                      <span>{item.name}</span>
                    </div>
                    {item.badge && (
                      <span className="rounded-full bg-violet-100 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300 dark:border dark:border-violet-800/60 text-[9px] font-bold px-1.5 py-0.2">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="cursor-pointer rounded-xl px-3 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 hover:text-rose-700 dark:hover:text-rose-300 focus:text-rose-700 transition-colors"
                onClick={handleLogout}
              >
                <LogOut className="h-3.5 w-3.5 mr-2" />
                {isPending ? t("common.processing") : t("common.logout")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </motion.header>
  );
};

export default Header;
