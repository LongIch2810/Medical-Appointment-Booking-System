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
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { CalendarCheck, Check } from "lucide-react";
import FilterItem from "../item/FilterItem";
import { cn } from "@/lib/utils";
import { MAX_EXPERIENCE } from "@/utils/constants";
import { useState } from "react";
interface ExperienceItem {
  id: number;
  minExperience: number;
  maxExperience: number;
}
const items: ExperienceItem[] = [
  {
    id: 1,
    minExperience: 3,
    maxExperience: 5,
  },
  {
    id: 2,
    minExperience: 6,
    maxExperience: 10,
  },
  {
    id: 3,
    minExperience: 11,
    maxExperience: 15,
  },
  {
    id: 4,
    minExperience: 16,
    maxExperience: MAX_EXPERIENCE,
  },
];
const DialogChooseExperience = ({ className = "" }: { className: string }) => {
  const [open, setOpen] = useState(false);
  const {
    setMinExperienceSelect,
    setMaxExperienceSelect,
    minExperienceSelect,
    maxExperienceSelect,
  } = useFilterDoctorsStore();

  const selectedItem = items.find(
    (item) =>
      item.minExperience === minExperienceSelect &&
      item.maxExperience === maxExperienceSelect
  );
  const activeValue = selectedItem
    ? `${selectedItem.minExperience} năm ${
        selectedItem.maxExperience === MAX_EXPERIENCE
          ? "trở lên"
          : `- ${selectedItem.maxExperience} năm`
      }`
    : undefined;

  const handleSelect = (item: ExperienceItem) => {
    setMinExperienceSelect(item.minExperience);
    setMaxExperienceSelect(item.maxExperience);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <div>
          <FilterItem
            label="Năm kinh nghiệm"
            activeValue={activeValue}
            icon={<CalendarCheck size={16} />}
            className={cn("w-full md:w-auto", className)}
          />
        </div>
      </DialogTrigger>
      <DialogContent className="max-w-md p-0 gap-0 overflow-hidden">
        <div className="shrink-0 p-5 pb-3 border-b border-slate-100 dark:border-slate-800 pr-12">
          <DialogHeader>
            <DialogTitle>Chọn năm kinh nghiệm</DialogTitle>
          </DialogHeader>
        </div>
        <Command className="flex-1 min-h-0">
          <CommandList className="max-h-[50dvh] sm:max-h-[350px] overflow-y-auto overscroll-contain">
            <CommandGroup>
              {items.map((item) => (
                <CommandItem
                  key={item.id}
                  onSelect={() => handleSelect(item)}
                  className="cursor-pointer"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      minExperienceSelect === item.minExperience &&
                        maxExperienceSelect === item.maxExperience
                        ? "opacity-100"
                        : "opacity-0"
                    )}
                  />
                  {`${item.minExperience} năm ${
                    item.maxExperience === MAX_EXPERIENCE
                      ? "trở lên"
                      : ` - ${item.maxExperience} năm`
                  }`}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
};

export default DialogChooseExperience;
