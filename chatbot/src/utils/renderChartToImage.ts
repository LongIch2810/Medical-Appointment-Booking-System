import fs from "fs";
import { ChartJSNodeCanvas } from "chartjs-node-canvas";
import { HEIGHT_IMAGE_CHART, WIDTH_IMAGE_CHART } from "./constants.js";
import { z } from "zod";
import { ChartSchema } from "../tools/generate_chat_config.tool.js";
import ChartDataLabels from "chartjs-plugin-datalabels";
import path from "path";

type Chart = z.infer<typeof ChartSchema>;

const ensureDir = (dir: string) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};
export const renderChartToImage = async (chartConfig: Chart) => {
  const tmpDir = path.resolve(process.cwd(), "tmp");
  ensureDir(tmpDir);
  const outputPath = path.join(tmpDir, `chart-${Date.now()}.png`);
  const width = WIDTH_IMAGE_CHART;
  const height = HEIGHT_IMAGE_CHART;
  const canvas = new ChartJSNodeCanvas({
    width,
    height,
    backgroundColour: "white",
    plugins: { modern: [ChartDataLabels] },
  });

  const buffer = await canvas.renderToBuffer(chartConfig);
  fs.writeFileSync(outputPath, buffer);
  return outputPath;
};
