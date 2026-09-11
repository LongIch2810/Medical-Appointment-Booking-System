import { createHash, timingSafeEqual } from "node:crypto";
import { NextFunction, Request, Response } from "express";

export const INTERNAL_SERVICE_KEY_HEADER = "x-chatbot-internal-key";
export const MIN_INTERNAL_SERVICE_KEY_LENGTH = 32;

function digest(value: string): Buffer {
  return createHash("sha256").update(value, "utf8").digest();
}

export function isValidInternalServiceKey(
  provided: string | undefined,
  configured: string | undefined,
): boolean {
  if (!provided || !configured) return false;
  return timingSafeEqual(digest(provided), digest(configured));
}

export function assertInternalServiceKeyConfigured(): void {
  const key = process.env.CHATBOT_INTERNAL_KEY;
  if (!key || key.length < MIN_INTERNAL_SERVICE_KEY_LENGTH) {
    throw new Error(
      `CHATBOT_INTERNAL_KEY must contain at least ${MIN_INTERNAL_SERVICE_KEY_LENGTH} characters.`,
    );
  }
}

export function requireInternalServiceKey(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const configured = process.env.CHATBOT_INTERNAL_KEY;
  const provided = req.get(INTERNAL_SERVICE_KEY_HEADER);

  if (!configured || configured.length < MIN_INTERNAL_SERVICE_KEY_LENGTH) {
    res.status(503).json({
      success: false,
      code: "CHATBOT_AUTH_NOT_CONFIGURED",
      message: "Chatbot service authentication is not configured.",
    });
    return;
  }

  if (!isValidInternalServiceKey(provided, configured)) {
    res.status(401).json({
      success: false,
      code: "CHATBOT_UNAUTHORIZED",
      message: "Unauthorized chatbot service request.",
    });
    return;
  }

  next();
}
