import { useQuery } from "@tanstack/react-query";

import {
  fetchAdminDashboard,
  fetchDoctorDashboard,
  fetchPatientDashboard,
} from "@/api/dashboardApi";

export const dashboardQueryKeys = {
  admin: ["dashboard", "admin"] as const,
  doctor: ["dashboard", "doctor"] as const,
  patient: ["dashboard", "patient"] as const,
};

export function useAdminDashboard() {
  return useQuery({
    queryKey: dashboardQueryKeys.admin,
    queryFn: fetchAdminDashboard,
    staleTime: 1000 * 60 * 2,
  });
}

export function useDoctorDashboard() {
  return useQuery({
    queryKey: dashboardQueryKeys.doctor,
    queryFn: fetchDoctorDashboard,
    staleTime: 1000 * 60 * 2,
  });
}

export function usePatientDashboard() {
  return useQuery({
    queryKey: dashboardQueryKeys.patient,
    queryFn: fetchPatientDashboard,
    staleTime: 1000 * 60 * 2,
  });
}
