import { Request, Response } from "express";
import { ChatInput } from "../types/ChatInput.js";
import {
  handleChatService,
  handleCreateReportService,
  handleBuildHealthRoadMapService,
  handleDiagnosisService,
  handleSummaryMedicalRecordService,
} from "../services/chatbot.service.js";
import RequestWithFileParams from "../types/RequestWithFileParams.js";

const MAX_CHAT_QUESTION_LENGTH = 4_000;
const MAX_REPORT_QUESTION_LENGTH = 2_000;
const MAX_TOKEN_LENGTH = 16_384;

function isNonEmptyString(value: unknown, maxLength: number): value is string {
  return (
    typeof value === "string" &&
    value.trim().length > 0 &&
    value.length <= maxLength
  );
}

function parsePositiveInteger(value: unknown): number | null {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}

const handleChatController = async (
  req: Request,
  res: Response,
): Promise<any> => {
  const { question, userId, token }: ChatInput = req.body;
  if (!isNonEmptyString(question, MAX_CHAT_QUESTION_LENGTH)) {
    return res
      .status(400)
      .json({ success: false, message: "Question is invalid or too long." });
  }
  const parsedUserId = parsePositiveInteger(userId);
  if (!parsedUserId) {
    return res
      .status(400)
      .json({ success: false, message: "A valid userId is required." });
  }
  if (!isNonEmptyString(token, MAX_TOKEN_LENGTH)) {
    return res
      .status(400)
      .json({ success: false, message: "A valid token is required." });
  }
  const result = await handleChatService({
    question: question.trim(),
    userId: parsedUserId,
    token,
  });
  return res.status(200).json({ success: true, answer: result.answer });
};

const handleCreateReportController = async (
  req: Request,
  res: Response,
): Promise<any> => {
  const { question, fileName } = req.body;
  if (!isNonEmptyString(question, MAX_REPORT_QUESTION_LENGTH)) {
    return res
      .status(400)
      .json({ success: false, message: "Question is invalid or too long." });
  }

  const result = await handleCreateReportService({
    question: question.trim(),
    ...(isNonEmptyString(fileName, 200) ? { fileName: fileName.trim() } : {}),
  });
  return res.status(200).json({ success: true, data: result });
};

const handleBuildHealthRoadMapController = async (
  req: Request,
  res: Response,
): Promise<any> => {
  const { relative_id, token, fileName } = req.body;
  const relativeId = parsePositiveInteger(relative_id);

  if (!relativeId || !isNonEmptyString(token, MAX_TOKEN_LENGTH)) {
    return res
      .status(400)
      .json({ success: false, message: "relative_id and token are required." });
  }

  const result = await handleBuildHealthRoadMapService({
    relative_id: relativeId,
    token,
    ...(isNonEmptyString(fileName, 200) ? { fileName: fileName.trim() } : {}),
  });

  return res.status(200).json({ success: true, data: result });
};

const handleDiagnosisController = async (
  req: Request,
  res: Response,
): Promise<any> => {
  const { text_input, relative_id, token } = req.body;
  const relativeId = parsePositiveInteger(relative_id);

  if (
    !isNonEmptyString(text_input, MAX_CHAT_QUESTION_LENGTH) ||
    !relativeId ||
    !isNonEmptyString(token, MAX_TOKEN_LENGTH)
  ) {
    return res.status(400).json({
      success: false,
      message: "text_input, relative_id and token are required.",
    });
  }

  const result = await handleDiagnosisService({
    text_input: text_input.trim(),
    relative_id: relativeId,
    token,
  });

  return res.status(200).json({ success: true, data: result });
};

const handleSummaryMedicalRecordController = async (
  req: Request,
  res: Response,
): Promise<any> => {
  const fileParams = (req as RequestWithFileParams).fileParams;
  const answer = await handleSummaryMedicalRecordService(fileParams);
  return res.status(200).json({ success: true, data: answer });
};

export {
  handleChatController,
  handleCreateReportController,
  handleBuildHealthRoadMapController,
  handleDiagnosisController,
  handleSummaryMedicalRecordController,
};
