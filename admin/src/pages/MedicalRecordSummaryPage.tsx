import { useEffect, useRef, useState } from "react";
import { Sparkles, Stethoscope } from "lucide-react";

import { PageHeader } from "@/components/app/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMedicalRecordSummary } from "@/hooks/useMedicalRecordSummary";
import type {
  MedicalRecordUploadMode,
  UploadedMedicalFile,
} from "@/types/interface/medicalRecord.interface";
import { MedicalRecordFilePreview } from "@/components/app/medical-record/MedicalRecordFilePreview";
import { MedicalRecordSummaryResult } from "@/components/app/medical-record/MedicalRecordSummaryResult";
import { MedicalRecordUploader } from "@/components/app/medical-record/MedicalRecordUploader";
import { MedicalRecordSummaryHistory } from "@/components/app/MedicalRecordSummaryHistory";
import axiosInstance from "@/configs/axios";
import type { MedicalRecordSummaryData } from "@/types/interface/medicalRecord.interface";

export function MedicalRecordSummaryPage() {
  const [mode, setMode] = useState<MedicalRecordUploadMode>("images");
  const [files, setFiles] = useState<UploadedMedicalFile[]>([]);
  const [selectedHistory, setSelectedHistory] = useState<(MedicalRecordSummaryData & { id: number; createdAt: string; inputMode: string }) | null>(null);

  // Ref to track current files for clean memory release on unmount
  const filesRef = useRef<UploadedMedicalFile[]>(files);
  filesRef.current = files;

  const {
    mutate: summarize,
    isPending,
    summary,
    document: generatedDocument,
    friendlyError,
    generatedAt,
    resetSummary,
  } = useMedicalRecordSummary();

  // Cleanup object URLs on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      filesRef.current.forEach((item) => {
        if (item.previewUrl) {
          URL.revokeObjectURL(item.previewUrl);
        }
      });
    };
  }, []);

  const handleModeChange = (newMode: MedicalRecordUploadMode) => {
    if (newMode === mode) return;

    // Revoke old preview URLs when switching modes
    files.forEach((item) => {
      if (item.previewUrl) {
        URL.revokeObjectURL(item.previewUrl);
      }
    });

    setFiles([]);
    setMode(newMode);
  };

  const handleRemoveFile = (id: string) => {
    setFiles((prev) => {
      const fileToRemove = prev.find((item) => item.id === id);
      if (fileToRemove?.previewUrl) {
        URL.revokeObjectURL(fileToRemove.previewUrl);
      }
      return prev.filter((item) => item.id !== id);
    });
  };

  const handleClearAll = () => {
    files.forEach((item) => {
      if (item.previewUrl) {
        URL.revokeObjectURL(item.previewUrl);
      }
    });
    setFiles([]);
  };

  const handleGenerate = () => {
    if (isPending || files.length === 0) return;

    const rawFiles = files.map((item) => item.file);
    setSelectedHistory(null);
    summarize({ files: rawFiles, mode });
  };

  const downloadFile = async (path: string, fileName: string) => {
    if (!path) return;
    const response = await axiosInstance.get<Blob>(path.replace(/^\/api\/v1/, ""), { responseType: "blob" });
    const url = URL.createObjectURL(response.data);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
  };

  const displayedSummary = selectedHistory?.summary ?? summary;
  const displayedGeneratedAt = selectedHistory ? new Date(selectedHistory.createdAt) : generatedAt;

  const handleRegenerate = () => {
    resetSummary();
  };

  return (
    <div className="space-y-6">
      {/* Header with Title, Eyebrow and AI Assistant Badge */}
      <PageHeader
        eyebrow="AI Hỗ trợ lâm sàng"
        title="Tóm tắt bệnh án bằng AI"
        description="Tải lên tài liệu bệnh án dạng hình ảnh hoặc file PDF để AI trích xuất thông tin, hỗ trợ bác sĩ nắm bắt tiền sử và diễn biến bệnh nhanh chóng."
        extra={
          <Badge
            variant="default"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold shadow-2xs"
          >
            <Sparkles className="size-3.5" />
            <span>AI hỗ trợ</span>
          </Badge>
        }
      />

      {/* Two-Column Desktop Layout / Single Column on Tablet & Mobile */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
        {/* Left Column: Upload & Document Preview */}
        <div className="space-y-5 lg:col-span-5">
          <Card className="rounded-3xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
            <CardHeader className="p-0 pb-4 border-b border-slate-100 dark:border-slate-800">
              <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Stethoscope className="size-4 text-primary" />
                <span>Tài liệu bệnh án đầu vào</span>
              </CardTitle>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Chọn hoặc kéo thả tài liệu để chuẩn bị phân tích.
              </p>
            </CardHeader>

            <CardContent className="p-0 pt-4 space-y-5">
              <MedicalRecordUploader
                mode={mode}
                onModeChange={handleModeChange}
                files={files}
                onFilesChange={setFiles}
                disabled={isPending}
              />

              <MedicalRecordFilePreview
                files={files}
                mode={mode}
                onRemove={handleRemoveFile}
                onClearAll={handleClearAll}
                disabled={isPending}
              />

              {/* Main Action Button */}
              <div className="pt-2">
                <Button
                  type="button"
                  variant="default"
                  size="lg"
                  onClick={handleGenerate}
                  disabled={files.length === 0 || isPending}
                  className="w-full gap-2 rounded-2xl font-bold shadow-xs hover:shadow-md transition-all text-sm h-12"
                  aria-label="Tạo tóm tắt bệnh án"
                >
                  <Sparkles className="size-4" />
                  {isPending ? "Đang đọc và tóm tắt bệnh án…" : "Tạo tóm tắt"}
                </Button>

                <p className="mt-2 text-center text-[11px] text-slate-400 dark:text-slate-400">
                  Dữ liệu được xử lý bảo mật trong phiên làm việc, không lưu trữ vào bộ nhớ cục bộ.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: AI Summary Result */}
        <div className="space-y-5 lg:col-span-7">
          <MedicalRecordSummaryResult
            summary={displayedSummary}
            isLoading={isPending}
            error={friendlyError}
            generatedAt={displayedGeneratedAt}
            onRetry={handleGenerate}
            onRegenerate={handleRegenerate}
            document={selectedHistory?.document ?? generatedDocument}
            onDownloadFile={downloadFile}
          />
        </div>
      </div>
      <MedicalRecordSummaryHistory onSelect={setSelectedHistory} />
    </div>
  );
}
