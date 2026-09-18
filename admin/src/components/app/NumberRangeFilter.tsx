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
};

const numberInputClass =
  "flex h-10 w-24 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-2xs outline-none transition placeholder:text-slate-400 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-400";

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
}: NumberRangeFilterProps) {
  return (
    <div className="flex flex-col gap-1">
      <label className="mono-label text-[10px] text-slate-500 dark:text-slate-400">
        {label}
      </label>
      <div className="flex items-center gap-2">
        <input
          id={minId}
          type="number"
          placeholder="Từ"
          value={minValue}
          min={min}
          max={max}
          aria-invalid={Boolean(error)}
          aria-label={`${label} từ`}
          disabled={disabled}
          onChange={(e) => onMinChange(e.target.value)}
          className={numberInputClass}
        />
        <span className="text-xs text-slate-400">–</span>
        <input
          id={maxId}
          type="number"
          placeholder="Đến"
          value={maxValue}
          min={min}
          max={max}
          aria-invalid={Boolean(error)}
          aria-label={`${label} đến`}
          disabled={disabled}
          onChange={(e) => onMaxChange(e.target.value)}
          className={numberInputClass}
        />
      </div>
      {error ? (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
