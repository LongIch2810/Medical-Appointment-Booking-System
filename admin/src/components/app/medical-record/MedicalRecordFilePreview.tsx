import { FileText, Image as ImageIcon, Trash2, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type {
  MedicalRecordUploadMode,
  UploadedMedicalFile,
} from "@/types/interface/medicalRecord.interface";
import { formatFileSize } from "@/utils/formatFileSize";

interface MedicalRecordFilePreviewProps {
  files: UploadedMedicalFile[];
  mode: MedicalRecordUploadMode;
  onRemove: (id: string) => void;
  onClearAll: () => void;
  disabled?: boolean;
}

export function MedicalRecordFilePreview({
  files,
  mode,
  onRemove,
  onClearAll,
  disabled = false,
}: MedicalRecordFilePreviewProps) {
  if (files.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {mode === "images"
              ? `Hình ảnh đã chọn (${files.length}/5)`
              : `Tài liệu PDF (${files.length}/1)`}
          </span>
          <Badge variant="outline" className="text-[11px] font-semibold">
            {formatFileSize(files.reduce((acc, curr) => acc + curr.size, 0))}
          </Badge>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onClearAll}
          disabled={disabled}
          className="h-7 text-xs text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:text-rose-400 dark:hover:bg-rose-950/40"
          aria-label="Xóa tất cả tệp đã chọn"
        >
          <Trash2 className="size-3.5" />
          Xóa tất cả
        </Button>
      </div>

      {mode === "images" ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {files.map((item, index) => (
            <Card
              key={item.id}
              className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-2 shadow-2xs transition-all hover:border-primary/40 dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="relative aspect-4/3 w-full overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800">
                {item.previewUrl ? (
                  <img
                    src={item.previewUrl}
                    alt={item.name}
                    className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-slate-400">
                    <ImageIcon className="size-8" />
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => onRemove(item.id)}
                  disabled={disabled}
                  className="absolute top-1.5 right-1.5 flex size-6 cursor-pointer items-center justify-center rounded-full bg-slate-900/70 text-white shadow-xs backdrop-blur-xs transition-colors hover:bg-rose-600 disabled:pointer-events-none"
                  aria-label={`Xóa ảnh ${item.name}`}
                  title="Xóa ảnh"
                >
                  <X className="size-3.5" />
                </button>
                <span className="absolute bottom-1.5 left-1.5 rounded-md bg-slate-900/60 px-1.5 py-0.5 text-[10px] font-bold text-white backdrop-blur-xs">
                  #{index + 1}
                </span>
              </div>
              <CardContent className="p-1.5 pt-2">
                <p
                  className="truncate text-xs font-semibold text-slate-800 dark:text-slate-200"
                  title={item.name}
                >
                  {item.name}
                </p>
                <p className="text-[11px] text-slate-400">
                  {formatFileSize(item.size)}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400">
                <FileText className="size-6" />
              </div>
              <div className="min-w-0">
                <p
                  className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100"
                  title={files[0]?.name}
                >
                  {files[0]?.name}
                </p>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Badge variant="outline" className="border-rose-200 px-1.5 py-0 text-[10px] font-bold text-rose-600 dark:border-rose-900 dark:text-rose-400">
                    PDF
                  </Badge>
                  <span>{files[0] ? formatFileSize(files[0].size) : ""}</span>
                </div>
              </div>
            </div>
            {files[0] ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onRemove(files[0]!.id)}
                disabled={disabled}
                className="size-8 p-0 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40"
                aria-label={`Xóa tệp ${files[0].name}`}
                title="Xóa tệp PDF"
              >
                <X className="size-4" />
              </Button>
            ) : null}
          </div>
        </Card>
      )}
    </div>
  );
}
