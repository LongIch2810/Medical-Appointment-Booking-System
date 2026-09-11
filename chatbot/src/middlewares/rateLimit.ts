import { NextFunction, Request, Response } from "express";
import type { RequestWithActor } from "./requestIdentity.js";
import { RateLimitStore } from "./rateLimitStore.js";

type RateLimitOptions = {
  /** Không gian tên riêng cho từng loại flow (chat/report/roadmap/upload) —
   * tách bucket để một flow tốn kém không "ăn" hết quota của flow khác cho
   * cùng một user. */
  bucket: string;
  max: number;
  windowMs: number;
  store: RateLimitStore;
};

export function createRateLimit({ bucket, max, windowMs, store }: RateLimitOptions) {
  return async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    // Danh tính đã verify (JWT thật, xem requestIdentity.ts) là actor đáng
    // tin cậy cho rate limit — KHÔNG bao giờ dùng req.body.userId do client
    // tự khai báo. Chỉ fallback về IP cho các route không mang token người
    // dùng (vd. create-report).
    const actorUserId = (req as RequestWithActor).actorUserId;
    const actor =
      typeof actorUserId === "number"
        ? `user:${actorUserId}`
        : `ip:${req.ip || req.socket.remoteAddress || "unknown"}`;
    const key = `chatbot-rl:${bucket}:${actor}`;

    let count: number;
    try {
      count = await store.increment(key, windowMs);
    } catch (error) {
      // Fail-open trên lỗi hạ tầng Redis — không để một sự cố Redis chặn
      // toàn bộ chatbot; log để vận hành biết limiter đang không hoạt động.
      console.error(
        JSON.stringify({
          scope: "chatbot_rate_limit_error",
          bucket,
          message: error instanceof Error ? error.message : String(error),
        }),
      );
      next();
      return;
    }

    const resetAtSeconds = Math.ceil((Date.now() + windowMs) / 1_000);
    res.setHeader("RateLimit-Limit", max);
    res.setHeader("RateLimit-Remaining", Math.max(0, max - count));
    res.setHeader("RateLimit-Reset", resetAtSeconds);

    if (count > max) {
      res.status(429).json({
        success: false,
        code: "CHATBOT_RATE_LIMITED",
        message: "Too many chatbot requests. Please retry later.",
      });
      return;
    }

    next();
  };
}
