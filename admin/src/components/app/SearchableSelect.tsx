import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Loader2, Search, SearchX, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type SearchableSelectItem = {
  value: number | string;
  label: string;
  hint?: string;
};

export type SearchableSelectProps = {
  id?: string;
  label?: string;
  placeholder?: string;
  searchPlaceholder?: string;
  search: string;
  onSearchChange: (value: string) => void;
  isLoading?: boolean;
  page: number;
  totalPages: number;
  onPageChange: (next: number) => void;
  disabled?: boolean;
  items: SearchableSelectItem[];
  selectedValue?: number | string;
  selectedLabel?: string | null;
  onSelect: (value: number | string | undefined) => void;
  className?: string;
  error?: string;
};

export function SearchableSelect({
  id,
  label,
  placeholder = "-- Chọn --",
  searchPlaceholder = "Tìm kiếm...",
  search,
  onSearchChange,
  isLoading,
  page,
  totalPages,
  onPageChange,
  disabled,
  items,
  selectedValue,
  selectedLabel,
  onSelect,
  className,
  error,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [lastSelected, setLastSelected] = useState<
    { value: number | string; label: string } | undefined
  >();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const listboxId = `${id ?? "searchable-select"}-listbox`;

  useEffect(() => {
    if (!open) return;
    const handleClick = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => {
      document.removeEventListener("mousedown", handleClick);
    };
  }, [open]);

  useEffect(() => {
    if (open) {
      const timer = window.setTimeout(() => {
        searchInputRef.current?.focus();
      }, 10);
      return () => window.clearTimeout(timer);
    }
  }, [open]);

  useEffect(() => {
    if (disabled && open) setOpen(false);
  }, [disabled, open]);

  useEffect(() => {
    if (selectedValue === undefined) setLastSelected(undefined);
  }, [selectedValue]);

  useEffect(() => {
    if (selectedValue !== undefined && selectedLabel) {
      setLastSelected({ value: selectedValue, label: selectedLabel });
    }
  }, [selectedLabel, selectedValue]);

  useEffect(() => {
    setActiveIndex(-1);
  }, [search, page, items.length]);

  const rememberedLabel =
    lastSelected && lastSelected.value === selectedValue
      ? lastSelected.label
      : undefined;
  const triggerLabel = selectedLabel ?? rememberedLabel ?? placeholder;
  const hasSelection =
    selectedValue !== undefined && Boolean(selectedLabel ?? rememberedLabel);
  const showPagination = totalPages > 1;

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(undefined);
    setLastSelected(undefined);
  };

  return (
    <div ref={containerRef} className={cn("relative flex flex-col gap-1.5", className)}>
      {label ? (
        <label
          htmlFor={id}
          className="mono-label text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400"
        >
          {label}
        </label>
      ) : null}

      <div className="relative w-full">
        <button
          id={id}
          ref={triggerRef}
          type="button"
          disabled={disabled}
          aria-label={label ? `${label}: ${triggerLabel}` : triggerLabel}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={open ? listboxId : undefined}
          aria-invalid={Boolean(error)}
          onKeyDown={(event) => {
            if (
              event.key === "ArrowDown" ||
              event.key === "Enter" ||
              event.key === " "
            ) {
              event.preventDefault();
              setOpen(true);
              setActiveIndex(-1);
            }
          }}
          onClick={() => {
            setOpen((prev) => !prev);
            setActiveIndex(-1);
          }}
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
            {triggerLabel}
          </span>
          <div className="flex items-center gap-1 shrink-0">
            {hasSelection && !disabled ? (
              <button
                type="button"
                onClick={handleClear}
                aria-label="Xóa lựa chọn"
                className="rounded-full p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="size-3.5" />
              </button>
            ) : null}
            <ChevronDown
              className={cn(
                "size-4 text-slate-400 transition-transform duration-150 dark:text-slate-500",
                open && "rotate-180 text-primary dark:text-teal-400"
              )}
            />
          </div>
        </button>

        {/* Dropdown listbox with high z-index */}
        {open && !disabled ? (
          <div className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg animate-in fade-in-0 zoom-in-95 dark:border-slate-800 dark:bg-slate-900 min-w-[220px]">
            {/* Search header inside dropdown */}
            <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50/70 px-3 dark:border-slate-800/80 dark:bg-slate-900/90">
              <Search className="size-3.5 shrink-0 text-slate-400" />
              <input
                ref={searchInputRef}
                type="text"
                role="combobox"
                aria-controls={listboxId}
                aria-expanded={open}
                aria-autocomplete="list"
                aria-label={searchPlaceholder}
                aria-activedescendant={
                  activeIndex >= 0
                    ? `${listboxId}-option-${activeIndex}`
                    : undefined
                }
                placeholder={searchPlaceholder}
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Escape") {
                    event.preventDefault();
                    setOpen(false);
                    triggerRef.current?.focus();
                  } else if (event.key === "ArrowDown") {
                    event.preventDefault();
                    setActiveIndex((current) =>
                      items.length ? (current + 1) % items.length : -1
                    );
                  } else if (event.key === "ArrowUp") {
                    event.preventDefault();
                    setActiveIndex((current) =>
                      items.length
                        ? (current - 1 + items.length) % items.length
                        : -1
                    );
                  } else if (event.key === "Enter" && activeIndex >= 0) {
                    event.preventDefault();
                    const item = items[activeIndex];
                    if (item) {
                      onSelect(item.value);
                      setLastSelected(item);
                      setOpen(false);
                      triggerRef.current?.focus();
                    }
                  }
                }}
                className="h-9 flex-1 border-0 bg-transparent text-xs text-slate-900 outline-none placeholder:text-slate-400 focus:outline-none dark:text-slate-100 dark:placeholder:text-slate-500"
              />
              {search ? (
                <button
                  type="button"
                  onClick={() => onSearchChange("")}
                  className="rounded-full p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                  aria-label="Xóa từ khóa tìm kiếm"
                >
                  <X className="size-3" />
                </button>
              ) : null}
            </div>

            {/* Listbox options */}
            <div
              id={listboxId}
              role="listbox"
              aria-label={placeholder}
              className="max-h-60 overflow-y-auto p-1"
            >
              {/* Reset/All option */}
              <button
                type="button"
                role="option"
                aria-selected={selectedValue === undefined}
                className={cn(
                  "flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left text-xs transition-colors cursor-pointer",
                  selectedValue === undefined
                    ? "bg-primary/10 font-semibold text-primary dark:bg-primary/20 dark:text-teal-300"
                    : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                )}
                onClick={() => {
                  onSelect(undefined);
                  setLastSelected(undefined);
                  setOpen(false);
                  triggerRef.current?.focus();
                }}
              >
                <span>{placeholder}</span>
                {selectedValue === undefined ? (
                  <Check className="size-3.5 shrink-0 text-primary dark:text-teal-400" />
                ) : null}
              </button>

              {isLoading ? (
                <div className="flex items-center justify-center gap-2 py-6 text-xs text-slate-500 dark:text-slate-400">
                  <Loader2 className="size-3.5 animate-spin text-primary dark:text-teal-400" />
                  <span>Đang tải danh sách...</span>
                </div>
              ) : items.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-1.5 py-6 text-center text-xs text-slate-500 dark:text-slate-400">
                  <SearchX className="size-5 text-slate-300 dark:text-slate-600" />
                  <span>Không tìm thấy kết quả phù hợp</span>
                </div>
              ) : (
                items.map((item, index) => {
                  const isSelected = item.value === selectedValue;
                  const isHighlight = index === activeIndex;

                  return (
                    <button
                      key={item.value}
                      id={`${listboxId}-option-${index}`}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      className={cn(
                        "flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition-colors cursor-pointer select-none",
                        isHighlight
                          ? "bg-slate-100 dark:bg-slate-800"
                          : "hover:bg-slate-50 dark:hover:bg-slate-800/60",
                        isSelected
                          ? "bg-primary/10 font-semibold text-primary dark:bg-primary/20 dark:text-teal-300"
                          : "text-slate-800 dark:text-slate-200"
                      )}
                      onClick={() => {
                        onSelect(item.value);
                        setLastSelected(item);
                        setOpen(false);
                        triggerRef.current?.focus();
                      }}
                    >
                      <span className="flex flex-col min-w-0">
                        <span className="truncate">{item.label}</span>
                        {item.hint ? (
                          <span className="truncate text-[11px] text-slate-400 dark:text-slate-500">
                            {item.hint}
                          </span>
                        ) : null}
                      </span>
                      {isSelected ? (
                        <Check className="size-3.5 shrink-0 text-primary dark:text-teal-400" />
                      ) : null}
                    </button>
                  );
                })
              )}
            </div>

            {/* Pagination footer if multi-page */}
            {showPagination ? (
              <div className="flex items-center justify-between gap-2 border-t border-slate-100 bg-slate-50/50 px-2 py-1.5 dark:border-slate-800 dark:bg-slate-900/50">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={page <= 1 || isLoading}
                  onClick={() => onPageChange(Math.max(1, page - 1))}
                  className="h-7 text-xs px-2"
                >
                  Trước
                </Button>
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  {page} / {totalPages}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages || isLoading}
                  onClick={() => onPageChange(Math.min(totalPages, page + 1))}
                  className="h-7 text-xs px-2"
                >
                  Sau
                </Button>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      {error ? (
        <p className="text-[11px] text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
