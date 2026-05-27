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
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="max-w-xl rounded-[22px] border-[#d9d9dd]">
        <CardContent className="space-y-5 text-center">
          <div className="font-display text-6xl font-medium text-[#212121]">
            403
          </div>
          <h1 className="text-2xl font-medium text-[#212121]">
            Không có quyền truy cập
          </h1>
          <p className="text-sm text-[#75758a]">
            Tài khoản này không thể vào trang quản trị. Vui lòng dùng tài khoản
            phù hợp.
          </p>
          {currentUser ? (
            <div className="rounded-lg border border-[#d9d9dd] bg-[#f7f6f2] p-4 text-sm text-[#75758a]">
              Role hiện tại: {readRoleNames(currentUser).join(", ") || "không có role"}
            </div>
          ) : null}
          <div className="flex flex-col items-center gap-3">
            <Button
              onClick={() => logoutMutation.mutate()}
              disabled={logoutMutation.isPending}
              className="w-full sm:w-auto"
            >
              {logoutMutation.isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Đang đăng xuất
                </>
              ) : (
                  "Đăng xuất"
              )}
            </Button>
            <Button asChild variant="outline" className="w-full sm:w-auto">
              <Link to="/login">Về trang đăng nhập</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
