import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Search } from "lucide-react";

import { Button } from "@/components/ui/button";

export type SearchableSelectItem = {
  value: number | string;
  label: string;
  hint?: string;
};

export type SearchableSelectProps = {
  id?: string;
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
};

export function SearchableSelect({
  id,
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
      }, 0);
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

  return (
    <div ref={containerRef} className="relative">
      <button
        id={id}
        ref={triggerRef}
        type="button"
        disabled={disabled}
        aria-label={placeholder}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
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
        className={`flex h-11 w-full items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:disabled:bg-slate-800 dark:disabled:text-slate-600 ${open ? "border-primary ring-2 ring-primary/20" : ""}`}
      >
        <span
          className={`truncate text-left ${hasSelection ? "text-slate-900 dark:text-slate-100" : "text-slate-400 dark:text-slate-500"}`}
        >
          {triggerLabel}
        </span>
        <ChevronDown
          className={`size-4 shrink-0 text-slate-400 dark:text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && !disabled ? (
        <div className="absolute left-0 right-0 top-full z-30 mt-1 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2 border-b border-slate-200 bg-white px-3 dark:border-slate-800 dark:bg-slate-900">
            <Search className="size-4 text-slate-400" />
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
                    items.length ? (current + 1) % items.length : -1,
                  );
                } else if (event.key === "ArrowUp") {
                  event.preventDefault();
                  setActiveIndex((current) =>
                    items.length
                      ? (current - 1 + items.length) % items.length
                      : -1,
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
              className="h-10 flex-1 border-0 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:outline-none focus-visible:outline-none focus-visible:ring-0 dark:text-slate-100 dark:placeholder:text-slate-400"
            />
          </div>

          <div
            id={listboxId}
            role="listbox"
            aria-label={placeholder}
            className="max-h-60 overflow-y-auto py-1"
          >
            {isLoading ? (
              <div className="px-3 py-3 text-xs text-slate-500 dark:text-slate-400">
                Đang tải...
              </div>
            ) : items.length === 0 ? (
              <div className="px-3 py-3 text-xs text-slate-500 dark:text-slate-400">
                Không có kết quả.
              </div>
            ) : (
              items.map((item, index) => {
                const isSelected = item.value === selectedValue;
                return (
                  <button
                    key={item.value}
                    id={`${listboxId}-option-${index}`}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 ${index === activeIndex ? "bg-slate-100 dark:bg-slate-800" : ""} ${isSelected ? "bg-primary/10 text-primary font-bold dark:bg-primary/20 dark:text-emerald-400" : "text-slate-800 dark:text-slate-200"}`}
                    onClick={() => {
                      onSelect(item.value);
                      setLastSelected(item);
                      setOpen(false);
                      triggerRef.current?.focus();
                    }}
                  >
                    <span className="flex flex-col">
                      <span className="truncate">{item.label}</span>
                      {item.hint ? (
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">
                          {item.hint}
                        </span>
                      ) : null}
                    </span>
                    {isSelected ? (
                      <Check className="size-4 shrink-0 text-primary dark:text-emerald-400" />
                    ) : null}
                  </button>
                );
              })
            )}
          </div>

          {showPagination ? (
            <div className="flex items-center justify-between gap-2 border-t border-slate-200 bg-white px-2 py-1.5 dark:border-slate-800 dark:bg-slate-900">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page <= 1 || isLoading}
                onClick={() => onPageChange(Math.max(1, page - 1))}
              >
                Trước
              </Button>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Trang {page}/{totalPages}
                {isLoading ? " • đang tải..." : ""}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page >= totalPages || isLoading}
                onClick={() => onPageChange(Math.min(totalPages, page + 1))}
              >
                Sau
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
