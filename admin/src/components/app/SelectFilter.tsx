import { useEffect, useRef, useState, useId } from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export type SelectFilterOption = {
  value: string;
  label: string;
};

export type SelectFilterProps = {
  id?: string;
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectFilterOption[];
  placeholder: string;
  disabled?: boolean;
  className?: string;
  error?: string;
};

export function SelectFilter({
  id: explicitId,
  label,
  value,
  onChange,
  options,
  placeholder,
  disabled = false,
  className,
  error,
}: SelectFilterProps) {
  const generatedId = useId();
  const id = explicitId || generatedId;
  const listboxId = `${id}-listbox`;

  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  // All options including the empty/placeholder option
  const allOptions: SelectFilterOption[] = [
    { value: "", label: placeholder },
    ...options,
  ];

  // Currently selected option
  const selectedOption = allOptions.find((opt) => opt.value === value);
  const hasSelection = Boolean(value);

  // Handle click outside to close dropdown
  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  // Close when disabled
  useEffect(() => {
    if (disabled && open) {
      setOpen(false);
    }
  }, [disabled, open]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!open) {
        setOpen(true);
        setActiveIndex(0);
      } else {
        setActiveIndex((prev) => (prev + 1) % allOptions.length);
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (!open) {
        setOpen(true);
        setActiveIndex(allOptions.length - 1);
      } else {
        setActiveIndex(
          (prev) => (prev - 1 + allOptions.length) % allOptions.length
        );
      }
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (!open) {
        setOpen(true);
        const currentIndex = allOptions.findIndex((opt) => opt.value === value);
        setActiveIndex(currentIndex >= 0 ? currentIndex : 0);
      } else if (activeIndex >= 0 && activeIndex < allOptions.length) {
        const chosen = allOptions[activeIndex];
        onChange(chosen.value);
        setOpen(false);
        triggerRef.current?.focus();
      }
    } else if (e.key === "Escape" && open) {
      e.preventDefault();
      setOpen(false);
      triggerRef.current?.focus();
    } else if (e.key === "Tab" && open) {
      setOpen(false);
    }
  };

  const handleSelect = (val: string) => {
    onChange(val);
    setOpen(false);
    triggerRef.current?.focus();
  };

  return (
    <div
      ref={containerRef}
      className={cn("relative flex flex-col gap-1.5 min-w-[140px]", className)}
    >
      {label ? (
        <label
          htmlFor={id}
          className="mono-label text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400"
        >
          {label}
        </label>
      ) : null}

      <button
        id={id}
        ref={triggerRef}
        type="button"
        disabled={disabled}
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
        aria-label={label ? `${label}: ${selectedOption?.label ?? placeholder}` : placeholder}
        aria-invalid={Boolean(error)}
        onClick={() => {
          if (!disabled) {
            setOpen((prev) => !prev);
            const currentIndex = allOptions.findIndex(
              (opt) => opt.value === value
            );
            setActiveIndex(currentIndex >= 0 ? currentIndex : 0);
          }
        }}
        onKeyDown={handleKeyDown}
        className={cn(
          "flex h-10 w-full items-center justify-between gap-2 rounded-xl border bg-white px-3 text-left text-sm transition-all focus-visible:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-slate-900",
          open
            ? "border-primary ring-2 ring-primary/20 dark:border-teal-500 dark:ring-teal-500/20"
            : "border-slate-200 shadow-2xs hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-700",
          error && "border-destructive focus-visible:ring-destructive/20"
        )}
      >
        <span
          className={cn(
            "truncate text-sm",
            hasSelection
              ? "font-medium text-slate-900 dark:text-slate-100"
              : "text-slate-500 dark:text-slate-400"
          )}
        >
          {selectedOption?.label || placeholder}
        </span>
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-slate-400 transition-transform duration-150 dark:text-slate-500",
            open && "rotate-180 text-primary dark:text-teal-400"
          )}
        />
      </button>

      {/* Dropdown Menu */}
      {open && !disabled ? (
        <div
          id={listboxId}
          role="listbox"
          aria-label={label || placeholder}
          className="absolute left-0 top-full z-50 mt-1 max-h-60 w-full min-w-[180px] overflow-y-auto rounded-xl border border-slate-200 bg-white p-1 shadow-lg outline-none animate-in fade-in-0 zoom-in-95 dark:border-slate-800 dark:bg-slate-900"
        >
          {allOptions.map((opt, index) => {
            const isSelected = opt.value === value;
            const isHighlight = index === activeIndex;

            return (
              <div
                key={opt.value || `empty-${index}`}
                id={`${listboxId}-option-${index}`}
                role="option"
                aria-selected={isSelected}
                tabIndex={-1}
                onClick={() => handleSelect(opt.value)}
                onMouseEnter={() => setActiveIndex(index)}
                className={cn(
                  "flex cursor-pointer items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-sm transition-colors select-none",
                  isHighlight
                    ? "bg-slate-100 dark:bg-slate-800"
                    : "hover:bg-slate-50 dark:hover:bg-slate-800/60",
                  isSelected
                    ? "bg-primary/10 font-semibold text-primary dark:bg-primary/20 dark:text-teal-300"
                    : "text-slate-700 dark:text-slate-200"
                )}
              >
                <span className="truncate">{opt.label}</span>
                {isSelected ? (
                  <Check className="size-3.5 shrink-0 text-primary dark:text-teal-400" />
                ) : null}
              </div>
            );
          })}
        </div>
      ) : null}

      {error ? (
        <p className="text-[11px] text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
