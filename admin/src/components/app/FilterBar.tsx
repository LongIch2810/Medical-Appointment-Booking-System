import type { ReactNode } from "react";
import { RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";

export type FilterBarProps = {
  children: ReactNode;
  onReset: () => void;
  hasActiveFilters: boolean;
  activeFilterCount?: number;
};

export function FilterBar({
  children,
  onReset,
  hasActiveFilters,
  activeFilterCount,
}: FilterBarProps) {
  return (
    <div
      role="region"
      aria-label="Bộ lọc nâng cao"
      data-active-filter-count={activeFilterCount ?? 0}
      className="grid grid-cols-1 items-end gap-3 sm:flex sm:flex-wrap"
    >
      {children}
      {hasActiveFilters ? (
        <div className="flex items-center gap-2">
          {activeFilterCount !== undefined ? (
            <span
              className="rounded-full bg-primary/10 px-2 py-1 text-xs font-semibold text-primary"
              aria-live="polite"
            >
              {activeFilterCount}
            </span>
          ) : null}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="h-10"
            aria-label="Xóa các bộ lọc nâng cao"
          >
            <RotateCcw className="mr-1 size-3" />
            Xóa lọc
          </Button>
        </div>
      ) : null}
    </div>
  );
}
