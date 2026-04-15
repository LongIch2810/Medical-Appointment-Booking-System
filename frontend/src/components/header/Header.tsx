import React from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "../ui/button";
import { NavLink, useNavigate } from "react-router-dom";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import type { User } from "@/types/interface/user.interface";
import { useLogout } from "@/hooks/useLogout";

const headerItems = [
  {
    name: "Bác sĩ",
    to: "/doctors",
  },
  {
    name: "Tin tức",
    to: "/news",
  },
  {
    name: "Liên hệ",
    to: "/contact",
  },
  {
    name: "Trợ lý AI",
    to: "/chatbot",
  },
];

const headerSubItems = [
  {
    name: "Dashboard",
    to: "/patient",
  },
  {
    name: "Thông tin cá nhân",
    to: "/patient/profile",
  },
  {
    name: "Lịch khám",
    to: "/patient/appointments",
  },
  {
    name: "Người thân",
    to: "/patient/relatives",
  },
  {
    name: "Tư vấn trực tuyến",
    to: "/patient/messages",
  },
  {
    name: "AI Coach Health",
    to: "/patient/ai-coach-health",
  },
  {
    name: "Hồ sơ sức khỏe",
    to: "/patient/health-records",
  },
  {
    name: "Kết quả khám",
    to: "/patient/visit-results",
  },
  {
    name: "Cài đặt",
    to: "/patient/settings",
  },
];

type HeaderProps = {
  userInfo: User | null;
};

const Header: React.FC<HeaderProps> = ({ userInfo }) => {
  const navigate = useNavigate();
  const { mutate, isPending } = useLogout();
  const handleLogout = () => {
    mutate();
  };

  return (
    <header className="fixed flex items-center justify-between px-6 py-4 bg-white shadow w-full z-[10]">
      <div className="flex items-center gap-x-5">
        <div className="md:hidden">
          <Sheet>
            <SheetTrigger className="cursor-pointer">
              <Menu className="w-6 h-6" />
            </SheetTrigger>
            <SheetContent side="left">
              {headerItems.map((item, index) => (
                <NavLink
                  key={index}
                  to={item.to}
                  className={({ isActive }) =>
                    `p-2 rounded-lg ${
                      isActive
                        ? "text-primary font-semibold bg-secondary"
                        : "text-gray-700 hover:text-primary hover:bg-secondary"
                    }`
                  }
                >
                  {item.name}
                </NavLink>
              ))}
            </SheetContent>
          </Sheet>
        </div>

        <div
          className="flex items-center gap-x-1 lg:gap-x-3 lg:text-2xl text-xl font-bold text-primary cursor-pointer"
          onClick={() => navigate("/")}
        >
          <img
            src="../../../public/logo.jpg"
            alt="logo"
            className="w-10 h-10 lg:w-20 lg:h-20 rounded-lg"
          />
          <span className="hidden sm:block">LifeHealth</span>
        </div>
      </div>

      <div className="hidden md:flex items-center space-x-6">
        {headerItems.map((item, index) => (
          <NavLink
            key={index}
            to={item.to}
            className={({ isActive }) =>
              `p-2 rounded-lg ${
                isActive
                  ? "text-primary font-semibold bg-secondary"
                  : "text-gray-700 hover:text-primary hover:bg-secondary"
              }`
            }
          >
            {item.name}
          </NavLink>
        ))}

        {!userInfo ? (
          <NavLink
            to="/sign-in"
            className={({ isActive }) =>
              `p-2 rounded-lg ${
                isActive
                  ? "text-primary font-semibold bg-secondary"
                  : "text-gray-700 hover:text-primary hover:bg-secondary"
              }`
            }
          >
            Đăng nhập
          </NavLink>
        ) : (
          <DropdownMenu>
            <DropdownMenuTrigger asChild className="cursor-pointer">
              <Button variant="ghost" className="flex items-center gap-2">
                Tài khoản ▼
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              <DropdownMenuLabel>
                Chào bạn, <span className="font-bold">{userInfo.username}!</span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {headerSubItems.map((item, index) => (
                <DropdownMenuItem
                  key={index}
                  className="cursor-pointer"
                  onClick={() => navigate(item.to)}
                >
                  {item.name}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="cursor-pointer"
                onClick={handleLogout}
              >
                {isPending ? "Đang xử lý..." : "Đăng xuất"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <div className="md:hidden">
        {!userInfo ? (
          <NavLink
            to="/sign-in"
            className={({ isActive }) =>
              `p-2 rounded-lg ${
                isActive
                  ? "text-primary font-semibold bg-secondary"
                  : "text-gray-700 hover:text-primary hover:bg-secondary"
              }`
            }
          >
            Đăng nhập
          </NavLink>
        ) : (
          <DropdownMenu>
            <DropdownMenuTrigger asChild className="cursor-pointer">
              <Button variant="ghost" className="flex items-center gap-2">
                Tài khoản ▼
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              <DropdownMenuLabel>
                Chào bạn, <span className="font-bold">{userInfo.username}!</span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {headerSubItems.map((item, index) => (
                <DropdownMenuItem
                  key={index}
                  className="cursor-pointer"
                  onClick={() => navigate(item.to)}
                >
                  {item.name}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="cursor-pointer"
                onClick={handleLogout}
              >
                {isPending ? "Đang xử lý..." : "Đăng xuất"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  );
};

export default Header;

