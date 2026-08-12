import { useFilterDoctorsStore } from "@/store/filterDoctorsStore";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Check, Loader2, MapPin } from "lucide-react";
import FilterItem from "../item/FilterItem";
import { useProvinces } from "@/hooks/useProvinces";
import { cn } from "@/lib/utils";
import { cleanProvinceName } from "../../utils/cleanProvinceName";
import { useState } from "react";
const DialogChooseArea = ({ className = "" }: { className: string }) => {
  const [open, setOpen] = useState(false);
  const { areaSelect, setAreaSelect } = useFilterDoctorsStore();
  const { data, isLoading, isError } = useProvinces();
  const handleSelect = (province_name: string) => {
    setAreaSelect(cleanProvinceName(province_name));
    setOpen(false);
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        <FilterItem
          label="Khu vực"
          activeValue={areaSelect || undefined}
          icon={<MapPin size={16} />}
          className={cn("w-full md:w-auto", className)}
        />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Chọn khu vực</DialogTitle>
        </DialogHeader>
        <Command>
          <CommandInput placeholder="Tìm kiếm khu vực..." />
          <CommandList>
            {(isLoading || isError) && (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              </div>
            )}
            <CommandEmpty>Không tìm thấy chuyên khoa.</CommandEmpty>
            <CommandGroup>
              {data &&
                data.map((item: any) => (
                  <CommandItem
                    key={item.code}
                    onSelect={() => handleSelect(item.name)}
                    className="cursor-pointer"
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        areaSelect === item.name ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {item.name}
                  </CommandItem>
                ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
};

export default DialogChooseArea;
