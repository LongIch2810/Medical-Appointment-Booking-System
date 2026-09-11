import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-1 active:scale-[0.98] cursor-pointer",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-white shadow-xs hover:bg-primary/90 hover:shadow-md border border-primary/20",
        destructive:
          "bg-destructive text-white shadow-xs hover:bg-destructive/90 focus-visible:ring-destructive/30 border border-destructive/20",
        outline:
          "border border-slate-200/90 bg-white text-slate-700 shadow-2xs hover:bg-slate-50 hover:text-primary hover:border-primary/40 dark:bg-neutral-800 dark:border-neutral-700 dark:text-slate-200 dark:hover:bg-neutral-700",
        secondary:
          "bg-secondary text-secondary-foreground shadow-2xs hover:bg-secondary/80 border border-secondary/40",
        ghost:
          "text-slate-700 hover:bg-slate-100 hover:text-primary dark:text-slate-200 dark:hover:bg-neutral-800",
        link: "text-primary underline-offset-4 hover:underline font-semibold",
        primary:
          "bg-primary text-white shadow-xs hover:bg-primary/90 hover:shadow-md border border-primary/20",
        google:
          "bg-white text-slate-700 border border-slate-200 shadow-2xs hover:bg-slate-50 hover:border-slate-300",
        details:
          "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 hover:text-emerald-800",
        sky: "bg-sky-50 text-sky-700 border border-sky-200 hover:bg-sky-100 hover:text-sky-800",
      },
      size: {
        default: "h-10 px-4 py-2 has-[>svg]:px-3.5",
        sm: "h-8.5 rounded-lg gap-1.5 px-3 text-xs has-[>svg]:px-2.5",
        lg: "h-11.5 rounded-xl px-6 text-base has-[>svg]:px-4.5",
        icon: "size-10 rounded-xl",
        mini: "size-5 rounded-md",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
