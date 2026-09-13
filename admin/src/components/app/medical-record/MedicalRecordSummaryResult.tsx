import { useState } from "react";
import ReactMarkdown from "react-markdown";
import {
  AlertCircle,
  Check,
  Clock,
  Copy,
  Download,
  FileSearch,
  RotateCcw,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import { toast } from "react-toastify";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { MedicalRecordDocument } from "@/types/interface/medicalRecord.interface";

interface MedicalRecordSummaryResultProps {
  summary: string | null;
  isLoading: boolean;
  error: string | null;
  generatedAt: Date | null;
  onRetry: () => void;
  onRegenerate: () => void;
  document?: MedicalRecordDocument;
  onDownloadFile?: (path: string, fileName: string) => void;
  isViewingHistory?: boolean;
  onClearHistory?: () => void;
}

function formatGenerationTime(date: Date | null): string {
  if (!date) return "";
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${hours}:${minutes} ngày ${day}/${month}/${year}`;
}

export function MedicalRecordSummaryResult({
  summary,
  isLoading,
  error,
  generatedAt,
  onRetry,
  onRegenerate,
  document,
  onDownloadFile,
  isViewingHistory,
  onClearHistory,
}: MedicalRecordSummaryResultProps) {
  const [hasCopied, setHasCopied] = useState(false);

  const handleCopy = async () => {
    if (!summary) return;
    try {
      await navigator.clipboard.writeText(summary);
      setHasCopied(true);
      toast.success("Đã sao chép nội dung tóm tắt bệnh án vào clipboard!");
      setTimeout(() => setHasCopied(false), 2000);
    } catch {
      toast.error("Không thể sao chép tự động. Vui lòng chọn và sao chép thủ công.");
    }
  };

  // 1. Loading State
  if (isLoading) {
    return (
      <Card className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
        <div
          role="status"
          aria-live="polite"
          className="flex min-h-[420px] flex-col items-center justify-center text-center p-6 space-y-6"
        >
          {/* Medical ECG Pulse Animation */}
          <div className="relative flex items-center justify-center size-24">
            <span className="absolute inline-flex h-full w-full animate-ai-pulse-ring rounded-full bg-primary/20" />
            <span
              className="absolute inline-flex size-16 animate-ai-pulse-ring rounded-full bg-primary/25"
              style={{ animationDelay: "0.5s" }}
            />
            <svg viewBox="0 0 100 100" className="relative size-14">
              <circle
                cx="50"
                cy="50"
                r="46"
                className="fill-primary stroke-primary/30"
                strokeWidth="2"
              />
              <path
                d="M18 50 L34 50 L42 33 L50 66 L58 40 L66 50 L82 50"
                pathLength={100}
                strokeDasharray="24 12"
                className="fill-none stroke-white animate-ai-ecg-scroll"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <div className="space-y-2 max-w-md">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
              Đang đọc và tóm tắt bệnh án…
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              Hệ thống AI đang phân tích tài liệu hình ảnh/PDF, trích xuất dữ liệu cận lâm sàng và tổng hợp tiền sử bệnh lý. Quá trình có thể mất từ 10 - 30 giây.
            </p>
          </div>

          {/* Skeleton step progress indicator */}
          <div className="w-full max-w-sm space-y-2.5 pt-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-primary">
              <span className="inline-block size-2 rounded-full bg-primary animate-pulse" />
              <span>Đang trích xuất nội dung văn bản và hình ảnh lâm sàng...</span>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden dark:bg-slate-800">
              <div className="h-full bg-gradient-to-r from-primary/40 via-primary to-primary/80 animate-pulse rounded-full w-3/4" />
            </div>
            <div className="flex justify-between text-[11px] text-slate-400">
              <span>Nhận diện OCR / PDF</span>
              <span>Tổng hợp chẩn đoán AI</span>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  // 2. Error State
  if (error) {
    return (
      <Card className="rounded-3xl border border-rose-200/80 bg-white p-6 shadow-2xs dark:border-rose-900/60 dark:bg-slate-900">
        <div
          role="alert"
          aria-live="polite"
          className="flex min-h-[380px] flex-col items-center justify-center text-center p-6 space-y-4"
        >
          <div className="rounded-full bg-rose-50 p-4 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400">
            <AlertCircle className="size-8" />
          </div>
          <div className="space-y-1.5 max-w-md">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
              Không thể tạo tóm tắt bệnh án
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {error}
            </p>
          </div>
          <div className="pt-2 flex flex-wrap gap-2.5">
            <Button
              variant="default"
              size="sm"
              onClick={onRetry}
              className="gap-2 rounded-xl"
            >
              <RotateCcw className="size-4" />
              Thử lại ngay
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onRegenerate}
              className="rounded-xl"
            >
              Chọn lại tài liệu
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  // 3. Empty State
  if (!summary) {
    return (
      <Card className="rounded-3xl border-2 border-dashed border-slate-200/80 bg-slate-50/50 p-6 shadow-2xs dark:border-slate-800 dark:bg-slate-900/30">
        <div className="flex min-h-[420px] flex-col items-center justify-center text-center p-6 space-y-3.5">
          <div className="rounded-2xl bg-primary/10 p-4 text-primary">
            <FileSearch className="size-8" />
          </div>
          <div className="space-y-1 max-w-md">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Chưa có bản tóm tắt bệnh án
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              Vui lòng tải lên ảnh chụp phiếu khám, kết quả xét nghiệm hoặc 1 file PDF bệnh án ở cột bên trái, sau đó nhấn nút <strong>“Tạo tóm tắt”</strong> để nhận kết quả phân tích.
            </p>
          </div>
          <div className="flex items-center gap-2 pt-2">
            <Badge variant="outline" className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              <Sparkles className="size-3 text-primary mr-1" />
              Hỗ trợ tóm tắt đa tài liệu
            </Badge>
          </div>
        </div>
      </Card>
    );
  }

  // 4. Result State
  return (
    <div className="space-y-4">
      {/* Result Card */}
      <Card className="rounded-3xl border border-slate-200/80 bg-white shadow-2xs dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
        {/* History Banner */}
        {isViewingHistory ? (
          <div className="flex items-center justify-between gap-3 border-b border-primary/20 bg-primary/5 px-4 py-2.5 sm:px-5 dark:border-primary/30 dark:bg-primary/10">
            <div className="flex items-center gap-2 text-xs font-medium text-primary">
              <Clock className="size-3.5 shrink-0" />
              <span>
                Đang hiển thị bản tóm tắt lưu từ lịch sử ({generatedAt ? formatGenerationTime(generatedAt) : ""})
              </span>
            </div>
            {onClearHistory ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onClearHistory}
                className="h-7 rounded-lg text-xs font-bold text-primary hover:bg-primary/10 transition-colors cursor-pointer"
              >
                Tạo tóm tắt mới
              </Button>
            ) : null}
          </div>
        ) : null}

        {/* Card Header & Actions */}
        <CardHeader className="border-b border-slate-100 bg-slate-50/60 p-4 sm:p-5 dark:border-slate-800 dark:bg-slate-900/80">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Sparkles className="size-4 text-primary" />
                  Bản tóm tắt bệnh án AI
                </CardTitle>
                <Badge variant="success" className="text-[10px] font-bold px-2 py-0.5">
                  Hoàn tất
                </Badge>
              </div>
              {generatedAt ? (
                <p className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                  <Clock className="size-3 text-slate-400" />
                  <span>Tạo lúc: {formatGenerationTime(generatedAt)}</span>
                </p>
              ) : null}
            </div>

            <div className="flex items-center gap-2 self-start sm:self-center">
              {document?.pdfUrl && onDownloadFile ? <Button type="button" variant="outline" size="sm" className="gap-1.5 rounded-xl" onClick={() => onDownloadFile(document.pdfUrl, `tom-tat-benh-an-${document.id}.pdf`)}><Download className="size-3.5" />PDF</Button> : null}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCopy}
                className="gap-1.5 rounded-xl font-semibold text-xs shadow-2xs"
                aria-label="Sao chép nội dung tóm tắt bệnh án"
              >
                {hasCopied ? (
                  <>
                    <Check className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-emerald-700 dark:text-emerald-300">Đã sao chép</span>
                  </>
                ) : (
                  <>
                    <Copy className="size-3.5" />
                    <span>Sao chép tóm tắt</span>
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onRegenerate}
                className="gap-1.5 rounded-xl text-xs text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                aria-label="Tạo lại bản tóm tắt"
              >
                <RotateCcw className="size-3.5" />
                <span>Tạo lại</span>
              </Button>
            </div>
          </div>
        </CardHeader>

        {/* Clinical Safety Disclaimer Banner (Requirement 8) */}
        <div className="p-4 sm:p-5 pb-0">
          <div
            role="alert"
            aria-live="polite"
            className="flex items-start gap-3 rounded-2xl border border-amber-200/90 bg-amber-50/80 p-4 text-amber-900 shadow-2xs dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200"
          >
            <ShieldAlert className="size-5 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
            <div className="space-y-0.5 text-xs sm:text-sm">
              <p className="font-bold text-amber-900 dark:text-amber-100">
                Lưu ý an toàn y khoa bắt buộc:
              </p>
              <p className="text-amber-800/95 dark:text-amber-300/90 leading-relaxed">
                Nội dung do AI hỗ trợ tổng hợp từ tài liệu tải lên. Bác sĩ cần đối chiếu bệnh án gốc và chịu trách nhiệm cho quyết định chuyên môn.
              </p>
            </div>
          </div>
        </div>

        {/* Markdown Content Section */}
        <CardContent className="p-4 sm:p-6">
          <div className="medical-record-markdown space-y-4 text-slate-800 dark:text-slate-200 leading-relaxed text-sm">
            <ReactMarkdown
              components={{
                h1: ({ children }) => (
                  <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-slate-100 mt-4 mb-2 pb-1.5 border-b border-slate-200 dark:border-slate-800 tracking-tight">
                    {children}
                  </h1>
                ),
                h2: ({ children }) => (
                  <h2 className="text-base sm:text-lg font-bold text-teal-800 dark:text-teal-300 mt-4 mb-2 flex items-center gap-2">
                    <span className="inline-block size-1.5 rounded-full bg-teal-500" />
                    {children}
                  </h2>
                ),
                h3: ({ children }) => (
                  <h3 className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-200 mt-3 mb-1.5">
                    {children}
                  </h3>
                ),
                p: ({ children }) => (
                  <p className="mb-2.5 text-xs sm:text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                    {children}
                  </p>
                ),
                ul: ({ children }) => (
                  <ul className="list-disc list-outside pl-5 space-y-1 mb-3 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                    {children}
                  </ul>
                ),
                ol: ({ children }) => (
                  <ol className="list-decimal list-outside pl-5 space-y-1 mb-3 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                    {children}
                  </ol>
                ),
                li: ({ children }) => (
                  <li className="leading-relaxed">{children}</li>
                ),
                strong: ({ children }) => (
                  <strong className="font-bold text-slate-900 dark:text-slate-100">
                    {children}
                  </strong>
                ),
                blockquote: ({ children }) => (
                  <blockquote className="my-3 border-l-4 border-teal-500 bg-teal-50/60 p-3 rounded-r-xl text-xs sm:text-sm italic text-slate-700 dark:border-teal-400 dark:bg-teal-950/30 dark:text-slate-300">
                    {children}
                  </blockquote>
                ),
                table: ({ children }) => (
                  <div className="overflow-x-auto my-3 rounded-xl border border-slate-200 dark:border-slate-800">
                    <table className="w-full text-xs text-left">
                      {children}
                    </table>
                  </div>
                ),
                thead: ({ children }) => (
                  <thead className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold">
                    {children}
                  </thead>
                ),
                tbody: ({ children }) => (
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {children}
                  </tbody>
                ),
                tr: ({ children }) => (
                  <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    {children}
                  </tr>
                ),
                th: ({ children }) => (
                  <th className="p-2.5 font-bold">{children}</th>
                ),
                td: ({ children }) => (
                  <td className="p-2.5 text-slate-700 dark:text-slate-300">
                    {children}
                  </td>
                ),
                hr: () => (
                  <hr className="my-4 border-slate-200 dark:border-slate-800" />
                ),
                code: ({ children, className }) => (
                  <code
                    className={cn(
                      "rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-teal-800 dark:bg-slate-800 dark:text-teal-300",
                      className,
                    )}
                  >
                    {children}
                  </code>
                ),
              }}
            >
              {summary}
            </ReactMarkdown>
          </div>
        </CardContent>
        {document?.sourceFiles?.length && onDownloadFile ? (
          <div className="border-t border-slate-100 px-4 pb-5 sm:px-6 dark:border-slate-800">
            <p className="mb-2.5 pt-4 text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <FileSearch className="size-3.5 text-primary" />
              <span>File bệnh án gốc đã lưu ({document.sourceFiles.length} tệp)</span>
            </p>
            <div className="flex flex-wrap gap-2">
              {document.sourceFiles.map((file) => (
                <Button
                  key={file.id || file.fileName}
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1.5 rounded-xl text-xs font-medium hover:border-primary/40 hover:bg-primary/5 hover:text-primary transition-colors cursor-pointer"
                  onClick={() => onDownloadFile(file.fileUrl || "", file.fileName)}
                  title={`Tải xuống file gốc: ${file.fileName}`}
                  aria-label={`Tải xuống file bệnh án gốc: ${file.fileName}`}
                >
                  <Download className="size-3.5 text-slate-500" />
                  <span className="max-w-[180px] truncate">{file.fileName}</span>
                </Button>
              ))}
            </div>
          </div>
        ) : null}
      </Card>
    </div>
  );
}
