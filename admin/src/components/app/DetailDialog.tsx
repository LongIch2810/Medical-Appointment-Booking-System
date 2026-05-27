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
        {body ?? (
          <div className="grid gap-3 md:grid-cols-2">
            {rows.map((row) => (
              <div
                key={row.label}
                className="rounded-lg border border-[#d9d9dd] bg-[#f7f6f2] p-4"
              >
                <div className="mono-label text-[10px] text-[#75758a]">
                  {row.label}
                </div>
                <div className="mt-1 text-sm font-medium text-[#212121]">
                  {row.value ?? "-"}
                </div>
              </div>
            ))}
          </div>
        )}
        {footer ? <div className="pt-2">{footer}</div> : null}
        <div className="flex justify-end pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
          >
            Đóng
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
