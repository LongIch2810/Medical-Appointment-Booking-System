import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Stethoscope } from "lucide-react";
import { useGetSpecialtiesInfinite } from "@/hooks/useGetSpecialtiesInfinite";
import SpecialtyCard from "../card/SpecialtyCard";
import SpecialtyCardSkeleton from "../skeleton/SpecialtyCardSkeleton";
import ErrorState from "../notification/ErrorState";
import type { SpecialtyProps } from "@/types/global";

export const SpecialtiesSection: React.FC = () => {
  const { data, isLoading, isError, refetch } = useGetSpecialtiesInfinite();

  // On Home, only display the first 10 popular specialties in a compact grid
  const specialties: SpecialtyProps[] =
    data?.pages?.[0]?.data?.specialties || [];

  return (
    <section className="py-10 sm:py-14 bg-slate-50/50 dark:bg-slate-900/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div className="space-y-1.5 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#159a98] dark:text-[#2cd4d1]">
              <Stethoscope className="w-4 h-4" />
              <span>Chuyên khoa đa dạng</span>
            </div>
            <h2 className="font-heading text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
              Chuyên khoa khám phổ biến
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Lựa chọn đúng chuyên khoa để kết nối nhanh chóng với bác sĩ đầu ngành phù hợp triệu chứng của bạn.
            </p>
          </div>

          <Link
            to="/doctors"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#159a98] dark:text-[#2cd4d1] hover:text-[#117d7b] dark:hover:text-teal-300 transition-colors shrink-0 group focus-visible:ring-2 focus-visible:ring-[#159a98] rounded-md outline-none"
          >
            <span>Tất cả chuyên khoa</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {/* Content State */}
        {isError ? (
          <ErrorState
            title="Không thể tải danh sách chuyên khoa"
            description="Đã xảy ra lỗi khi kết nối máy chủ. Vui lòng thử lại."
            onRetry={() => refetch()}
          />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 sm:gap-4 lg:gap-5">
            {isLoading
              ? Array.from({ length: 10 }).map((_, index) => (
                  <SpecialtyCardSkeleton key={index} />
                ))
              : specialties
                  .slice(0, 10)
                  .map((specialty) => (
                    <SpecialtyCard
                      key={specialty.id}
                      specialtyProps={specialty}
                    />
                  ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default SpecialtiesSection;
