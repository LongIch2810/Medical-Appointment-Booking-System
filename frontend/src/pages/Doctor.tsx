import { Input } from "@/components/ui/input";
import { RotateCcw, Search } from "lucide-react";

import DialogChooseSpecialty from "../components/dialog/DialogChooseSpecialty";
import DialogChooseExperience from "../components/dialog/DialogChooseExperience";
import DialogInputWorkplace from "../components/dialog/DialogInputWorkplace";
import DialogChooseArea from "@/components/dialog/DialogChooseArea";
import { useFilterDoctorsStore } from "@/store/filterDoctorsStore";
import { useSearchParams } from "react-router-dom";
import { useEffect, useMemo } from "react";
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

  const debouncedSearch = useDebounce(search, 500);

  useEffect(() => {
    const urlSearch = searchParams.get("search") || "";
    const urlSpecialty = Number(searchParams.get("specialtyId")) || 0;
    const urlMinExp = Number(searchParams.get("minExp")) || 0;
    const urlMaxExp = Number(searchParams.get("maxExp")) || 0;
    const urlWorkplace = searchParams.get("workplace") || "";
    const urlArea = searchParams.get("area") || "";

    setSearch(urlSearch);
    setSpecialtyIdSelect(urlSpecialty);
    setMinExperienceSelect(urlMinExp);
    setMaxExperienceSelect(urlMaxExp);
    setWorkplaceInput(urlWorkplace);
    setAreaSelect(urlArea);
  }, []);

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
  return (
    <section className="mt-16 md:mt-28">
      <header className="container mx-auto max-w-[700px] lg:max-w-[900px]">
        <Input
          placeholder="Tìm kiếm bác sĩ..."
          className="lg:text-lg rounded-full border-2 bg-white border-gray-300 placeholder:text-gray-400 shadow-md text-gray-800 italic"
          icon={<Search />}
          value={search}
          onChange={handleSearch}
        />
        <div className="flex flex-col md:flex-row md:flex-wrap gap-3 md:gap-5 mt-3 md:mt-5 md:justify-center">
          <DialogChooseSpecialty className="w-full md:w-auto" />
          <DialogChooseExperience className="w-full md:w-auto" />
          <DialogInputWorkplace className="w-full md:w-auto" />
          <DialogChooseArea className="w-full md:w-auto" />
          <Button
            type="button"
            variant="outline"
            disabled={!hasActiveFilters}
            onClick={handleResetFilters}
            className="w-full md:w-auto gap-2 rounded-full border-slate-300 bg-white text-slate-700 shadow-sm hover:border-primary/40 hover:bg-primary/5 hover:text-primary disabled:opacity-50"
          >
            <RotateCcw className="h-4 w-4" />
            Đặt lại bộ lọc
          </Button>
        </div>
      </header>
      <div className="flex flex-col items-center lg:gap-10 gap-8 container mx-auto">
        {isError ? (
          <ErrorState
            title="Không thể tải danh sách bác sĩ"
            description="Đã có lỗi xảy ra khi tải dữ liệu. Vui lòng thử lại."
            onRetry={() => refetch()}
          />
        ) : (
          <>
            <div className="flex justify-center">
              {!isLoading && doctors.length === 0 && (
                <NotFoundResult onReset={handleResetFilters} />
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {isLoading &&
                Array.from({ length: 20 }).map((_, i) => (
                  <DoctorCardSkeleton key={i} />
                ))}
              {doctors.map((item, index) => (
                <DoctorCard key={index} item={item} />
              ))}
              {isFetchingNextPage &&
                Array.from({ length: 20 }).map((_, i) => (
                  <DoctorCardSkeleton key={i} />
                ))}
            </div>
            <div className="flex justify-center">
              {hasNextPage && (
                <Button
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                >
                  {isFetchingNextPage ? <Loading /> : "Xem thêm"}
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
