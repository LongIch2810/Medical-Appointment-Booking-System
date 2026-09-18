import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export type NumberRangeFilterProps = {
  label: string;
  minId: string;
  maxId: string;
  minValue: string;
  maxValue: string;
  onMinChange: (value: string) => void;
  onMaxChange: (value: string) => void;
  min?: number;
  max?: number;
  error?: string;
  disabled?: boolean;
  className?: string;
};

const numberInputClass =
  "flex h-10 w-full sm:w-28 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-2xs outline-none transition placeholder:text-slate-400 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-400 disabled:cursor-not-allowed disabled:opacity-50";

export function NumberRangeFilter({
  label,
  minId,
  maxId,
  minValue,
  maxValue,
  onMinChange,
  onMaxChange,
  min,
  max,
  error,
  disabled,
  className,
}: NumberRangeFilterProps) {
  // Built-in validation if minValue > maxValue
  const isInvalidRange = Boolean(
    minValue !== "" &&
    maxValue !== "" &&
    Number(minValue) > Number(maxValue)
  );
  const effectiveError = error || (isInvalidRange ? "Giá trị không hợp lệ (min > max)" : undefined);

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label className="mono-label text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
        {label}
      </label>
      <div className="flex items-center gap-2">
        <div className="relative flex-1 sm:flex-initial">
          <input
            id={minId}
            type="number"
            placeholder="Từ"
            value={minValue}
            min={min}
            max={max}
            aria-invalid={Boolean(effectiveError)}
            aria-label={`${label} từ`}
            disabled={disabled}
            onChange={(e) => onMinChange(e.target.value)}
            className={cn(
              numberInputClass,
              effectiveError && "border-destructive focus-visible:ring-destructive/20"
            )}
          />
        </div>
        <span className="text-xs font-semibold text-slate-400 select-none">–</span>
        <div className="relative flex-1 sm:flex-initial">
          <input
            id={maxId}
            type="number"
            placeholder="Đến"
            value={maxValue}
            min={min}
            max={max}
            aria-invalid={Boolean(effectiveError)}
            aria-label={`${label} đến`}
            disabled={disabled}
            onChange={(e) => onMaxChange(e.target.value)}
            className={cn(
              numberInputClass,
              effectiveError && "border-destructive focus-visible:ring-destructive/20"
            )}
          />
        </div>
      </div>

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
