import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "border-input placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/25 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-[#1E293B] dark:border-[#293548] dark:text-[#F1F5F9] dark:placeholder:text-[#94A3B8] dark:hover:border-primary/50 flex field-sizing-content min-h-16 w-full rounded-xl border bg-white px-3.5 py-2.5 text-base shadow-2xs transition-[color,box-shadow] outline-none disabled:cursor-not-allowed disabled:opacity-45 md:text-sm",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
