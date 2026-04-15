import { ShieldCheck, Stethoscope } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { Card, CardContent } from "@/components/ui/card";
import { mockProfiles } from "@/mock/profiles";
import { getFirstAccessiblePath } from "@/lib/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import type { AppRole } from "@/types/app";

export function LoginPage() {
  const navigate = useNavigate();
  const loginAs = useAuthStore((state) => state.loginAs);

  const handleLogin = (role: AppRole) => {
    loginAs(role);
    navigate(getFirstAccessiblePath(mockProfiles[role].permissions));
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="grid w-full max-w-6xl gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="overflow-hidden border-white/70 bg-[linear-gradient(135deg,#ecfeff,#dbeafe_52%,#f8fafc)] text-slate-900">
          <CardContent className="relative min-h-[420px] overflow-hidden p-8 md:p-10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(45,212,191,0.18),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.18),transparent_30%)]" />
            <div className="relative space-y-6">
              <div className="flex items-center gap-4">
                <div className="flex size-16 items-center justify-center overflow-hidden rounded-[1.4rem] bg-white p-2 shadow-lg ring-1 ring-slate-200">
                  <img
                    src="/logo.jpg"
                    alt="LifeHealth logo"
                    className="size-full rounded-[1rem] object-cover"
                  />
                </div>
                <div>
                  <div className="font-display text-3xl text-slate-950">
                    LifeHealth
                  </div>
                  <div className="text-xs uppercase tracking-[0.22em] text-sky-700">
                    healthcare admin
                  </div>
                </div>
              </div>

              <div className="w-fit rounded-full border border-sky-200 bg-white/80 px-4 py-2 text-xs uppercase tracking-[0.25em] text-sky-800">
                Healthcare admin UI
              </div>

              <div className="max-w-2xl">
                <h1 className="font-display text-5xl leading-tight text-slate-950">
                  LifeHealth admin workspace for doctor and system operations.
                </h1>
                <p className="mt-4 max-w-xl text-base leading-7 text-slate-700">
                  Sidebar hiển thị theo permission, module map theo backend domain,
                  và toàn bộ dữ liệu hiện đang ở chế độ mock để bạn cắm API sau.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-5">
          <Card>
            <CardContent className="space-y-6">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-600">
                  Mock access
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-900">
                  Chọn role để vào dashboard
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-700">
                  Mỗi role dùng một permission set riêng; route và sidebar sẽ đổi
                  theo role ngay lập tức.
                </p>
              </div>

              <button
                onClick={() => handleLogin("doctor")}
                className="w-full rounded-[1.4rem] border border-border bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
              >
                <div className="flex items-center gap-4">
                  <div className="rounded-2xl bg-sky-50 p-3 text-sky-700">
                    <Stethoscope className="size-5" />
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-slate-900">
                      Doctor workspace
                    </div>
                    <div className="text-sm leading-6 text-slate-700">
                      Schedule, appointments, patients, messages, records, content.
                    </div>
                  </div>
                </div>
              </button>

              <button
                onClick={() => handleLogin("admin")}
                className="w-full rounded-[1.4rem] border border-border bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
              >
                <div className="flex items-center gap-4">
                  <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-700">
                    <ShieldCheck className="size-5" />
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-slate-900">
                      Admin control tower
                    </div>
                    <div className="text-sm leading-6 text-slate-700">
                      Users, doctors, roles, audit logs, complaints, notifications, settings.
                    </div>
                  </div>
                </div>
              </button>

              <div className="rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-700">
                Backend modules đã được map vào UI: appointments, doctors, tags,
                topics, articles, messages, examination-result, health-profile,
                relatives, notifications, complaints, roles, permissions, audit-logs.
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
