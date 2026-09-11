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
      <DialogTrigger asChild>
        <div>
          <FilterItem
            label="Khu vực"
            activeValue={areaSelect || undefined}
            icon={<MapPin size={16} />}
            className={cn("w-full md:w-auto", className)}
          />
        </div>
      </DialogTrigger>
      <DialogContent className="max-w-md p-0 gap-0 overflow-hidden">
        <div className="shrink-0 p-5 pb-3 border-b border-slate-100 dark:border-slate-800 pr-12">
          <DialogHeader>
            <DialogTitle>Chọn khu vực</DialogTitle>
          </DialogHeader>
        </div>
        <Command className="flex-1 min-h-0">
          <CommandInput placeholder="Tìm kiếm khu vực..." />
          <CommandList className="max-h-[50dvh] sm:max-h-[350px] overflow-y-auto overscroll-contain">
            {(isLoading || isError) && (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              </div>
            )}
            <CommandEmpty>Không tìm thấy khu vực.</CommandEmpty>
            <CommandGroup>
              {data &&
                data.map((item: { code: string | number; name: string }) => (
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
