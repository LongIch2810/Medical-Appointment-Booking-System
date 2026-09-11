import { ErrorRequestHandler } from "express";
import { normalizeChatbotError } from "../utils/retry.js";

const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  const uploadErrorCode =
    err && typeof err === "object" && "code" in err
      ? String((err as { code?: unknown }).code ?? "")
      : "";
  if (uploadErrorCode.startsWith("LIMIT_")) {
    const status =
      uploadErrorCode === "LIMIT_FILE_SIZE" ||
      uploadErrorCode === "LIMIT_FILE_COUNT"
        ? 413
        : 400;
    res.status(status).json({
      SC: status,
      code: uploadErrorCode,
      err: "Upload does not satisfy the file limits.",
    });
    return;
  }

  const normalized = normalizeChatbotError(err);
  const isServerError = normalized.status >= 500;

  res.status(normalized.status).json({
    SC: normalized.status,
    code: normalized.code,
    err: isServerError
      ? "Chatbot service could not process the request."
      : normalized.message,
  });
};

export default errorHandler;
