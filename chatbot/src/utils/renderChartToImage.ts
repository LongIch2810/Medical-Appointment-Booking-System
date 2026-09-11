import fs from "fs";
import { ChartJSNodeCanvas } from "chartjs-node-canvas";
import { HEIGHT_IMAGE_CHART, WIDTH_IMAGE_CHART } from "./constants.js";
import { z } from "zod";
import { ChartSchema } from "../tools/generate_chat_config.tool.js";
import ChartDataLabels from "chartjs-plugin-datalabels";
import path from "path";

type Chart = z.infer<typeof ChartSchema>;
type ChartConfig = Record<string, any>;
type ChartBufferRenderer = (chartConfig: ChartConfig) => Promise<Buffer>;

const ensureDir = (dir: string) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

const omitNullProperties = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(omitNullProperties);
  if (!value || typeof value !== "object") return value;

  return Object.fromEntries(
    Object.entries(value).flatMap(([key, child]) =>
      child === null || child === undefined
        ? []
        : [[key, omitNullProperties(child)]],
    ),
  );
};

export const normalizeChartConfig = (chartConfig: Chart): ChartConfig => {
  const normalized = omitNullProperties(chartConfig) as ChartConfig;
  const datalabels = normalized.options?.plugins?.datalabels;

  // Cấu hình do LLM sinh ra chỉ có thể biểu diễn formatter bằng string, trong
  // khi Chart.js yêu cầu callback function. Không truyền chuỗi này vào plugin.
  if (datalabels && typeof datalabels.formatter !== "function") {
    delete datalabels.formatter;
  }

  return normalized;
};

const getChartSummary = (chartConfig: ChartConfig) => ({
  type: chartConfig.type ?? "unknown",
  labelCount: Array.isArray(chartConfig.data?.labels)
    ? chartConfig.data.labels.length
    : 0,
  datasetCount: Array.isArray(chartConfig.data?.datasets)
    ? chartConfig.data.datasets.length
    : 0,
});

const getErrorDetails = (error: unknown) => {
  if (error instanceof Error) {
    return { message: error.message, stack: error.stack ?? "" };
  }
  return { message: String(error), stack: "" };
};

export const isDataLabelsRenderError = (error: unknown) =>
  getErrorDetails(error).stack.includes("chartjs-plugin-datalabels");

const withoutDataLabels = (chartConfig: ChartConfig): ChartConfig => {
  const options = { ...(chartConfig.options ?? {}) };
  const plugins = { ...(options.plugins ?? {}) };
  plugins.datalabels = { ...(plugins.datalabels ?? {}), display: false };

  return { ...chartConfig, options: { ...options, plugins } };
};

const renderToBuffer = async (chartConfig: ChartConfig): Promise<Buffer> => {
  const width = WIDTH_IMAGE_CHART;
  const height = HEIGHT_IMAGE_CHART;
  const canvas = new ChartJSNodeCanvas({
    width,
    height,
    backgroundColour: "white",
    plugins: { modern: [ChartDataLabels] },
  });

  // chartConfig đến từ ChartSchema (LLM structured output) — các field optional
  // đều mang thêm `| null` để tương thích ràng buộc "all optional fields must
  // be nullable" của OpenAI structured outputs, nhưng kiểu ChartConfiguration
  // của Chart.js không nhận null cho các field đó — ép kiểu tại ranh giới gọi
  // thư viện thay vì nới lỏng ChartSchema (schema cần giữ đúng chuẩn OpenAI).
  return canvas.renderToBuffer(chartConfig as any);
};

export const renderChartBufferWithFallback = async (
  chartConfig: Chart,
  renderer: ChartBufferRenderer = renderToBuffer,
): Promise<Buffer> => {
  const normalizedConfig = normalizeChartConfig(chartConfig);

  try {
    return await renderer(normalizedConfig);
  } catch (error) {
    if (!isDataLabelsRenderError(error)) throw error;

    const { message } = getErrorDetails(error);
    console.warn(
      "[renderChartToImage] datalabels render failed; retrying without labels",
      {
        ...getChartSummary(normalizedConfig),
        error: message,
      },
    );

    try {
      return await renderer(withoutDataLabels(normalizedConfig));
    } catch (fallbackError) {
      const { message: fallbackMessage } = getErrorDetails(fallbackError);
      console.error(
        "[renderChartToImage] fallback render without datalabels failed",
        {
          ...getChartSummary(normalizedConfig),
          error: fallbackMessage,
        },
      );
      throw fallbackError;
    }
  }
};

export const renderChartToImage = async (chartConfig: Chart) => {
  const tmpDir = path.resolve(process.cwd(), "tmp");
  ensureDir(tmpDir);
  const outputPath = path.join(tmpDir, `chart-${Date.now()}.png`);

  const buffer = await renderChartBufferWithFallback(chartConfig);
  fs.writeFileSync(outputPath, buffer);
  return outputPath;
};
