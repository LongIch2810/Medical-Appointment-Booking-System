import type { FilterItemProps } from "@/types/global";
import clsx from "clsx";

const FilterItem = ({ label, className = "", icon, activeValue }: FilterItemProps) => {
  const isActive = Boolean(activeValue);

  return (
    <div
      className={clsx(
        "inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm cursor-pointer transition whitespace-nowrap",
        isActive
          ? "bg-primary/10 text-primary border border-primary/30 hover:bg-primary/15 dark:bg-primary/20 dark:border-primary/50 dark:text-teal-300"
          : "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 dark:hover:bg-slate-700",
        className
      )}
    >
      {icon && (
        <span className={isActive ? "text-primary dark:text-teal-300" : "text-slate-600 dark:text-slate-300"}>{icon}</span>
      )}
      <span className="truncate max-w-[10rem]">
        {isActive ? activeValue : label}
      </span>
    </div>
  );
};

export default FilterItem;
