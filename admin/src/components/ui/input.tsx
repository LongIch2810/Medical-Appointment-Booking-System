import * as React from "react";

import { cn } from "@/lib/utils";

export function Input({ className, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      className={cn(
        "flex h-11 w-full rounded-sm border border-border bg-white px-4 py-2 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus-visible:border-[#9b60aa] focus-visible:ring-2 focus-visible:ring-[#9b60aa]/20",
        className
      )}
      {...props}
    />
  );
}
