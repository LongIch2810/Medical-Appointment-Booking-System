export type SelectFilterOption = {
  value: string;
  label: string;
};

export type SelectFilterProps = {
  id: string;
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectFilterOption[];
  placeholder: string;
};

const selectClass =
  "flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-2xs outline-none transition placeholder:text-slate-400 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-400";

export function SelectFilter({
  id,
  label,
  value,
  onChange,
  options,
  placeholder,
}: SelectFilterProps) {
  return (
    <div className="flex flex-col gap-1">
      {label ? (
        <label
          htmlFor={id}
          className="mono-label text-[10px] text-slate-500 dark:text-slate-400"
        >
          {label}
        </label>
      ) : null}
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={selectClass}
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
