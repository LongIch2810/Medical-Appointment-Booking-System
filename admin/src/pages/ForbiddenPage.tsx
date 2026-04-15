import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function ForbiddenPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="max-w-xl">
        <CardContent className="space-y-5 text-center">
          <div className="font-display text-6xl text-slate-900">403</div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Permission denied
          </h1>
          <p className="text-sm text-slate-500">
            Role hiện tại không có quyền truy cập route này. Sidebar chỉ hiển thị
            những mục phù hợp với permission set của user.
          </p>
          <Button asChild>
            <Link to="/">Quay về workspace</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
