import { cn } from "@/lib/utils";

export type StatusSegment = {
  key: string;
  label: string;
  value: number;
  color: string;
};

type SegmentedStatusBarProps = {
  segments: StatusSegment[];
  className?: string;
  emptyLabel?: string;
};

/**
 * Thanh ngang chia segment theo tỷ lệ, hữu ích khi cần biểu diễn nhanh
 * phân phối status trong tập dữ liệu nhỏ.
 */
export function SegmentedStatusBar({
  segments,
  className,
  emptyLabel = "Không có dữ liệu",
}: SegmentedStatusBarProps) {
  const total = segments.reduce((sum, segment) => sum + segment.value, 0);

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="flex h-3 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
        {total === 0
          ? null
          : segments.map((segment) => {
              const percent = (segment.value / total) * 100;
              if (percent <= 0) return null;
              return (
                <div
                  key={segment.key}
                  style={{
                    width: `${percent}%`,
                    backgroundColor: segment.color,
                  }}
                  className="h-full"
                  aria-label={`${segment.label}: ${segment.value}`}
                />
              );
            })}
      </div>
      {total === 0 ? (
        <p className="text-xs text-slate-500 dark:text-slate-400">{emptyLabel}</p>
      ) : (
        <ul className="grid grid-cols-2 gap-2 text-xs text-slate-800 dark:text-slate-200">
          {segments.map((segment) => {
            const percent = total
              ? Math.round((segment.value / total) * 100)
              : 0;
            return (
              <li
                key={segment.key}
                className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-800 dark:bg-slate-900"
              >
                <span className="flex items-center gap-2">
                  <span
                    className="inline-block size-2.5 rounded-full"
                    style={{ backgroundColor: segment.color }}
                  />
                  <span>{segment.label}</span>
                </span>
                <span className="text-slate-500 dark:text-slate-400">
                  <span className="font-semibold text-slate-900 dark:text-slate-100">
                    {segment.value}
                  </span>
                  <span className="ml-1">({percent}%)</span>
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
