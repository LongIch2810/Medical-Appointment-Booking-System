import { BadRequestException, PayloadTooLargeException } from '@nestjs/common';

export const MAX_MEDICAL_RECORD_FILES = 5;
export const MAX_MEDICAL_RECORD_FILE_SIZE_BYTES = 10 * 1024 * 1024;

const SUPPORTED_IMAGE_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
]);

export type MedicalRecordUpload = {
  fieldName: 'images' | 'pdf';
  files: Express.Multer.File[];
};

export type MedicalRecordUploadFields = {
  images?: Express.Multer.File[];
  pdf?: Express.Multer.File[];
};

export function parseMedicalRecordUpload(
  fields: MedicalRecordUploadFields,
): MedicalRecordUpload {
  const images = fields.images ?? [];
  const pdfs = fields.pdf ?? [];

  if (
    (images.length === 0 && pdfs.length === 0) ||
    (images.length > 0 && pdfs.length > 0)
  ) {
    throw new BadRequestException(
      'Provide either images or one PDF, but not both.',
    );
  }

  if (images.length > MAX_MEDICAL_RECORD_FILES || pdfs.length > 1) {
    throw new BadRequestException('Too many medical record files.');
  }

  const files = images.length > 0 ? images : pdfs;
  for (const file of files) {
    if (file.size > MAX_MEDICAL_RECORD_FILE_SIZE_BYTES) {
      throw new PayloadTooLargeException(
        'Each medical record file must be 10 MB or smaller.',
      );
    }
  }

  if (
    images.length > 0 &&
    images.some((file) => !SUPPORTED_IMAGE_MIME_TYPES.has(file.mimetype))
  ) {
    throw new BadRequestException(
      'Only JPEG, PNG, and WebP images are supported.',
    );
  }
  if (pdfs.length > 0 && pdfs[0].mimetype !== 'application/pdf') {
    throw new BadRequestException(
      'Only PDF files are supported in the pdf field.',
    );
  }

  return {
    fieldName: images.length > 0 ? 'images' : 'pdf',
    files,
  };
}
