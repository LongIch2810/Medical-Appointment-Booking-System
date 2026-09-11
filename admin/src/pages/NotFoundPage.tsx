import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 bg-slate-50 dark:bg-slate-950">
      <Card className="max-w-md w-full rounded-3xl border-slate-200/80 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900">
        <CardContent className="space-y-5 text-center p-2">
          <div className="font-display text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-teal-500 to-sky-500">
            404
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100">
            Không tìm thấy trang
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Đường dẫn yêu cầu không tồn tại trong hệ thống quản trị LifeHealth hoặc đã được chuyển đổi.
          </p>
          <div className="pt-2">
            <Button asChild className="w-full rounded-xl font-bold">
              <Link to="/">Về trang điều hành chính</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
