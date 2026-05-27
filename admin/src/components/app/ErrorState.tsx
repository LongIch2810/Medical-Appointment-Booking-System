import { AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type ErrorStateProps = {
  title?: string;
  description?: string;
  onRetry?: () => void;
};

export function ErrorState({
  title = "Không thể tải dữ liệu",
  description = "Đã xảy ra lỗi khi gọi API. Vui lòng thử lại.",
  onRetry,
}: ErrorStateProps) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex min-h-64 flex-col items-center justify-center gap-3 text-center">
        <div className="rounded-full bg-rose-50 p-4 text-rose-600">
          <AlertCircle className="size-6" />
        </div>
        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
        <p className="max-w-md text-sm text-slate-500">{description}</p>
        {onRetry ? (
          <Button variant="outline" onClick={onRetry}>
            Thử lại
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}
