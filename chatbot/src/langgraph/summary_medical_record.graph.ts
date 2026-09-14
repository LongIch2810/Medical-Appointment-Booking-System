import * as dotenv from "dotenv";
import { Annotation, StateGraph } from "@langchain/langgraph";
import { DynamicStructuredTool } from "@langchain/core/tools";
import { normalizedImage } from "../utils/normalizedImage.js";
import { BenhAn, BenhAnSchema, ocrTool } from "../tools/ocr.tool.js";
import {
  BanGhiTomTat,
  SummaryMedicalRecordSchema,
  summarizeMedicalRecordTool,
} from "../tools/summary_medical_record.tool.js";
import { prepareMedicalRecordPdf } from "../utils/prepareMedicalRecordPdf.js";

dotenv.config();

export type FileParams =
  | { imageFiles: Express.Multer.File[]; outputFileName?: string }
  | { pdfFile: Express.Multer.File; outputFileName?: string };

const SummaryMedicalRecordState = Annotation.Root({
  fileParams: Annotation<FileParams>(),
  normalizedInput: Annotation<
    | Array<{ mimetype: string; base64: string }>
    | { mimetype: "application/pdf"; base64: string }
  >(),
  ocr: Annotation<BenhAn>(),
  summary: Annotation<BanGhiTomTat>(),
});

async function runTool<T extends DynamicStructuredTool>(
  tool: T,
  args: Record<string, any>,
) {
  const result = await tool.invoke(args);
  return result;
}

async function NormalizeInputNode(
  state: typeof SummaryMedicalRecordState.State,
) {
  if ("imageFiles" in state.fileParams) {
    const images = await Promise.all(
      state.fileParams.imageFiles.map((imgFile) => normalizedImage(imgFile)),
    );
    const normalizedInput = images.map((i) => ({
      mimetype: i.mimetype,
      base64: i.buffer.toString("base64"),
    }));

    return { normalizedInput };
  }

  const normalizedInput = await prepareMedicalRecordPdf(
    state.fileParams.pdfFile,
  );

  return { normalizedInput };
}

async function OcrNode(state: typeof SummaryMedicalRecordState.State) {
  const ocr = BenhAnSchema.parse(await runTool(ocrTool, state.normalizedInput));

  return { ocr };
}

async function SummaryNode(state: typeof SummaryMedicalRecordState.State) {
  const benh_an_json = JSON.stringify(state.ocr);

  const result = SummaryMedicalRecordSchema.parse(
    await runTool(summarizeMedicalRecordTool, { benh_an_json }),
  );
  const answer = result.answer.trim();
  if (!answer) {
    throw new Error("Medical record summary was empty.");
  }

  return { summary: { answer } };
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
