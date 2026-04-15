import * as React from "react";

import { cn } from "@/lib/utils";

export function Input({ className, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      className={cn(
        "flex h-11 w-full rounded-xl border border-border bg-white/80 px-4 py-2 text-sm text-foreground shadow-sm outline-none transition placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring",
        className
      )}
      {...props}
    />
  );
}
