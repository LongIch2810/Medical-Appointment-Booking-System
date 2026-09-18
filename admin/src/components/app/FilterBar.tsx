import { useState, type ReactNode } from "react";
import { Filter, RotateCcw, ChevronDown, ChevronUp, X, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type ActiveFilterChip = {
  id: string;
  label: string;
  onRemove: () => void;
};

export type FilterBarProps = {
  children: ReactNode;
  onReset: () => void;
  hasActiveFilters: boolean;
  activeFilterCount?: number;
  title?: string;
  collapsible?: boolean;
  chips?: ActiveFilterChip[];
  isLoading?: boolean;
  className?: string;
  actions?: ReactNode;
};

export function FilterBar({
  children,
  onReset,
  hasActiveFilters,
  activeFilterCount,
  title = "Bộ lọc tìm kiếm",
  collapsible = false,
  chips = [],
  isLoading = false,
  className,
  actions,
}: FilterBarProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  // Compute effective count
  const effectiveCount = activeFilterCount ?? (chips.length > 0 ? chips.length : (hasActiveFilters ? 1 : 0));

  return (
    <section
      role="region"
      aria-label="Bộ lọc nâng cao"
      data-active-filter-count={effectiveCount}
      className={cn(
        "rounded-2xl border border-slate-200/90 bg-white/95 p-3.5 shadow-2xs backdrop-blur-xs transition-colors dark:border-slate-800/90 dark:bg-slate-900/95 sm:p-4",
        className
      )}
    >
      {/* Filter Header Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3 dark:border-slate-800/60">
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary dark:bg-primary/20">
            {isLoading ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Filter className="size-3.5" />
            )}
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
            {title}
          </span>
          {effectiveCount > 0 ? (
            <Badge
              variant="secondary"
              className="h-5 rounded-full bg-primary/10 px-2 text-[11px] font-semibold text-primary dark:bg-primary/20 dark:text-teal-300"
              aria-live="polite"
            >
              {effectiveCount} đang áp dụng
            </Badge>
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          {actions}

          {/* Reset button: always rendered with disabled state when no active filters */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onReset}
            disabled={!hasActiveFilters}
            className={cn(
              "h-8 gap-1.5 rounded-lg px-2.5 text-xs font-semibold text-slate-600 transition-colors dark:text-slate-300",
              hasActiveFilters
                ? "hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                : "opacity-40 cursor-not-allowed hover:bg-transparent"
            )}
            aria-label="Xóa các bộ lọc nâng cao"
          >
            <RotateCcw className="size-3" />
            <span>Xóa lọc</span>
          </Button>

          {/* Collapsible toggle button */}
          {collapsible ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded((prev) => !prev)}
              aria-expanded={isExpanded}
              aria-label={isExpanded ? "Thu gọn bộ lọc" : "Mở rộng bộ lọc"}
              className="h-8 gap-1 rounded-lg px-2 text-xs font-medium sm:hidden"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="size-3.5" />
                  <span>Thu gọn</span>
                </>
              ) : (
                <>
                  <ChevronDown className="size-3.5" />
                  <span>Mở rộng</span>
                </>
              )}
            </Button>
          ) : null}
        </div>
      </div>

      {/* Filter items container */}
      <div
        className={cn(
          "pt-3 transition-all duration-200 ease-in-out",
          collapsible && !isExpanded ? "hidden sm:block" : "block"
        )}
      >
        <div className="grid grid-cols-1 items-end gap-3 sm:grid-cols-2 md:grid-cols-3 lg:flex lg:flex-wrap">
          {children}
        </div>
      </div>

      {/* Active Filter Chips */}
      {chips.length > 0 ? (
        <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-slate-100 pt-2.5 dark:border-slate-800/60">
          <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
            Đang lọc theo:
          </span>
          {chips.map((chip) => (
            <span
              key={chip.id}
              className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              <span>{chip.label}</span>
              <button
                type="button"
                onClick={chip.onRemove}
                className="rounded-full p-0.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 dark:hover:bg-slate-700 dark:hover:text-slate-200 cursor-pointer"
                aria-label={`Xóa bộ lọc ${chip.label}`}
              >
                <X className="size-3" />
              </button>
            </span>
          ))}
          <button
            type="button"
            onClick={onReset}
            className="text-[11px] font-semibold text-primary hover:underline dark:text-teal-400 ml-1 cursor-pointer"
          >
            Xóa tất cả
          </button>
        </div>
      ) : null}
    </section>
  );
}
