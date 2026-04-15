import cloudinary from "../configs/cloudinary.js";

export const uploadPdfToCloudinary = async (filePath: string) => {
  const result = await cloudinary.uploader.upload(filePath, {
    resource_type: "raw",
    folder: "pdfs",
    format: "pdf",
    use_filename: true,
    unique_filename: true,
    overwrite: false,
  });
  return {
    url: result.secure_url,
    public_id: result.public_id,
  };
};
