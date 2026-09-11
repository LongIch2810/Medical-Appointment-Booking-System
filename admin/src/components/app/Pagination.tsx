import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

import { cn } from "@/lib/utils";

type PaginationProps = {
  page: number;
  total: number;
  limit: number;
  onPageChange: (page: number) => void;
  onLimitChange?: (limit: number) => void;
  pageSizeOptions?: number[];
  className?: string;
};

const DEFAULT_PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

function buildPageList(current: number, totalPages: number): Array<number | "..."> {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, idx) => idx + 1);
  }

  const pages: Array<number | "..."> = [1];
  const left = Math.max(2, current - 1);
  const right = Math.min(totalPages - 1, current + 1);

  if (left > 2) pages.push("...");
  for (let page = left; page <= right; page += 1) {
    pages.push(page);
  }
  if (right < totalPages - 1) pages.push("...");
  pages.push(totalPages);

  return pages;
}

export function Pagination({
  page,
  total,
  limit,
  onPageChange,
  onLimitChange,
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
  className,
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / Math.max(1, limit)));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = total === 0 ? 0 : (safePage - 1) * limit + 1;
  const end = Math.min(total, safePage * limit);
  const pageList = buildPageList(safePage, totalPages);

  const baseBtn =
    "inline-flex h-8 min-w-8 items-center justify-center rounded-xl border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 transition-all hover:bg-slate-50 hover:border-primary/40 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer shadow-2xs";

  return (
    <div
      className={cn(
        "flex flex-col gap-3 text-xs text-slate-500 dark:text-slate-400 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <div className="flex flex-wrap items-center gap-3">
        <span>
          Hiển thị <span className="font-bold text-slate-900 dark:text-slate-100">{start}</span>
          {" - "}
          <span className="font-bold text-slate-900 dark:text-slate-100">{end}</span> trên{" "}
          <span className="font-bold text-slate-900 dark:text-slate-100">{total}</span> bản ghi
        </span>
        {onLimitChange ? (
          <label className="flex items-center gap-2">
            <span className="text-[11px] font-medium">Số dòng/trang:</span>
            <select
              value={limit}
              onChange={(event) => onLimitChange(Number(event.target.value))}
              className="h-8 rounded-xl border border-slate-200 bg-white px-2 text-xs font-semibold text-slate-800 shadow-2xs outline-none focus-visible:border-primary dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
            >
              {pageSizeOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          onClick={() => onPageChange(1)}
          disabled={safePage <= 1}
          className={baseBtn}
          aria-label="Trang đầu"
        >
          <ChevronsLeft className="size-3.5" />
        </button>
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, safePage - 1))}
          disabled={safePage <= 1}
          className={baseBtn}
          aria-label="Trang trước"
        >
          <ChevronLeft className="size-3.5" />
        </button>
        {pageList.map((entry, index) =>
          entry === "..." ? (
            <span key={`ellipsis-${index}`} className="px-1 text-slate-400">
              …
            </span>
          ) : (
            <button
              key={entry}
              type="button"
              onClick={() => onPageChange(entry)}
              aria-current={entry === safePage ? "page" : undefined}
              className={cn(
                baseBtn,
                entry === safePage &&
                  "!bg-primary !text-primary-foreground !border-primary shadow-xs font-bold hover:!bg-primary/90",
              )}
            >
              {entry}
            </button>
          ),
        )}
        <button
          type="button"
          onClick={() => onPageChange(Math.min(totalPages, safePage + 1))}
          disabled={safePage >= totalPages}
          className={baseBtn}
          aria-label="Trang sau"
        >
          <ChevronRight className="size-3.5" />
        </button>
        <button
          type="button"
          onClick={() => onPageChange(totalPages)}
          disabled={safePage >= totalPages}
          className={baseBtn}
          aria-label="Trang cuối"
        >
          <ChevronsRight className="size-3.5" />
        </button>
      </div>
    </div>
  );
}

