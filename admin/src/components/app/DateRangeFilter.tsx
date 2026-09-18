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
};

const dateInputClass =
  "flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-2xs outline-none transition placeholder:text-slate-400 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-400";

/**
 * Renders a "from" date filter, and a paired "to" date filter when
 * `toId`/`onToChange` are supplied — omit them for a single-bound filter.
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
}: DateRangeFilterProps) {
  return (
    <>
      <div className="flex flex-col gap-1">
        <label
          htmlFor={fromId}
          className="mono-label text-[10px] text-slate-500 dark:text-slate-400"
        >
          {fromLabel}
        </label>
        <input
          id={fromId}
          type="date"
          value={fromValue}
          aria-invalid={Boolean(error)}
          onChange={(e) => onFromChange(e.target.value)}
          disabled={disabled}
          className={dateInputClass}
        />
      </div>
      {toId && onToChange ? (
        <div className="flex flex-col gap-1">
          <label
            htmlFor={toId}
            className="mono-label text-[10px] text-slate-500 dark:text-slate-400"
          >
            {toLabel}
          </label>
          <input
            id={toId}
            type="date"
            value={toValue ?? ""}
            aria-invalid={Boolean(error)}
            onChange={(e) => onToChange(e.target.value)}
            disabled={disabled}
            className={dateInputClass}
          />
        </div>
      ) : null}
      {error ? (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </>
  );
}
