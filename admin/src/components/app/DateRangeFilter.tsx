import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export type DateRangeFilterProps = {
  fromId: string;
  fromLabel?: string;
  fromValue: string;
  onFromChange: (value: string) => void;
  toId?: string;
  toLabel?: string;
  toValue?: string;
  onToChange?: (value: string) => void;
  error?: string;
  disabled?: boolean;
  className?: string;
};

const dateInputClass =
  "flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-2xs outline-none transition placeholder:text-slate-400 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-400 disabled:cursor-not-allowed disabled:opacity-50";

/**
 * Renders a unified "from" date filter, and paired "to" date filter.
 * Packaged in a single container with inline validation and responsive grid layout.
 */
export function DateRangeFilter({
  fromId,
  fromLabel = "Từ ngày",
  fromValue,
  onFromChange,
  toId,
  toLabel = "Đến ngày",
  toValue,
  onToChange,
  error,
  disabled,
  className,
}: DateRangeFilterProps) {
  // Built-in validation if fromValue > toValue
  const isInvalidRange = Boolean(
    fromValue && toValue && fromValue > toValue
  );
  const effectiveError = error || (isInvalidRange ? "Khoảng ngày không hợp lệ" : undefined);
  const hasToFilter = Boolean(toId && onToChange);

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <div className={cn("grid gap-2.5", hasToFilter ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1")}>
        {/* From Date Input */}
        <div className="flex flex-col gap-1">
          <label
            htmlFor={fromId}
            className="mono-label text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400"
          >
            {fromLabel}
          </label>
          <input
            id={fromId}
            type="date"
            value={fromValue}
            aria-invalid={Boolean(effectiveError)}
            aria-label={fromLabel}
            onChange={(e) => onFromChange(e.target.value)}
            disabled={disabled}
            className={cn(
              dateInputClass,
              effectiveError && "border-destructive focus-visible:ring-destructive/20"
            )}
          />
        </div>

        {/* To Date Input */}
        {hasToFilter ? (
          <div className="flex flex-col gap-1">
            <label
              htmlFor={toId}
              className="mono-label text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400"
            >
              {toLabel}
            </label>
            <input
              id={toId}
              type="date"
              value={toValue ?? ""}
              aria-invalid={Boolean(effectiveError)}
              aria-label={toLabel}
              onChange={(e) => onToChange?.(e.target.value)}
              disabled={disabled}
              className={cn(
                dateInputClass,
                effectiveError && "border-destructive focus-visible:ring-destructive/20"
              )}
            />
          </div>
        ) : null}
      </div>

      {/* Inline Error Message */}
      {effectiveError ? (
        <div
          role="alert"
          className="flex items-center gap-1 text-[11px] font-medium text-destructive animate-in fade-in-50"
        >
          <AlertCircle className="size-3 shrink-0" />
          <span>{effectiveError}</span>
        </div>
      ) : null}
    </div>
  );
}
