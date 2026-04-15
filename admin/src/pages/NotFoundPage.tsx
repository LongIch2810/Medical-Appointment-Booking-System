import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="max-w-xl">
        <CardContent className="space-y-5 text-center">
          <div className="font-display text-6xl text-slate-900">404</div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Trang không tồn tại
          </h1>
          <p className="text-sm text-slate-500">
            Route này chưa được cấu hình trong app `admin` hoặc bạn đang truy cập sai đường dẫn.
          </p>
          <Button asChild>
            <Link to="/">Về dashboard</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
