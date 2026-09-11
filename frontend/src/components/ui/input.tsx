import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.ComponentProps<"input"> {
  icon?: React.ReactNode;
  onClickIcon?: () => void;
  error?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, icon, onClickIcon, error, ...props }, ref) => {
    return (
      <div className="w-full flex flex-col gap-1">
        {/* wrapper input + icon */}
        <div className="relative w-full">
          <input
            type={type}
            data-slot="input"
            className={cn(
              "file:text-foreground placeholder:text-slate-400 dark:placeholder:text-slate-500 flex h-10 w-full min-w-0 rounded-xl border bg-white px-3.5 py-2 text-sm shadow-2xs transition-all duration-200 outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 focus-visible:border-primary/50 focus-visible:ring-2 focus-visible:ring-primary/20",
              error
                ? "border-rose-400 focus-visible:border-rose-500 focus-visible:ring-rose-200 dark:border-rose-500 dark:focus-visible:ring-rose-950/50"
                : "border-slate-200 hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-700 dark:bg-slate-900 dark:text-slate-100",
              icon ? "pr-10" : "",
              className
            )}
            ref={ref}
            {...props}
          />

          {icon && (
            <button
              type="button"
              onClick={onClickIcon}
              className={cn(
                "absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-200 transition-colors",
                onClickIcon && "cursor-pointer"
              )}
            >
              {icon}
            </button>
          )}
        </div>

        {/* error message */}
        {error && <p className="text-xs font-medium text-rose-500 pl-1">{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
export { Input };
