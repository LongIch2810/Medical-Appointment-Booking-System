import { useFilterDoctorsStore } from "@/store/filterDoctorsStore";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
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
      <DialogTrigger>
        <FilterItem
          label="Nơi làm việc"
          activeValue={workplaceInput || undefined}
          icon={<Briefcase size={16} />}
          className={cn("w-full md:w-auto", className)}
        />
      </DialogTrigger>

      {/* Nội dung dialog */}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nhập nơi làm việc</DialogTitle>
          <DialogDescription>
            Vui lòng nhập tên nơi làm việc của bác sĩ để hệ thống lọc danh sách
            phù hợp. Ví dụ: "Bệnh viện Bạch Mai" hoặc "Phòng khám Hoàn Mỹ".Nhập
            xong hãy xác nhận để chúng tôi ghi lại kết quả.
          </DialogDescription>
        </DialogHeader>

        {/* Input nơi làm việc */}
        <Input
          placeholder="Nhập nơi làm việc ..."
          value={tempValue}
          onChange={(e) => setTempValue(e.target.value)}
        />

        {/* Footer với nút hành động */}
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Đóng
          </Button>
          <Button onClick={handleSave} disabled={!tempValue.trim()}>
            Xác nhận
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DialogInputWorkplace;
