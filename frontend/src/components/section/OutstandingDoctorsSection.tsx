import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Flame } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useOutstandingDoctors } from "@/hooks/useOutstandingDoctors";
import DoctorCard from "../card/DoctorCard";
import DoctorCardSkeleton from "../skeleton/DoctorCardSkeleton";
import ErrorState from "../notification/ErrorState";
import NotFoundResult from "../notification/NotFoundResult";
import { Button } from "../ui/button";

export const OutstandingDoctorsSection: React.FC = () => {
  const { t } = useTranslation();
  const { data, isLoading, isError, refetch } = useOutstandingDoctors();
  const doctors = data?.data || [];

  return (
    <section className="py-12 sm:py-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 sm:mb-10">
          <div className="space-y-1.5 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
              <Flame className="w-4 h-4" />
              <span>{t("home.featuredDoctorsEyebrow")}</span>
            </div>
            <h2 className="font-heading text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
              {t("home.featuredDoctorsTitle")}
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {t("home.featuredDoctorsSubtitle")}
            </p>
          </div>

          <Button
            asChild
            variant="outline"
            className="hidden sm:inline-flex rounded-xl border-slate-300 dark:border-slate-700 hover:border-[#159a98] hover:text-[#159a98] font-bold text-xs sm:text-sm h-10 px-4 cursor-pointer"
          >
            <Link to="/doctors" className="inline-flex items-center gap-1.5">
              <span>{t("home.viewAllDoctors")}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </div>

        {/* Dynamic States */}
        {isError ? (
          <ErrorState
            title={t("home.outstandingErrorTitle")}
            description={t("home.outstandingErrorDesc")}
            onRetry={() => refetch()}
          />
        ) : !isLoading && doctors.length === 0 ? (
          <NotFoundResult
            title={t("home.outstandingEmptyTitle")}
            description={t("home.outstandingEmptyDesc")}
            onReset={() => refetch()}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
            {isLoading
              ? Array.from({ length: 4 }).map((_, index) => (
                  <DoctorCardSkeleton key={index} />
                ))
              : doctors.map((doctor) => (
                  <DoctorCard key={doctor.id} item={doctor} />
                ))}
          </div>
        )}

        {/* Mobile View All Button */}
        <div className="mt-8 flex justify-center sm:hidden">
          <Button
            asChild
            className="w-full h-11 rounded-xl bg-[#159a98] hover:bg-[#117d7b] text-white font-bold text-sm shadow-sm cursor-pointer"
          >
            <Link to="/doctors" className="inline-flex items-center justify-center gap-2">
              <span>{t("home.viewAllDoctorsWithCount", { count: doctors.length > 0 ? `${doctors.length}+` : "600+" })}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default OutstandingDoctorsSection;
