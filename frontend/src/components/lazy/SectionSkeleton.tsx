import React from "react";
import { cn } from "@/lib/utils";

export interface SectionSkeletonProps {
  /** Chiều cao tối thiểu (pixel hoặc chuỗi CSS) để giữ chỗ layout, chống CLS */
  minHeight?: number | string;
  /** Tiêu đề giả lập của section */
  title?: string;
  /** Mô tả ngắn giả lập */
  description?: string;
  /** Dạng layout hiển thị: cards (4 cột), grid (5 cột nhỏ), hoặc simple */
  type?: "cards" | "grid" | "simple";
  /** Số lượng card giả lập hiển thị */
  cardCount?: number;
  className?: string;
}

export const SectionSkeleton: React.FC<SectionSkeletonProps> = ({
  minHeight = 400,
  title,
  description,
  type = "cards",
  cardCount = 4,
  className,
}) => {
  const minHeightStyle =
    typeof minHeight === "number" ? `${minHeight}px` : minHeight;

  return (
    <section
      role="status"
      aria-label="Đang tải nội dung..."
      style={{ minHeight: minHeightStyle }}
      className={cn(
        "w-full py-10 sm:py-14 transition-opacity duration-300",
        className
      )}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header Placeholder */}
        <div className="mb-8 space-y-2.5 max-w-xl">
          {title ? (
            <div className="flex items-center gap-2">
              <div className="h-4 w-28 rounded-md bg-slate-200/80 dark:bg-slate-800 animate-pulse" />
              <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                {title}
              </span>
            </div>
          ) : (
            <div className="h-4 w-32 rounded-md bg-slate-200/80 dark:bg-slate-800 animate-pulse" />
          )}

          <div className="h-7 w-3/4 max-w-sm rounded-lg bg-slate-200/90 dark:bg-slate-800 animate-pulse" />
          {description ? (
            <p className="text-xs text-slate-400 dark:text-slate-500">
              {description}
            </p>
          ) : (
            <div className="h-4 w-full max-w-md rounded-md bg-slate-100 dark:bg-slate-800/60 animate-pulse" />
          )}
        </div>

        {/* Content Cards Placeholder */}
        {type === "cards" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
            {Array.from({ length: cardCount }).map((_, index) => (
              <div
                key={index}
                className="rounded-3xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/60 dark:bg-slate-900/40 p-5 space-y-4 animate-pulse"
              >
                <div className="flex items-center gap-3.5">
                  <div className="h-14 w-14 rounded-2xl bg-slate-200 dark:bg-slate-800 shrink-0" />
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="h-4 w-3/4 rounded bg-slate-200 dark:bg-slate-800" />
                    <div className="h-3 w-1/2 rounded bg-slate-200/70 dark:bg-slate-800/70" />
                  </div>
                </div>
                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="h-3 w-full rounded bg-slate-200/60 dark:bg-slate-800/60" />
                  <div className="h-3 w-4/5 rounded bg-slate-200/50 dark:bg-slate-800/50" />
                </div>
              </div>
            ))}
          </div>
        )}

        {type === "grid" && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 sm:gap-4 lg:gap-5">
            {Array.from({ length: cardCount || 10 }).map((_, index) => (
              <div
                key={index}
                className="flex flex-col items-center p-4 sm:p-5 rounded-2xl bg-slate-50/60 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800 animate-pulse space-y-3"
              >
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-slate-200 dark:bg-slate-800" />
                <div className="h-3.5 w-20 rounded bg-slate-200 dark:bg-slate-800" />
              </div>
            ))}
          </div>
        )}

        {type === "simple" && (
          <div className="w-full h-48 rounded-3xl bg-slate-100/70 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800 animate-pulse flex items-center justify-center">
            <div className="h-4 w-40 rounded bg-slate-200 dark:bg-slate-800" />
          </div>
        )}
      </div>
    </section>
  );
};

export default SectionSkeleton;
