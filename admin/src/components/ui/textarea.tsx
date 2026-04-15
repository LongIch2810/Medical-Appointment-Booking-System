import * as React from "react";

import { cn } from "@/lib/utils";

export function Textarea({
  className,
  ...props
}: React.ComponentProps<"textarea">) {
  return (
    <textarea
      className={cn(
        "flex min-h-28 w-full rounded-xl border border-border bg-white/80 px-4 py-3 text-sm text-foreground shadow-sm outline-none transition placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring",
        className
      )}
      {...props}
    />
  );
}
