import multer from "multer";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB / file (tuỳ bạn)
    files: 6, // tối đa 5 ảnh + 1 pdf
  },
});

export default upload;
