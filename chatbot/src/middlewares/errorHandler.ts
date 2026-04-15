import { ErrorRequestHandler } from "express";
import axios from "axios";

const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  if (
    axios.isAxiosError &&
    axios.isAxiosError(err) &&
    (err as any).response?.status === 401
  ) {
    res.status(401).json({ SC: 401, err: "Unauthorized" });
    return;
  }

  const status = err?.status || err?.statusCode || 500;
  const message = err?.message || "Internal Server Error";
  const details = err?.details ?? null;

  res.status(status).json({ SC: status, err: message, details });
};

export default errorHandler;
