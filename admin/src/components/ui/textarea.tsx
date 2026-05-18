import * as React from "react";

import { cn } from "@/lib/utils";

export function Textarea({
  className,
  ...props
}: React.ComponentProps<"textarea">) {
  return (
    <textarea
      className={cn(
        "flex min-h-28 w-full rounded-sm border border-border bg-white px-4 py-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus-visible:border-[#9b60aa] focus-visible:ring-2 focus-visible:ring-[#9b60aa]/20",
        className
      )}
      {...props}
    />
  );
}
