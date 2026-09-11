import {
  cancelPatientAppointment,
  changePatientPassword,
  createPatientRelative,
  deletePatientRelative,
  fetchPatientAppointments,
  fetchPatientAppointmentDetail,
  fetchPatientChannels,
  fetchPatientDashboard,
  fetchPatientExaminationResults,
  fetchPatientHealthProfiles,
  fetchPatientMessages,
  fetchPatientRelatives,
  fetchRelationships,
  markPatientChannelRead,
  sendPatientMessage,
  updatePatientHealthProfile,
  updatePatientProfile,
  updatePatientRelative,
} from "@/api/patientApi";
import type {
  ApiResponse,
  Channel,
  ChannelListResponse,
  Message,
  MessageListResponse,
  PatientListPayload,
  PersonalAppointmentsPayload,
  SendMessagePayload,
} from "@/types/interface/patient.interface";
import {
  type InfiniteData,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

export const patientQueryKeys = {
  dashboard: ["patient-dashboard"] as const,
  appointments: (filters: PersonalAppointmentsPayload) =>
    ["patient-appointments", filters] as const,
  appointmentDetail: (appointmentId: number) =>
    ["patient-appointment-detail", appointmentId] as const,
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

export function usePatientAppointmentDetail(
  appointmentId: number,
  enabled = true,
) {
  return useQuery({
    queryKey: patientQueryKeys.appointmentDetail(appointmentId),
    queryFn: () => fetchPatientAppointmentDetail(appointmentId),
    enabled: enabled && appointmentId > 0,
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

type MessagesCache = InfiniteData<ApiResponse<MessageListResponse>>;

export function useSendPatientMessage(channelId: number) {
  const queryClient = useQueryClient();
  const messagesKey = patientQueryKeys.messages(channelId);

  return useMutation({
    mutationFn: sendPatientMessage,
    onMutate: async (payload: SendMessagePayload) => {
      await queryClient.cancelQueries({ queryKey: messagesKey });
      const previous = queryClient.getQueryData<MessagesCache>(messagesKey);
      const tempId = -Date.now();

      queryClient.setQueryData<MessagesCache>(messagesKey, (old) => {
        if (!old) return old;
        const optimisticMessage: Message = {
          id: tempId,
          message_type: payload.message_type,
          content: payload.content,
          is_read: false,
          message_attachments: [],
          sender: { id: payload.sender_id, fullname: null, picture: null },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          isOptimistic: true,
        };
        const pages = [...old.pages];
        const lastIndex = pages.length - 1;
        pages[lastIndex] = {
          ...pages[lastIndex],
          data: {
            ...pages[lastIndex].data,
            messages: [...pages[lastIndex].data.messages, optimisticMessage],
          },
        };
        return { ...old, pages };
      });

      return { previous, tempId };
    },
    onError: (_error, _payload, context) => {
      if (!context) return;
      queryClient.setQueryData<MessagesCache>(messagesKey, (old) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            data: {
              ...page.data,
              messages: page.data.messages.map((message) =>
                message.id === context.tempId
                  ? { ...message, isOptimistic: false, failed: true }
                  : message,
              ),
            },
          })),
        };
      });
    },
    onSuccess: (_response, _payload, context) => {
      if (context) {
        queryClient.setQueryData<MessagesCache>(messagesKey, (old) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              data: {
                ...page.data,
                messages: page.data.messages.filter(
                  (message) => message.id !== context.tempId,
                ),
              },
            })),
          };
        });
      }
      queryClient.invalidateQueries({ queryKey: messagesKey });
      queryClient.invalidateQueries({ queryKey: ["patient-channels"] });
      queryClient.invalidateQueries({ queryKey: patientQueryKeys.dashboard });
    },
  });
}

export function useMarkChannelRead(channelId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => markPatientChannelRead(channelId),
    onSuccess: () => {
      queryClient.setQueriesData<ApiResponse<ChannelListResponse>>(
        { queryKey: ["patient-channels"] },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            data: {
              ...old.data,
              channels: old.data.channels.map((channel: Channel) =>
                channel.id === channelId
                  ? { ...channel, unread_count: 0 }
                  : channel,
              ),
            },
          };
        },
      );
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
