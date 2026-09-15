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

type ConfirmDialogProps = {
  trigger: ReactNode;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  isSubmitting?: boolean;
  onConfirm: () => void | Promise<unknown>;
};

export function ConfirmDialog({
  trigger,
  title,
  description,
  confirmLabel = "Xác nhận",
  cancelLabel = "Hủy",
  destructive = false,
  isSubmitting = false,
  onConfirm,
}: ConfirmDialogProps) {
  const [open, setOpen] = useState(false);

  const handleConfirm = async () => {
    if (isSubmitting) return;
    try {
      await onConfirm();
      setOpen(false);
    } catch {
      // lỗi đã có toast, giữ dialog mở.
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription
            className={description ? "mt-2 text-sm leading-relaxed" : "sr-only"}
          >
            {description ?? title}
          </DialogDescription>
        </DialogHeader>
        <div className="flex shrink-0 flex-col-reverse sm:flex-row justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isSubmitting}
            className="rounded-xl font-semibold"
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={destructive ? "destructive" : "default"}
            onClick={handleConfirm}
            disabled={isSubmitting}
            className="rounded-xl font-bold shadow-xs"
          >
            {isSubmitting ? "Đang xử lý..." : confirmLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

