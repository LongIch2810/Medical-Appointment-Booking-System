import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("bg-slate-200/80 dark:bg-[#1E293B] animate-pulse rounded-xl", className)}
      {...props}
    />
  )
}

export { Skeleton }
