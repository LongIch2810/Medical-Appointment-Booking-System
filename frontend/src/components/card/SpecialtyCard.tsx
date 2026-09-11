import React from "react";
import { Link } from "react-router-dom";
import type { SpecialtyProps } from "@/types/global";
import { ArrowUpRight } from "lucide-react";

interface SpecialtyCardProps {
  specialtyProps: SpecialtyProps;
}

export const SpecialtyCard: React.FC<SpecialtyCardProps> = ({ specialtyProps }) => {
  return (
    <Link
      to={`/doctors?specialtyId=${specialtyProps.id}`}
      aria-label={`Xem bác sĩ chuyên khoa ${specialtyProps.name}`}
      className="group relative flex flex-col items-center p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs hover:shadow-md hover:border-[#159a98]/60 dark:hover:border-[#2cd4d1]/60 hover:-translate-y-0.5 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-[#159a98] outline-none"
    >
      <div className="relative mb-3">
        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden bg-teal-50 dark:bg-teal-950/60 p-1 border border-teal-100 dark:border-teal-900 group-hover:scale-105 transition-transform duration-300">
          <img
            src={specialtyProps.img_url}
            alt={specialtyProps.name}
            width={64}
            height={64}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover rounded-xl"
            onError={(e) => {
              // Fallback to stethoscope icon if image fails to load
              (e.currentTarget as HTMLImageElement).src =
                "https://cdn-icons-png.flaticon.com/512/2966/2966327.png";
            }}
          />
        </div>
        <span className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 w-5 h-5 rounded-full bg-[#159a98] text-white flex items-center justify-center shadow-xs">
          <ArrowUpRight className="w-3 h-3" />
        </span>
      </div>

      <h3 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 text-center line-clamp-2 group-hover:text-[#159a98] dark:group-hover:text-[#2cd4d1] transition-colors leading-snug">
        {specialtyProps.name}
      </h3>
      <span className="mt-1 text-[11px] font-medium text-slate-400 dark:text-slate-500">
        Đặt khám
      </span>
    </Link>
  );
};

export default SpecialtyCard;
