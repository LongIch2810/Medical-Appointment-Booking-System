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

const handleChatController = async (
  req: Request,
  res: Response
): Promise<any> => {
  const { question, userId, token }: ChatInput = req.body;
  if (!question) {
    return res
      .status(400)
      .json({ success: false, message: "Question is required." });
  }
  const result = await handleChatService({ question, userId, token });
  return res.status(200).json({ success: true, answer: result.answer });
};

const handleCreateReportController = async (
  req: Request,
  res: Response
): Promise<any> => {
  const { question } = req.body;
  if (!question) {
    return res
      .status(400)
      .json({ success: false, message: "Question is required." });
  }

  const result = await handleCreateReportService({ question });
  return res.status(200).json({ success: true, data: result });
};

const handleBuildHealthRoadMapController = async (
  req: Request,
  res: Response
): Promise<any> => {
  const { relative_id, token } = req.body;

  if (!relative_id || !token) {
    return res
      .status(400)
      .json({ success: false, message: "relative_id and token are required." });
  }

  const result = await handleBuildHealthRoadMapService({
    relative_id: Number(relative_id),
    token,
  });

  return res.status(200).json({ success: true, data: result });
};

const handleDiagnosisController = async (
  req: Request,
  res: Response
): Promise<any> => {
  const { text_input, relative_id, token } = req.body;

  if (!text_input || !relative_id || !token) {
    return res.status(400).json({
      success: false,
      message: "text_input, relative_id and token are required.",
    });
  }

  const result = await handleDiagnosisService({
    text_input,
    relative_id: Number(relative_id),
    token,
  });

  return res.status(200).json({ success: true, data: result });
};

const handleSummaryMedicalRecordController = async (
  req: Request,
  res: Response
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
