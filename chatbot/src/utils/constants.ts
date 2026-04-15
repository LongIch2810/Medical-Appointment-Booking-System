import path, { dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const srcDir = path.resolve(__dirname, "..");
const dataFolder = "data";
const serviceFileName = "service.pdf";
const rulesFileName = "rules.pdf";
const pathFileServicePdf = path.join(srcDir, dataFolder, serviceFileName);
const pathFileRulesPdf = path.join(srcDir, dataFolder, rulesFileName);

export const WIDTH_IMAGE_CHART = 1000;
export const HEIGHT_IMAGE_CHART = 500;

export const FILE_PATHS = [pathFileServicePdf, pathFileRulesPdf];
