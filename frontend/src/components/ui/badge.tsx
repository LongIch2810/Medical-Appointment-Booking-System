import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-full border px-2.5 py-0.5 text-xs font-semibold w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none transition-all overflow-hidden",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground font-bold shadow-2xs",
        secondary:
          "border-slate-200 bg-slate-100 text-slate-700 dark:border-[#293548] dark:bg-[#1E293B] dark:text-slate-200",
        destructive:
          "border-rose-200 bg-rose-50 text-rose-700 dark:border-[#FB7185]/40 dark:bg-[#FB7185]/15 dark:text-[#FB7185]",
        outline:
          "border-slate-200 text-slate-700 bg-white dark:border-[#293548] dark:bg-[#172033] dark:text-slate-300",
        success:
          "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-[#34D399]/40 dark:bg-[#34D399]/15 dark:text-[#34D399]",
        warning:
          "border-amber-200 bg-amber-50 text-amber-700 dark:border-[#FBBF24]/40 dark:bg-[#FBBF24]/15 dark:text-[#FBBF24]",
        info:
          "border-sky-200 bg-sky-50 text-sky-700 dark:border-[#60A5FA]/40 dark:bg-[#60A5FA]/15 dark:text-[#60A5FA]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span";

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
