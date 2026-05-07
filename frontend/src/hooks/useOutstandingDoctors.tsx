import { fetchDoctors, fetchOutstandingDoctors } from "@/api/doctorApi";
import { useQuery } from "@tanstack/react-query";

export function useOutstandingDoctors() {
  return useQuery({
    queryKey: ["outstanding-doctors"],
    queryFn: async () => {
      const outstandingDoctors = await fetchOutstandingDoctors();
      if (outstandingDoctors.data.length > 0) {
        return outstandingDoctors;
      }

      const doctors = await fetchDoctors({ page: 1, limit: 4 });
      return {
        ...outstandingDoctors,
        data: doctors.data.doctors.map((doctor) => ({
          ...doctor,
          isOutstanding: true,
        })),
      };
    },
    staleTime: 1000 * 60 * 10,
  });
}
