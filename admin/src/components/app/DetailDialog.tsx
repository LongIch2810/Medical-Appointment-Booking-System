import { useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export type DetailRow = {
  label: string;
  value: ReactNode;
};

type DetailDialogProps = {
  trigger: ReactNode;
  title: string;
  description?: string;
  rows: DetailRow[];
  /** Render thêm nội dung phía dưới grid (badge, list nhỏ, ghi chú...). */
  footer?: ReactNode;
  /** Render thay grid mặc định nếu cần layout custom. */
  body?: ReactNode;
};

/**
 * Dialog hiển thị chi tiết theo dạng grid label/value, dùng chung cho mọi
 * module list trong admin.
 */
export function DetailDialog({
  trigger,
  title,
  description,
  rows,
  footer,
  body,
}: DetailDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? (
            <DialogDescription>{description}</DialogDescription>
          ) : null}
        </DialogHeader>
        <div className="flex-1 min-h-0 min-w-0 overflow-y-auto overscroll-contain pr-1 scrollbar-soft space-y-3 pt-2">
          {body ?? (
            <div className="grid gap-3 sm:grid-cols-2">
              {rows.map((row) => (
                <div
                  key={row.label}
                  className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950/60"
                >
                  <div className="mono-label text-[10px] font-bold text-slate-500 dark:text-slate-400">
                    {row.label}
                  </div>
                  <div className="mt-1 text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 break-words">
                    {row.value ?? "-"}
                  </div>
                </div>
              ))}
            </div>
          )}
          {footer ? <div className="pt-2">{footer}</div> : null}
        </div>
        <div className="flex shrink-0 justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            className="rounded-xl font-semibold"
          >
            Đóng
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

