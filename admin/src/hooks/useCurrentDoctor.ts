import { useQuery } from "@tanstack/react-query";

import { fetchDoctors } from "@/api/doctorApi";
import { useAuthStore } from "@/store/useAuthStore";
import type { Doctor } from "@/types/interface/doctor.interface";

/**
 * Tra cứu hồ sơ bác sĩ ứng với user đang đăng nhập.
 *
 * Backend hiện chưa expose `doctor.id` qua `/users/info`, nên admin lookup gián
 * tiếp qua endpoint `/doctors` (POST filter & pagination). Hàm match theo
 * `user_id` để chính xác và bỏ qua trường hợp trùng tên.
 */
export function useCurrentDoctor() {
  const currentUser = useAuthStore((state) => state.currentUser);
  const userId = currentUser?.id;
  const search = currentUser?.fullname?.trim();

  return useQuery({
    queryKey: ["current-doctor", userId],
    enabled: Boolean(userId),
    staleTime: 1000 * 60 * 5,
    queryFn: async (): Promise<Doctor | null> => {
      if (!userId) return null;
      const response = await fetchDoctors({
        page: 1,
        limit: 100,
        search: search || undefined,
      });
      const doctors = response.data?.doctors ?? [];
      return (
        doctors.find((doctor) => Number(doctor.user_id) === Number(userId)) ??
        null
      );
    },
  });
}
