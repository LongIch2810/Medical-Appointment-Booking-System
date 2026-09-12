import { Input } from "@/components/ui/input";
import { RotateCcw, Search } from "lucide-react";
import { useTranslation } from "react-i18next";
import DialogChooseSpecialty from "../components/dialog/DialogChooseSpecialty";
import DialogChooseExperience from "../components/dialog/DialogChooseExperience";
import DialogInputWorkplace from "../components/dialog/DialogInputWorkplace";
import DialogChooseArea from "@/components/dialog/DialogChooseArea";
import DialogAutoBooking from "@/components/dialog/DialogAutoBooking";
import { useFilterDoctorsStore } from "@/store/filterDoctorsStore";
import { useSearchParams } from "react-router-dom";
import { useEffect, useMemo, useRef } from "react";
import { useGetDoctorsInfinite } from "@/hooks/useGetDoctorsInfinite";
import DoctorCardSkeleton from "@/components/skeleton/DoctorCardSkeleton";
import DoctorCard from "@/components/card/DoctorCard";
import { Button } from "@/components/ui/button";
import Loading from "@/components/loading/Loading";
import NotFoundResult from "@/components/notification/NotFoundResult";
import ErrorState from "@/components/notification/ErrorState";
import { useDebounce } from "@/hooks/useDebounce";

const Doctor = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    search,
    setSearch,
    specialtyIdSelect,
    setSpecialtyIdSelect,
    minExperienceSelect,
    setMinExperienceSelect,
    maxExperienceSelect,
    setMaxExperienceSelect,
    workplaceInput,
    setWorkplaceInput,
    areaSelect,
    setAreaSelect,
  } = useFilterDoctorsStore();
  const initialSearchParams = useRef(searchParams).current;

  const debouncedSearch = useDebounce(search, 500);

  useEffect(() => {
    const urlSearch = initialSearchParams.get("search") || "";
    const urlSpecialty = Number(initialSearchParams.get("specialtyId")) || 0;
    const urlMinExp = Number(initialSearchParams.get("minExp")) || 0;
    const urlMaxExp = Number(initialSearchParams.get("maxExp")) || 0;
    const urlWorkplace = initialSearchParams.get("workplace") || "";
    const urlArea = initialSearchParams.get("area") || "";

    setSearch(urlSearch);
    setSpecialtyIdSelect(urlSpecialty);
    setMinExperienceSelect(urlMinExp);
    setMaxExperienceSelect(urlMaxExp);
    setWorkplaceInput(urlWorkplace);
    setAreaSelect(urlArea);
  }, [
    initialSearchParams,
    setAreaSelect,
    setMaxExperienceSelect,
    setMinExperienceSelect,
    setSearch,
    setSpecialtyIdSelect,
    setWorkplaceInput,
  ]);

  useEffect(() => {
    const params: Record<string, string> = {};
    if (search) params.search = search;
    if (specialtyIdSelect) params.specialtyId = specialtyIdSelect.toString();
    if (minExperienceSelect) params.minExp = minExperienceSelect.toString();
    if (maxExperienceSelect) params.maxExp = maxExperienceSelect.toString();
    if (workplaceInput) params.workplace = workplaceInput;
    if (areaSelect) params.area = areaSelect;

    setSearchParams(params);
  }, [
    search,
    specialtyIdSelect,
    minExperienceSelect,
    maxExperienceSelect,
    workplaceInput,
    areaSelect,
    setSearchParams,
  ]);

  const filters = useMemo(
    () => ({
      specialty_id: specialtyIdSelect || undefined,
      min_experience: minExperienceSelect || undefined,
      max_experience: maxExperienceSelect || undefined,
      workplace: workplaceInput || undefined,
      area: areaSelect || undefined,
      search: debouncedSearch || undefined,
    }),
    [
      specialtyIdSelect,
      minExperienceSelect,
      maxExperienceSelect,
      workplaceInput,
      areaSelect,
      debouncedSearch,
    ]
  );

  const {
    data,
    isLoading,
    isError,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
  } = useGetDoctorsInfinite(filters);
  const doctors = data?.pages.flatMap((page) => page.data.doctors) || [];

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };

  const hasActiveFilters =
    Boolean(search) ||
    Boolean(specialtyIdSelect) ||
    Boolean(minExperienceSelect) ||
    Boolean(maxExperienceSelect) ||
    Boolean(workplaceInput) ||
    Boolean(areaSelect);

  const handleResetFilters = () => {
    setSearch("");
    setSpecialtyIdSelect(0);
    setMinExperienceSelect(0);
    setMaxExperienceSelect(0);
    setWorkplaceInput("");
    setAreaSelect("");
    setSearchParams({});
  };

  const { t } = useTranslation();

  return (
    <section className="mt-16 md:mt-24 pb-16">
      <header className="container mx-auto max-w-4xl mb-8 px-4 text-center space-y-4">
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 font-heading">
            {t("doctor.pageTitle")}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-xl mx-auto leading-relaxed">
            {t("doctor.pageSubtitle")}
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
          <Input
            placeholder={t("doctor.searchPlaceholder")}
            className="h-12 md:h-13 text-sm md:text-base rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 placeholder:text-slate-400 text-slate-900 dark:text-slate-100 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 px-5"
            icon={<Search className="text-slate-400" size={18} />}
            value={search}
            onChange={handleSearch}
            aria-label={t("doctor.searchPlaceholder")}
          />
        </div>

        <div className="flex flex-col md:flex-row md:flex-wrap gap-2 md:gap-3 mt-4 md:justify-center items-center">
          <DialogChooseSpecialty className="w-full md:w-auto" />
          <DialogChooseExperience className="w-full md:w-auto" />
          <DialogInputWorkplace className="w-full md:w-auto" />
          <DialogChooseArea className="w-full md:w-auto" />
          <DialogAutoBooking className="w-full md:w-auto" />
          {hasActiveFilters && (
            <Button
              type="button"
              variant="outline"
              onClick={handleResetFilters}
              className="w-full md:w-auto gap-2 rounded-full border-rose-200 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 shadow-2xs hover:bg-rose-100 dark:hover:bg-rose-900/50 text-xs font-bold h-9 cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              {t("doctor.resetFilters")}
            </Button>
          )}
        </div>
      </header>

      <div className="flex flex-col items-center lg:gap-10 gap-8 container mx-auto px-4">
        {isError ? (
          <ErrorState
            title={t("doctor.errorTitle")}
            description={t("doctor.errorDesc")}
            onRetry={() => refetch()}
          />
        ) : (
          <>
            <div className="flex justify-center w-full">
              {!isLoading && doctors.length === 0 && (
                <NotFoundResult
                  title={t("doctor.noResultsTitle")}
                  description={t("doctor.noResultsDesc")}
                  onReset={handleResetFilters}
                />
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 w-full">
              {isLoading &&
                Array.from({ length: 12 }).map((_, i) => (
                  <DoctorCardSkeleton key={i} />
                ))}
              {doctors.map((item, index) => (
                <DoctorCard key={item.id ?? index} item={item} />
              ))}
              {isFetchingNextPage &&
                Array.from({ length: 4 }).map((_, i) => (
                  <DoctorCardSkeleton key={`next-${i}`} />
                ))}
            </div>
            <div className="flex justify-center pt-4">
              {hasNextPage && (
                <Button
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                  className="rounded-xl px-6 py-2.5 font-bold shadow-xs hover:shadow-md cursor-pointer"
                >
                  {isFetchingNextPage ? <Loading /> : t("doctor.loadMore")}
                </Button>
              )}
            </div>
          </>
        )}
      </div>
    </section>
  );
};

export default Doctor;
