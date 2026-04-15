import { Inbox } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

export function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex min-h-64 flex-col items-center justify-center gap-3 text-center">
        <div className="rounded-full bg-primary/10 p-4 text-primary">
          <Inbox className="size-6" />
        </div>
        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
        <p className="max-w-md text-sm text-slate-500">{description}</p>
      </CardContent>
    </Card>
  );
}
