import * as SheetPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import type * as React from "react";

import { cn } from "@/lib/utils";

export const Sheet = SheetPrimitive.Root;
export const SheetTrigger = SheetPrimitive.Trigger;
export const SheetTitle = SheetPrimitive.Title;
export const SheetDescription = SheetPrimitive.Description;

export function SheetContent({
  className,
  children,
  side = "left",
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Content> & {
  side?: "left" | "right";
}) {
  return (
    <SheetPrimitive.Portal>
      <SheetPrimitive.Overlay className="fixed inset-0 z-50 bg-slate-950/45 backdrop-blur-sm" />
      <SheetPrimitive.Content
        className={cn(
          "fixed top-0 z-50 flex h-full w-[88%] max-w-sm flex-col border-r border-slate-200 bg-white text-slate-900 transition data-[state=open]:animate-in overflow-hidden outline-hidden dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100",
          side === "left" ? "left-0 data-[state=open]:slide-in-from-left" : "right-0 data-[state=open]:slide-in-from-right",
          className
        )}
        {...props}
      >
        {children}
        <SheetPrimitive.Close className="absolute right-4 top-4 z-50 rounded-full border border-slate-200 bg-white/90 p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-900/90 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100 cursor-pointer transition">
          <X className="size-4" />
          <span className="sr-only">Đóng</span>
        </SheetPrimitive.Close>
      </SheetPrimitive.Content>
    </SheetPrimitive.Portal>
  );
}
