import { useFilterDoctorsStore } from "@/store/filterDoctorsStore";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import FilterItem from "../item/FilterItem";
import { Briefcase } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const DialogInputWorkplace = ({ className = "" }: { className: string }) => {
  const { workplaceInput, setWorkplaceInput } = useFilterDoctorsStore();
  const [tempValue, setTempValue] = useState(workplaceInput || "");
  const [open, setOpen] = useState(false);
  // Lưu giá trị vào store + đóng dialog
  const handleSave = () => {
    setWorkplaceInput(tempValue);
    setOpen(false); // ✅ Đóng dialog
  };

  // Reset giá trị và đóng dialog
  const handleClose = () => {
    setTempValue(workplaceInput || "");
    setOpen(false); // ✅ Đóng dialog
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        setOpen(isOpen);
        if (isOpen) {
          // Khi mở dialog → reset input theo store
          setTempValue(workplaceInput || "");
        }
      }}
    >
      {/* Nút mở dialog */}
      <DialogTrigger asChild>
        <div>
          <FilterItem
            label="Nơi làm việc"
            activeValue={workplaceInput || undefined}
            icon={<Briefcase size={16} />}
            className={cn("w-full md:w-auto", className)}
          />
        </div>
      </DialogTrigger>

      {/* Nội dung dialog */}
      <DialogContent className="max-w-md p-0 gap-0 overflow-hidden dark:border-[#293548] dark:bg-[#172033]">
        <div className="shrink-0 p-5 pb-3 border-b border-slate-100 dark:border-[#293548] bg-white dark:bg-[#111827] pr-12">
          <DialogHeader>
            <DialogTitle>Nhập nơi làm việc</DialogTitle>
            <DialogDescription className="mt-1.5 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Nhập tên nơi làm việc của bác sĩ (Ví dụ: &quot;Bệnh viện Bạch Mai&quot; hoặc &quot;Phòng khám Hoàn Mỹ&quot;) để lọc danh sách.
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Input nơi làm việc */}
        <div className="p-5">
          <Input
            placeholder="Nhập nơi làm việc ..."
            value={tempValue}
            onChange={(e) => setTempValue(e.target.value)}
            className="rounded-xl"
          />
        </div>

        {/* Footer với nút hành động */}
        <div className="shrink-0 p-4 bg-slate-50/80 dark:bg-[#111827] border-t border-slate-100 dark:border-[#293548] flex justify-end gap-2.5">
          <Button variant="outline" onClick={handleClose} className="rounded-xl">
            Đóng
          </Button>
          <Button onClick={handleSave} disabled={!tempValue.trim()} className="rounded-xl font-bold !bg-primary text-white dark:!text-primary-foreground">
            Xác nhận
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DialogInputWorkplace;
