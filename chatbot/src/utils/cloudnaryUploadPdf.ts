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
  return {
    publicId: result.public_id,
    resourceType: result.resource_type,
    format: result.format || "pdf",
    fileName: `${result.original_filename || "ai-document"}.pdf`,
    bytes: result.bytes,
  };
};
