import {
  useCallback,
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type KeyboardEvent,
} from "react";
import {
  AlertCircle,
  FileText,
  Image as ImageIcon,
  UploadCloud,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  MAX_MEDICAL_RECORD_FILE_SIZE_BYTES,
  MAX_MEDICAL_RECORD_IMAGES,
  SUPPORTED_IMAGE_EXTENSIONS,
  SUPPORTED_IMAGE_MIME_TYPES,
  SUPPORTED_PDF_EXTENSIONS,
  SUPPORTED_PDF_MIME_TYPES,
  type MedicalRecordUploadMode,
  type UploadedMedicalFile,
} from "@/types/interface/medicalRecord.interface";
import { formatFileSize } from "@/utils/formatFileSize";

interface MedicalRecordUploaderProps {
  mode: MedicalRecordUploadMode;
  onModeChange: (newMode: MedicalRecordUploadMode) => void;
  files: UploadedMedicalFile[];
  onFilesChange: (newFiles: UploadedMedicalFile[]) => void;
  disabled?: boolean;
}

export function MedicalRecordUploader({
  mode,
  onModeChange,
  files,
  onFilesChange,
  disabled = false,
}: MedicalRecordUploaderProps) {
  const inputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const isImageMode = mode === "images";

  const validateAndProcessFiles = useCallback(
    (rawFiles: File[]) => {
      setValidationError(null);

      if (rawFiles.length === 0) return;

      // Rule: Do not mix image and PDF
      const hasImages = rawFiles.some((f) =>
        f.type ? f.type.startsWith("image/") : f.name.match(/\.(jpe?g|png|webp)$/i),
      );
      const hasPdfs = rawFiles.some((f) =>
        f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf"),
      );

      if (hasImages && hasPdfs) {
        setValidationError(
          "Không thể chọn đồng thời cả hình ảnh và file PDF. Vui lòng chỉ chọn một loại tài liệu.",
        );
        return;
      }

      // Check current mode matching
      if (isImageMode && hasPdfs) {
        setValidationError(
          "Bạn đang ở chế độ 'Tải ảnh'. Vui lòng chuyển sang tab 'Tải PDF' nếu muốn tải tài liệu PDF.",
        );
        return;
      }

      if (!isImageMode && hasImages) {
        setValidationError(
          "Bạn đang ở chế độ 'Tải PDF'. Vui lòng chuyển sang tab 'Tải ảnh' nếu muốn tải hình ảnh bệnh án.",
        );
        return;
      }

      // Check individual file sizes
      for (const file of rawFiles) {
        if (file.size > MAX_MEDICAL_RECORD_FILE_SIZE_BYTES) {
          setValidationError(
            `Tệp "${file.name}" vượt quá dung lượng tối đa 10 MB (${formatFileSize(file.size)}). Vui lòng nén hoặc chọn tệp nhỏ hơn.`,
          );
          return;
        }

        if (file.size === 0) {
          setValidationError(`Tệp "${file.name}" rỗng (0 bytes). Vui lòng chọn tệp hợp lệ.`);
          return;
        }

        if (isImageMode) {
          const isSupportedMime = (SUPPORTED_IMAGE_MIME_TYPES as readonly string[]).includes(
            file.type,
          );
          const hasSupportedExt = SUPPORTED_IMAGE_EXTENSIONS.some((ext) =>
            file.name.toLowerCase().endsWith(ext),
          );
          if (!isSupportedMime && !hasSupportedExt) {
            setValidationError(
              `Định dạng tệp "${file.name}" không được hỗ trợ. Chỉ chấp nhận ảnh định dạng JPG, JPEG, PNG hoặc WebP.`,
            );
            return;
          }
        } else {
          const isSupportedMime = (SUPPORTED_PDF_MIME_TYPES as readonly string[]).includes(
            file.type,
          );
          const hasSupportedExt = SUPPORTED_PDF_EXTENSIONS.some((ext) =>
            file.name.toLowerCase().endsWith(ext),
          );
          if (!isSupportedMime && !hasSupportedExt) {
            setValidationError(
              `Định dạng tệp "${file.name}" không hợp lệ. Chỉ chấp nhận tài liệu định dạng PDF.`,
            );
            return;
          }
        }
      }

      if (isImageMode) {
        // Can accumulate or replace, up to 5 total
        const remainingSlots = MAX_MEDICAL_RECORD_IMAGES - files.length;
        if (rawFiles.length > remainingSlots) {
          setValidationError(
            `Chỉ được chọn tối đa ${MAX_MEDICAL_RECORD_IMAGES} hình ảnh. Bạn đang có ${files.length} ảnh và vừa chọn thêm ${rawFiles.length} ảnh.`,
          );
          return;
        }

        const newUploadedFiles: UploadedMedicalFile[] = rawFiles.map((file) => ({
          id: `${file.name}-${file.lastModified}-${Math.random().toString(36).slice(2, 9)}`,
          file,
          previewUrl: URL.createObjectURL(file),
          name: file.name,
          size: file.size,
          type: file.type || "image/jpeg",
        }));

        onFilesChange([...files, ...newUploadedFiles]);
      } else {
        // PDF mode: exactly 1 PDF
        if (rawFiles.length > 1) {
          setValidationError("Chỉ được chọn duy nhất 1 file PDF cho mỗi lượt tóm tắt.");
          return;
        }

        const targetFile = rawFiles[0];
        if (!targetFile) return;

        // Revoke any previous preview URLs if replacing
        files.forEach((f) => {
          if (f.previewUrl) URL.revokeObjectURL(f.previewUrl);
        });

        const newUploadedFile: UploadedMedicalFile = {
          id: `${targetFile.name}-${targetFile.lastModified}-${Math.random().toString(36).slice(2, 9)}`,
          file: targetFile,
          name: targetFile.name,
          size: targetFile.size,
          type: targetFile.type || "application/pdf",
        };

        onFilesChange([newUploadedFile]);
      }
    },
    [files, isImageMode, onFilesChange],
  );

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;
    setIsDragOver(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (disabled) return;

    const droppedFiles = Array.from(e.dataTransfer.files);
    validateAndProcessFiles(droppedFiles);
  };

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      validateAndProcessFiles(selectedFiles);
    }
    // Reset file input value to allow re-selecting the same file if needed
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (!disabled) {
        fileInputRef.current?.click();
      }
    }
  };

  const handleSwitchMode = (newMode: MedicalRecordUploadMode) => {
    if (newMode === mode || disabled) return;
    setValidationError(null);
    onModeChange(newMode);
  };

  const acceptAttribute = isImageMode
    ? ".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
    : ".pdf,application/pdf";

  const isUploadDisabled =
    disabled ||
    (isImageMode && files.length >= MAX_MEDICAL_RECORD_IMAGES) ||
    (!isImageMode && files.length >= 1);

  return (
    <div className="space-y-4">
      {/* Mode Switcher Tabs */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-200/80 pb-3 dark:border-slate-800">
        <div className="flex items-center gap-1.5" role="tablist" aria-label="Chọn định dạng tải tài liệu">
          <button
            type="button"
            role="tab"
            aria-selected={isImageMode}
            onClick={() => handleSwitchMode("images")}
            disabled={disabled}
            className={cn(
              "flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition-all select-none cursor-pointer",
              isImageMode
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800",
            )}
          >
            <ImageIcon className="size-4" />
            <span>Tải ảnh (1 - 5 ảnh)</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={!isImageMode}
            onClick={() => handleSwitchMode("pdf")}
            disabled={disabled}
            className={cn(
              "flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition-all select-none cursor-pointer",
              !isImageMode
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800",
            )}
          >
            <FileText className="size-4" />
            <span>Tải PDF (1 file)</span>
          </button>
        </div>

        <Badge variant="outline" className="hidden sm:inline-flex text-[11px] font-semibold text-slate-500">
          Tối đa 10 MB / tệp
        </Badge>
      </div>

      {/* Validation Error Banner */}
      {validationError ? (
        <div
          role="alert"
          aria-live="polite"
          className="flex items-start gap-2.5 rounded-2xl border border-rose-200/80 bg-rose-50/70 p-3.5 text-xs text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300"
        >
          <AlertCircle className="size-4 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
          <p className="font-medium leading-relaxed">{validationError}</p>
        </div>
      ) : null}

      {/* Drag and Drop Zone */}
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled}
        aria-label={
          isImageMode
            ? "Khu vực tải hình ảnh bệnh án, nhấn Enter hoặc thả tệp để tải"
            : "Khu vực tải tệp PDF bệnh án, nhấn Enter hoặc thả tệp để tải"
        }
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => {
          if (!isUploadDisabled) {
            fileInputRef.current?.click();
          }
        }}
        onKeyDown={handleKeyDown}
        className={cn(
          "relative flex flex-col items-center justify-center rounded-3xl border-2 border-dashed p-6 sm:p-8 text-center transition-all cursor-pointer select-none outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
          isDragOver
            ? "border-primary bg-primary/5 scale-[1.01]"
            : "border-slate-300/90 bg-white/60 hover:border-primary/60 hover:bg-primary/5 dark:border-slate-700/80 dark:bg-slate-900/40 dark:hover:border-primary/60",
          isUploadDisabled &&
            "cursor-not-allowed opacity-60 hover:border-slate-300 hover:bg-transparent dark:hover:border-slate-700",
        )}
      >
        <input
          ref={fileInputRef}
          id={inputId}
          type="file"
          accept={acceptAttribute}
          multiple={isImageMode}
          onChange={handleFileInputChange}
          disabled={isUploadDisabled}
          className="sr-only"
        />

        <div
          className={cn(
            "flex size-14 items-center justify-center rounded-2xl transition-all shadow-2xs",
            isDragOver
              ? "bg-primary text-primary-foreground scale-110"
              : "bg-primary/10 text-primary group-hover:scale-105",
          )}
        >
          <UploadCloud className="size-7" />
        </div>

        <div className="mt-3.5 space-y-1">
          <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
            {isImageMode
              ? files.length >= MAX_MEDICAL_RECORD_IMAGES
                ? "Đã đạt giới hạn tối đa 5 hình ảnh"
                : "Kéo thả hình ảnh vào đây hoặc nhấp để tải lên"
              : files.length >= 1
                ? "Đã chọn tài liệu PDF (nhấp nếu muốn thay thế)"
                : "Kéo thả tệp PDF vào đây hoặc nhấp để tải lên"}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            {isImageMode
              ? "Hỗ trợ JPG, JPEG, PNG, WebP (tối đa 5 ảnh, ≤ 10 MB mỗi ảnh)"
              : "Hỗ trợ 1 file PDF (bệnh án, kết quả xét nghiệm, ≤ 10 MB)"}
          </p>
        </div>

        {/* Informative Micro Badges */}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          <span className="rounded-lg bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            {isImageMode ? "Tối đa 5 ảnh" : "Đúng 1 file PDF"}
          </span>
          <span className="rounded-lg bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            Giới hạn 10 MB / tệp
          </span>
          <span className="rounded-lg bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
            Bảo mật lâm sàng
          </span>
        </div>
      </div>
    </div>
  );
}
