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
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 max-h-[55vh] overflow-y-auto pr-1">{children}</div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              {cancelLabel}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
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
        className="text-xs font-medium text-[#212121]"
      >
        {label}
        {required ? <span className="ml-0.5 text-rose-500">*</span> : null}
      </label>
      {children}
      {hint ? <span className="text-[11px] text-[#75758a]">{hint}</span> : null}
    </div>
  );
}
