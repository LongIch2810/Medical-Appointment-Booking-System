import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type FormDialogProps = {
  trigger: ReactNode;
  title: string;
  description?: string;
  submitLabel?: string;
  cancelLabel?: string;
  isSubmitting?: boolean;
  /** Reset form state when dialog opens (eg. cleared values for create). */
  onOpen?: () => void;
  /**
   * Khi handler resolve thành công thì dialog tự đóng.
   * Throw/reject để giữ dialog mở khi có lỗi.
   */
  onSubmit: () => void | Promise<unknown>;
  children: ReactNode;
  /** Extra classes for DialogContent (e.g. wider width). */
  dialogClassName?: string;
};

export function FormDialog({
  trigger,
  title,
  description,
  submitLabel = "Lưu",
  cancelLabel = "Hủy",
  isSubmitting = false,
  onOpen,
  onSubmit,
  children,
  dialogClassName = "max-w-xl",
}: FormDialogProps) {
  const [open, setOpen] = useState(false);
  const onOpenRef = useRef(onOpen);
  onOpenRef.current = onOpen;

  useEffect(() => {
    if (open) onOpenRef.current?.();
  }, [open]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;
    try {
      await onSubmit();
      setOpen(false);
    } catch {
      // giữ dialog mở để người dùng sửa, lỗi đã hiển thị qua toast.
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className={dialogClassName}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? (
            <DialogDescription>{description}</DialogDescription>
          ) : null}
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col min-h-0 flex-1 gap-4 pt-2">
          <div className="flex-1 min-h-0 min-w-0 overflow-y-auto overscroll-contain pr-1.5 scrollbar-soft flex flex-col gap-3.5">
            {children}
          </div>
          <div className="flex shrink-0 justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
              className="rounded-xl font-semibold"
            >
              {cancelLabel}
            </Button>
            <Button type="submit" disabled={isSubmitting} className="rounded-xl font-bold shadow-xs">
              {isSubmitting ? "Đang lưu..." : submitLabel}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

type FieldProps = {
  label: string;
  htmlFor?: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
};

export function FormField({
  label,
  htmlFor,
  hint,
  required,
  children,
}: FieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={htmlFor}
        className="text-xs font-bold text-slate-700 dark:text-slate-300"
      >
        {label}
        {required ? <span className="ml-0.5 text-rose-500">*</span> : null}
      </label>
      {children}
      {hint ? <span className="text-[11px] text-slate-500 dark:text-slate-400">{hint}</span> : null}
    </div>
  );
}

