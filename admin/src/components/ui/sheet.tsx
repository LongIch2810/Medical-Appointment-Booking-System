import * as SheetPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import type * as React from "react";

import { cn } from "@/lib/utils";

export const Sheet = SheetPrimitive.Root;
export const SheetTrigger = SheetPrimitive.Trigger;

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
          "fixed top-0 z-50 flex h-full w-[88%] max-w-sm flex-col border-r border-white/70 bg-white/95 shadow-2xl backdrop-blur-xl transition data-[state=open]:animate-in",
          side === "left" ? "left-0 data-[state=open]:slide-in-from-left" : "right-0 data-[state=open]:slide-in-from-right",
          className
        )}
        {...props}
      >
        {children}
        <SheetPrimitive.Close className="absolute right-4 top-4 rounded-full border border-border p-2 text-muted-foreground hover:text-foreground">
          <X className="size-4" />
          <span className="sr-only">Close</span>
        </SheetPrimitive.Close>
      </SheetPrimitive.Content>
    </SheetPrimitive.Portal>
  );
}
