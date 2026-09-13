import cloudinary from "../configs/cloudinary.js";

export const uploadPdfToCloudinary = async (filePath: string) => {
  const result = await cloudinary.uploader.upload(filePath, {
    resource_type: "raw",
    type: "authenticated",
    folder: "ai-documents/results",
    format: "pdf",
    use_filename: true,
    unique_filename: true,
    overwrite: false,
  });
  const originalFileName = result.original_filename || "ai-document";
  return {
    publicId: result.public_id,
    resourceType: result.resource_type,
    format: result.format || "pdf",
    fileName: originalFileName.toLowerCase().endsWith(".pdf")
      ? originalFileName
      : `${originalFileName}.pdf`,
    bytes: result.bytes,
  };
};
