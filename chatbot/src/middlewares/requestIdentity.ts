import jwt from "jsonwebtoken";
import { NextFunction, Request, Response } from "express";

export type RequestWithActor = Request & { actorUserId?: number };

function getBearerToken(req: Request): string | undefined {
  const authorization =
    typeof req.get === "function" ? req.get("authorization") : undefined;
  if (!authorization) return undefined;
  const [scheme, token] = authorization.split(/\s+/, 2);
  return scheme?.toLowerCase() === "bearer" && token ? token : undefined;
}

function parsePositiveInteger(value: unknown): number | null {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}

/**
 * Backend luôn forward chính access token thật của user (cookie accessToken)
 * trong `req.body.token` cho các route có ngữ cảnh người dùng (chat,
 * build-health-roadmap). Middleware này verify token đó bằng CHÍNH secret
 * mà backend dùng để ký (ACCESS_TOKEN_SECRET, phải khớp giữa 2 service) và
 * gắn `req.actorUserId` = subject đã verify — đây là danh tính đáng tin cậy
 * dùng cho rate limit, KHÔNG phải `req.body.userId` do client tự khai báo.
 *
 * Route không mang `token` (vd. create-report) sẽ không có actorUserId —
 * rate limiter sẽ fallback về IP cho các route đó (xem rateLimit.ts).
 */
export function attachVerifiedActor(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const token = getBearerToken(req) ?? req.body?.token;
  if (typeof token !== "string" || token.length === 0) {
    next();
    return;
  }

  const secret = process.env.ACCESS_TOKEN_SECRET;
  if (!secret) {
    res.status(503).json({
      success: false,
      code: "CHATBOT_AUTH_NOT_CONFIGURED",
      message: "Chatbot actor verification is not configured.",
    });
    return;
  }

  let payload: string | jwt.JwtPayload;
  try {
    payload = jwt.verify(token, secret);
  } catch {
    res.status(401).json({
      success: false,
      code: "CHATBOT_INVALID_ACTOR_TOKEN",
      message: "Invalid or expired user token.",
    });
    return;
  }

  const actorUserId =
    typeof payload === "object" ? parsePositiveInteger(payload.sub) : null;
  if (!actorUserId) {
    res.status(401).json({
      success: false,
      code: "CHATBOT_INVALID_ACTOR_TOKEN",
      message: "Invalid or expired user token.",
    });
    return;
  }

  const claimedUserId = req.body?.userId;
  if (
    claimedUserId !== undefined &&
    parsePositiveInteger(claimedUserId) !== actorUserId
  ) {
    res.status(401).json({
      success: false,
      code: "CHATBOT_ACTOR_MISMATCH",
      message: "userId does not match the authenticated token.",
    });
    return;
  }

  (req as RequestWithActor).actorUserId = actorUserId;
  next();
}
