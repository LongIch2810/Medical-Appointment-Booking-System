import { Loader2 } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

export function LoadingState({ label = "Đang tải dữ liệu..." }: { label?: string }) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex min-h-64 flex-col items-center justify-center gap-3 text-center text-[#75758a]">
        <Loader2 className="size-6 animate-spin text-primary" />
        <p className="text-sm">{label}</p>
      </CardContent>
    </Card>
  );
}
