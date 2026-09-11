import type { QueryClient } from "@tanstack/react-query";
import {
  fetchPatientAppointments,
  fetchPatientChannels,
  fetchPatientDashboard,
  fetchPatientExaminationResults,
  fetchPatientHealthProfiles,
  fetchPatientRelatives,
} from "@/api/patientApi";
import { patientQueryKeys } from "@/hooks/usePatientPortalApi";

// Dynamic import loaders map for code chunks
const routeLoaders: Record<string, () => Promise<unknown>> = {
  "/": () => import("@/pages/Home"),
  "/patient": () => import("@/pages/patient/Dashboard"),
  "/patient/dashboard": () => import("@/pages/patient/Dashboard"),
  "/patient/profile": () => import("@/pages/patient/Profile"),
  "/patient/appointments": () => import("@/pages/patient/Appointments"),
  "/patient/notifications": () => import("@/pages/patient/Notifications"),
  "/patient/relatives": () => import("@/pages/patient/Relatives"),
  "/patient/settings": () => import("@/pages/patient/Settings"),
  "/patient/messages": () => import("@/pages/patient/Messages"),
  "/patient/health-records": () => import("@/pages/patient/HealthRecords"),
  "/patient/visit-results": () => import("@/pages/patient/VisitResults"),
  "/patient/ai-coach-health": () => import("@/pages/AICoachHealth"),
  "/patient/complaints": () => import("@/pages/patient/Complaints"),
  "/doctors": () => import("@/pages/Doctor"),
  "/news": () => import("@/pages/News"),
  "/contact": () => import("@/pages/Contact"),
  "/chatbot": () => import("@/pages/Chatbot"),
};

// Set of already prefetched route paths to prevent duplicate import calls
const prefetchedRoutes = new Set<string>();

/**
 * Prefetch a route's JS/CSS chunk on intent (hover/focus)
 */
export function prefetchPatientRoute(path: string): void {
  const normalized = path.toLowerCase().replace(/\/$/, "") || "/patient";
  if (prefetchedRoutes.has(normalized)) return;

  const loader = routeLoaders[normalized];
  if (loader) {
    prefetchedRoutes.add(normalized);
    loader().catch(() => {
      // Allow retry on failure
      prefetchedRoutes.delete(normalized);
    });
  }
}

/**
 * Prefetch primary query data into TanStack Query cache on user intent
 */
export function prefetchPatientData(path: string, queryClient: QueryClient): void {
  const normalized = path.toLowerCase().replace(/\/$/, "") || "/patient";

  switch (normalized) {
    case "/patient":
    case "/patient/dashboard":
      queryClient.prefetchQuery({
        queryKey: patientQueryKeys.dashboard,
        queryFn: fetchPatientDashboard,
        staleTime: 1000 * 60 * 5,
      });
      break;

    case "/patient/appointments":
      queryClient.prefetchQuery({
        queryKey: patientQueryKeys.appointments({
          limit: 10,
          page: 1,
        }),
        queryFn: () =>
          fetchPatientAppointments({ limit: 10, page: 1 }),
        staleTime: 1000 * 60 * 5,
      });
      break;

    case "/patient/relatives":
      queryClient.prefetchQuery({
        queryKey: patientQueryKeys.relatives({
          limit: 10,
          page: 1,
        }),
        queryFn: () =>
          fetchPatientRelatives({ limit: 10, page: 1 }),
        staleTime: 1000 * 60 * 5,
      });
      break;

    case "/patient/health-records":
      queryClient.prefetchQuery({
        queryKey: patientQueryKeys.healthProfiles({
          limit: 10,
          page: 1,
        }),
        queryFn: () =>
          fetchPatientHealthProfiles({ limit: 10, page: 1 }),
        staleTime: 1000 * 60 * 5,
      });
      break;

    case "/patient/messages":
      queryClient.prefetchQuery({
        queryKey: patientQueryKeys.channels({
          limit: 10,
          page: 1,
        }),
        queryFn: () =>
          fetchPatientChannels({ limit: 10, page: 1 }),
        staleTime: 1000 * 60 * 5,
      });
      break;

    case "/patient/visit-results":
      queryClient.prefetchQuery({
        queryKey: patientQueryKeys.examinationResults({
          limit: 10,
          page: 1,
        }),
        queryFn: () =>
          fetchPatientExaminationResults({ limit: 10, page: 1 }),
        staleTime: 1000 * 60 * 5,
      });
      break;
  }
}

/**
 * Prefetch core frequent patient routes sequentially in background during idle moments
 * Staggered to prevent main-thread compilation storms
 */
export function prefetchCorePatientRoutes(): void {
  const coreRoutes = [
    "/patient/appointments",
    "/patient/health-records",
    "/patient/messages",
    "/patient/profile",
  ];

  let index = 0;
  const scheduleNext = () => {
    if (index >= coreRoutes.length) return;
    const route = coreRoutes[index++];
    prefetchPatientRoute(route);

    if (typeof window !== "undefined" && "requestIdleCallback" in window) {
      (window as Window & { requestIdleCallback: (cb: () => void, opts?: { timeout: number }) => void }).requestIdleCallback(
        scheduleNext,
        { timeout: 2000 }
      );
    } else {
      setTimeout(scheduleNext, 400);
    }
  };

  if (typeof window !== "undefined" && "requestIdleCallback" in window) {
    (window as Window & { requestIdleCallback: (cb: () => void, opts?: { timeout: number }) => void }).requestIdleCallback(
      scheduleNext,
      { timeout: 3000 }
    );
  } else {
    setTimeout(scheduleNext, 1200);
  }
}
