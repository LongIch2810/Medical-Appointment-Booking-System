import { useState } from "react";
import { Loader2, ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useLogin } from "@/hooks/useAuth";

export function LoginPage() {
  const loginMutation = useLogin();
  const [usernameOrEmail, setUsernameOrEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!usernameOrEmail.trim() || !password) return;
    loginMutation.mutate({ usernameOrEmail: usernameOrEmail.trim(), password });
  };

  const isPending = loginMutation.isPending;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-between">
      <div className="flex h-9 items-center justify-between bg-slate-900 px-6 text-xs text-white">
        <div className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-slate-300 font-medium">LifeHealth Medical Operations Portal</span>
        </div>
        <span className="text-[11px] text-slate-400 font-mono">RBAC Security Guarded</span>
      </div>

      <main className="mx-auto grid min-h-[calc(100vh-72px)] w-full max-w-7xl gap-8 px-4 py-8 lg:grid-cols-[1.18fr_0.82fr] lg:px-8 items-center">
        <section className="flex flex-col justify-between gap-8">
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="flex size-14 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <img
                  src="/logo.jpg"
                  alt="LifeHealth logo"
                  className="size-full rounded-xl object-cover"
                />
              </div>
              <div>
                <div className="font-display text-2xl font-extrabold text-slate-900 dark:text-slate-100">
                  LifeHealth
                </div>
                <div className="mono-label mt-1 text-[11px] font-bold text-primary dark:text-emerald-400">
                  HEALTHCARE COMMAND CENTER
                </div>
              </div>
            </div>

            <div className="max-w-4xl">
              <Badge variant="info" className="text-xs font-bold px-3 py-1">Admin &amp; Doctor Workspace</Badge>
              <h1 className="mt-4 break-words font-display text-4xl sm:text-6xl font-extrabold leading-tight text-slate-900 dark:text-slate-100">
                Điều hành y tế thông minh, minh bạch &amp; an toàn.
              </h1>
              <p className="mt-4 max-w-2xl text-base sm:text-lg leading-relaxed text-slate-600 dark:text-slate-400">
                Hệ thống bảng điều khiển đa vai trò dành cho Bác sĩ và Nhà quản trị: Quản lý lịch hẹn, theo dõi hồ sơ bệnh án, báo cáo doanh thu AI và ma trận phân quyền RBAC.
              </p>
            </div>
          </div>

          <Card className="overflow-hidden rounded-3xl border-slate-200/80 bg-white shadow-2xs dark:border-slate-800 dark:bg-slate-900 p-0">
            <CardContent className="grid gap-0 p-0 md:grid-cols-[1.15fr_0.85fr]">
              <div className="navy-product-field p-6 text-white md:p-8">
                <div className="mono-label text-[10px] font-bold text-emerald-300 uppercase tracking-wider">
                  Hạ tầng vận hành lâm sàng
                </div>
                <div className="mt-6 space-y-3">
                  {[
                    ["Lịch hẹn & Tiếp nhận", "Giám sát luồng khám real-time", "Ổn định"],
                    ["Tư vấn trực tuyến", "Trao đổi bác sĩ & bệnh nhân", "Sẵn sàng"],
                    ["Phân quyền vai trò", "Ma trận bảo mật RBAC", "Bảo vệ"],
                  ].map(([label, value, status]) => (
                    <div
                      key={label}
                      className="rounded-2xl border border-white/10 bg-white/5 p-3.5 backdrop-blur-xs"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="text-xs sm:text-sm font-bold">{label}</div>
                          <div className="mt-0.5 text-xs text-white/60">
                            {value}
                          </div>
                        </div>
                        <span className="rounded-xl border border-white/20 bg-white/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-300">
                          {status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-slate-100 dark:bg-slate-950/60 p-3 flex items-center justify-center">
                <img
                  src="/banner.png"
                  alt="LifeHealth clinical workspace"
                  className="h-full min-h-[240px] w-full rounded-2xl object-cover shadow-inner"
                />
              </div>
            </CardContent>
          </Card>
        </section>

        <aside className="flex items-center">
          <Card className="w-full rounded-3xl border-slate-200/80 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900">
            <CardContent className="space-y-6 p-6 sm:p-8">
              <div>
                <p className="mono-label text-[10px] font-bold uppercase tracking-wider text-primary dark:text-emerald-400">
                  Xác thực hệ thống
                </p>
                <h2 className="mt-2 font-display text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100">
                  Đăng nhập quản trị
                </h2>
                <p className="mt-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  Đăng nhập bằng tài khoản Quản trị viên hoặc Bác sĩ để vào giao diện điều hành tương ứng.
                </p>
              </div>

              <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300" htmlFor="usernameOrEmail">
                    Tên đăng nhập hoặc email
                  </label>
                  <Input
                    id="usernameOrEmail"
                    autoComplete="username"
                    placeholder="admin hoặc doctor@lifehealth.vn"
                    value={usernameOrEmail}
                    onChange={(event) => setUsernameOrEmail(event.target.value)}
                    disabled={isPending}
                    required
                    className="h-11 rounded-xl"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300" htmlFor="password">
                    Mật khẩu
                  </label>
                  <Input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    disabled={isPending}
                    required
                    className="h-11 rounded-xl"
                  />
                </div>

                <Button type="submit" size="lg" className="w-full rounded-xl font-bold text-sm shadow-md" disabled={isPending}>
                  {isPending ? (
                    <>
                      <Loader2 className="size-4 animate-spin mr-2" /> Đang xác thực thông tin...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="size-4 mr-2" /> Đăng nhập hệ thống
                    </>
                  )}
                </Button>
              </form>

              <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-3.5 text-xs leading-relaxed text-slate-500 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-400">
                🔒 Phiên đăng nhập được bảo vệ bởi HttpOnly Cookie &amp; JWT Token với cơ chế tự động gia hạn an toàn.
              </div>
            </CardContent>
          </Card>
        </aside>
      </main>

      <footer className="py-3 text-center text-xs text-slate-400 border-t border-slate-200/60 dark:border-slate-800/60">
        © {new Date().getFullYear()} LifeHealth Medical System • Dự án nghiên cứu & học thuật phi thương mại.
      </footer>
    </div>
  );
}

