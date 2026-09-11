import { Bar, Doughnut, Line, Pie, Scatter } from "react-chartjs-2";

import "@/lib/chartSetup";

const CHART_COMPONENTS = {
  bar: Bar,
  line: Line,
  pie: Pie,
  doughnut: Doughnut,
  scatter: Scatter,
} as const;

type ChartConfigRendererProps = {
  chartConfig: Record<string, unknown>;
};

/**
 * Vẽ nguyên trạng cấu hình Chart.js do AI (chatbot/create-report) sinh ra —
 * không tự parse/tái tạo dữ liệu, chỉ chọn đúng component theo chartConfig.type.
 */
export function ChartConfigRenderer({ chartConfig }: ChartConfigRendererProps) {
  const type = (chartConfig?.type as keyof typeof CHART_COMPONENTS) || "bar";
  const ChartComponent = CHART_COMPONENTS[type] ?? Bar;
  const data = chartConfig?.data as never;
  const options = (chartConfig?.options ?? {}) as Record<string, unknown>;

  if (!data) return null;

  return (
    <div className="h-72 w-full">
      <ChartComponent
        data={data}
        options={{ ...options, maintainAspectRatio: false, responsive: true }}
      />
    </div>
  );
}
