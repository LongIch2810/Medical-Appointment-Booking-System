import * as React from "react";

import { cn } from "@/lib/utils";

export function Card({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "surface-glass text-card-foreground flex flex-col gap-5 rounded-lg border border-border py-6",
        className
      )}
      {...props}
    />
  );
}

export function CardHeader({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return <div className={cn("px-6", className)} {...props} />;
}

export function CardTitle({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return <div className={cn("text-lg font-medium", className)} {...props} />;
}

export function CardDescription({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return <div className={cn("text-sm text-muted-foreground", className)} {...props} />;
}

export function CardContent({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return <div className={cn("px-6", className)} {...props} />;
}

export function CardFooter({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return <div className={cn("px-6", className)} {...props} />;
}
