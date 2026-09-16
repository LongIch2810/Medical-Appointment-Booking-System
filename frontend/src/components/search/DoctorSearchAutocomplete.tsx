import { useEffect, useRef, useState } from "react";
import { Loader2, Search, Stethoscope } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { useDebounce } from "@/hooks/useDebounce";
import { useDoctorSuggestions } from "@/hooks/useDoctorSuggestions";
import type { DoctorSuggestion, SpecialtySuggestion } from "@/types/interface/doctorSuggestion.interface";

const MIN_QUERY_LENGTH = 2;
// The suggestions endpoint responds in ~10-20ms locally, so a short
// debounce is enough to avoid firing on every keystroke while still
// feeling near-instant.
const SUGGESTION_DEBOUNCE_MS = 150;
const FALLBACK_AVATAR = "https://cdn-icons-png.flaticon.com/512/2922/2922510.png";

interface DoctorSearchAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelectSpecialty: (specialtyId: number) => void;
  onSubmit?: () => void;
  placeholder?: string;
  className?: string;
}

const DoctorSearchAutocomplete = ({
  value,
  onChange,
  onSelectSpecialty,
  onSubmit,
  placeholder,
  className,
}: DoctorSearchAutocompleteProps) => {
  const [isOpen, setIsOpen] = useState(false);
  // null = nothing keyboard-highlighted yet (the user hasn't pressed
  // Arrow Down/Up). Enter only "confirms" a suggestion once the user has
  // explicitly navigated to one; otherwise Enter submits the raw typed
  // text, same as the search button — so ignoring the dropdown and just
  // typing + Enter always searches exactly what was typed.
  const [highlightedIndex, setHighlightedIndex] = useState<number | null>(
    null
  );
  const [, setSelectedSuggestionId] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const debouncedQuery = useDebounce(value, SUGGESTION_DEBOUNCE_MS);
  const shouldQuery = debouncedQuery.trim().length >= MIN_QUERY_LENGTH;

  const { data, isFetching, isError } = useDoctorSuggestions(debouncedQuery);
  const doctors = data?.data.doctors ?? [];
  const specialties = data?.data.specialties ?? [];
  const totalSuggestions = doctors.length + specialties.length;

  useEffect(() => {
    setHighlightedIndex(null);
  }, [doctors.length, specialties.length]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
    setSelectedSuggestionId(null);
    setIsOpen(true);
  };

  const handleSelectDoctor = (item: DoctorSuggestion) => {
    onChange(item.fullname);
    setSelectedSuggestionId(item.id);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const handleSelectSpecialty = (item: SpecialtySuggestion) => {
    onSelectSpecialty(item.id);
    onChange("");
    setSelectedSuggestionId(null);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setIsOpen(false);
      return;
    }

    if (e.key === "Enter") {
      if (isOpen && highlightedIndex !== null) {
        if (highlightedIndex < doctors.length) {
          const item = doctors[highlightedIndex];
          if (item) {
            e.preventDefault();
            handleSelectDoctor(item);
          }
        } else {
          const item = specialties[highlightedIndex - doctors.length];
          if (item) {
            e.preventDefault();
            handleSelectSpecialty(item);
          }
        }
        return;
      }
      // Nothing keyboard-highlighted (user never pressed Arrow Down/Up,
      // whether or not suggestions happen to be showing) — Enter acts like
      // the search button: search exactly what was typed, right away.
      if (onSubmit) {
        e.preventDefault();
        setIsOpen(false);
        onSubmit();
      }
      return;
    }

    if (!isOpen || totalSuggestions === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((i) =>
        i === null ? 0 : Math.min(i + 1, totalSuggestions - 1)
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((i) => (i === null || i === 0 ? null : i - 1));
    }
  };

  const showDropdown = isOpen && shouldQuery;

  return (
    <div className="relative" ref={containerRef}>
      <Input
        ref={inputRef}
        placeholder={placeholder}
        className={className}
        icon={<Search className="text-slate-400" size={18} />}
        value={value}
        onChange={handleInputChange}
        onFocus={() => setIsOpen(true)}
        onKeyDown={handleKeyDown}
        aria-label={placeholder}
        role="combobox"
        aria-expanded={showDropdown}
        aria-autocomplete="list"
      />
      {showDropdown && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-800 dark:bg-slate-900 overflow-hidden text-left">
          <Command shouldFilter={false}>
            <CommandList className="max-h-80">
              {isFetching && (
                <div className="flex items-center justify-center gap-2 p-3 text-sm text-slate-500 dark:text-slate-400">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Đang tìm...
                </div>
              )}
              {!isFetching && isError && (
                <div className="p-3 text-sm text-rose-500">
                  Không thể tải gợi ý. Vui lòng thử lại.
                </div>
              )}
              {!isFetching && !isError && (
                <>
                  {totalSuggestions === 0 && (
                    <CommandEmpty className="p-3 text-sm text-slate-500 dark:text-slate-400">
                      Không tìm thấy bác sĩ hoặc chuyên khoa phù hợp.
                    </CommandEmpty>
                  )}
                  {doctors.length > 0 && (
                    <CommandGroup heading="Bác sĩ">
                      {doctors.map((item, index) => (
                        <CommandItem
                          key={`doctor-${item.id}`}
                          onSelect={() => handleSelectDoctor(item)}
                          className={cn(
                            "cursor-pointer gap-3",
                            index === highlightedIndex &&
                              "bg-accent text-accent-foreground"
                          )}
                        >
                          <img
                            src={item.picture || FALLBACK_AVATAR}
                            alt={item.fullname}
                            className="h-8 w-8 shrink-0 rounded-full object-cover"
                          />
                          <div className="flex flex-col overflow-hidden">
                            <span className="truncate font-medium">
                              {item.fullname}
                            </span>
                            {item.specialty && (
                              <span className="truncate text-xs text-slate-500 dark:text-slate-400">
                                {item.specialty}
                              </span>
                            )}
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}
                  {specialties.length > 0 && (
                    <CommandGroup heading="Chuyên khoa">
                      {specialties.map((item, index) => (
                        <CommandItem
                          key={`specialty-${item.id}`}
                          onSelect={() => handleSelectSpecialty(item)}
                          className={cn(
                            "cursor-pointer gap-3",
                            doctors.length + index === highlightedIndex &&
                              "bg-accent text-accent-foreground"
                          )}
                        >
                          <Stethoscope className="h-4 w-4 shrink-0 text-slate-400" />
                          <span className="truncate">{item.name}</span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}
                </>
              )}
            </CommandList>
          </Command>
        </div>
      )}
    </div>
  );
};

export default DoctorSearchAutocomplete;
