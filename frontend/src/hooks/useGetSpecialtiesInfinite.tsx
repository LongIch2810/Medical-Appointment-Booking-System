import { fetchSpecialties } from "@/api/specialtyApi";
import { useInfiniteQuery } from "@tanstack/react-query";

export interface UseGetSpecialtiesInfiniteOptions {
  enabled?: boolean;
}

export function useGetSpecialtiesInfinite(
  filters?: Record<string, unknown>,
  options?: UseGetSpecialtiesInfiniteOptions
) {
  return useInfiniteQuery({
    queryKey: ["specialties", filters],
    queryFn: ({ pageParam }) =>
      fetchSpecialties({ page: pageParam as number, limit: 10, ...filters }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const { page, totalPages } = lastPage.data;
      return page < totalPages ? page + 1 : undefined;
    },
    staleTime: 1000 * 60 * 5,
    enabled: options?.enabled ?? true,
  });
}
