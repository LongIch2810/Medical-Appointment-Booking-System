import express from "express";
import {
  handleBuildHealthRoadMapController,
  handleChatController,
  handleCreateReportController,
  handleSummaryMedicalRecordController,
} from "../controllers/chatbot.controller.js";
import upload from "../configs/multer.js";
import { xorValidate } from "../middlewares/xorValidate.js";
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

  // Bucket riêng cho từng flow — chat là lưu lượng cao/rẻ, report/roadmap/
  // upload tốn tài nguyên hơn nên giới hạn thấp hơn, và tách riêng để một
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
  const healthRoadmapRateLimit = createRateLimit({
    bucket: "health-roadmap",
    max: 12,
    windowMs: 60_000,
    store: rateLimitStore,
  });
  const uploadRateLimit = createRateLimit({
    bucket: "upload",
    max: 12,
    windowMs: 60_000,
    store: rateLimitStore,
  });

  router.use(requireInternalServiceKey);
  router.use(attachVerifiedActor);

  router.post("/chat", chatRateLimit, handleChatController);
  router.post("/create-report", reportRateLimit, handleCreateReportController);
  router.post(
    "/build-health-roadmap",
    healthRoadmapRateLimit,
    handleBuildHealthRoadMapController,
  );
  router.post(
    "/upload/summary-medical-record",
    uploadRateLimit,
    upload.fields([
      { name: "images", maxCount: 5 },
      { name: "pdf", maxCount: 1 },
    ]),
    xorValidate,
    handleSummaryMedicalRecordController,
  );

  return router;
}

export default createChatbotRouter();
