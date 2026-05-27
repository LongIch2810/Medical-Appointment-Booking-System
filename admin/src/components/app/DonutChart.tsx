import { useId } from "react";

import { cn } from "@/lib/utils";

export type DonutSegment = {
  key: string;
  label: string;
  value: number;
  color: string;
};

type DonutChartProps = {
  segments: DonutSegment[];
  size?: number;
  strokeWidth?: number;
  className?: string;
  centerTitle?: string;
  centerSubtitle?: string;
};

/**
 * Donut chart đơn giản dựng bằng SVG, không cần thêm thư viện chart.
 * Tự xử lý trường hợp tổng = 0 bằng cách hiển thị vòng tròn nền xám.
 */
export function DonutChart({
  segments,
  size = 200,
  strokeWidth = 26,
  className,
  centerTitle,
  centerSubtitle,
}: DonutChartProps) {
  const reactId = useId();
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const total = segments.reduce((sum, segment) => sum + segment.value, 0);
  const safeTotal = total > 0 ? total : 1;

  let offset = 0;

  return (
    <div className={cn("flex flex-col items-center gap-4", className)}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="-rotate-90"
        >
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#f0eee9"
            strokeWidth={strokeWidth}
          />
          {total > 0
            ? segments.map((segment) => {
                const segmentLength =
                  (segment.value / safeTotal) * circumference;
                const dashArray = `${segmentLength} ${circumference - segmentLength}`;
                const dashOffset = -offset;
                offset += segmentLength;
                return (
                  <circle
                    key={`${reactId}-${segment.key}`}
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke={segment.color}
                    strokeWidth={strokeWidth}
                    strokeDasharray={dashArray}
                    strokeDashoffset={dashOffset}
                    strokeLinecap="butt"
                  />
                );
              })
            : null}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="font-display text-3xl font-medium leading-none text-[#212121]">
            {centerTitle ?? total.toLocaleString()}
          </span>
          {centerSubtitle ? (
            <span className="mt-1 text-xs text-[#75758a]">{centerSubtitle}</span>
          ) : null}
        </div>
      </div>
      {segments.length > 0 ? (
        <ul className="grid w-full gap-2 text-xs text-[#212121]">
          {segments.map((segment) => {
            const percent = total
              ? Math.round((segment.value / total) * 100)
              : 0;
            return (
              <li
                key={segment.key}
                className="flex items-center justify-between gap-3"
              >
                <span className="flex items-center gap-2">
                  <span
                    className="inline-block size-2.5 rounded-full"
                    style={{ backgroundColor: segment.color }}
                  />
                  <span className="text-[#212121]">{segment.label}</span>
                </span>
                <span className="text-[#75758a]">
                  <span className="font-medium text-[#212121]">
                    {segment.value.toLocaleString()}
                  </span>
                  <span className="ml-1">({percent}%)</span>
                </span>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
