export type MedicalRecordUploadMode = "images" | "pdf";

export interface UploadedMedicalFile {
  id: string;
  file: File;
  previewUrl?: string;
  name: string;
  size: number;
  type: string;
}

export interface MedicalRecordSummaryData {
  summary: string;
}

export const MAX_MEDICAL_RECORD_IMAGES = 5;
export const MAX_MEDICAL_RECORD_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export const SUPPORTED_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export const SUPPORTED_IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"] as const;

export const SUPPORTED_PDF_MIME_TYPES = ["application/pdf"] as const;
export const SUPPORTED_PDF_EXTENSIONS = [".pdf"] as const;
