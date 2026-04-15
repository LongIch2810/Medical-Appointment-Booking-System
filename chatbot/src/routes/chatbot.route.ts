import express from "express";
import {
  handleBuildHealthRoadMapController,
  handleChatController,
  handleCreateReportController,
  handleSummaryMedicalRecordController,
} from "../controllers/chatbot.controller.js";
import upload from "../configs/multer.js";
import { xorValidate } from "../middlewares/xorValidate.js";

const router = express.Router();

router.post("/chat", handleChatController);
router.post("/create-report", handleCreateReportController);
router.post("/build-health-roadmap", handleBuildHealthRoadMapController);
router.post(
  "/upload/summary-medical-record",
  upload.fields([
    { name: "images", maxCount: 5 },
    { name: "pdf", maxCount: 1 },
  ]),
  xorValidate,
  handleSummaryMedicalRecordController
);

export default router;
