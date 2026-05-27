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
    <div className="min-h-screen bg-white">
      <div className="flex h-9 items-center justify-center bg-black px-4 text-center text-xs text-white">
        <span className="text-white/[0.72]">
          Medical operations console
        </span>
      </div>

      <main className="mx-auto grid min-h-[calc(100vh-36px)] w-full max-w-7xl gap-8 px-4 py-10 lg:grid-cols-[1.18fr_0.82fr] lg:px-8">
        <section className="flex flex-col justify-between gap-10">
          <div className="space-y-8">
            <div className="flex items-center gap-4">
              <div className="flex size-14 items-center justify-center overflow-hidden rounded-lg border border-[#d9d9dd] bg-white p-1.5">
                <img
                  src="/logo.jpg"
                  alt="LifeHealth logo"
                  className="size-full rounded-sm object-cover"
                />
              </div>
              <div>
                <div className="font-display text-2xl font-medium leading-none text-[#212121]">
                  LifeHealth
                </div>
                <div className="mono-label mt-2 text-[10px] text-[#75758a]">
                  healthcare admin
                </div>
              </div>
            </div>

            <div className="max-w-4xl">
              <Badge variant="info">Admin workspace</Badge>
              <h1 className="mt-5 break-words font-display text-5xl font-medium leading-none text-[#212121] md:text-7xl">
                Clinical operations without visual noise.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-[#75758a]">
                A role-aware console for doctors and administrators across
                appointment, patient, permission, message, and content workflows.
              </p>
            </div>
          </div>

          <Card className="overflow-hidden rounded-[22px] border-[#d9d9dd] p-0">
            <CardContent className="grid gap-0 p-0 md:grid-cols-[1.15fr_0.85fr]">
              <div className="navy-product-field p-6 text-white md:p-8">
                <div className="mono-label text-[10px] text-white/50">
                  agent console
                </div>
                <div className="mt-8 space-y-4">
                  {[
                    ["Appointments", "Live operational dashboard", "stable"],
                    ["Messages", "Patient triage workspace", "review"],
                    ["Permissions", "Role-based access control", "guarded"],
                  ].map(([label, value, status]) => (
                    <div
                      key={label}
                      className="rounded-lg border border-white/[0.15] bg-white/[0.08] p-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="text-sm font-medium">{label}</div>
                          <div className="mt-1 text-sm text-white/[0.55]">
                            {value}
                          </div>
                        </div>
                        <span className="rounded-full border border-white/[0.2] px-3 py-1 text-[11px] text-white/[0.65]">
                          {status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-[#eeece7] p-3">
                <img
                  src="/banner.png"
                  alt="LifeHealth clinical workspace"
                  className="h-full min-h-[260px] w-full rounded-[18px] object-cover"
                />
              </div>
            </CardContent>
          </Card>
        </section>

        <aside className="flex items-center">
          <Card className="w-full rounded-[22px] border-[#d9d9dd]">
            <CardContent className="space-y-6 p-6 md:p-8">
              <div>
                <p className="mono-label text-[10px] text-[#75758a]">
                  sign in
                </p>
                <h2 className="mt-3 font-display text-3xl font-medium leading-tight text-[#212121]">
                  Đăng nhập vào bảng điều khiển.
                </h2>
                <p className="mt-3 text-sm leading-6 text-[#75758a]">
                  Đăng nhập bằng tài khoản admin hoặc bác sĩ. Hệ thống sẽ tự
                  điều hướng tới workspace phù hợp với phân quyền.
                </p>
              </div>

              <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#212121]" htmlFor="usernameOrEmail">
                    Tên đăng nhập hoặc email
                  </label>
                  <Input
                    id="usernameOrEmail"
                    autoComplete="username"
                    placeholder="vd: admin hoặc admin@medihub.vn"
                    value={usernameOrEmail}
                    onChange={(event) => setUsernameOrEmail(event.target.value)}
                    disabled={isPending}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#212121]" htmlFor="password">
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
                  />
                </div>

                <Button type="submit" className="w-full" disabled={isPending}>
                  {isPending ? (
                    <>
                      <Loader2 className="size-4 animate-spin" /> Đang đăng nhập
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="size-4" /> Đăng nhập
                    </>
                  )}
                </Button>
              </form>

              <div className="rounded-lg border border-[#d9d9dd] bg-[#f7f6f2] p-4 text-sm leading-6 text-[#75758a]">
                Phiên đăng nhập sử dụng cookie httpOnly do backend cấp. Token
                refresh tự động khi hết hạn.
              </div>
            </CardContent>
          </Card>
        </aside>
      </main>
    </div>
  );
}
