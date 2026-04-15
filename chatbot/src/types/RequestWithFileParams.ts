import type { Request } from "express";
import { FileParams } from "../langgraph/summary_medical_record.graph.js";

type RequestWithFileParams = Request & { fileParams: FileParams };

export default RequestWithFileParams;
