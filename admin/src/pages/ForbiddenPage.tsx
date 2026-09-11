import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLogout } from "@/hooks/useAuth";
import { readRoleNames, useAuthStore } from "@/store/useAuthStore";

export function ForbiddenPage() {
  const logoutMutation = useLogout();
  const currentUser = useAuthStore((state) => state.currentUser);

  useEffect(() => {
    const roles = readRoleNames(currentUser);
    const roleLabel = roles.length ? roles.join(", ") : "không có role";
    toast.error(
      `Tài khoản ${roleLabel} không thể vào trang này.`,
      { toastId: "admin-forbidden-role" },
    );
  }, [currentUser]);

  return (
    <div className="flex min-h-screen items-center justify-center px-4 bg-slate-50 dark:bg-slate-950">
      <Card className="max-w-md w-full rounded-3xl border-slate-200/80 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900">
        <CardContent className="space-y-5 text-center p-2">
          <div className="font-display text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-amber-500">
            403
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100">
            Truy cập bị từ chối
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Tài khoản hiện tại không có quyền hạn hợp lệ để truy cập vào khu vực quản trị hoặc bác sĩ này.
          </p>
          {currentUser ? (
            <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-3.5 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-400 font-medium">
              Vai trò tài khoản: <span className="font-bold text-slate-900 dark:text-slate-100">{readRoleNames(currentUser).join(", ") || "Chưa gán vai trò"}</span>
            </div>
          ) : null}
          <div className="flex flex-col gap-2.5 pt-2">
            <Button
              onClick={() => logoutMutation.mutate()}
              disabled={logoutMutation.isPending}
              className="w-full rounded-xl font-bold"
            >
              {logoutMutation.isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin mr-2" /> Đang đăng xuất...
                </>
              ) : (
                "Đăng xuất & Đổi tài khoản"
              )}
            </Button>
            <Button asChild variant="outline" className="w-full rounded-xl font-semibold">
              <Link to="/login">Về trang đăng nhập</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

