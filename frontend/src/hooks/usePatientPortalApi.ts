import {
  cancelPatientAppointment,
  changePatientPassword,
  createPatientRelative,
  deletePatientRelative,
  fetchPatientAppointments,
  fetchPatientChannels,
  fetchPatientDashboard,
  fetchPatientExaminationResults,
  fetchPatientHealthProfiles,
  fetchPatientMessages,
  fetchPatientRelatives,
  fetchRelationships,
  sendPatientMessage,
  updatePatientHealthProfile,
  updatePatientProfile,
  updatePatientRelative,
} from "@/api/patientApi";
import type {
  PatientListPayload,
  PersonalAppointmentsPayload,
} from "@/types/interface/patient.interface";
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

export const patientQueryKeys = {
  dashboard: ["patient-dashboard"] as const,
  appointments: (filters: PersonalAppointmentsPayload) =>
    ["patient-appointments", filters] as const,
  relatives: (filters: PatientListPayload) =>
    ["patient-relatives", filters] as const,
  relationships: (filters: PatientListPayload) =>
    ["relationships", filters] as const,
  healthProfiles: (filters: PatientListPayload) =>
    ["patient-health-profiles", filters] as const,
  examinationResults: (
    filters: PatientListPayload & { relativeId?: number; date?: string },
  ) =>
    ["patient-examination-results", filters] as const,
  channels: (filters: PatientListPayload) =>
    ["patient-channels", filters] as const,
  messages: (channelId: number) => ["patient-messages", channelId] as const,
};

export function usePatientDashboard() {
  return useQuery({
    queryKey: patientQueryKeys.dashboard,
    queryFn: fetchPatientDashboard,
    staleTime: 1000 * 60 * 5,
  });
}

export function usePatientAppointments(filters: PersonalAppointmentsPayload) {
  return useQuery({
    queryKey: patientQueryKeys.appointments(filters),
    queryFn: () => fetchPatientAppointments(filters),
  });
}

export function useCancelPatientAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: cancelPatientAppointment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patient-appointments"] });
      queryClient.invalidateQueries({ queryKey: patientQueryKeys.dashboard });
    },
  });
}

export function usePatientRelatives(filters: PatientListPayload) {
  return useQuery({
    queryKey: patientQueryKeys.relatives(filters),
    queryFn: () => fetchPatientRelatives(filters),
  });
}

export function useRelationships(filters: PatientListPayload) {
  return useQuery({
    queryKey: patientQueryKeys.relationships(filters),
    queryFn: () => fetchRelationships(filters),
    staleTime: 1000 * 60 * 30,
  });
}

export function useCreatePatientRelative() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createPatientRelative,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patient-relatives"] });
      queryClient.invalidateQueries({ queryKey: ["patient-health-profiles"] });
      queryClient.invalidateQueries({ queryKey: patientQueryKeys.dashboard });
    },
  });
}

export function useUpdatePatientRelative() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updatePatientRelative,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patient-relatives"] });
      queryClient.invalidateQueries({ queryKey: ["patient-health-profiles"] });
    },
  });
}

export function useDeletePatientRelative() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deletePatientRelative,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patient-relatives"] });
      queryClient.invalidateQueries({ queryKey: ["patient-health-profiles"] });
      queryClient.invalidateQueries({ queryKey: patientQueryKeys.dashboard });
    },
  });
}

export function usePatientHealthProfiles(filters: PatientListPayload) {
  return useQuery({
    queryKey: patientQueryKeys.healthProfiles(filters),
    queryFn: () => fetchPatientHealthProfiles(filters),
  });
}

export function useUpdatePatientHealthProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updatePatientHealthProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patient-health-profiles"] });
      queryClient.invalidateQueries({ queryKey: patientQueryKeys.dashboard });
    },
  });
}

export function usePatientExaminationResults(
  filters: PatientListPayload & { relativeId?: number; date?: string },
) {
  return useQuery({
    queryKey: patientQueryKeys.examinationResults(filters),
    queryFn: () => fetchPatientExaminationResults(filters),
  });
}

export function usePatientChannels(filters: PatientListPayload) {
  return useQuery({
    queryKey: patientQueryKeys.channels(filters),
    queryFn: () => fetchPatientChannels(filters),
  });
}

export function usePatientMessages(channelId: number) {
  return useInfiniteQuery({
    queryKey: patientQueryKeys.messages(channelId),
    queryFn: ({ pageParam }) => fetchPatientMessages(channelId, pageParam),
    getNextPageParam: (lastPage) => {
      const { page, totalPages } = lastPage.data;
      return page < totalPages ? page + 1 : undefined;
    },
    initialPageParam: 1,
    enabled: !!channelId,
  });
}

export function useSendPatientMessage(channelId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: sendPatientMessage,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: patientQueryKeys.messages(channelId),
      });
      queryClient.invalidateQueries({ queryKey: ["patient-channels"] });
      queryClient.invalidateQueries({ queryKey: patientQueryKeys.dashboard });
    },
  });
}

export function useUpdatePatientProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updatePatientProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: patientQueryKeys.dashboard });
    },
  });
}

export function useChangePatientPassword() {
  return useMutation({
    mutationFn: changePatientPassword,
  });
}
