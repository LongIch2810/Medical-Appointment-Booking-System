import * as dotenv from "dotenv";
import { Annotation, StateGraph } from "@langchain/langgraph";
import { DynamicStructuredTool } from "@langchain/core/tools";
import { normalizedImage } from "../utils/normalizedImage.js";
import { BenhAn, ocrTool } from "../tools/ocr.tool.js";
import {
  BanGhiTomTat,
  summarizeMedicalRecordTool,
} from "../tools/summary_medical_record.tool.js";

dotenv.config();

export type FileParams =
  | { imageFiles: Express.Multer.File[] }
  | { pdfFile: Express.Multer.File };

const SummaryMedicalRecordState = Annotation.Root({
  fileParams: Annotation<FileParams>(),
  normalizedInput: Annotation<Array<{ mimetype: string; base64: string }>>(),
  ocr: Annotation<BenhAn>(),
  summary: Annotation<BanGhiTomTat>(),
});

function logNode(node: string, msg: string) {
  console.log(`[SummaryGraph][${node}] ${msg}`);
}

function preview(s: string, max = 300) {
  return s.length <= max
    ? s
    : s.slice(0, max) + `... (truncated ${s.length - max} chars)`;
}

function safeJson(obj: any, max = 1200) {
  try {
    return preview(JSON.stringify(obj, null, 2), max);
  } catch {
    return "[cannot stringify]";
  }
}

async function runTool<T extends DynamicStructuredTool>(
  tool: T,
  args: Record<string, any>
) {
  const result = await tool.invoke(args);
  return result;
}

async function NormalizeInputNode(
  state: typeof SummaryMedicalRecordState.State
) {
  logNode("normalize_input_node", "START");

  const objFileArr =
    "imageFiles" in state.fileParams
      ? await Promise.all(
          state.fileParams.imageFiles.map((imgFile) => normalizedImage(imgFile))
        )
      : [
          {
            mimetype: state.fileParams.pdfFile.mimetype,
            buffer: state.fileParams.pdfFile.buffer,
          },
        ];

  const normalizedInput = objFileArr.map((i) => ({
    mimetype: i.mimetype,
    base64: i.buffer.toString("base64"),
  }));

  // ✅ log kết quả node (không log full base64)
  logNode(
    "normalize_input_node",
    `DONE -> normalizedInput.length=${
      normalizedInput.length
    }, mimetypes=${normalizedInput.map((x) => x.mimetype).join(", ")}`
  );

  normalizedInput.forEach((x, idx) => {
    logNode(
      "normalize_input_node",
      `item#${idx + 1}: mimetype=${x.mimetype}, base64Len=${
        x.base64.length
      }, base64Preview="${preview(x.base64, 40)}"`
    );
  });

  return { normalizedInput };
}

async function OcrNode(state: typeof SummaryMedicalRecordState.State) {
  logNode(
    "ocr_node",
    `START -> normalizedInput.length=${state.normalizedInput.length}`
  );

  const ocr = await runTool(ocrTool, state.normalizedInput);

  // ✅ log OCR output (preview)
  logNode("ocr_node", "DONE -> OCR result preview:");
  logNode("ocr_node", safeJson(ocr, 2000));

  return { ocr };
}

async function SummaryNode(state: typeof SummaryMedicalRecordState.State) {
  logNode("summary_node", "START");

  const benh_an_json = JSON.stringify(state.ocr);
  logNode("summary_node", `inputJsonLen=${benh_an_json.length}`);

  const result = await runTool(summarizeMedicalRecordTool, { benh_an_json });

  // ✅ tuỳ tool bạn trả ra field gì
  const answer =
    (result as any)?.answer ?? (result as any)?.summary ?? String(result ?? "");

  logNode("summary_node", `DONE -> answerLen=${answer.length}`);
  logNode("summary_node", `answerPreview:\n${preview(answer, 1200)}`);

  return { summary: result as any };
}

const workflow = new StateGraph(SummaryMedicalRecordState)
  .addNode("normalize_input_node", NormalizeInputNode)
  .addNode("ocr_node", OcrNode)
  .addNode("summary_node", SummaryNode)
  .addEdge("__start__", "normalize_input_node")
  .addEdge("normalize_input_node", "ocr_node")
  .addEdge("ocr_node", "summary_node")
  .addEdge("summary_node", "__end__");

export const summaryMedicalRecordGraph = workflow.compile();
