import { useQuery } from "@tanstack/react-query";
import { fetchDoctorSuggestions } from "../api/doctorApi";

const MIN_SEARCH_LENGTH = 2;

export function useDoctorSuggestions(search: string) {
  const trimmed = search.trim();

  return useQuery({
    queryKey: ["doctor-suggestions", trimmed],
    queryFn: ({ signal }) => fetchDoctorSuggestions(trimmed, signal),
    enabled: trimmed.length >= MIN_SEARCH_LENGTH,
    retry: false,
  });
}
