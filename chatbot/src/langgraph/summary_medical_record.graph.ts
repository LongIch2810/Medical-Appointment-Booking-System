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
import {
  NormalizedMedicalRecordFile,
  renderMedicalRecordPdf,
} from "../utils/renderMedicalRecordPdf.js";

dotenv.config();

export type FileParams =
  { imageFiles: Express.Multer.File[] } | { pdfFile: Express.Multer.File };

const SummaryMedicalRecordState = Annotation.Root({
  fileParams: Annotation<FileParams>(),
  normalizedInput: Annotation<Array<{ mimetype: string; base64: string }>>(),
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
  const objFileArr: NormalizedMedicalRecordFile[] =
    "imageFiles" in state.fileParams
      ? await Promise.all(
          state.fileParams.imageFiles.map((imgFile) =>
            normalizedImage(imgFile),
          ),
        )
      : await renderMedicalRecordPdf(state.fileParams.pdfFile);

  const normalizedInput = objFileArr.map((i) => ({
    mimetype: i.mimetype,
    base64: i.buffer.toString("base64"),
  }));

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
