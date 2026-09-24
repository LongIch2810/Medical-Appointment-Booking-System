import { Request, Response } from "express";
import { ChatInput } from "../types/ChatInput.js";
import { REPORT_ASSISTANT_ACTIONS, ReportPlanSchema } from "../types/ReportAssistant.js";
import type { ReportAssistantAction, ReportAssistantInput } from "../types/ReportAssistant.js";
import type { RequestWithActor } from "../middlewares/requestIdentity.js";
import { PatientChatHistorySchema, type PatientChatInput } from "../types/PatientChat.js";
import { z } from "zod";
import {
  handleChatService,
  handleReportAssistantService,
  handleDiagnosisService,
  handlePatientChatService,
  handleDeletePatientChatConversationService,
} from "../services/chatbot.service.js";

const MAX_CHAT_QUESTION_LENGTH = 4_000;
const MAX_TOKEN_LENGTH = 16_384;
const MAX_REPORT_ASSISTANT_MESSAGE_LENGTH = 4_000;
const bookingSummarySchema = z.object({
  patientName: z.string().min(1).max(200),
  createsRelative: z.boolean(),
  specialtyName: z.string().min(1).max(200),
  doctorName: z.string().min(1).max(200).optional(),
  appointmentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/).nullable(),
}).strict();

function getBearerToken(req: Request): string | undefined {
  const authorization = req.get("authorization");
  const [scheme, token] = authorization?.split(/\s+/, 2) ?? [];
  return scheme?.toLowerCase() === "bearer" && token ? token : undefined;
}

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

const handleReportAssistantController = async (
  req: Request,
  res: Response,
): Promise<any> => {
  const body = req.body ?? {};
  const userId = parsePositiveInteger(body.userId);
  const actorUserId = (req as RequestWithActor).actorUserId;
  if (!userId || !actorUserId || actorUserId !== userId) {
    return res.status(401).json({
      success: false,
      code: "CHATBOT_ACTOR_MISMATCH",
      message: "A verified admin identity is required.",
    });
  }
  const conversationId = parsePositiveInteger(body.conversationId);
  const turnId = parsePositiveInteger(body.turnId);
  const mode = body.mode;
  const expectedThreadId = conversationId
    ? `report-assistant:v1:${userId}:${conversationId}`
    : '';
  if (
    !conversationId ||
    !turnId ||
    !['MESSAGE', 'CONFIRM_PLAN'].includes(mode) ||
    body.threadId !== expectedThreadId
  ) {
    return res.status(401).json({
      success: false,
      code: 'CHATBOT_ACTOR_MISMATCH',
      message: 'A verified report conversation identity is required.',
    });
  }
  if (!isNonEmptyString(body.message, MAX_REPORT_ASSISTANT_MESSAGE_LENGTH)) {
    return res.status(400).json({
      success: false,
      code: "REPORT_ASSISTANT_INVALID_INPUT",
      message: "Message is invalid or too long.",
    });
  }
  if (
    body.sourceRequest !== undefined &&
    !isNonEmptyString(body.sourceRequest, MAX_REPORT_ASSISTANT_MESSAGE_LENGTH)
  ) {
    return res.status(400).json({
      success: false,
      code: "REPORT_ASSISTANT_INVALID_INPUT",
      message: "Source request is invalid or too long.",
    });
  }
  if (body.mode === 'CONFIRM_PLAN' && !body.confirmedPlan) {
    return res.status(409).json({
      success: false,
      code: 'REPORT_PLAN_STALE',
      message: 'The pending report plan is no longer valid.',
    });
  }
  if (body.mode === 'MESSAGE' && body.confirmedPlan !== undefined) {
    return res.status(400).json({
      success: false,
      code: 'REPORT_ASSISTANT_INVALID_INPUT',
      message: 'A confirmed plan is only valid in confirmation mode.',
    });
  }
  if (
    body.historySeed !== undefined &&
    (!Array.isArray(body.historySeed) || body.historySeed.length > 12)
  ) {
    return res.status(400).json({
      success: false,
      code: "REPORT_ASSISTANT_INVALID_INPUT",
      message: "Conversation history is invalid.",
    });
  }

  const historySeed: NonNullable<ReportAssistantInput['historySeed']> = [];
  let contextCharacters = 0;
  for (const item of body.historySeed ?? []) {
    if (
      !item ||
      !["user", "assistant"].includes(item.role) ||
      typeof item.content !== "string"
    ) {
      return res.status(400).json({
        success: false,
        code: "REPORT_ASSISTANT_INVALID_INPUT",
        message: "Conversation history is invalid.",
      });
    }
    contextCharacters += item.content.length + (item.plan ? JSON.stringify(item.plan).length : 0);
    if (contextCharacters > 12_000) {
      return res.status(400).json({
        success: false,
        code: "REPORT_ASSISTANT_INVALID_INPUT",
        message: "Conversation history is too long.",
      });
    }
    if (
      item.action !== undefined &&
      !REPORT_ASSISTANT_ACTIONS.includes(item.action as ReportAssistantAction)
    ) {
      return res.status(400).json({
        success: false,
        code: "REPORT_ASSISTANT_INVALID_INPUT",
        message: "Conversation history is invalid.",
      });
    }
    const plan = item.plan !== undefined ? ReportPlanSchema.safeParse(item.plan) : undefined;
    if (item.plan !== undefined && !plan?.success) {
      return res.status(400).json({
        success: false,
        code: 'REPORT_ASSISTANT_INVALID_INPUT',
        message: 'Conversation history is invalid.',
      });
    }
    historySeed.push({
      role: item.role,
      content: item.content,
      ...(item.action ? { action: item.action as ReportAssistantAction } : {}),
      ...(plan?.success ? { plan: plan.data } : {}),
    });
  }
  const confirmedPlan = body.confirmedPlan
    ? ReportPlanSchema.safeParse(body.confirmedPlan)
    : undefined;
  if (body.confirmedPlan && !confirmedPlan?.success) {
    return res.status(400).json({
      success: false,
      code: "REPORT_ASSISTANT_INVALID_INPUT",
      message: "Confirmed report plan is invalid.",
    });
  }
  const input: ReportAssistantInput = {
    userId,
    conversationId,
    turnId,
    threadId: body.threadId,
    mode,
    message: body.message.trim(),
    ...(isNonEmptyString(body.sourceRequest, MAX_REPORT_ASSISTANT_MESSAGE_LENGTH)
      ? { sourceRequest: body.sourceRequest.trim() }
      : {}),
    ...(body.mode === 'MESSAGE' && body.historySeed !== undefined ? { historySeed } : {}),
    ...(confirmedPlan?.success ? { confirmedPlan: confirmedPlan.data } : {}),
    ...(isNonEmptyString(body.fileName, 200) ? { fileName: body.fileName.trim() } : {}),
  };
  const result = await handleReportAssistantService(input);
  return res.status(200).json({ success: true, data: result });
};

const handlePatientChatController = async (req: Request, res: Response): Promise<any> => {
  const body = req.body ?? {};
  const actorUserId = (req as RequestWithActor).actorUserId;
  const userId = parsePositiveInteger(body.userId);
  const conversationId = parsePositiveInteger(body.conversationId);
  const turnId = typeof body.turnId === 'string' ? body.turnId : '';
  const expectedThreadId = userId && conversationId
    ? `patient-chat:v1:${userId}:${conversationId}`
    : '';
  const token = getBearerToken(req);
  if (!actorUserId || !userId || actorUserId !== userId || !conversationId || !token) {
    return res.status(401).json({
      success: false,
      code: 'CHATBOT_ACTOR_MISMATCH',
      message: 'A verified patient identity is required.',
    });
  }
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(turnId) ||
    body.threadId !== expectedThreadId ||
    !['MESSAGE', 'RESUME_BOOKING'].includes(body.mode)
  ) {
    return res.status(400).json({
      success: false,
      code: 'PATIENT_CHAT_INVALID_INPUT',
      message: 'Patient chat identity or mode is invalid.',
    });
  }

  const input: PatientChatInput = {
    userId,
    conversationId,
    turnId,
    threadId: body.threadId,
    mode: body.mode,
    token,
  } as PatientChatInput;
  if (body.mode === 'MESSAGE') {
    if (!isNonEmptyString(body.message, MAX_CHAT_QUESTION_LENGTH)) {
      return res.status(400).json({
        success: false,
        code: 'PATIENT_CHAT_INVALID_INPUT',
        message: 'Message is invalid or too long.',
      });
    }
    if (body.decision !== undefined || body.approvalMessageId !== undefined || body.operationId !== undefined) {
      return res.status(400).json({
        success: false,
        code: 'PATIENT_CHAT_INVALID_INPUT',
        message: 'Booking approval fields are not valid for a message turn.',
      });
    }
    input.message = body.message.trim();
    const history = PatientChatHistorySchema.safeParse(body.historySeed ?? []);
    if (!history.success || history.data.reduce((sum, item) => sum + item.content.length + JSON.stringify(item.payload ?? '').length, 0) > 12_000) {
      return res.status(400).json({
        success: false,
        code: 'PATIENT_CHAT_INVALID_INPUT',
        message: 'Conversation history is invalid or too long.',
      });
    }
    input.historySeed = history.data;
  } else {
    const decision = body.decision;
    const operationId = typeof body.operationId === 'string' ? body.operationId : '';
    const approvalMessageId = parsePositiveInteger(body.approvalMessageId);
    const bookingSummary = bookingSummarySchema.safeParse(body.bookingSummary);
    if (
      !['APPROVE', 'REVISE', 'CANCEL'].includes(decision) ||
      !approvalMessageId ||
      !/^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(operationId) ||
      !bookingSummary.success ||
      (decision === 'REVISE' && !isNonEmptyString(body.message, MAX_CHAT_QUESTION_LENGTH))
    ) {
      return res.status(400).json({
        success: false,
        code: 'PATIENT_CHAT_INVALID_INPUT',
        message: 'Booking approval is invalid.',
      });
    }
    input.decision = decision;
    input.approvalMessageId = approvalMessageId;
    input.operationId = operationId;
    input.bookingSummary = bookingSummary.data;
    if (decision === 'REVISE') input.message = body.message.trim();
  }

  const result = await handlePatientChatService(input);
  return res.status(200).json({ success: true, data: result });
};

const handleDeletePatientChatConversationController = async (req: Request, res: Response): Promise<any> => {
  const actorUserId = (req as RequestWithActor).actorUserId;
  const userId = parsePositiveInteger(req.body?.userId);
  const conversationId = parsePositiveInteger(req.params.conversationId);
  if (!actorUserId || !userId || actorUserId !== userId || !conversationId || !getBearerToken(req)) {
    return res.status(401).json({
      success: false,
      code: 'CHATBOT_ACTOR_MISMATCH',
      message: 'A verified patient identity is required.',
    });
  }
  const result = await handleDeletePatientChatConversationService(userId, conversationId);
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

export {
  handleChatController,
  handleReportAssistantController,
  handlePatientChatController,
  handleDeletePatientChatConversationController,
  handleDiagnosisController,
};
