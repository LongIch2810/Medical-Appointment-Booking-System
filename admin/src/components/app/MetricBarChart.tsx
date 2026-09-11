import { cn } from "@/lib/utils";

export type MetricBarItem = {
  key: string;
  label: string;
  value: number;
  color?: string;
  helper?: string;
};

type MetricBarChartProps = {
  items: MetricBarItem[];
  className?: string;
  /**
   * Khi có giá trị, dùng làm trần để vẽ tỉ lệ. Mặc định là max của items.
   * Hữu ích khi muốn so sánh trên cùng một thang.
   */
  maxValue?: number;
};

const DEFAULT_COLOR = "#007664";

/**
 * Bar chart dạng horizontal nhẹ, không cần dependency. Phù hợp so sánh
 * vài chỉ số trong dashboard.
 */
export function MetricBarChart({
  items,
  className,
  maxValue,
}: MetricBarChartProps) {
  const computedMax = Math.max(
    1,
    maxValue ?? items.reduce((max, item) => Math.max(max, item.value), 0),
  );

  return (
    <ul className={cn("flex flex-col gap-3", className)}>
      {items.map((item) => {
        const ratio = Math.min(1, item.value / computedMax);
        const widthPercent = `${ratio * 100}%`;
        return (
          <li key={item.key} className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-xs text-slate-800 dark:text-slate-200">
              <span>{item.label}</span>
              <span className="font-medium text-slate-900 dark:text-slate-100">
                {item.value.toLocaleString()}
              </span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: widthPercent,
                  backgroundColor: item.color ?? DEFAULT_COLOR,
                }}
              />
            </div>
            {item.helper ? (
              <span className="text-[11px] text-slate-500 dark:text-slate-400">{item.helper}</span>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
