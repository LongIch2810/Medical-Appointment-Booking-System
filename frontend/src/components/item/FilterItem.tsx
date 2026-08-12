import type { FilterItemProps } from "@/types/global";
import clsx from "clsx";

const FilterItem = ({ label, className = "", icon, activeValue }: FilterItemProps) => {
  const isActive = Boolean(activeValue);

  return (
    <div
      className={clsx(
        "inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm cursor-pointer transition whitespace-nowrap",
        isActive
          ? "bg-primary/10 text-primary border border-primary/30 hover:bg-primary/15"
          : "bg-gray-200 text-gray-800 hover:bg-gray-300",
        className
      )}
    >
      {icon && (
        <span className={isActive ? "text-primary" : "text-black"}>{icon}</span>
      )}
      <span className="truncate max-w-[10rem]">
        {isActive ? activeValue : label}
      </span>
    </div>
  );
};

export default FilterItem;
