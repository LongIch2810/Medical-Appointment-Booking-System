import { useGetSpecialtiesInfinite } from "@/hooks/useGetSpecialtiesInfinite";
import { useFilterDoctorsStore } from "@/store/filterDoctorsStore";
import type { Specialty } from "@/types/interface/specialty.interface";
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
import { Check, Stethoscope } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import FilterItem from "../item/FilterItem";
import Loading from "../loading/Loading";
import { useState } from "react";

const DialogChooseSpecialty = ({ className = "" }: { className: string }) => {
  const [open, setOpen] = useState(false);
  const { specialtyIdSelect, setSpecialtyIdSelect } = useFilterDoctorsStore();
  const {
    data,
    hasNextPage,
    fetchNextPage,
    isLoading,
    isError,
    isFetchingNextPage,
  } = useGetSpecialtiesInfinite();
  const specialties: Specialty[] =
    data?.pages.flatMap((page) => page.data.specialties) ?? [];
  const selectedSpecialty = specialties.find(
    (specialty) => specialty.id === specialtyIdSelect
  );

  const handleSelect = (specialty_id: number) => {
    setSpecialtyIdSelect(specialty_id);
    setOpen(false);
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <div>
          <FilterItem
            label="Chuyên khoa"
            activeValue={selectedSpecialty?.name}
            icon={<Stethoscope size={16} />}
            className={cn("w-full md:w-auto", className)}
          />
        </div>
      </DialogTrigger>
      <DialogContent className="max-w-md p-0 gap-0 overflow-hidden">
        <div className="shrink-0 p-5 pb-3 border-b border-slate-100 dark:border-slate-800 pr-12">
          <DialogHeader>
            <DialogTitle>Chọn chuyên khoa</DialogTitle>
          </DialogHeader>
        </div>
        <Command className="flex-1 min-h-0">
          <CommandInput placeholder="Tìm kiếm chuyên khoa ..." />
          <CommandList className="max-h-[50dvh] sm:max-h-[350px] overflow-y-auto overscroll-contain">
            {(isLoading || isError) && <Loading />}
            <CommandEmpty>Không tìm thấy chuyên khoa.</CommandEmpty>
            <CommandGroup>
              {specialties.map((specialty) => (
                <CommandItem
                  key={specialty.id}
                  onSelect={() => handleSelect(specialty.id)}
                  className="cursor-pointer"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      specialtyIdSelect === specialty.id
                        ? "opacity-100"
                        : "opacity-0"
                    )}
                  />
                  {specialty.name}
                </CommandItem>
              ))}
            </CommandGroup>
            {hasNextPage && (
              <Button
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
              >
                {isFetchingNextPage ? <Loading /> : "Xem thêm"}
              </Button>
            )}
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
};

export default DialogChooseSpecialty;
