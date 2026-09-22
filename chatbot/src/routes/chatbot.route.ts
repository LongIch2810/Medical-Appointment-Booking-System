import express from "express";
import {
  handleBuildHealthRoadMapController,
  handleChatController,
  handleCreateReportController,
  handleReportAssistantController,
  handlePatientChatController,
  handleDeletePatientChatConversationController,
} from "../controllers/chatbot.controller.js";
import { requireInternalServiceKey } from "../middlewares/internalServiceAuth.js";
import { attachVerifiedActor } from "../middlewares/requestIdentity.js";
import { createRateLimit } from "../middlewares/rateLimit.js";
import {
  RateLimitStore,
  RedisRateLimitStore,
} from "../middlewares/rateLimitStore.js";
import { getRedisClient } from "../configs/redis.js";

export function createChatbotRouter(
  rateLimitStore: RateLimitStore = new RedisRateLimitStore(getRedisClient()),
) {
  const router = express.Router();

  // Bucket riêng cho từng flow — chat là lưu lượng cao/rẻ, report/roadmap
  // tốn tài nguyên hơn nên giới hạn thấp hơn, và tách riêng để một
  // flow tốn kém không ăn hết quota của flow khác cho cùng một user.
  const chatRateLimit = createRateLimit({
    bucket: "chat",
    max: 120,
    windowMs: 60_000,
    store: rateLimitStore,
  });
  const reportRateLimit = createRateLimit({
    bucket: "report",
    max: 12,
    windowMs: 60_000,
    store: rateLimitStore,
  });
  const patientChatRateLimit = createRateLimit({
    bucket: "patient-chat",
    max: 120,
    windowMs: 60_000,
    store: rateLimitStore,
  });
  const reportAssistantRateLimit = createRateLimit({
    bucket: "report-assistant-chat",
    max: 30,
    windowMs: 5 * 60_000,
    store: rateLimitStore,
  });
  const reportAssistantGenerationRateLimit = createRateLimit({
    bucket: "report-assistant-generation",
    max: 3,
    windowMs: 60 * 60_000,
    store: rateLimitStore,
  });
  const limitConfirmedReportGeneration = (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    if (req.body?.mode !== 'CONFIRM_PLAN') {
      next();
      return;
    }
    void reportAssistantGenerationRateLimit(req, res, next);
  };
  const healthRoadmapRateLimit = createRateLimit({
    bucket: "health-roadmap",
    max: 12,
    windowMs: 60_000,
    store: rateLimitStore,
  });
  router.use(requireInternalServiceKey);
  router.use(attachVerifiedActor);

  router.post("/chat", chatRateLimit, handleChatController);
  router.post("/patient-chat", patientChatRateLimit, handlePatientChatController);
  router.delete(
    "/patient-chat/conversations/:conversationId",
    patientChatRateLimit,
    handleDeletePatientChatConversationController,
  );
  router.post("/create-report", reportRateLimit, handleCreateReportController);
  router.post(
    "/report-assistant",
    reportAssistantRateLimit,
    limitConfirmedReportGeneration,
    handleReportAssistantController,
  );
  router.post(
    "/build-health-roadmap",
    healthRoadmapRateLimit,
    handleBuildHealthRoadMapController,
  );
  return router;
}

export default createChatbotRouter();
